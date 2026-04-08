"use client";

import { useEffect, useState } from "react";
import type { FreeStatsData } from "@/lib/minebean";
import { HeatmapGrid } from "./heatmap-grid";

export function FreeStats() {
  const [data, setData] = useState<FreeStatsData | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    fetch("/api/free-stats")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setData(d);
          setTimeLeft(d.timeRemaining);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  if (!data) return null;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8">
      <h2 className="mb-6 text-center text-lg font-semibold text-zinc-300">
        Live Analytics Preview
      </h2>

      {/* Stats row */}
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <MiniStat label="Current Round" value={data.currentRound.toLocaleString()} />
        <MiniStat
          label="Round Status"
          value={data.roundStatus === "live" ? `Live - ${mins}:${secs.toString().padStart(2, "0")}` : "Ended"}
          highlight={data.roundStatus === "live"}
        />
        <MiniStat
          label="BEAN Supply"
          value={`${parseFloat(data.beanSupply).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        />
        <MiniStat label="Network" value="Base" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Heatmap */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-400">Hot Block Heatmap (Recent)</h3>
          <HeatmapGrid data={data.blockWinCounts} />
        </div>

        {/* Recent rounds */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-400">Recent Rounds</h3>
          <div className="space-y-2">
            {data.recentRounds.map((r) => (
              <div
                key={r.roundId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm"
              >
                <span className="font-mono text-zinc-400">#{r.roundId}</span>
                <span className="truncate max-w-[140px] text-xs text-zinc-500">
                  {r.topMiner.slice(0, 6)}...{r.topMiner.slice(-4)}
                </span>
                <span className="text-emerald-400 font-medium">
                  {parseFloat(r.totalDeployed).toFixed(4)} ETH
                </span>
              </div>
            ))}
            {data.recentRounds.length === 0 && (
              <p className="text-sm text-zinc-500">No recent rounds</p>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
        <p className="text-sm text-zinc-400">
          Want whale tracking, full history, and per-wallet analytics?
        </p>
        <a
          href="/dashboard"
          className="mt-3 inline-block rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Unlock Full Dashboard
        </a>
      </div>
    </section>
  );
}

function MiniStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-center">
      <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
      <p
        className={`mt-0.5 text-lg font-bold ${highlight ? "text-green-400" : "text-emerald-400"}`}
      >
        {value}
      </p>
    </div>
  );
}
