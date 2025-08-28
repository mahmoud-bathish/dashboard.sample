"use client";

import { useMemo, useState, useCallback } from "react";
import { HeaderFilters } from "@/components/dashboard/HeaderFilters";
import { SectionSalesPie } from "@/components/dashboard/SectionSalesPie";
import { aggregateMetrics, generateSalesForRange } from "@/lib/data";
import type { DateTimeRange, DateInterval } from "@/lib/types";

// Cache for sales data to avoid regeneration
const salesCache = new Map<string, any>();

export default function HomePage() {
  const [range, setRange] = useState<DateTimeRange | undefined>(undefined);
  
  const currentRange = useMemo(() => (
    range || {
      start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 16),
      end: new Date().toISOString().slice(0, 16),
      interval: "day" as DateInterval,
    }
  ), [range]);

  // Optimized sales generation with caching
  const sales = useMemo(() => {
    const cacheKey = `${currentRange.start}-${currentRange.end}-${currentRange.interval}`;
    
    if (salesCache.has(cacheKey)) {
      return salesCache.get(cacheKey);
    }
    
    const generatedSales = generateSalesForRange(currentRange);
    salesCache.set(cacheKey, generatedSales);
    
    // Limit cache size to prevent memory issues
    if (salesCache.size > 10) {
      const firstKey = salesCache.keys().next().value;
      salesCache.delete(firstKey);
    }
    
    return generatedSales;
  }, [currentRange]);

  const metrics = useMemo(() => aggregateMetrics(sales), [sales]);

  // Memoize the range change handler
  const handleRangeChange = useCallback((newRange: DateTimeRange | undefined) => {
    setRange(newRange);
  }, []);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Supermarket Dashboard</h1>
        <HeaderFilters rangeValue={range} onRangeChange={handleRangeChange} />
      </div>

      <SectionSalesPie globalSales={sales} globalRange={currentRange} />
    </div>
  );
}
