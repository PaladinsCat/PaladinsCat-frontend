/** Chart component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 * refs: none
 */
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
import { chartColors, chartText, chartTextSecondary, chartGrid } from "@/lib/chart-colors";

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

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 * refs: none
 */
export function LineChartComponent({
  data,
  xKey,
  yKeys,
  yLabel = "",
  title,
  height = 300,
  colors = chartColors,
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
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />}
          {showXAxis && (
            <XAxis
              dataKey={xKey}
              stroke={chartTextSecondary}
              fontSize={12}
              tick={{ fill: chartTextSecondary }}
            />
          )}
          {showYAxis && (
            <YAxis
              stroke={chartTextSecondary}
              fontSize={12}
              tick={{ fill: chartTextSecondary }}
              label={{ value: yLabel, angle: -90, position: "insideLeft" }}
            />
          )}
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: chartGrid,
                border: `1px solid ${chartGrid}`,
                borderRadius: "0.5rem",
                color: chartText,
              }}
              labelStyle={{ color: chartTextSecondary }}
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

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 * refs: none
 */
export function BarChartComponent({
  data,
  xKey,
  yKeys,
  yLabel = "",
  title,
  height = 300,
  colors = chartColors,
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
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />}
          {showXAxis && (
            <XAxis
              dataKey={xKey}
              stroke={chartTextSecondary}
              fontSize={12}
              tick={{ fill: chartTextSecondary }}
            />
          )}
          {showYAxis && (
            <YAxis
              stroke={chartTextSecondary}
              fontSize={12}
              tick={{ fill: chartTextSecondary }}
              label={{ value: yLabel, angle: -90, position: "insideLeft" }}
            />
          )}
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: chartGrid,
                border: `1px solid ${chartGrid}`,
                borderRadius: "0.5rem",
                color: chartText,
              }}
              labelStyle={{ color: chartTextSecondary }}
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
