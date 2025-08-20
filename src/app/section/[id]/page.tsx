"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { HeaderFilters } from "@/components/dashboard/HeaderFilters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { aggregateMetrics, categories, generateSalesForRange, getCategoryName, getSectionName } from "@/lib/data";
import type { DateTimeRange } from "@/lib/types";
import { CategoryTopCard } from "@/components/dashboard/CategoryTopCard";

export default function SectionDetailsPage() {
  const params = useParams<{ id: string }>();
  const sectionId = params?.id;
  const sectionName = getSectionName(sectionId);

  const [range, setRange] = useState<DateTimeRange | undefined>(undefined);
  const [query, setQuery] = useState<string>("");
  const currentRange = useMemo(() => (
    range || {
      start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 16),
      end: new Date().toISOString().slice(0, 16),
      interval: "day",
    }
  ), [range]);

  const sales = useMemo(() => generateSalesForRange(currentRange), [currentRange]);
  const metrics = useMemo(() => aggregateMetrics(sales).filter((m) => m.sectionId === sectionId), [sales, sectionId]);

  const categoriesInSection = useMemo(() => categories.filter((c) => c.sectionId === sectionId), [sectionId]);
  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categoriesInSection;
    return categoriesInSection.filter((c) => c.name.toLowerCase().includes(q));
  }, [categoriesInSection, query]);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{sectionName} — Top Items per Category</h1>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative w-full sm:w-[280px]">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search category..."
              className="pl-8"
            />
            {query && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => setQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <HeaderFilters rangeValue={range} onRangeChange={setRange} />
        </div>
      </div>

      <div className="text-sm text-muted-foreground">{filteredCategories.length} of {categoriesInSection.length} categories</div>

      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCategories.map((cat) => (
          <CategoryTopCard
            key={cat.id}
            categoryId={cat.id}
            categoryName={getCategoryName(cat.id)}
            sectionId={sectionId}
            globalSales={sales}
            globalRange={currentRange}
          />
        ))}
      </div>
    </div>
  );
}


