import { Category, Item, ItemSales, Section, TimeRangeOption, ItemWithMetrics, DateTimeRange } from "./types";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const sections: Section[] = [
  { id: "sec-grocery", name: "Grocery" },
  { id: "sec-produce", name: "Produce" },
  { id: "sec-dairy", name: "Dairy" },
  { id: "sec-bakery", name: "Bakery" },
  { id: "sec-beverages", name: "Beverages" },
];

// Generate 10-30 categories per section
const CATEGORY_BASE_WORDS = [
  "Staples",
  "Snacks",
  "Fresh",
  "Deli",
  "Frozen",
  "Pantry",
  "Beverages",
  "Baking",
  "Cereal",
  "Condiments",
  "Household",
  "Health",
  "Beauty",
  "Pets",
  "Baby",
  "International",
  "Organic",
  "Seasonal",
  "Specialty",
  "Gourmet",
  "Cans",
  "Dairy",
  "Cheese",
  "Yogurt",
  "Bread",
  "Pastry",
  "Produce",
  "Meat",
  "Seafood",
  "Prepared",
  "Grains",
  "Sauces",
  "Spreads",
  "Nuts",
  "Sweets",
  "Cleaners",
];

export const categories: Category[] = sections.flatMap((section) => {
  const count = randomInt(10, 30);
  const created: Category[] = [];
  for (let i = 0; i < count; i++) {
    const base = pick(CATEGORY_BASE_WORDS);
    const id = `cat-${section.id}-${i + 1}`;
    const name = `${base} ${i + 1}`;
    created.push({ id, name, sectionId: section.id });
  }
  return created;
});

// Exactly 5 items per category
const ITEM_STYLE_WORDS = [
  "Classic",
  "Premium",
  "Family Pack",
  "Mini",
  "Large",
  "Zero Sugar",
  "Light",
  "Original",
  "Spicy",
  "Fresh",
  "Whole",
  "Sliced",
  "Organic",
  "Gluten Free",
  "Low Fat",
  "Extra",
];
const PRODUCT_WORDS = [
  "Blend",
  "Mix",
  "Snack",
  "Bites",
  "Delight",
  "Pack",
  "Selection",
  "Treat",
  "Variety",
  "Special",
];

export const items: Item[] = categories.flatMap((cat) => {
  const list: Item[] = [];
  for (let i = 0; i < 5; i++) {
    const descriptor = pick(ITEM_STYLE_WORDS);
    const product = pick(PRODUCT_WORDS);
    const name = `${descriptor} ${product}`;
    const unitCost = randomInt(1, 15);
    
    // Create more realistic profit scenarios
    let unitPrice: number;
    if (i === 0) {
      // First item: high profit margin
      unitPrice = unitCost + randomInt(8, 15);
    } else if (i === 1) {
      // Second item: moderate profit margin
      unitPrice = unitCost + randomInt(3, 8);
    } else if (i === 2) {
      // Third item: low profit margin
      unitPrice = unitCost + randomInt(1, 4);
    } else if (i === 3) {
      // Fourth item: break-even or slight loss
      unitPrice = unitCost + randomInt(-2, 2);
    } else {
      // Fifth item: potential loss
      unitPrice = unitCost + randomInt(-5, 0);
    }
    
    list.push({
      id: `${cat.id}-item-${i + 1}`,
      name,
      categoryId: cat.id,
      sectionId: cat.sectionId,
      unitCost: Math.max(0.5, unitCost),
      unitPrice: Math.max(0.2, unitPrice),
    });
  }
  return list;
});

