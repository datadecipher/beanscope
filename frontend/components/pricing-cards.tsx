"use client";

import { useWriteContract, useAccount } from "wagmi";
import { parseEther } from "viem";
import { BEAN_SCOPE_ACCESS, BEAN_SCOPE_ACCESS_ABI } from "@/lib/contracts";
import { PRICES } from "@/lib/config";

const plans = [
  { key: "day" as const, popular: false },
  { key: "week" as const, popular: true },
  { key: "lifetime" as const, popular: false },
];

export function PricingCards() {
  const { isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();

  const buy = (plan: "day" | "week" | "lifetime") => {
    const fnMap = {
      day: "buyDayPass",
      week: "buyWeekPass",
      lifetime: "buyLifetime",
    } as const;

    writeContract({
      address: BEAN_SCOPE_ACCESS,
      abi: BEAN_SCOPE_ACCESS_ABI,
      functionName: fnMap[plan],
      value: PRICES[plan].wei,
    });
  };

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-16">
      <h2 className="mb-8 text-center text-2xl font-bold">
        Unlock Full Analytics
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map(({ key, popular }) => (
          <div
            key={key}
            className={`relative flex flex-col rounded-xl border p-6 ${
              popular
                ? "border-emerald-500 bg-emerald-500/5"
                : "border-zinc-800 bg-zinc-900/50"
            }`}
          >
            {popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-black">
                Most Popular
              </span>
            )}
            <h3 className="text-lg font-semibold">{PRICES[key].label}</h3>
            <p className="mt-2 text-3xl font-bold">
              {PRICES[key].eth}{" "}
              <span className="text-base font-normal text-zinc-500">ETH</span>
            </p>
            <button
              onClick={() => buy(key)}
              disabled={!isConnected || isPending || !BEAN_SCOPE_ACCESS}
              className="mt-6 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {!isConnected
                ? "Connect Wallet"
                : isPending
                  ? "Confirming..."
                  : `Buy ${PRICES[key].label}`}
            </button>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-zinc-600">
        Pay on-chain with Base ETH. No email, no KYC.
      </p>
    </section>
  );
}
