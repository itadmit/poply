import React from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartProps {
  data: any[];
  type: 'line' | 'area' | 'bar' | 'pie';
  dataKey: string;
  xAxisKey?: string;
  lines?: Array<{
    dataKey: string;
    stroke: string;
    name: string;
  }>;
  areas?: Array<{
    dataKey: string;
    fill: string;
    stroke: string;
    name: string;
  }>;
  bars?: Array<{
    dataKey: string;
    fill: string;
    name: string;
  }>;
  pieData?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  curved?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-medium border border-gray-100">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const AdvancedChart: React.FC<ChartProps> = ({
  data,
  type,
  dataKey,
  xAxisKey = 'name',
  lines = [],
  areas = [],
  bars = [],
  pieData = [],
  height = 300,
  showLegend = true,
  showTooltip = true,
  showGrid = true,
  curved = true
}) => {
  const renderChart = () => {
    const commonProps = {
      data,
      height,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    const axisStyle = {
      fontSize: 12,
      fill: '#6B7280'
    };

    const gridStyle = {
      stroke: '#F3F4F6',
      strokeDasharray: '3 3'
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid {...gridStyle} />}
            <XAxis dataKey={xAxisKey} tick={axisStyle} />
            <YAxis tick={axisStyle} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {lines.map((line, index) => (
              <Line
                key={index}
                type={curved ? "monotone" : "linear"}
                dataKey={line.dataKey}
                stroke={line.stroke}
                name={line.name}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid {...gridStyle} />}
            <XAxis dataKey={xAxisKey} tick={axisStyle} />
            <YAxis tick={axisStyle} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {areas.map((area, index) => (
              <Area
                key={index}
                type={curved ? "monotone" : "linear"}
                dataKey={area.dataKey}
                stackId="1"
                stroke={area.stroke}
                fill={area.fill}
                name={area.name}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid {...gridStyle} />}
            <XAxis dataKey={xAxisKey} tick={axisStyle} />
            <YAxis tick={axisStyle} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {bars.map((bar, index) => (
              <Bar
                key={index}
                dataKey={bar.dataKey}
                fill={bar.fill}
                name={bar.name}
                radius={[8, 8, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full" style={{ height: height }}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};