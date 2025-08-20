"use client";

import { useMemo } from "react";
import { aggregateMetrics, getCategoryName, getSectionName, unprofitableItems } from "@/lib/data";
import type { ItemSales } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Props = { sales: ItemSales[] };

export function UnprofitableTable({ sales }: Props) {
  const metrics = useMemo(() => aggregateMetrics(sales), [sales]);
  const losers = useMemo(() => unprofitableItems(metrics).slice(0, 20), [metrics]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unprofitable Items</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Section</TableHead>
              <TableHead className="text-right">Units</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {losers.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell>{getCategoryName(m.categoryId)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{getSectionName(m.sectionId)}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{m.unitsSold.toLocaleString()}</TableCell>
                <TableCell className="text-right tabular-nums">{m.revenue.toFixed(2)}</TableCell>
                <TableCell className="text-right tabular-nums">{m.cost.toFixed(2)}</TableCell>
                <TableCell className="text-right tabular-nums text-red-600">{m.profit.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}


