export type Section = {
  id: string;
  name: string;
};

export type Category = {
  id: string;
  name: string;
  sectionId: string;
};

export type Item = {
  id: string;
  name: string;
  categoryId: string;
  sectionId: string;
  unitCost: number;
  unitPrice: number;
};

export type ItemSales = {
  itemId: string;
  date: string; // ISO date or datetime (e.g., YYYY-MM-DD or full ISO)
  unitsSold: number;
};

export type ItemWithMetrics = Item & {
  unitsSold: number;
  revenue: number;
  cost: number;
  profit: number;
};

export type TimeRangeOption = 7 | 30 | 90;

export type DateInterval = "day" | "hour";

export type DateTimeRange = {
  start: string; // ISO datetime, e.g., 2025-01-01T00:00
  end: string;   // ISO datetime, e.g., 2025-01-31T23:59
  interval: DateInterval;
};


