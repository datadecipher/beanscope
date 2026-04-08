"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { DashboardData } from "@/lib/minebean";

interface TokenomicsSectionProps {
  data: DashboardData;
}

export function TokenomicsSection({ data }: TokenomicsSectionProps) {
  const supply = parseFloat(data.beanSupply);
  const maxSupply = 3_000_000;
  const burned = 0; // TODO: track from ClaimedBEAN roasting fees
  const circulating = supply;

  const supplyData = [
    { name: "Circulating", value: circulating },
    { name: "Unminted", value: maxSupply - supply },
  ];

  const COLORS = ["#10b981", "#27272a"];

  // Block win distribution for bar chart
  const blockData = data.blockWinCounts.map((count, i) => ({
    block: i,
    wins: count,
  }));

  return (
    <div className="space-y-6">
      {/* Supply cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SupplyCard
          label="Minted"
          value={`${supply.toLocaleString(undefined, { maximumFractionDigits: 0 })} BEAN`}
          sub={`${((supply / maxSupply) * 100).toFixed(2)}% of max`}
        />
        <SupplyCard
          label="Max Supply"
          value="3,000,000 BEAN"
          sub="Hard cap"
        />
        <SupplyCard
          label="Emission Rate"
          value="1 BEAN / round"
          sub="+ 0.3 BEAN beanpot accumulation"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-4 text-lg font-semibold">Supply Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={supplyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {supplyData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                  }}
                  formatter={(value) =>
                    typeof value === "number"
                      ? value.toLocaleString(undefined, { maximumFractionDigits: 0 })
                      : String(value)
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-center gap-6 text-xs text-zinc-400">
            {supplyData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: COLORS[i] }}
                />
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-4 text-lg font-semibold">
            Block Win Distribution
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={blockData}>
                <XAxis
                  dataKey="block"
                  tick={{ fill: "#71717a", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="wins" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function SupplyCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-xl font-bold text-emerald-400">{value}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>
    </div>
  );
}
