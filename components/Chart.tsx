"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface ChartProps {
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKeys: string[];
  yLabel?: string;
  title?: string;
  height?: number;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
}

export function LineChartComponent({
  data,
  xKey,
  yKeys,
  yLabel = "",
  title,
  height = 300,
  colors = ["#4ade80", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  showXAxis = true,
  showYAxis = true,
}: ChartProps) {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-2 text-pc-text">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
          {showXAxis && (
            <XAxis
              dataKey={xKey}
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: "#9CA3AF" }}
            />
          )}
          {showYAxis && (
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: "#9CA3AF" }}
              label={{ value: yLabel, angle: -90, position: "insideLeft" }}
            />
          )}
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "0.5rem",
                color: "#F9FAFB",
              }}
              labelStyle={{ color: "#9CA3AF" }}
            />
          )}
          {showLegend && <Legend />}
          {yKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarChartComponent({
  data,
  xKey,
  yKeys,
  yLabel = "",
  title,
  height = 300,
  colors = ["#4ade80", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  showXAxis = true,
  showYAxis = true,
}: ChartProps) {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-2 text-pc-text">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
          {showXAxis && (
            <XAxis
              dataKey={xKey}
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: "#9CA3AF" }}
            />
          )}
          {showYAxis && (
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: "#9CA3AF" }}
              label={{ value: yLabel, angle: -90, position: "insideLeft" }}
            />
          )}
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "0.5rem",
                color: "#F9FAFB",
              }}
              labelStyle={{ color: "#9CA3AF" }}
            />
          )}
          {showLegend && <Legend />}
          {yKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
