import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as zlib from 'zlib';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import * as readline from 'readline';

const prisma = new PrismaClient();
const tempDir = path.join(os.tmpdir(), 'bitcoin-upload');

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { fileName } = data;

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

    if (status.completed) {
      return NextResponse.json({
        success: true,
        message: '이미 처리 완료된 파일입니다.',
        count: status.totalCount || 0,
      });
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

    let isFirstLine = true;
    let count = 0;
    const batchSize = 1000;
    let batch: any[] = [];

    for await (const line of rl) {
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
        // 예: 25년 1월 파일의 ID 1 => 25011
        const newId = parseInt(`${filePrefix}${originalId.trim()}`);

        // 배치에 추가
        batch.push({
          id: parseInt(originalId.trim()),
          timestamp: BigInt(timestamp.trim()),
          price: parseFloat(price.trim()),
          volume: parseFloat(volume.trim()),
          side: side.trim(),
        });

        // 배치 사이즈에 도달하면 데이터베이스에 삽입
        if (batch.length >= batchSize) {
          await prisma.bitcoinTrade.createMany({
            data: batch,
            skipDuplicates: true,
          });
          count += batch.length;
          batch = [];

          // 진행 상황 로깅
          console.log(`처리 중: ${count}개 레코드 완료`);
        }
      } catch (error) {
        console.error('행 처리 오류:', line, error);
        // 오류가 있는 행은 건너뛰고 계속 진행
      }
    }

    // 남은 배치 처리
    if (batch.length > 0) {
      await prisma.bitcoinTrade.createMany({
        data: batch,
        skipDuplicates: true,
      });
      count += batch.length;
    }

    // 상태 업데이트
    status.completed = true;
    status.totalCount = count;
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));

    console.log(`처리 완료: 총 ${count}개 레코드`);

    return NextResponse.json({
      success: true,
      count,
    });
  } catch (error: any) {
    console.error('최종 처리 오류:', error);
    return NextResponse.json(
      { error: `최종 처리 중 오류가 발생했습니다: ${error.message}` },
      { status: 500 }
    );
  }
}
