import React from 'react';
import ReactECharts from 'echarts-for-react';

interface FunnelData {
  name: string;
  value: number;
  fill: string;
}

interface Props {
  data: FunnelData[];
}

export const FunnelChart: React.FC<Props> = ({ data }) => {
  if (data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
        暂无足够的转化数据
      </div>
    );
  }

  // Transform data for ECharts
  const echartData = data.map(d => ({
    name: d.name,
    value: d.value,
    itemStyle: { color: d.fill }
  }));

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b} : {c} ({d}%)',
      backgroundColor: 'var(--bg-secondary)',
      borderColor: 'var(--border-color)',
      textStyle: { color: 'var(--text-primary)', fontSize: 13 },
      padding: [8, 12]
    },
    series: [
      {
        name: '转化漏斗',
        type: 'funnel',
        left: '10%',
        width: '80%',
        min: 0,
        max: Math.max(...data.map(d => d.value), 1),
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 4,
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}: {c}',
          color: '#fff',
          fontWeight: 600,
          fontSize: 13
        },
        labelLine: {
          length: 10,
          lineStyle: {
            width: 1,
            type: 'solid'
          }
        },
        itemStyle: {
          borderColor: 'var(--bg-primary)',
          borderWidth: 2,
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowOffsetY: 5,
          shadowColor: 'rgba(0, 0, 0, 0.1)'
        },
        emphasis: {
          label: {
            fontSize: 15
          }
        },
        data: echartData
      }
    ]
  };

  return (
    <ReactECharts 
      option={option} 
      style={{ height: '100%', width: '100%', minHeight: '300px' }} 
      opts={{ renderer: 'svg' }}
    />
  );
};
