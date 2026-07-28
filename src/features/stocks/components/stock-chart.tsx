"use client";

import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { useLiveChartSeries } from "@/features/stocks/components/live-price";
import type { TradeMarker } from "@/features/stocks/services/market.service";
import { formatCurrency } from "@/utils/format";

type StockChartProps = {
  data: { datetime: string; close: number }[];
  symbol: string;
  livePrice: number;
  markers?: TradeMarker[];
};

export function StockChart({
  data,
  symbol,
  livePrice,
  markers = [],
}: StockChartProps) {
  const series = useLiveChartSeries(livePrice, data, 80);

  const buyDots = markers
    .filter((m) => m.side === "buy")
    .map((m) => ({ datetime: m.datetime, close: m.price, qty: m.quantity }));
  const sellDots = markers
    .filter((m) => m.side === "sell")
    .map((m) => ({ datetime: m.datetime, close: m.price, qty: m.quantity }));

  if (series.length === 0) {
    return (
      <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border/70 px-6 text-center text-sm text-muted-foreground">
        <p>Waiting for live ticks for {symbol}…</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full rounded-3xl border border-border/50 bg-card/60 p-4 shadow-soft">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {symbol} · Global 10s tape
        </p>
        <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.14em]">
          <span className="inline-flex items-center gap-1.5 text-success">
            <span className="size-1.5 animate-pulse rounded-full bg-success" />
            Live
          </span>
          {buyDots.length > 0 && (
            <span className="text-primary">● Buy</span>
          )}
          {sellDots.length > 0 && (
            <span className="text-destructive">● Sell</span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height="88%">
        <ComposedChart data={series}>
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
          <ZAxis range={[80, 80]} />
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
          {buyDots.length > 0 && (
            <Scatter
              data={buyDots}
              dataKey="close"
              fill="#22C55E"
              name="Buy"
              isAnimationActive={false}
            />
          )}
          {sellDots.length > 0 && (
            <Scatter
              data={sellDots}
              dataKey="close"
              fill="#EF4444"
              name="Sell"
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
