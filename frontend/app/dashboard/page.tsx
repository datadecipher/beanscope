"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import type { DashboardData } from "@/lib/minebean";
import { HeatmapGrid } from "@/components/heatmap-grid";
import { RoundHistory } from "@/components/round-history";
import { WhaleTable } from "@/components/whale-table";
import { TokenomicsSection } from "@/components/tokenomics-section";
import { isSuperAdmin } from "@/lib/whitelist";

type Tab = "mining" | "tokenomics";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("mining");

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    // Step 1: check access
    fetch(`/api/dashboard?wallet=${address}`)
      .then((r) => r.json())
      .then(async (d) => {
        if (d.error === "no_access") {
          setError("no_access");
          return;
        }
        if (d.error) {
          setError(d.error);
          return;
        }
        // Step 2: fetch analytics from ISR-cached endpoint
        const res = await fetch("/api/analytics");
        const analytics = await res.json();
        if (analytics.error) {
          setError(analytics.error);
        } else {
          setData(analytics);
          setError(null);
        }
      })
      .catch(() => setError("fetch_failed"))
      .finally(() => setLoading(false));
  }, [address]);

  if (!isConnected) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-2xl font-bold">Connect your wallet</h1>
        <p className="text-zinc-400">to access BeanScope analytics</p>
        <ConnectButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error === "no_access") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-2xl font-bold">Access Required</h1>
        <p className="text-zinc-400">
          Buy a pass to unlock full analytics.
        </p>
        <a
          href="/"
          className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          View Pricing
        </a>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-zinc-400">
        Failed to load data. Try refreshing.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">
          BeanScope Dashboard
          {address && isSuperAdmin(address) && (
            <span className="ml-2 inline-block rounded bg-emerald-600/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
              Admin
            </span>
          )}
        </h1>
        <ConnectButton />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-zinc-900 p-1">
        {(["mining", "tokenomics"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              tab === t
                ? "bg-emerald-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {t === "mining" ? "Mining Analytics" : "Tokenomics"}
          </button>
        ))}
      </div>

      {tab === "mining" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Current Round" value={data.currentRound.toLocaleString()} />
            <StatCard label="Total ETH Deployed" value={`${data.totalETHDeployed} ETH`} />
            <StatCard label="BEAN Supply" value={`${parseFloat(data.beanSupply).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <h2 className="mb-4 text-lg font-semibold">Hot Block Heatmap</h2>
              <HeatmapGrid data={data.blockWinCounts} />
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <h2 className="mb-4 text-lg font-semibold">Whale Tracker</h2>
              <WhaleTable deployers={data.topDeployers} />
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="mb-4 text-lg font-semibold">Recent Rounds</h2>
            <RoundHistory rounds={data.recentRounds} />
          </div>
        </div>
      )}

      {tab === "tokenomics" && (
        <TokenomicsSection data={data} />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-xl font-bold text-emerald-400">{value}</p>
    </div>
  );
}
