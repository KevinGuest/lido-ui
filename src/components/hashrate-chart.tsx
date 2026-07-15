"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { hashSuffix } from "@/lib/format";
import type { ChartPoint } from "@/lib/mock-data";

const chartConfig = {
  hashrate: {
    label: "Hashrate",
    color: "oklch(0.85 0 0)",
  },
} satisfies ChartConfig;

export function HashrateChart({ data }: { data: ChartPoint[] }) {
  const points = React.useMemo(
    () =>
      data.map((point) => ({
        time: new Date(point.label).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        hashrate: Number(point.data) || 0,
      })),
    [data],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pool hashrate</CardTitle>
        <CardDescription>Last 24 hours</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <AreaChart data={points} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" />
            <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={32} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(value: number) => hashSuffix(value)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => hashSuffix(Number(value))}
                  indicator="line"
                />
              }
            />
            <Area
              type="monotone"
              dataKey="hashrate"
              stroke="var(--color-hashrate)"
              fill="var(--color-hashrate)"
              fillOpacity={0.16}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
