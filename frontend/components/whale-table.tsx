"use client";

import { useState } from "react";
import type { WinnerData } from "@/lib/minebean";

type SortKey = "totalETH" | "winRate" | "lastSeen";

interface WhaleTableProps {
  winners: WinnerData[];
  // legacy prop support
  deployers?: { address: string; totalETH: string; rounds: number }[];
}

export function WhaleTable({ winners, deployers }: WhaleTableProps) {
  const [sort, setSort] = useState<SortKey>("totalETH");

  // Support legacy deployers prop if winners not provided
  const rows: WinnerData[] = winners?.length
    ? winners
    : (deployers ?? []).map((d) => ({
        address: d.address,
        wins: 0,
        rounds: d.rounds,
        totalETH: d.totalETH,
        winRate: 0,
        lastSeen: 0,
        avgETH: d.rounds > 0 ? (parseFloat(d.totalETH) / d.rounds).toFixed(4) : "0",
      }));

  if (!rows.length) {
    return <p className="text-zinc-500 text-sm">No deployment data yet.</p>;
  }

  const sorted = [...rows].sort((a, b) => {
    if (sort === "totalETH") return parseFloat(b.totalETH) - parseFloat(a.totalETH);
    if (sort === "winRate") return b.winRate - a.winRate;
    return b.lastSeen - a.lastSeen;
  });

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => setSort(k)}
      className={`rounded px-2 py-0.5 text-xs transition ${
        sort === k ? "bg-emerald-600 text-white" : "text-zinc-500 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        <SortBtn k="totalETH" label="By ETH" />
        <SortBtn k="winRate" label="By Win Rate" />
        <SortBtn k="lastSeen" label="By Recent" />
      </div>
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase">
              <th className="pb-2 pr-3">#</th>
              <th className="pb-2 pr-3">Address</th>
              <th className="pb-2 pr-3">ETH</th>
              <th className="pb-2 pr-3">Wins</th>
              <th className="pb-2 pr-3">Win%</th>
              <th className="pb-2">Avg ETH</th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 10).map((d, i) => (
              <tr key={d.address} className="border-b border-zinc-800/50">
                <td className="py-2 pr-3 text-zinc-500">{i + 1}</td>
                <td className="py-2 pr-3 font-mono text-xs">
                  <a
                    href={`https://basescan.org/address/${d.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-300 hover:text-emerald-400 transition"
                  >
                    {d.address.slice(0, 6)}...{d.address.slice(-4)}
                  </a>
                </td>
                <td className="py-2 pr-3 font-mono text-emerald-400 text-xs">{d.totalETH}</td>
                <td className="py-2 pr-3 text-xs">{d.wins}</td>
                <td className="py-2 pr-3 text-xs text-amber-400">
                  {d.rounds > 0 ? `${(d.winRate * 100).toFixed(0)}%` : "--"}
                </td>
                <td className="py-2 font-mono text-xs text-zinc-400">{d.avgETH}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
