"use client";

import { useMemo, useState } from "react";
import { Pie, PieChart, Cell, Sector } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { aggregateMetrics, sections } from "@/lib/data";
import { useRouter } from "next/navigation";
import type { ItemSales } from "@/lib/types";

type Props = { sales: ItemSales[] };

export function SectionSalesPie({ sales }: Props) {
  const metrics = useMemo(() => aggregateMetrics(sales), [sales]);

  const { data, config } = useMemo(() => {
    const totals = new Map<string, number>();
    for (const m of metrics) {
      totals.set(m.sectionId, (totals.get(m.sectionId) || 0) + m.unitsSold);
    }

    // Bright, accessible palette
    const palette = [
      "#4AA8F0", // blue
      "#FF6B8A", // pink
      "#3FC1B0", // teal
      "#F7C948", // yellow
      "#FF964F", // orange
    ];
    const colorVars = [1, 2, 3, 4, 5].map((i) => `hsl(var(--chart-${i}))`);
    const cfg: Record<string, { label: string; theme: { light: string; dark: string } }> = {};
    const chartData = sections.map((s, idx) => {
      const color = palette[idx % palette.length];
      cfg[s.id] = { label: s.name, theme: { light: color, dark: color } };
      return {
        sectionId: s.id,
        name: s.name,
        value: totals.get(s.id) || 0,
        fill: color,
      };
    });

    return { data: chartData, config: cfg } as const;
  }, [metrics]);

  const totalUnits = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  const router = useRouter();

  const renderLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.62;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.06) return null;
    return (
      <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" className="text-[10px] md:text-xs fill-muted-foreground">
        {(percent * 100).toFixed(0)}%
      </text>
    );
  };

  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by Section</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="relative mx-auto w-full max-w-[820px] h-[280px] sm:h-[380px] px-2 sm:px-0">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={140}
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              isAnimationActive
              animationBegin={80}
              animationDuration={500}
              animationEasing="ease-in-out"
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseMove={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(undefined)}
              activeIndex={activeIndex}
              activeShape={(props: any) => (
                <Sector {...props} outerRadius={props.outerRadius + 4} />
              )}
              labelLine={false}
              label={renderLabel}
              strokeWidth={1}
            >
              {data.map((entry, idx) => (
                <Cell
                  key={entry.sectionId}
                  fill={entry.fill as string}
                  stroke="#ffffff"
                  className="transition-all duration-300 ease-in-out"
                  style={activeIndex === idx ? { filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.22))", transform: "scale(1.02)", transformOrigin: "center" } : undefined}
                  opacity={activeIndex === undefined || activeIndex === idx ? 1 : 0.45}
                  onClick={() => router.push(`/section/${entry.sectionId}`)}
                />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" labelKey="name" />} />
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground">
              <tspan className="text-[10px] sm:text-xs fill-muted-foreground" x="50%" dy="-0.4em">Total</tspan>
              <tspan className="font-semibold text-sm sm:text-base" x="50%" dy="1.2em">{totalUnits.toLocaleString()}</tspan>
            </text>
          </PieChart>
        </ChartContainer>
        <div className="mt-3 text-xs sm:text-sm text-muted-foreground">
          Click legend to focus a section; labels show share when large enough.
        </div>
      </CardContent>
    </Card>
  );
}


