import { useEffect } from 'react';
import * as d3 from 'd3';
import { BybitKline } from '@/types/type';
import { calculateMovingAverage } from '@/lib/getMovingAverage';

type Props = {
  svgRef: React.RefObject<SVGSVGElement>;
  data: BybitKline[];
  height: number;
};

export default function Update({ svgRef, data, height }: Props) {
  useEffect(() => {
    if (!svgRef.current) return;
    const movingAverageData = calculateMovingAverage(data, 5);
  }, []);
  return <div></div>;
}
