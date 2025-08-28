"use client";

import { useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeaderFilters } from "@/components/dashboard/HeaderFilters";
import { CategoryTopCard } from "@/components/dashboard/CategoryTopCard";
import { aggregateMetrics, categories, items, sections, generateSalesForRange } from "@/lib/data";
import type { DateTimeRange, DateInterval } from "@/lib/types";
import { BarChart3, TrendingUp, DollarSign } from "lucide-react";

type CategoryMetricType = "quantity" | "revenue" | "profit";
type CategoryDisplayMode = "values" | "percentages";

export default function SectionPage() {
  const params = useParams();
  const sectionId = params.id as string;
  const [query, setQuery] = useState("");
  const [categoryMetricType, setCategoryMetricType] = useState<CategoryMetricType>("quantity");
  const [categoryDisplayMode, setCategoryDisplayMode] = useState<CategoryDisplayMode>("values");

  const [range, setRange] = useState<DateTimeRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
    interval: "day" as DateInterval,
  });

  // Cache sales data to prevent regeneration
  const salesCache = new Map<string, any[]>();

  const sales = useMemo(() => {
    const cacheKey = `${range.start}-${range.end}-${range.interval}`;
    if (salesCache.has(cacheKey)) {
      return salesCache.get(cacheKey)!;
    }
    
    const generatedSales = generateSalesForRange(range);
    salesCache.set(cacheKey, generatedSales);
    return generatedSales;
  }, [range]);

  const metrics = useMemo(() => aggregateMetrics(sales).filter((m) => m.sectionId === sectionId), [sales, sectionId]);

  const categoriesInSection = useMemo(() => categories.filter((c) => c.sectionId === sectionId), [sectionId]);

  // Calculate category-level metrics for the overview
  const categoryMetrics = useMemo(() => {
    const categoryData = categoriesInSection.map(category => {
      const categoryItems = items.filter(item => item.categoryId === category.id);
      const categorySales = sales.filter(sale => {
        const item = items.find(i => i.id === sale.itemId);
        return item && item.categoryId === category.id;
      });
      
      const itemMetrics = aggregateMetrics(categorySales);
      const totalQuantity = itemMetrics.reduce((sum, item) => sum + item.unitsSold, 0);
      const totalRevenue = itemMetrics.reduce((sum, item) => sum + item.revenue, 0);
      const totalProfit = itemMetrics.reduce((sum, item) => sum + item.profit, 0);
      
      return {
        categoryId: category.id,
        categoryName: category.name,
        quantity: totalQuantity,
        revenue: totalRevenue,
        profit: totalProfit
      };
    });

    // Sort by selected metric in descending order
    return categoryData.sort((a, b) => {
      let aValue: number, bValue: number;
      switch (categoryMetricType) {
        case "quantity":
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case "revenue":
          aValue = a.revenue;
          bValue = b.revenue;
          break;
        case "profit":
          aValue = a.profit;
          bValue = b.profit;
          break;
        default:
          aValue = a.quantity;
          bValue = b.quantity;
      }
      return bValue - aValue;
    });
  }, [categoriesInSection, sales, categoryMetricType]);

  // Calculate totals for percentage calculations
  const categoryTotals = useMemo(() => {
    const totals = categoryMetrics.reduce((acc, category) => ({
      quantity: acc.quantity + category.quantity,
      revenue: acc.revenue + category.revenue,
      profit: acc.profit + category.profit
    }), { quantity: 0, revenue: 0, profit: 0 });
    
    return totals;
  }, [categoryMetrics]);

  const handleRangeChange = useCallback((newRange: DateTimeRange) => {
    setRange(newRange);
  }, []);

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleClearQuery = useCallback(() => {
    setQuery("");
  }, []);

  const filteredCategories = categoriesInSection.filter((category) =>
    category.name.toLowerCase().includes(query.toLowerCase())
  );

  const section = sections.find((s) => s.id === sectionId);

  if (!section) {
    return <div>Section not found</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{section.name} Section</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Scroll to the category performance overview
              const element = document.getElementById('category-performance-overview');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="text-xs"
          >
            📊 Check Categories Performance
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="flex gap-2">
          <Input
            placeholder="Search categories..."
            value={query}
            onChange={handleQueryChange}
            className="flex-1"
          />
          {query && (
            <Button variant="outline" onClick={handleClearQuery}>
              Clear
            </Button>
          )}
        </div>

        {/* Date Filters */}
        <HeaderFilters range={range} onRangeChange={handleRangeChange} />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((category) => (
          <div key={category.id} id={`category-${category.id}`}>
            <CategoryTopCard
              categoryId={category.id}
              categoryName={category.name}
              sectionId={sectionId}
              globalSales={sales}
            />
          </div>
        ))}
      </div>

      {/* Category Metrics Overview Filter - Moved to bottom */}
      <Card id="category-performance-overview">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Category Performance Overview</CardTitle>
          <div className="flex flex-col gap-2">
            <Tabs value={categoryMetricType} onValueChange={(v) => setCategoryMetricType(v as CategoryMetricType)} className="w-full">
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
                variant={categoryDisplayMode === "values" ? "default" : "outline"}
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => setCategoryDisplayMode("values")}
              >
                Values
              </Button>
              <Button
                variant={categoryDisplayMode === "percentages" ? "default" : "outline"}
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => setCategoryDisplayMode("percentages")}
              >
                %
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryMetrics.map((category) => {
              let value: number;
              let total: number;
              
              switch (categoryMetricType) {
                case "quantity":
                  value = category.quantity;
                  total = categoryTotals.quantity;
                  break;
                case "revenue":
                  value = category.revenue;
                  total = categoryTotals.revenue;
                  break;
                case "profit":
                  value = category.profit;
                  total = categoryTotals.profit;
                  break;
                default:
                  value = category.quantity;
                  total = categoryTotals.quantity;
              }

              const percentage = total > 0 ? (value / total) * 100 : 0;
              const displayValue = categoryDisplayMode === "percentages" ? percentage : value;
              
              let formattedValue: string;
              if (categoryDisplayMode === "percentages") {
                formattedValue = `${percentage.toFixed(1)}%`;
              } else {
                switch (categoryMetricType) {
                  case "quantity":
                    formattedValue = value.toLocaleString();
                    break;
                  case "revenue":
                    formattedValue = `$${value.toLocaleString()}`;
                    break;
                  case "profit":
                    formattedValue = `$${value.toLocaleString()}`;
                    break;
                  default:
                    formattedValue = value.toLocaleString();
                }
              }

              return (
                <div
                  key={category.categoryId}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                  onClick={() => {
                    // Scroll to the category card
                    const element = document.getElementById(`category-${category.categoryId}`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{category.categoryName}</div>
                    <div className="text-xs text-muted-foreground">
                      {categoryDisplayMode === "percentages" ? "Category Share" : getMetricLabel(categoryMetricType)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{formattedValue}</div>
                    <div className="text-xs text-muted-foreground">
                      {categoryDisplayMode === "percentages" ? `${value.toLocaleString()} units` : `${percentage.toFixed(1)}%`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getMetricLabel(metricType: CategoryMetricType): string {
  switch (metricType) {
    case "quantity": return "Units";
    case "revenue": return "Revenue";
    case "profit": return "Profit";
    default: return "Units";
  }
}


