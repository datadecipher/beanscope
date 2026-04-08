import { createPublicClient, http, formatEther, type Address } from "viem";
import { base } from "viem/chains";
import {
  GRID_MINING,
  GRID_MINING_ABI,
  BEAN_TOKEN,
  BEAN_TOKEN_ABI,
} from "./contracts";
import { ALCHEMY_RPC, PUBLIC_RPC } from "./config";

const client = createPublicClient({
  chain: base,
  transport: http(process.env.ALCHEMY_API_KEY ? ALCHEMY_RPC : PUBLIC_RPC),
});

export interface RoundData {
  roundId: number;
  startTime: number;
  endTime: number;
  winningBlock: number;
  totalDeployed: string;
  totalWinnings: string;
  topMiner: string;
  topMinerReward: string;
  beanpotAmount: string;
  settled: boolean;
}

export interface DashboardData {
  currentRound: number;
  totalRounds: number;
  recentRounds: RoundData[];
  blockWinCounts: number[];
  totalETHDeployed: string;
  beanSupply: string;
  topDeployers: { address: string; totalETH: string; rounds: number }[];
}

export interface FreeStatsData {
  currentRound: number;
  beanSupply: string;
  roundStatus: "live" | "ended";
  timeRemaining: number;
  recentRounds: Pick<RoundData, "roundId" | "topMiner" | "totalDeployed" | "settled">[];
  blockWinCounts: number[];
}

export async function getCurrentRound(): Promise<number> {
  const result = await client.readContract({
    address: GRID_MINING,
    abi: GRID_MINING_ABI,
    functionName: "currentRoundId",
  });
  return Number(result);
}

export async function getRoundData(roundId: number): Promise<RoundData> {
  const round = await client.readContract({
    address: GRID_MINING,
    abi: GRID_MINING_ABI,
    functionName: "getRound",
    args: [BigInt(roundId)],
  });

  return {
    roundId,
    startTime: Number(round.startTime),
    endTime: Number(round.endTime),
    winningBlock: round.winningBlock,
    totalDeployed: formatEther(round.totalDeployed),
    totalWinnings: formatEther(round.totalWinnings),
    topMiner: round.topMiner,
    topMinerReward: formatEther(round.topMinerReward),
    beanpotAmount: formatEther(round.beanpotAmount),
    settled: round.settled,
  };
}

export async function getBeanSupply(): Promise<string> {
  const supply = await client.readContract({
    address: BEAN_TOKEN,
    abi: BEAN_TOKEN_ABI,
    functionName: "totalSupply",
  });
  return formatEther(supply);
}

const ROUND_SETTLED_EVENT = {
  type: "event" as const,
  name: "RoundSettled",
  inputs: [
    { name: "roundId", type: "uint64", indexed: true as const },
    { name: "winningBlock", type: "uint8", indexed: false as const },
    { name: "topMiner", type: "address", indexed: false as const },
    { name: "totalWinnings", type: "uint256", indexed: false as const },
    { name: "topMinerReward", type: "uint256", indexed: false as const },
    { name: "beanpotAmount", type: "uint256", indexed: false as const },
    { name: "isSplit", type: "bool", indexed: false as const },
    { name: "topMinerSeed", type: "uint256", indexed: false as const },
    { name: "winnersDeployed", type: "uint256", indexed: false as const },
  ],
} as const;

const DEPLOYED_EVENT = {
  type: "event" as const,
  name: "Deployed",
  inputs: [
    { name: "roundId", type: "uint64", indexed: true as const },
    { name: "user", type: "address", indexed: true as const },
    { name: "amountPerBlock", type: "uint256", indexed: false as const },
    { name: "blockMask", type: "uint256", indexed: false as const },
    { name: "totalAmount", type: "uint256", indexed: false as const },
  ],
} as const;

