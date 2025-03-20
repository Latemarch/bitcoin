'use client';
import * as React from 'react';
import * as d3 from 'd3';
import { BybitKline } from '@/types/type';

type Props = {
  width?: number;
  height?: number;
  data: BybitKline[];
};

export default function CandleChartCanvas({ width = 400, height = 300, data }: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 스케일 설정
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => new Date(d[0])) as [Date, Date])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([d3.min(data, (d) => d[3]), d3.max(data, (d) => d[2])] as [number, number])
      .range([height, 0]);

    // 캔버스 초기화
    ctx.clearRect(0, 0, width, height);

    // 캔들 그리기
    const candleWidth = (width / data.length) * 0.8;
    data.forEach((d, i) => {
      const x = xScale(new Date(d[0]));
      const open = yScale(d[1]);
      const close = yScale(d[4]);
      const high = yScale(d[2]);
      const low = yScale(d[3]);

      // 캔들 몸통
      ctx.fillStyle = d[1] > d[4] ? 'red' : 'green';
      ctx.fillRect(x - candleWidth / 2, Math.min(open, close), candleWidth, Math.abs(close - open));

      // 윅
      ctx.beginPath();
      ctx.moveTo(x, high);
      ctx.lineTo(x, low);
      ctx.strokeStyle = d[1] > d[4] ? 'red' : 'green';
      ctx.stroke();
    });
  }, [data, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ border: '1px solid steelblue' }}
    />
  );
}
