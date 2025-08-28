"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { aggregateMetrics, items } from "@/lib/data";
import type { ItemSales } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, DollarSign } from "lucide-react";

type Props = {
  categoryId: string;
  categoryName: string;
  sectionId: string;
  globalSales: ItemSales[];
};

type MetricType = "quantity" | "revenue" | "profit";
type DisplayMode = "values" | "percentages";

export function CategoryTopCard({ categoryId, categoryName, sectionId, globalSales }: Props) {
  const [metricType, setMetricType] = useState<MetricType>("quantity");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("values");

  const { topItems, totalValue, categoryTotal } = useMemo(() => {
    console.log('CategoryTopCard Data Debug:', {
      categoryId,
      categoryName,
      globalSalesLength: globalSales.length,
      sectionId
    });

    // Get all items in this category first
    const categoryItems = items.filter(item => item.categoryId === categoryId);
    console.log('Category items found:', categoryItems.length);

    // Get all sales for this category
    const categorySales = globalSales.filter(sale => {
      const item = items.find(i => i.id === sale.itemId);
      const matches = item && item.categoryId === categoryId;
      if (matches) {
        console.log('Found matching sale:', { sale, item });
      }
      return matches;
    });

    console.log('Category sales found:', categorySales.length);

    // Get metrics for this category
    const metrics = aggregateMetrics(categorySales);
    console.log('Aggregated metrics:', metrics);

    const categoryMetrics = metrics.filter(m => m.categoryId === categoryId);
    console.log('Category metrics:', categoryMetrics);

    if (categoryMetrics.length === 0) {
      console.log('No category metrics found!');
      return { topItems: [], totalValue: 0, categoryTotal: 0 };
    }

    // Calculate total for the entire category (all items, not just top 5)
    const totalCategoryValue = categoryMetrics.reduce((sum, item) => {
      switch (metricType) {
        case "quantity":
          return sum + item.unitsSold;
        case "revenue":
          return sum + item.revenue;
        case "profit":
          return sum + item.profit;
        default:
          return sum + item.unitsSold;
      }
    }, 0);

    // Get the top 5 items by the selected metric
    let sortedItems: typeof categoryMetrics;
    switch (metricType) {
      case "quantity":
        sortedItems = [...categoryMetrics].sort((a, b) => b.unitsSold - a.unitsSold);
        break;
      case "revenue":
        sortedItems = [...categoryMetrics].sort((a, b) => b.revenue - a.revenue);
        break;
      case "profit":
        sortedItems = [...categoryMetrics].sort((a, b) => b.profit - a.profit);
        break;
      default:
        sortedItems = [...categoryMetrics].sort((a, b) => b.unitsSold - a.unitsSold);
    }

    const top5 = sortedItems.slice(0, 5);
    console.log('Top 5 items:', top5);

    // Calculate total for top 5 items
    const top5Total = top5.reduce((sum, item) => {
      switch (metricType) {
        case "quantity":
          return sum + item.unitsSold;
        case "revenue":
          return sum + item.revenue;
        case "profit":
          return sum + item.profit;
        default:
          return sum + item.unitsSold;
      }
    }, 0);

    // Convert to percentages if needed (based on category total, not top 5 total)
    if (displayMode === "percentages" && totalCategoryValue > 0) {
      top5.forEach(item => {
        let value: number;
        switch (metricType) {
          case "quantity":
            value = item.unitsSold;
            break;
          case "revenue":
            value = item.revenue;
            break;
          case "profit":
            value = item.profit;
            break;
          default:
            value = item.unitsSold;
        }
        // Add percentage to the item object
        (item as any).percentage = (value / totalCategoryValue) * 100;
      });
    }

    console.log('Final result:', { topItems: top5, totalValue: top5Total, categoryTotal: totalCategoryValue });
    return { 
      topItems: top5, 
      totalValue: top5Total, 
      categoryTotal: totalCategoryValue 
    };
  }, [categoryId, globalSales, metricType, displayMode]);

  const chartData = topItems.map((item, index) => {
    let value: number;
    if (displayMode === "percentages") {
      value = (item as any).percentage || 0;
    } else {
      switch (metricType) {
        case "quantity":
          value = item.unitsSold;
          break;
        case "revenue":
          value = item.revenue;
          break;
        case "profit":
          value = item.profit;
          break;
        default:
          value = item.unitsSold;
      }
    }

    return {
      name: item.name, // Use item.name instead of item.itemName
      value,
      rawValue: value,
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    };
  });

  // Debug logging to see what's happening
  console.log('CategoryTopCard Chart Debug:', {
    categoryId,
    categoryName,
    topItems: topItems.length,
    chartData,
    metricType,
    displayMode,
    totalValue,
    categoryTotal
  });

  // Ensure we have data to display
  if (chartData.length === 0) {
    console.log('No chart data available!');
  }

  const formatTotal = (value: number) => {
    if (displayMode === "percentages") {
      // Show total percentage of top 5 items relative to category total
      const top5Percentage = (totalValue / categoryTotal) * 100;
      return `${top5Percentage.toFixed(1)}% of category`;
    }
    
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

  if (topItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{categoryName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            No data available for this category
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{categoryName}</CardTitle>
        <div className="flex flex-col gap-2">
          <Tabs value={metricType} onValueChange={(v) => setMetricType(v as MetricType)} className="w-full">
            <TabsList className="grid grid-cols-3 h-8">
              <TabsTrigger value="quantity" className="text-xs px-2">
                <BarChart3 className="h-3 w-3 mr-1" />
                Qty
              </TabsTrigger>
              <TabsTrigger value="revenue" className="text-xs px-2">
                <DollarSign className="h-3 w-3 mr-1" />
                Rev
              </TabsTrigger>
              <TabsTrigger value="profit" className="text-xs px-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                Profit
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-1">
            <Button
              variant={displayMode === "values" ? "default" : "outline"}
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => setDisplayMode("values")}
            >
              Values
            </Button>
            <Button
              variant={displayMode === "percentages" ? "default" : "outline"}
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => setDisplayMode("percentages")}
            >
              %
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Top 5 Items - {getMetricLabel()}</div>
            <div className="text-lg font-semibold">{formatTotal(totalValue)}</div>
          </div>
          
          <div className="h-[240px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <XAxis 
                    dataKey="name" 
                    type="category"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    padding={{ left: 8, right: 8 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    type="number"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        const data = payload[0].payload;
                        const itemName = data.name;
                        const value = data.rawValue;
                        
                        let formattedValue: string;
                        let metricLabel: string;
                        
                        if (displayMode === "percentages") {
                          formattedValue = `${value.toFixed(1)}%`;
                          metricLabel = "Category Share";
                        } else {
                          switch (metricType) {
                            case "quantity":
                              formattedValue = value.toLocaleString();
                              metricLabel = "Units";
                              break;
                            case "revenue":
                              formattedValue = `$${value.toLocaleString()}`;
                              metricLabel = "Revenue";
                              break;
                            case "profit":
                              formattedValue = `$${value.toLocaleString()}`;
                              metricLabel = "Profit";
                              break;
                            default:
                              formattedValue = value.toLocaleString();
                              metricLabel = "Units";
                          }
                        }
                        
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-2 space-y-1">
                            <div className="font-medium text-foreground text-xs">{itemName}</div>
                            <div className="text-xs">
                              <span className="text-muted-foreground">{metricLabel}: </span>
                              <span className="font-medium text-foreground">{formattedValue}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              // Fallback with sample data to ensure chart renders
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground">No data available</div>
                  <div className="text-xs text-muted-foreground">
                    Debug: {topItems.length} items, {metricType}, {displayMode}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Chart data length: {chartData.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Top items: {JSON.stringify(topItems.map(i => ({ name: i.name, value: i.unitsSold })))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            {displayMode === "percentages" 
              ? `Top 5 items represent ${((totalValue / categoryTotal) * 100).toFixed(1)}% of category total`
              : `Showing top 5 of ${topItems.length + Math.max(0, Math.floor(categoryTotal / totalValue * 5) - 5)} items`
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


