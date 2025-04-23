import { useEffect } from 'react';
import { BybitKline } from '@/types/type';

type Props = {
  svgRef: React.RefObject<SVGSVGElement>;
  candleData: BybitKline[];
  height: number;
  width: number;
};

export default function BackTest({ svgRef, candleData, height, width }: Props) {
  useEffect(() => {
    if (!svgRef.current) return;
    // SVG 선택 및 초기화
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div></div>;
}
