'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Data() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [totalBytes, setTotalBytes] = useState(0);
  const [processedBytes, setProcessedBytes] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage('');
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      setMessage('업로드가 취소되었습니다.');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('파일을 선택해주세요.');
      return;
    }

    // .gz 파일만 허용
    if (!file.name.endsWith('.gz')) {
      setMessage('gz 압축 파일만 업로드 가능합니다.');
      return;
    }

    try {
      setLoading(true);
      setProgress(0);
      setTotalBytes(file.size);
      setProcessedBytes(0);
      setMessage('파일 처리 중...');
      // 파일을 청크로 나누어 처리
      const CHUNK_SIZE = 1024 * 1024 * 5; // 5MB 청크
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      abortControllerRef.current = new AbortController();
      let totalProcessed = 0;
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        if (!abortControllerRef.current) break;
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        // 각 청크를 서버로 전송
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('fileName', file.name);
        formData.append('chunkIndex', String(chunkIndex));
        formData.append('totalChunks', String(totalChunks));
        try {
          const response = await fetch('/api/upload-chunk', {
            method: 'POST',
            body: formData,
            signal: abortControllerRef.current.signal,
          });
          if (!response.ok) {
            const error = await response.text();
            throw new Error(error || '업로드 실패');
          }
          const result = await response.json();
          totalProcessed += result.count || 0;
          // 진행 상황 업데이트
          setProcessedBytes(end);
          setProgress(Math.floor((end / file.size) * 100));
        } catch (error: any) {
          if (error.name === 'AbortError') {
            return; // 중단된 요청은 에러로 처리하지 않음
          }
          throw error;
        }
      }
      // 모든 청크가 업로드된 후, 최종 처리 요청
      if (abortControllerRef.current) {
        const response = await fetch('/api/finalize-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name }),
          signal: abortControllerRef.current.signal,
        });
        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || '최종 처리 실패');
        }
        const result = await response.json();
        setProgress(100);
        setMessage(result.message || `성공적으로 처리되었습니다!`);
      }
      router.refresh();
    } catch (error: any) {
      console.error('파일 처리 오류:', error);
      setMessage(`오류: ${error.message}`);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  // 메시지에 줄바꿈이 있는 경우 pre 태그로 감싸 표시
  const formattedMessage = message.includes('\n') ? (
    <pre className="whitespace-pre-wrap">{message}</pre>
  ) : (
    message
  );

  return (
    <div className="p-8 max-w-4xl mx-auto text-gray-800">
      <h1 className="text-2xl font-bold mb-6">비트코인 데이터 업로드</h1>

      <div className="mb-6 p-6 border rounded-lg shadow-sm">
        <div className="mb-4">
          <label htmlFor="file" className="block mb-2 font-medium">
            CSV.GZ 파일 선택
          </label>
          <input
            type="file"
            id="file"
            accept=".gz"
            onChange={handleFileChange}
            className="block w-full text-sm border rounded-lg cursor-pointer focus:outline-none"
            disabled={loading}
          />
          <p className="mt-1 text-sm text-gray-500">BTCUSDT-*.csv.gz 형식의 파일을 업로드하세요.</p>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className={`px-4 py-2 rounded-md font-medium ${
              loading || !file
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? '처리 중...' : '파일 처리 및 업로드'}
          </button>

          {loading && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-md font-medium bg-red-600 hover:bg-red-700 text-white"
            >
              취소
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">
              {(processedBytes / (1024 * 1024)).toFixed(2)} MB /{' '}
              {(totalBytes / (1024 * 1024)).toFixed(2)} MB
            </span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`p-4 mb-4 rounded-lg ${
            message.includes('오류') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}
        >
          {formattedMessage}
        </div>
      )}
    </div>
  );
}
