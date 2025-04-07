import { useEffect } from 'react';
import { BybitKline } from '@/types/type';

type Props = {
  svgRef: React.RefObject<SVGSVGElement>;
  data: BybitKline[];
  height: number;
  width: number;
};

export default function Update({ svgRef, data, height, width }: Props) {
  useEffect(() => {
    if (!svgRef.current) return;
    // SVG 선택 및 초기화
  }, []);
  return <div></div>;
}
