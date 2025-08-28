"use client";

import { useMemo, useState } from "react";
import { Pie, PieChart, Cell, Sector } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { aggregateMetrics, generateSalesForRange, sections } from "@/lib/data";
import { useRouter } from "next/navigation";
import type { DateTimeRange, ItemSales } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, DollarSign } from "lucide-react";

type Props = { globalSales: ItemSales[]; globalRange: DateTimeRange };

type MetricType = "quantity" | "revenue" | "profit";
type DisplayMode = "values" | "percentages";

export function SectionSalesPie({ globalSales, globalRange }: Props) {
  const [localRange, setLocalRange] = useState<DateTimeRange | undefined>(undefined);
  const [metricType, setMetricType] = useState<MetricType>("quantity");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("values");
  
  const sales = useMemo(() => (localRange ? generateSalesForRange(localRange) : globalSales), [globalSales, localRange]);
  const metrics = useMemo(() => aggregateMetrics(sales), [sales]);

  const { data, config, totalValue } = useMemo(() => {
    const totals = new Map<string, number>();
    
    for (const m of metrics) {
      const sectionId = m.sectionId;
      const current = totals.get(sectionId) || 0;
      
      let value: number;
      switch (metricType) {
        case "quantity":
          value = m.unitsSold;
          break;
        case "revenue":
          value = m.revenue;
          break;
        case "profit":
          value = m.profit;
          break;
        default:
          value = m.unitsSold;
      }
      
      totals.set(sectionId, current + value);
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
      const rawValue = totals.get(s.id) || 0;
      
      cfg[s.id] = { label: s.name, theme: { light: color, dark: color } };
      return {
        sectionId: s.id,
        name: s.name,
        value: rawValue,
        rawValue: rawValue, // Keep original value for tooltip
        fill: color,
      };
    });

    const total = chartData.reduce((sum, d) => sum + d.value, 0);
    
    // Convert to percentages if needed
    if (displayMode === "percentages" && total > 0) {
      chartData.forEach(d => {
        d.value = (d.value / total) * 100;
      });
    }

    return { data: chartData, config: cfg, totalValue: total } as const;
  }, [metrics, metricType, displayMode]);

  const router = useRouter();

  const renderLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const RADIAN = Math.PI / 180;
    // Position labels inside the pie slices, closer to the center
    const radius = innerRadius + (outerRadius - innerRadius) * 0.3;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.06) return null;
    
    let value: string;
    if (displayMode === "percentages") {
      // percent is already a decimal (e.g., 0.25), so multiply by 100 to get percentage
      value = `${(percent * 100).toFixed(1)}%`;
    } else {
      // percent is a decimal representing the slice's portion of the total
      value = Math.round(percent * totalValue).toLocaleString();
    }
    
    return (
      <text x={x} y={y} fill="currentColor" textAnchor="middle" dominantBaseline="central" className="text-[10px] md:text-xs font-medium fill-foreground">
        {value}
      </text>
    );
  };

  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const formatTotal = (value: number) => {
    if (displayMode === "percentages") return "100%";
    
    switch (metricType) {
      case "quantity":
        return value.toLocaleString();
      case "revenue":
        return `$${value.toLocaleString()}`;
      case "profit":
        return `$${value.toLocaleString()}`;
      default:
        return value.toLocaleString();
    }
  };

  const getMetricLabel = () => {
    switch (metricType) {
      case "quantity": return "Units";
      case "revenue": return "Revenue";
      case "profit": return "Profit";
      default: return "Units";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by Section</CardTitle>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={metricType} onValueChange={(v) => setMetricType(v as MetricType)} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="quantity" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Quantity
              </TabsTrigger>
              <TabsTrigger value="revenue" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Revenue
              </TabsTrigger>
              <TabsTrigger value="profit" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Profit
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2">
            <Button
              variant={displayMode === "values" ? "default" : "outline"}
              size="sm"
              onClick={() => setDisplayMode("values")}
            >
              Values
            </Button>
            <Button
              variant={displayMode === "percentages" ? "default" : "outline"}
              size="sm"
              onClick={() => setDisplayMode("percentages")}
            >
              %
            </Button>
          </div>
        </div>
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
            <ChartTooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const data = payload[0].payload;
                  const sectionName = data.name;
                  const rawValue = data.rawValue || data.value;
                  const percentage = ((rawValue / totalValue) * 100).toFixed(1);
                  
                  let formattedValue: string;
                  let metricLabel: string;
                  
                  switch (metricType) {
                    case "quantity":
                      formattedValue = rawValue.toLocaleString();
                      metricLabel = "Units";
                      break;
                    case "revenue":
                      formattedValue = `$${rawValue.toLocaleString()}`;
                      metricLabel = "Revenue";
                      break;
                    case "profit":
                      formattedValue = `$${rawValue.toLocaleString()}`;
                      metricLabel = "Profit";
                      break;
                    default:
                      formattedValue = rawValue.toLocaleString();
                      metricLabel = "Units";
                  }
                  
                  return (
                    <div className="bg-background border rounded-lg shadow-lg p-3 space-y-2">
                      <div className="font-semibold text-foreground">{sectionName}</div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">{metricLabel}:</span>
                          <span className="font-medium text-foreground">{formattedValue}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Share:</span>
                          <span className="font-medium text-foreground">{percentage}%</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground">
              <tspan className="text-[10px] sm:text-xs fill-muted-foreground" x="50%" dy="-0.4em">{getMetricLabel()}</tspan>
              <tspan className="font-semibold text-sm sm:text-base" x="50%" dy="1.2em">{formatTotal(totalValue)}</tspan>
            </text>
          </PieChart>
        </ChartContainer>
        <div className="mt-3 text-xs sm:text-sm text-muted-foreground">
          Tap a slice to drill into the section • {displayMode === "percentages" ? "Showing percentages" : "Showing actual values"}
        </div>
      </CardContent>
    </Card>
  );
}


