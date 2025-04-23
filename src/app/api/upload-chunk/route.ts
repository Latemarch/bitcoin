import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// 임시 디렉토리 생성
const tempDir = path.join(os.tmpdir(), 'bitcoin-upload');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const chunk = formData.get('chunk') as Blob;
    const fileName = formData.get('fileName') as string;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string);
    const totalChunks = parseInt(formData.get('totalChunks') as string);

    if (!chunk || !fileName || isNaN(chunkIndex) || isNaN(totalChunks)) {
      return NextResponse.json({ error: '유효하지 않은 요청입니다.' }, { status: 400 });
    }

    // 파일 이름에서 고유 ID 생성
    const fileId = fileName.replace(/[^a-zA-Z0-9]/g, '_');
    const chunkDir = path.join(tempDir, fileId);

    // 청크 저장 디렉토리 생성
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }

    // 청크 파일 경로
    const chunkPath = path.join(chunkDir, `chunk_${chunkIndex}`);

    // 청크를 파일로 저장
    const chunkArrayBuffer = await chunk.arrayBuffer();
    fs.writeFileSync(chunkPath, new Uint8Array(chunkArrayBuffer));

    // 상태 파일 업데이트
    const statusPath = path.join(chunkDir, 'status.json');
    let status: {
      totalChunks: number;
      receivedChunks: number[];
      fileName: string;
      completed: boolean;
    } = {
      totalChunks,
      receivedChunks: [],
      fileName,
      completed: false,
    };

    if (fs.existsSync(statusPath)) {
      status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    }

    if (!status.receivedChunks.includes(chunkIndex)) {
      status.receivedChunks.push(chunkIndex);
      fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
    }

    return NextResponse.json({
      success: true,
      chunkIndex,
      receivedChunks: status.receivedChunks.length,
      totalChunks,
      count: 0, // 실제 레코드 카운트는 finalize 단계에서 계산
    });
  } catch (error: any) {
    console.error('청크 업로드 오류:', error);
    return NextResponse.json(
      { error: `청크 처리 중 오류가 발생했습니다: ${error.message}` },
      { status: 500 }
    );
  }
}
