"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { DashboardData } from "@/lib/minebean";

interface MiningChartsProps {
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

export function MiningCharts({ data }: MiningChartsProps) {
  const { roundHistory, topWinners } = data;

  // ETH deployed per round (last 50 rounds)
  const ethPerRound = roundHistory.slice(-50).map((r) => ({
    round: r.roundId,
    eth: parseFloat(parseFloat(r.totalWinnings).toFixed(4)),
  }));

  // Round duration trend (rounds with timestamps)
  const durationData = roundHistory
    .filter((r) => r.startTime > 0 && r.endTime > r.startTime)
    .slice(-50)
    .map((r) => ({
      round: r.roundId,
      hours: parseFloat(((r.endTime - r.startTime) / 3600).toFixed(2)),
    }));

  // Beanpot growth per round (last 50)
  const beanpotData = roundHistory.slice(-50).map((r) => ({
    round: r.roundId,
    beanpot: parseFloat(parseFloat(r.beanpotAmount).toFixed(4)),
  }));

  // Top 10 winners by wins
  const winnersData = topWinners.slice(0, 10).map((w) => ({
    address: `${w.address.slice(0, 6)}...${w.address.slice(-4)}`,
    wins: w.wins,
  }));

  return (
    <div className="space-y-6">
      {/* ETH Deployed per Round */}
      {ethPerRound.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-1 text-base font-semibold">ETH Deployed per Round</h2>
          <p className="mb-4 text-xs text-zinc-500">Whale activity over time (last 50 rounds)</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ethPerRound}>
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
                  formatter={(v: unknown) => [`${Number(v)} ETH`, "Deployed"]}
                  labelFormatter={(l) => `Round #${l}`}
                />
                <Line
                  type="monotone"
                  dataKey="eth"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Winners */}
        {winnersData.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="mb-1 text-base font-semibold">Top Winners</h2>
            <p className="mb-4 text-xs text-zinc-500">Rounds won by wallet</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={winnersData} layout="vertical">
                  <XAxis
                    type="number"
                    tick={{ fill: "#71717a", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="address"
                    tick={{ fill: "#71717a", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v: unknown) => [`${Number(v)}`, "Wins"]}
                  />
                  <Bar dataKey="wins" fill="#10b981" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Beanpot Growth */}
        {beanpotData.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="mb-1 text-base font-semibold">Beanpot per Round</h2>
            <p className="mb-4 text-xs text-zinc-500">Jackpot accumulation over time</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={beanpotData}>
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
                    formatter={(v: unknown) => [`${Number(v)} ETH`, "Beanpot"]}
                    labelFormatter={(l) => `Round #${l}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="beanpot"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Round Duration Trend */}
      {durationData.length > 1 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-1 text-base font-semibold">Round Duration Trend</h2>
          <p className="mb-4 text-xs text-zinc-500">Hours per round over time</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={durationData}>
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
                  width={35}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(v: unknown) => [`${Number(v)}h`, "Duration"]}
                  labelFormatter={(l) => `Round #${l}`}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
