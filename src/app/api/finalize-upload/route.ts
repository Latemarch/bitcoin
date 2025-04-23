import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as zlib from 'zlib';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import * as readline from 'readline';

// 대용량 처리를 위한 환경 변수 설정
process.env.NODE_OPTIONS = '--max-old-space-size=8192'; // 메모리 제한 증가

const prisma = new PrismaClient({
  log: ['warn', 'error'], // 로그 레벨 최소화
});
const tempDir = path.join(os.tmpdir(), 'bitcoin-upload');

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { fileName } = data;
    const url = new URL(request.url);
    const forceReprocess = url.searchParams.get('force') === 'true';

    if (!fileName) {
      return NextResponse.json({ error: '파일 이름이 필요합니다.' }, { status: 400 });
    }

    const fileId = fileName.replace(/[^a-zA-Z0-9]/g, '_');
    const chunkDir = path.join(tempDir, fileId);
    const statusPath = path.join(chunkDir, 'status.json');

    // 상태 파일 확인
    if (!fs.existsSync(statusPath)) {
      return NextResponse.json(
        {
          error: '업로드 정보를 찾을 수 없습니다.',
        },
        { status: 400 }
      );
    }

    const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));

    // 모든 청크가 업로드되었는지 확인
    if (status.receivedChunks.length !== status.totalChunks) {
      return NextResponse.json(
        {
          error: `일부 청크가 누락되었습니다. (${status.receivedChunks.length}/${status.totalChunks})`,
        },
        { status: 400 }
      );
    }

    // 이미 처리된 파일인 경우에도 다시 처리할 수 있도록 상태 초기화
    if (status.completed) {
      console.log(`이미 처리된 파일을 다시 처리합니다: ${fileName}`);
      status.completed = false;
    }

    // 모든 청크를 하나의 파일로 병합
    const combinedFilePath = path.join(chunkDir, 'combined.gz');
    const outputStream = fs.createWriteStream(combinedFilePath);

    // 청크 인덱스 순서대로 정렬 후 병합
    const sortedChunks = [...status.receivedChunks].sort((a, b) => a - b);

    for (const chunkIndex of sortedChunks) {
      const chunkPath = path.join(chunkDir, `chunk_${chunkIndex}`);
      if (fs.existsSync(chunkPath)) {
        const chunkData = fs.readFileSync(chunkPath);
        outputStream.write(chunkData);
      }
    }

    outputStream.end();

    // 파일 처리가 완료될 때까지 대기
    await new Promise<void>((resolve) => {
      outputStream.on('finish', resolve);
    });

    // 파일명에서 년/월 추출 (예: BTCUSDT-2025-01.csv.gz => 2501)
    const match = fileName.match(/BTCUSDT-(\d{4})-(\d{2})/);
    if (!match) {
      return NextResponse.json({ error: '파일명 형식이 올바르지 않습니다.' }, { status: 400 });
    }

    const year = match[1].slice(2); // 예: 2025 -> 25
    const month = match[2]; // 예: 01
    const filePrefix = year + month; // 예: 2501

    // 압축 해제된 파일 경로
    const uncompressedFilePath = path.join(chunkDir, 'combined.csv');

    // gzip 압축 해제
    await pipeline(
      createReadStream(combinedFilePath),
      zlib.createGunzip(),
      createWriteStream(uncompressedFilePath)
    );

    // CSV 파일 처리
    const fileStream = createReadStream(uncompressedFilePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    // CSV 파일의 실제 레코드 수 계산 (첫 번째 스캔)
    let totalCSVRecords = 0;
    let isCountingHeader = true;

    for await (const line of rl) {
      // 헤더 라인 건너뛰기
      if (isCountingHeader) {
        isCountingHeader = false;
        continue;
      }

      // 빈 라인은 건너뛰기
      if (!line.trim()) continue;

      totalCSVRecords++;
    }

    console.log(`CSV 파일 총 레코드 수: ${totalCSVRecords}`);

    // 메모리 정리
    global.gc && global.gc();

    // 스트림 다시 열기 (두 번째 스캔 - 실제 처리)
    const fileStream2 = createReadStream(uncompressedFilePath);
    const rl2 = readline.createInterface({
      input: fileStream2,
      crlfDelay: Infinity,
    });

    // 병렬 처리를 위한 설정
    const MAX_PARALLEL_BATCHES = 5; // 동시에 처리할 배치 수
    const batchSize = 10000; // 각 배치당 레코드 수
    const maxParallelRecords = batchSize * MAX_PARALLEL_BATCHES;
    let allRecords: any[] = [];
    let count = 0;
    let isFirstLine = true;
    let lastLogTime = Date.now();
    const logInterval = 5000; // 5초마다 로그 출력

    console.log(
      `CSV 파일 병렬 처리 시작 (${MAX_PARALLEL_BATCHES}개 배치 동시 처리, 배치당 ${batchSize}개 레코드)`
    );

    // 모든 레코드 수집
    for await (const line of rl2) {
      // 헤더 라인 건너뛰기
      if (isFirstLine) {
        isFirstLine = false;
        continue;
      }

      // 빈 라인 건너뛰기
      if (!line.trim()) continue;

      // CSV 라인 파싱
      const [originalId, timestamp, price, volume, side] = line.split(',');

      // 데이터 유효성 검사
      if (!originalId || !timestamp || !price || !volume || !side) continue;

      try {
        // 새 ID 생성: filePrefix + 원래 ID
        const parsedRecord = {
          id: parseInt(originalId.trim()),
          timestamp: BigInt(timestamp.trim()),
          price: parseFloat(price.trim()),
          volume: parseFloat(volume.trim()),
          side: side.trim(),
        };

        allRecords.push(parsedRecord);

        // 메모리 관리를 위해 일정 크기마다 처리
        if (allRecords.length >= maxParallelRecords) {
          const processingRecords = [...allRecords];
          allRecords = [];

          // 병렬 처리
          const processedCount = await processRecordsInParallel(
            processingRecords,
            batchSize,
            MAX_PARALLEL_BATCHES
          );
          count += processedCount;

          // 로깅
          const currentTime = Date.now();
          if (currentTime - lastLogTime >= logInterval) {
            const percent = Math.round((count / totalCSVRecords) * 100);
            console.log(`처리 중: ${count}개 레코드 완료 (${percent}%)`);
            lastLogTime = currentTime;
          }

          // 메모리 정리
          global.gc && global.gc();
        }
      } catch (error) {
        console.error('행 처리 오류:', line, error);
      }
    }

    // 남은 레코드 처리
    if (allRecords.length > 0) {
      const processedCount = await processRecordsInParallel(
        allRecords,
        batchSize,
        MAX_PARALLEL_BATCHES
      );
      count += processedCount;
    }

    // 메모리 정리
    global.gc && global.gc();

    // 상태 업데이트
    status.completed = true;
    status.totalCount = count;
    status.totalCSVRecords = totalCSVRecords;
    status.actualCount = await prisma.bitcoinTrade.count();
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));

    // 데이터베이스의 실제 레코드 수 확인
    const actualCount = await prisma.bitcoinTrade.count();
    console.log(
      `처리 완료: CSV 파일 총 ${totalCSVRecords}개, 처리 ${count}개, 데이터베이스 ${actualCount}개 레코드`
    );

    return NextResponse.json({
      success: true,
      csvRecords: totalCSVRecords,
      processedRecords: count,
      dbRecords: actualCount,
      message: `파일 처리 완료! \n원본 CSV: ${totalCSVRecords}개 레코드\n처리됨: ${count}개 레코드\n데이터베이스 저장: ${actualCount}개 레코드`,
    });
  } catch (error: any) {
    console.error('최종 처리 오류:', error);
    return NextResponse.json(
      { error: `최종 처리 중 오류가 발생했습니다: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * 레코드를 병렬로 처리하는 함수
 */
async function processRecordsInParallel(
  records: any[],
  batchSize: number,
  maxParallelBatches: number
): Promise<number> {
  // 배치로 나누기
  const batches: any[][] = [];
  for (let i = 0; i < records.length; i += batchSize) {
    batches.push(records.slice(i, i + batchSize));
  }

  let processedCount = 0;

  // 배치를 병렬로 처리 (최대 maxParallelBatches개씩)
  for (let i = 0; i < batches.length; i += maxParallelBatches) {
    const batchPromises = batches.slice(i, i + maxParallelBatches).map(async (batch) => {
      try {
        const result = await prisma.bitcoinTrade.createMany({
          data: batch,
          skipDuplicates: true,
        });
        return result.count;
      } catch (error) {
        console.error('배치 처리 오류:', error);
        return 0;
      }
    });

    // 병렬 실행 후 결과 수집
    const results = await Promise.all(batchPromises);
    processedCount += results.reduce((sum, count) => sum + count, 0);
  }

  return processedCount;
}