export function generateSales(days: TimeRangeOption): ItemSales[] {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - days + 1);

  const sales: ItemSales[] = [];

  for (const item of items) {
    const base = randomInt(2, 40);
    for (let d = 0; d < days; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + d);
      const weekday = date.getDay(); // 0 Sun .. 6 Sat
      const weekendBoost = weekday === 0 || weekday === 6 ? 1.4 : 1;
      const categoryFactor = 1 + (categories.find((c) => c.id === item.categoryId)?.name.length || 8) / 50;
      const noise = 0.6 + Math.random() * 0.8;
      const unitsSold = Math.max(0, Math.round(base * weekendBoost * categoryFactor * noise - randomInt(0, 4)));
      sales.push({ itemId: item.id, date: date.toISOString().slice(0, 10), unitsSold });
    }
  }
  return sales;
}

// New: generate sales for an arbitrary datetime range and interval (day/hour)
export function generateSalesForRange(range: DateTimeRange): ItemSales[] {
  const start = new Date(range.start);
  const end = new Date(range.end);
  const stepMs = range.interval === "hour" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  const sales: ItemSales[] = [];
  for (const item of items) {
    const base = randomInt(2, 40);
    for (let t = start.getTime(); t <= end.getTime(); t += stepMs) {
      const dt = new Date(t);
      const weekday = dt.getDay();
      const hour = dt.getHours();
      const weekendBoost = weekday === 0 || weekday === 6 ? 1.4 : 1;
      const hourBoost = range.interval === "hour" ? (hour >= 10 && hour <= 20 ? 1.2 : 0.6) : 1;
      const categoryFactor = 1 + (categories.find((c) => c.id === item.categoryId)?.name.length || 8) / 50;
      const noise = 0.6 + Math.random() * 0.8;
      const units = Math.max(0, Math.round(base * weekendBoost * hourBoost * categoryFactor * noise - randomInt(0, 4)));
      sales.push({ itemId: item.id, date: dt.toISOString(), unitsSold: units });
    }
  }
  return sales;
}

export function aggregateMetrics(sales: ItemSales[]): ItemWithMetrics[] {
  const grouped = new Map<string, number>();
  for (const s of sales) {
    grouped.set(s.itemId, (grouped.get(s.itemId) || 0) + s.unitsSold);
  }
  return items.map((item) => {
    const unitsSold = grouped.get(item.id) || 0;
    const revenue = unitsSold * item.unitPrice;
    const cost = unitsSold * item.unitCost;
    const profit = revenue - cost;
    return { ...item, unitsSold, revenue, cost, profit };
  });
}

export function topSellingByCategory(metrics: ItemWithMetrics[], topN = 5) {
  const byCategory = new Map<string, ItemWithMetrics[]>();
  for (const m of metrics) {
    const arr = byCategory.get(m.categoryId) || [];
    arr.push(m);
    byCategory.set(m.categoryId, arr);
  }
  const result: { categoryId: string; items: ItemWithMetrics[] }[] = [];
  for (const [categoryId, arr] of byCategory) {
    result.push({ categoryId, items: arr.sort((a, b) => b.unitsSold - a.unitsSold).slice(0, topN) });
  }
  return result;
}

export function topSellingBySection(metrics: ItemWithMetrics[], topN = 5) {
  const bySection = new Map<string, ItemWithMetrics[]>();
  for (const m of metrics) {
    const arr = bySection.get(m.sectionId) || [];
    arr.push(m);
    bySection.set(m.sectionId, arr);
  }
  const result: { sectionId: string; items: ItemWithMetrics[] }[] = [];
  for (const [sectionId, arr] of bySection) {
    result.push({ sectionId, items: arr.sort((a, b) => b.unitsSold - a.unitsSold).slice(0, topN) });
  }
  return result;
}

export function unprofitableItems(metrics: ItemWithMetrics[]) {
  return metrics.filter((m) => m.profit <= 0).sort((a, b) => a.profit - b.profit);
}

export function getSectionName(sectionId: string): string {
  return sections.find((s) => s.id === sectionId)?.name || sectionId;
}

export function getCategoryName(categoryId: string): string {
  return categories.find((c) => c.id === categoryId)?.name || categoryId;
}


