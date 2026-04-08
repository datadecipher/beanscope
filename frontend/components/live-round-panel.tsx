"use client";

import { useEffect, useState } from "react";
import type { DashboardData } from "@/lib/minebean";

interface LiveRoundPanelProps {
  data: DashboardData;
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Ended";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function LiveRoundPanel({ data }: LiveRoundPanelProps) {
  const { currentRound, currentRoundEndTime, currentRoundTotalDeployed, blockWinCounts } = data;
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const update = () => {
      const now = Math.floor(Date.now() / 1000);
      setSecondsLeft(Math.max(0, currentRoundEndTime - now));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [currentRoundEndTime]);

  const isLive = secondsLeft > 0 && currentRoundEndTime > 0;
  const totalDuration = 24 * 3600; // assume ~24h rounds for progress bar
  const elapsed = currentRoundEndTime > 0 ? totalDuration - secondsLeft : 0;
  const progress = Math.min(100, (elapsed / totalDuration) * 100);

  // Hottest block historically
  const maxWins = Math.max(...blockWinCounts, 1);
  const hottestBlock = blockWinCounts.indexOf(maxWins);

  const eth = parseFloat(currentRoundTotalDeployed ?? "0");

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-base font-semibold">
          Round #{currentRound}
          {isLive && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              LIVE
            </span>
          )}
        </h2>
        <span className="font-mono text-lg font-bold text-emerald-400">
          {currentRoundEndTime > 0 ? formatCountdown(secondsLeft) : "--"}
        </span>
      </div>

      {currentRoundEndTime > 0 && (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-zinc-500">
            <span>Progress</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-800">
            <div
              className="h-1.5 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">ETH Deployed</p>
          <p className="mt-0.5 text-sm font-bold text-white">
            {eth > 0 ? `${eth.toFixed(4)} ETH` : "--"}
          </p>
        </div>
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Hottest Block</p>
          <p className="mt-0.5 text-sm font-bold text-amber-400">
            {maxWins > 0 ? `Block ${hottestBlock} (${maxWins}W)` : "--"}
          </p>
        </div>
        <div className="col-span-2 rounded-lg bg-zinc-800/50 p-3 sm:col-span-1">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Status</p>
          <p className={`mt-0.5 text-sm font-bold ${isLive ? "text-emerald-400" : "text-zinc-400"}`}>
            {currentRoundEndTime === 0 ? "No data" : isLive ? "Active" : "Settling..."}
          </p>
        </div>
      </div>
    </div>
  );
}
