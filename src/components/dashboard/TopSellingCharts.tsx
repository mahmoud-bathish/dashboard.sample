"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { aggregateMetrics, getCategoryName, getSectionName, topSellingByCategory, topSellingBySection } from "@/lib/data";
import type { ItemSales, TimeRangeOption } from "@/lib/types";

type Props = {
  sales: ItemSales[];
};

export function TopSellingCharts({ sales }: Props) {
  const metrics = useMemo(() => aggregateMetrics(sales), [sales]);
  const byCategory = useMemo(() => topSellingByCategory(metrics, 5), [metrics]);
  const bySection = useMemo(() => topSellingBySection(metrics, 5), [metrics]);

  return (
    <Tabs defaultValue="section" className="w-full">
      <TabsList className="grid grid-cols-2 w-full">
        <TabsTrigger value="section">Top by Section</TabsTrigger>
        <TabsTrigger value="category">Top by Category</TabsTrigger>
      </TabsList>
      <TabsContent value="section" className="mt-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bySection.map(({ sectionId, items }) => {
            const chartData = items.map((m) => ({ name: m.name, units: m.unitsSold }));
            return (
              <Card key={sectionId}>
                <CardHeader>
                  <CardTitle>{getSectionName(sectionId)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{ units: { label: "Units", color: "hsl(var(--chart-1))" } }}
                    className="w-full h-[260px]"
                  >
                    <BarChart data={chartData}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} hide />
                      <YAxis tickLine={false} axisLine={false} width={40} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="units" fill="var(--color-units)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Top 5 items by units sold
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>
      <TabsContent value="category" className="mt-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {byCategory.map(({ categoryId, items }) => {
            const chartData = items.map((m) => ({ name: m.name, units: m.unitsSold }));
            return (
              <Card key={categoryId}>
                <CardHeader>
                  <CardTitle>{getCategoryName(categoryId)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{ units: { label: "Units", color: "hsl(var(--chart-2))" } }}
                    className="w-full h-[260px]"
                  >
                    <BarChart data={chartData}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} hide />
                      <YAxis tickLine={false} axisLine={false} width={40} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="units" fill="var(--color-units)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Top 5 items by units sold
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>
    </Tabs>
  );
}


