"use client";
import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";
import axios from "axios";
import ReactECharts from "echarts-for-react";

const ROOT_PATH = "https://echarts.apache.org/examples";

type EChartsOption = echarts.EChartsOption;

interface RawData {
  values: number[][];
  categoryData: string[];
  volumes: number[][];
}

function splitData(rawData: number[][]): RawData {
  let categoryData: string[] = [];
  let values: number[][] = [];
  let volumes: number[][] = [];
  for (let i = 0; i < rawData.length; i++) {
    categoryData.push(rawData[i].splice(0, 1)[0] as any);
    values.push(rawData[i]);
    volumes.push([i, rawData[i][4], rawData[i][0] > rawData[i][1] ? 1 : -1]);
  }
  return {
    categoryData: categoryData,
    values: values,
    volumes: volumes,
  };
}

function calculateMA(dayCount: number, data: RawData): Array<number | string> {
  var result: (number | string)[] = [];
  for (var i = 0, len = data.values.length; i < len; i++) {
    if (i < dayCount) {
      result.push("-");
      continue;
    }
    var sum = 0;
    for (var j = 0; j < dayCount; j++) {
      sum += data.values[i - j][1];
    }
    result.push(+(sum / dayCount).toFixed(3));
  }
  return result;
}

export default function CandleChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [option, setOption] = React.useState();

  useEffect(() => {
    const chartDom = chartRef.current!;

    axios
      .get(`${ROOT_PATH}/data/asset/data/stock-DJI.json`)
      .then((response) => {
        const rawData = response.data;
        const data = splitData(rawData);

        let option: EChartsOption;
        option = {
          animation: false,
          legend: {
            bottom: 10,
            left: "center",
            data: ["Dow-Jones index", "MA5", "MA10", "MA20", "MA30"],
          },
          tooltip: {
            trigger: "axis",
            axisPointer: { type: "cross" },
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            textStyle: { color: "#000" },
            position: function (pos, params, el, elRect, size) {
              const obj: Record<string, number> = { top: 10 };
              obj[["left", "right"][+(pos[0] < size.viewSize[0] / 2)]] = 30;
              return obj;
            },
          },
          axisPointer: {
            link: [{ xAxisIndex: "all" }],
            label: { backgroundColor: "#777" },
          },
          toolbox: {
            feature: {
              dataZoom: { yAxisIndex: false },
              brush: { type: ["lineX", "clear"] },
            },
          },
          brush: {
            xAxisIndex: "all",
            brushLink: "all",
            outOfBrush: { colorAlpha: 0.1 },
          },
          visualMap: {
            show: false,
            seriesIndex: 5,
            dimension: 2,
            pieces: [
              { value: 1, color: "#ec0000" },
              { value: -1, color: "#00da3c" },
            ],
          },
          grid: [
            { left: "10%", right: "8%", height: "50%" },
            { left: "10%", right: "8%", top: "63%", height: "16%" },
          ],
          xAxis: [
            {
              type: "category",
              data: data.categoryData,
              boundaryGap: false,
              axisLine: { onZero: false },
              splitLine: { show: false },
              min: "dataMin",
              max: "dataMax",
              axisPointer: { z: 100 },
            },
            {
              type: "category",
              gridIndex: 1,
              data: data.categoryData,
              boundaryGap: false,
              axisLine: { onZero: false },
              axisTick: { show: false },
              splitLine: { show: false },
              axisLabel: { show: false },
              min: "dataMin",
              max: "dataMax",
            },
          ],
          yAxis: [
            {
              scale: true,
              splitArea: { show: true },
            },
            {
              scale: true,
              gridIndex: 1,
              splitNumber: 2,
              axisLabel: { show: false },
              axisLine: { show: false },
              axisTick: { show: false },
              splitLine: { show: false },
            },
          ],
          dataZoom: [
            { type: "inside", xAxisIndex: [0, 1], start: 98, end: 100 },
            {
              show: true,
              xAxisIndex: [0, 1],
              type: "slider",
              top: "85%",
              start: 98,
              end: 100,
            },
          ],
          series: [
            {
              name: "Dow-Jones index",
              type: "candlestick",
              data: data.values,
              itemStyle: {
                color: "#00da3c",
                color0: "#ec0000",
                borderColor: "#008F28",
                borderColor0: "#8A0000",
              },
            },
            {
              name: "MA5",
              type: "line",
              data: calculateMA(5, data),
              smooth: true,
              lineStyle: { opacity: 0.5 },
            },
            {
              name: "MA10",
              type: "line",
              data: calculateMA(10, data),
              smooth: true,
              lineStyle: { opacity: 0.5 },
            },
            {
              name: "MA20",
              type: "line",
              data: calculateMA(20, data),
              smooth: true,
              lineStyle: { opacity: 0.5 },
            },
            {
              name: "MA30",
              type: "line",
              data: calculateMA(30, data),
              smooth: true,
              lineStyle: { opacity: 0.5 },
            },
            {
              name: "Volume",
              type: "bar",
              xAxisIndex: 1,
              yAxisIndex: 1,
              data: data.volumes,
            },
          ],
        };
        setOption(option as any);
      });
  }, []);

  return (
    <div>
      {option && (
        <ReactECharts
          // ref={chartRef}
          style={{ height: "calc(100% - 20px)", width: "100%" }}
          option={option}
          theme={"dark"}
          opts={{ renderer: "svg" }}
        />
      )}
    </div>
  );
}
