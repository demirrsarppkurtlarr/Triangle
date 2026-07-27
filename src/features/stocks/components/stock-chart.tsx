"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/utils/format";

type StockChartProps = {
  data: { datetime: string; close: number }[];
  symbol: string;
};

export function StockChart({ data, symbol }: StockChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-3xl border border-dashed border-border/70 text-sm text-muted-foreground">
        Chart data unavailable. Check Twelve Data API key / quota.
      </div>
    );
  }

  return (
    <div className="h-56 w-full rounded-3xl border border-border/50 bg-card/60 p-4 shadow-soft">
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {symbol} · Daily
      </p>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
          <XAxis
            dataKey="datetime"
            tick={{ fontSize: 10 }}
            tickFormatter={(v: string) => v.slice(5, 10)}
            hide={data.length > 40}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 10 }}
            width={56}
            tickFormatter={(v: number) => `$${v}`}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(label) => String(label)}
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke="#2563EB"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
