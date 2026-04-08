"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        Live on Base
      </div>
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">
        See what{" "}
        <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
          whales
        </span>{" "}
        see.
      </h1>
      <p className="mt-4 max-w-lg text-lg text-zinc-400">
        Advanced analytics for MineBean miners. Hot blocks, whale tracking,
        tokenomics, and more.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <ConnectButton />
        <a
          href="/dashboard"
          className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          View Dashboard
        </a>
      </div>
    </section>
  );
}
