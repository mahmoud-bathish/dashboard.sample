"use client";

import { useMemo, useState } from "react";
import { HeaderFilters } from "@/components/dashboard/HeaderFilters";
import { SectionSalesPie } from "@/components/dashboard/SectionSalesPie";
import { generateSalesForRange } from "@/lib/data";
import type { DateTimeRange, DateInterval } from "@/lib/types";

export default function Home() {
  const [range, setRange] = useState<DateTimeRange | undefined>(undefined);
  const sales = useMemo(() => {
    const r =
      range || {
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 16),
        end: new Date().toISOString().slice(0, 16),
        interval: "day" as DateInterval,
      };
    return generateSalesForRange(r);
  }, [range]);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Store Performance Dashboard</h1>
        <HeaderFilters rangeValue={range} onRangeChange={setRange} />
      </div>

      <SectionSalesPie globalSales={sales} globalRange={range || {
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 16),
        end: new Date().toISOString().slice(0, 16),
        interval: "day" as DateInterval,
      }} />
    </div>
  );
}
