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

import { useLiveChartSeries } from "@/features/stocks/components/live-price";
import { formatCurrency } from "@/utils/format";

type StockChartProps = {
  data: { datetime: string; close: number }[];
  symbol: string;
  /** Current live quote — chart extends on every tick. */
  livePrice: number;
};

export function StockChart({ data, symbol, livePrice }: StockChartProps) {
  const series = useLiveChartSeries(livePrice, data, 80);

  if (series.length === 0) {
    return (
      <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border/70 px-6 text-center text-sm text-muted-foreground">
        <p>Waiting for live ticks for {symbol}…</p>
      </div>
    );
  }

  return (
    <div className="h-56 w-full rounded-3xl border border-border/50 bg-card/60 p-4 shadow-soft">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {symbol} · Live tape
        </p>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-success">
          <span className="size-1.5 animate-pulse rounded-full bg-success" />
          Live
        </span>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={series}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.4}
          />
          <XAxis
            dataKey="datetime"
            tick={{ fontSize: 10 }}
            minTickGap={28}
            tickFormatter={(v: string) =>
              new Date(v).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            }
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 10 }}
            width={56}
            tickFormatter={(v: number) => `$${v}`}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(label) =>
              new Date(String(label)).toLocaleTimeString()
            }
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke="#2563EB"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
