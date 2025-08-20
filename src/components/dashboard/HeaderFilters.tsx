"use client";

import { useState } from "react";
import type { DateTimeRange, DateInterval } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  onRangeChange?: (range: DateTimeRange) => void;
  rangeValue?: DateTimeRange;
};

export function HeaderFilters({ onRangeChange, rangeValue }: Props) {
  const [localRange, setLocalRange] = useState<DateTimeRange>(
    rangeValue || {
      start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 16),
      end: new Date().toISOString().slice(0, 16),
      interval: "day" as DateInterval,
    }
  );

  const emit = (next: Partial<DateTimeRange>) => {
    const updated: DateTimeRange = { ...localRange, ...next } as DateTimeRange;
    setLocalRange(updated);
    onRangeChange?.(updated);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Label htmlFor="start" className="text-xs text-muted-foreground">Start</Label>
        <Input id="start" type="datetime-local" value={localRange.start} onChange={(e) => emit({ start: e.target.value })} className="w-[200px]" />
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="end" className="text-xs text-muted-foreground">End</Label>
        <Input id="end" type="datetime-local" value={localRange.end} onChange={(e) => emit({ end: e.target.value })} className="w-[200px]" />
      </div>
    </div>
  );
}


