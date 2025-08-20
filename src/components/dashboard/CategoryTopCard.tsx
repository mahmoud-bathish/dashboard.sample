"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { aggregateMetrics, generateSalesForRange } from "@/lib/data";
import type { DateTimeRange, ItemSales } from "@/lib/types";

type Props = {
  categoryId: string;
  categoryName: string;
  sectionId: string;
  globalSales: ItemSales[];
  globalRange: DateTimeRange;
};

export function CategoryTopCard({ categoryId, categoryName, sectionId, globalSales, globalRange }: Props) {
  const [localRange, setLocalRange] = useState<DateTimeRange | undefined>(undefined);

  const sales = useMemo(() => {
    if (!localRange) return globalSales;
    return generateSalesForRange(localRange);
  }, [globalSales, localRange]);

  const metricsInCat = useMemo(
    () => aggregateMetrics(sales).filter((m) => m.categoryId === categoryId),
    [sales, categoryId]
  );

  const byUnits = useMemo(
    () => metricsInCat.slice().sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5).map((m) => ({ name: m.name, value: m.unitsSold })),
    [metricsInCat]
  );
  const byRevenue = useMemo(
    () => metricsInCat.slice().sort((a, b) => b.revenue - a.revenue).slice(0, 5).map((m) => ({ name: m.name, value: Number(m.revenue.toFixed(2)) })),
    [metricsInCat]
  );

  const current = localRange || globalRange;

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="text-base">{categoryName}</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 max-w-full whitespace-nowrap">
                <CalendarIcon className="h-4 w-4" />
                <span className="truncate">{current.start.slice(0, 10)} → {current.end.slice(0, 10)}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[94vw] sm:w-auto max-w-[520px] p-3" align="start">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">Start date</div>
                  <Calendar
                    mode="single"
                    selected={new Date(current.start)}
                    onSelect={(d) => d && setLocalRange({ ...(current as DateTimeRange), start: new Date(d.setHours(0,0,0,0)).toISOString().slice(0,16) })}
                  />
                </div>
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">End date</div>
                  <Calendar
                    mode="single"
                    selected={new Date(current.end)}
                    onSelect={(d) => d && setLocalRange({ ...(current as DateTimeRange), end: new Date(d.setHours(23,59,0,0)).toISOString().slice(0,16) })}
                  />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Start time</Label>
                  <Input type="time" value={current.start.slice(11,16)} onChange={(e) => setLocalRange({ ...(current as DateTimeRange), start: `${current.start.slice(0,10)}T${e.target.value}` })} className="h-8 max-w-[140px]" />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">End time</Label>
                  <Input type="time" value={current.end.slice(11,16)} onChange={(e) => setLocalRange({ ...(current as DateTimeRange), end: `${current.end.slice(0,10)}T${e.target.value}` })} className="h-8 max-w-[140px]" />
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {localRange && (
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" title="Reset to page range" onClick={() => setLocalRange(undefined)}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="units">
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="units">Units</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>
          <TabsContent value="units">
            <ChartContainer config={{ value: { label: "Units", color: "hsl(var(--chart-1))" } }} className="w-full h-[200px] sm:h-[240px] px-2 sm:px-0">
              <BarChart data={byUnits} margin={{ left: 0, right: 0 }} barGap={4} barCategoryGap="12%">
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" type="category" tickLine={false} axisLine={false} hide padding={{ left: 8, right: 8 }} allowDuplicatedCategory={false} />
                <YAxis tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={4} />
              </BarChart>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="revenue">
            <ChartContainer config={{ value: { label: "Revenue", color: "hsl(var(--chart-2))" } }} className="w-full h-[200px] sm:h-[240px] px-2 sm:px-0">
              <BarChart data={byRevenue} margin={{ left: 0, right: 0 }} barGap={4} barCategoryGap="12%">
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" type="category" tickLine={false} axisLine={false} hide padding={{ left: 8, right: 8 }} allowDuplicatedCategory={false} />
                <YAxis tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={4} />
              </BarChart>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