export async function fetchDashboardData(): Promise<DashboardData> {
  const [currentRound, beanSupply, latestBlock] = await Promise.all([
    getCurrentRound(),
    getBeanSupply(),
    client.getBlockNumber(),
  ]);

  // Use events instead of per-round RPC calls — much faster
  const lookback = BigInt(Math.max(0, Number(latestBlock) - 3000));

  const [settledLogs, deployedLogs] = await Promise.all([
    client.getLogs({ address: GRID_MINING, event: ROUND_SETTLED_EVENT, fromBlock: lookback }).catch(() => []),
    client.getLogs({ address: GRID_MINING, event: DEPLOYED_EVENT, fromBlock: lookback }).catch(() => []),
  ]);

  // Build round history from RoundSettled events (newest first)
  const blockWinCounts = new Array(25).fill(0);
  let totalETH = 0;
  const deployerMap = new Map<string, { totalETH: number; rounds: number }>();

  const recentRounds: RoundData[] = [];
  for (const log of [...settledLogs].reverse()) {
    const block = log.args.winningBlock ?? 0;
    blockWinCounts[block]++;
    const winnings = formatEther(log.args.totalWinnings ?? 0n);
    totalETH += parseFloat(winnings);
    const miner = log.args.topMiner ?? "0x0000000000000000000000000000000000000000";
    if (miner !== "0x0000000000000000000000000000000000000000") {
      const ex = deployerMap.get(miner) ?? { totalETH: 0, rounds: 0 };
      ex.rounds++;
      deployerMap.set(miner, ex);
    }
    if (recentRounds.length < 20) {
      recentRounds.push({
        roundId: Number(log.args.roundId ?? 0),
        startTime: 0,
        endTime: 0,
        winningBlock: block,
        totalDeployed: winnings,
        totalWinnings: winnings,
        topMiner: miner,
        topMinerReward: formatEther(log.args.topMinerReward ?? 0n),
        beanpotAmount: formatEther(log.args.beanpotAmount ?? 0n),
        settled: true,
      });
    }
  }

  // Whale tracking from Deployed events
  for (const log of deployedLogs) {
    const user = log.args.user as string;
    const amount = parseFloat(formatEther(log.args.totalAmount ?? 0n));
    const ex = deployerMap.get(user) ?? { totalETH: 0, rounds: 0 };
    ex.totalETH += amount;
    ex.rounds++;
    deployerMap.set(user, ex);
  }

  const topDeployers = Array.from(deployerMap.entries())
    .map(([address, data]) => ({
      address,
      totalETH: data.totalETH.toFixed(4),
      rounds: data.rounds,
    }))
    .sort((a, b) => parseFloat(b.totalETH) - parseFloat(a.totalETH))
    .slice(0, 20);

  return {
    currentRound,
    totalRounds: currentRound,
    recentRounds,
    blockWinCounts,
    totalETHDeployed: totalETH.toFixed(4),
    beanSupply,
    topDeployers,
  };
}

export async function fetchFreeStats(): Promise<FreeStatsData> {
  const [currentRound, beanSupply, currentRoundData, latestBlock] = await Promise.all([
    getCurrentRound(),
    getBeanSupply(),
    getCurrentRound().then((r) => getRoundData(r)),
    client.getBlockNumber(),
  ]);

  const now = Math.floor(Date.now() / 1000);
  const roundStatus = now < currentRoundData.endTime ? "live" : "ended";
  const timeRemaining = Math.max(0, currentRoundData.endTime - now);

  // Use events for heatmap and recent rounds
  const lookback = BigInt(Math.max(0, Number(latestBlock) - 3000));
  const settledLogs = await client
    .getLogs({ address: GRID_MINING, event: ROUND_SETTLED_EVENT, fromBlock: lookback })
    .catch(() => []);

  const blockWinCounts = new Array(25).fill(0);
  const recentRounds: FreeStatsData["recentRounds"] = [];

  for (const log of [...settledLogs].reverse()) {
    blockWinCounts[log.args.winningBlock ?? 0]++;
    if (recentRounds.length < 3) {
      recentRounds.push({
        roundId: Number(log.args.roundId ?? 0),
        topMiner: log.args.topMiner ?? "0x0000000000000000000000000000000000000000",
        totalDeployed: formatEther(log.args.totalWinnings ?? 0n),
        settled: true,
      });
    }
  }

  return {
    currentRound,
    beanSupply,
    roundStatus,
    timeRemaining,
    recentRounds,
    blockWinCounts,
  };
}

export async function getUserStats(address: Address) {
  const [unclaimedETH, unclaimedBEAN] = await Promise.all([
    client.readContract({
      address: GRID_MINING,
      abi: GRID_MINING_ABI,
      functionName: "userUnclaimedETH",
      args: [address],
    }),
    client.readContract({
      address: GRID_MINING,
      abi: GRID_MINING_ABI,
      functionName: "userUnclaimedBEAN",
      args: [address],
    }),
  ]);

  return {
    unclaimedETH: formatEther(unclaimedETH),
    unclaimedBEAN: formatEther(unclaimedBEAN),
  };
}
