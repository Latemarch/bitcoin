export function drawCandle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: any[],
  xScale: d3.ScaleTime<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  transform: d3.ZoomTransform
) {
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.k, transform.k);

  const candleWidth = (width / data.length) * 0.8;
  data.forEach((d) => {
    const x = xScale(new Date(d[0]));
    const open = yScale(d[1]);
    const close = yScale(d[4]);
    const high = yScale(d[2]);
    const low = yScale(d[3]);

    ctx.fillStyle = d[1] > d[4] ? 'red' : 'green';
    ctx.fillRect(x - candleWidth / 2, Math.min(open, close), candleWidth, Math.abs(close - open));

    ctx.beginPath();
    ctx.moveTo(x, high);
    ctx.lineTo(x, low);
    ctx.strokeStyle = d[1] > d[4] ? 'red' : 'green';
    ctx.stroke();
  });

  ctx.restore();
}
