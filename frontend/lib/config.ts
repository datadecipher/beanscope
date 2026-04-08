// publicnode blocks getLogs from Vercel IPs; use Alchemy for events, fallback to publicnode for basic calls
export const ALCHEMY_RPC = `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY ?? "demo"}`;
export const PUBLIC_RPC = "https://base-rpc.publicnode.com";

export const PRICES = {
  day: { label: "24h Pass", eth: "0.01", wei: 10000000000000000n },
  week: { label: "7-Day Pass", eth: "0.04", wei: 40000000000000000n },
  lifetime: { label: "Lifetime", eth: "0.15", wei: 150000000000000000n },
} as const;
