"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { DashboardData } from "@/lib/minebean";

interface TokenomicsChartsProps {
  data: DashboardData;
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#18181b",
    border: "1px solid #27272a",
    borderRadius: "8px",
    fontSize: "12px",
  },
  labelStyle: { color: "#a1a1aa" },
};

const MAX_SUPPLY = 3_000_000;

export function TokenomicsCharts({ data }: TokenomicsChartsProps) {
  const {
    roundHistory,
    beanSupply,
    totalETHRewarded,
    avgYieldPerRound,
    bestRound,
    totalBeanpotDistributed,
    burnedSupply,
    currentRound,
  } = data;

  const supply = parseFloat(beanSupply);
  const burned = parseFloat(burnedSupply);
  const circulating = Math.max(0, supply - burned);
  const unminted = Math.max(0, MAX_SUPPLY - supply);
  const avgEmission = supply > 0 && currentRound > 0 ? supply / currentRound : 1;
  const roundsUntilMax = avgEmission > 0 ? Math.round(unminted / avgEmission) : 0;

  // Emission cumulative chart (every 10th round to keep size manageable)
  const emissionData = roundHistory
    .filter((_, i) => i % Math.max(1, Math.floor(roundHistory.length / 60)) === 0)
    .map((r, i) => ({
      round: r.roundId,
      cumSupply: Math.round(((i + 1) / roundHistory.length) * supply),
    }));

  // ETH yield per round (last 50)
  const yieldData = roundHistory.slice(-50).map((r) => ({
    round: r.roundId,
    yield: parseFloat(parseFloat(r.topMinerReward).toFixed(4)),
  }));

  // Supply pie
  const pieData = [
    { name: "Circulating", value: parseFloat(circulating.toFixed(0)), color: "#10b981" },
    { name: "Burned", value: parseFloat(burned.toFixed(0)), color: "#ef4444" },
    { name: "Unminted", value: parseFloat(unminted.toFixed(0)), color: "#27272a" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Yield stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total ETH Rewarded"
          value={`${parseFloat(totalETHRewarded).toFixed(4)} ETH`}
          sub="To miners across all rounds"
        />
        <StatCard
          label="Avg Yield / Round"
          value={`${parseFloat(avgYieldPerRound).toFixed(4)} ETH`}
          sub="Mean per settled round"
        />
        <StatCard
          label="Best Round Ever"
          value={bestRound ? `${parseFloat(bestRound.totalWinnings).toFixed(4)} ETH` : "--"}
          sub={bestRound ? `Round #${bestRound.roundId}` : "No data"}
        />
        <StatCard
          label="Total Beanpot Paid"
          value={`${parseFloat(totalBeanpotDistributed).toFixed(4)} ETH`}
          sub="Across all settled rounds"
        />
      </div>

      {/* Emission stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="BEAN Minted"
          value={`${supply.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub={`${((supply / MAX_SUPPLY) * 100).toFixed(2)}% of max`}
        />
        <StatCard
          label="BEAN Burned"
          value={burned > 0 ? burned.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "None"}
          sub={burned > 0 ? `${((burned / MAX_SUPPLY) * 100).toFixed(3)}% of max` : "No burn mechanism active"}
        />
        <StatCard
          label="Rounds to Max Supply"
          value={roundsUntilMax > 0 ? roundsUntilMax.toLocaleString() : "--"}
          sub={`~${avgEmission.toFixed(2)} BEAN/round avg`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Supply Pie */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-4 text-base font-semibold">Supply Breakdown</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  {...tooltipStyle}
                  formatter={(v: unknown) => [
                    Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 }),
                    "BEAN",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-zinc-400">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        {/* Emission Cumulative */}
        {emissionData.length > 1 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="mb-1 text-base font-semibold">Minted Over Time</h2>
            <p className="mb-4 text-xs text-zinc-500">Cumulative BEAN supply by round</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={emissionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="round"
                    tick={{ fill: "#71717a", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `#${v}`}
                  />
                  <YAxis
                    tick={{ fill: "#71717a", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                  />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v: unknown) => [
                      Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 }),
                      "BEAN",
                    ]}
                    labelFormatter={(l) => `Round #${l}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumSupply"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ETH Yield per Round */}
      {yieldData.length > 1 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-1 text-base font-semibold">ETH Yield per Round</h2>
          <p className="mb-4 text-xs text-zinc-500">Miner rewards over time (last 50 rounds)</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yieldData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="round"
                  tick={{ fill: "#71717a", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `#${v}`}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={45}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(v: unknown) => [`${Number(v)} ETH`, "Miner Reward"]}
                  labelFormatter={(l) => `Round #${l}`}
                />
                <Line
                  type="monotone"
                  dataKey="yield"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {burned === 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-xs text-zinc-500">
          No burn mechanism active — BEAN supply is deflationary only through mining cost.
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-lg font-bold text-emerald-400 leading-tight">{value}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>
    </div>
  );
}
