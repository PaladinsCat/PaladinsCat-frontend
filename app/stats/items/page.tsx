"use client";

import { useEffect, useState } from "react";
import { fetchItems, type ItemStat } from "@/lib/api-client";

export default function ItemsPage() {
  const [items, setItems] = useState<ItemStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchItems()
      .then(setItems)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-pc-accent">Item Meta</h1>
      {loading ? (
        <div className="text-center py-8 text-pc-text-secondary">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-pc-text-muted">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-pc-bg-elevated">
              <tr>
                <th className="px-4 py-2 text-pc-accent font-semibold">Item</th>
                <th className="px-4 py-2 text-pc-accent font-semibold">Total Usage</th>
                <th className="px-4 py-2 text-pc-accent font-semibold">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 20).map((i) => (
                <tr key={i.itemId} className="border-t border-pc-border">
                  <td className="px-4 py-2 text-pc-text">{i.itemName}</td>
                  <td className="px-4 py-2 text-pc-text">{i.totalUsage}</td>
                  <td className="px-4 py-2 text-pc-text">{i.winRate?.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
