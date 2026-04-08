import { createPublicClient, http, formatEther, type Address } from "viem";
import { unstable_cache } from "next/cache";
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

export interface WinnerData {
  address: string;
  wins: number;
  rounds: number;
  totalETH: string;
  winRate: number;
  lastSeen: number;
  avgETH: string;
}

export interface DashboardData {
  currentRound: number;
  totalRounds: number;
  recentRounds: RoundData[];
  blockWinCounts: number[];
  totalETHDeployed: string;
  beanSupply: string;
  topDeployers: { address: string; totalETH: string; rounds: number }[];
  // new fields
  roundHistory: RoundData[];
  topWinners: WinnerData[];
  totalETHRewarded: string;
  avgYieldPerRound: string;
  bestRound: { roundId: number; totalWinnings: string } | null;
  totalBeanpotDistributed: string;
  burnedSupply: string;
  currentRoundEndTime: number;
  currentRoundTotalDeployed: string;
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

const GAME_STARTED_EVENT = {
  type: "event" as const,
  name: "GameStarted",
  inputs: [
    { name: "roundId", type: "uint64", indexed: true as const },
    { name: "startTime", type: "uint256", indexed: false as const },
    { name: "endTime", type: "uint256", indexed: false as const },
  ],
} as const;

const BEAN_TRANSFER_EVENT = {
  type: "event" as const,
  name: "Transfer",
  inputs: [
    { name: "from", type: "address", indexed: true as const },
    { name: "to", type: "address", indexed: true as const },
    { name: "value", type: "uint256", indexed: false as const },
  ],
} as const;

// getLogs with a hard per-call timeout (publicnode hangs when there are results)
const CALL_TIMEOUT_MS = 5_500; // 5.5s per getLogs call max
const CHUNK_SIZE = 3_000n;
const HISTORY_LOOKBACK = 30_000n; // 10 chunks, 2 batches of 4
const PARALLEL_BATCH = 4;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getLogsWithTimeout(params: any): Promise<any[]> {
  return Promise.race([
    client.getLogs(params).catch(() => []),
    new Promise<[]>((resolve) => setTimeout(() => resolve([]), CALL_TIMEOUT_MS)),
  ]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getLogsChunked(params: any, from: bigint, to: bigint): Promise<any[]> {
  const chunks: { from: bigint; to: bigint }[] = [];
  let cur = from;
  while (cur <= to) {
    const end = cur + CHUNK_SIZE > to ? to : cur + CHUNK_SIZE;
    chunks.push({ from: cur, to: end });
    cur = end + 1n;
  }

  const results: unknown[] = [];
  for (let i = 0; i < chunks.length; i += PARALLEL_BATCH) {
    const batch = chunks.slice(i, i + PARALLEL_BATCH);
    const batchResults = await Promise.all(
      batch.map((c) => getLogsWithTimeout({ ...params, fromBlock: c.from, toBlock: c.to }))
    );
    results.push(...batchResults.flat());
  }
  return results;
}

async function _fetchDashboardData(): Promise<DashboardData> {
  const [currentRound, beanSupply, latestBlock] = await Promise.all([
    getCurrentRound(),
    getBeanSupply(),
    client.getBlockNumber(),
  ]);

  const fromBlock = latestBlock > HISTORY_LOOKBACK ? latestBlock - HISTORY_LOOKBACK : 0n;

  // Fetch all event types in parallel using chunked getLogs
  const [settledLogs, deployedLogs, gameStartedLogs, burnLogs, currentRoundData] = await Promise.all([
    getLogsChunked({ address: GRID_MINING, event: ROUND_SETTLED_EVENT }, fromBlock, latestBlock),
    getLogsChunked({ address: GRID_MINING, event: DEPLOYED_EVENT }, fromBlock, latestBlock),
    getLogsChunked({ address: GRID_MINING, event: GAME_STARTED_EVENT }, fromBlock, latestBlock),
    getLogsChunked({ address: BEAN_TOKEN, event: BEAN_TRANSFER_EVENT, args: { to: "0x0000000000000000000000000000000000000000" as `0x${string}` } }, fromBlock, latestBlock),
    getRoundData(currentRound).catch(() => null),
  ]);

  // Build timestamp map from GameStarted events
  const roundTimestamps = new Map<number, { startTime: number; endTime: number }>();
  for (const log of gameStartedLogs) {
    const roundId = Number(log.args.roundId ?? 0);
    roundTimestamps.set(roundId, {
      startTime: Number(log.args.startTime ?? 0n),
      endTime: Number(log.args.endTime ?? 0n),
    });
  }

  // Build data from RoundSettled events
  const blockWinCounts = new Array(25).fill(0);
  let totalETHDeployedNum = 0;
  let totalETHRewardedNum = 0;
  let totalBeanpotNum = 0;
  let bestRound: { roundId: number; totalWinnings: string } | null = null;
  let bestRoundVal = 0;

  // Winner tracking: address → { wins, lastSeen }
  const winnerMap = new Map<string, { wins: number; lastSeen: number }>();
  const roundHistory: RoundData[] = [];

  const sortedSettled = [...settledLogs].sort((a, b) =>
    Number(a.args.roundId ?? 0) - Number(b.args.roundId ?? 0)
  );

  for (const log of sortedSettled) {
    const block = Number(log.args.winningBlock ?? 0);
    if (block >= 0 && block < 25) blockWinCounts[block]++;

    const winnings = parseFloat(formatEther(log.args.totalWinnings ?? 0n));
    const reward = parseFloat(formatEther(log.args.topMinerReward ?? 0n));
    const beanpot = parseFloat(formatEther(log.args.beanpotAmount ?? 0n));
    const roundId = Number(log.args.roundId ?? 0);
    const miner = log.args.topMiner ?? "0x0000000000000000000000000000000000000000";
    const ts = roundTimestamps.get(roundId);

    totalETHDeployedNum += winnings;
    totalETHRewardedNum += reward;
    totalBeanpotNum += beanpot;

    if (winnings > bestRoundVal) {
      bestRoundVal = winnings;
      bestRound = { roundId, totalWinnings: winnings.toFixed(6) };
    }

    const validMiner = miner !== "0x0000000000000000000000000000000000000000";
    if (validMiner) {
      const ex = winnerMap.get(miner) ?? { wins: 0, lastSeen: 0 };
      ex.wins++;
      ex.lastSeen = Math.max(ex.lastSeen, ts?.endTime ?? 0);
      winnerMap.set(miner, ex);
    }

    roundHistory.push({
      roundId,
      startTime: ts?.startTime ?? 0,
      endTime: ts?.endTime ?? 0,
      winningBlock: block,
      totalDeployed: formatEther(log.args.totalWinnings ?? 0n),
      totalWinnings: formatEther(log.args.totalWinnings ?? 0n),
      topMiner: miner,
      topMinerReward: formatEther(log.args.topMinerReward ?? 0n),
      beanpotAmount: formatEther(log.args.beanpotAmount ?? 0n),
      settled: true,
    });
  }

  // Deployer tracking from Deployed events
  const deployerMap = new Map<string, { totalETH: number; rounds: Set<number> }>();
  for (const log of deployedLogs) {
    const user = log.args.user as string;
    const amount = parseFloat(formatEther(log.args.totalAmount ?? 0n));
    const roundId = Number(log.args.roundId ?? 0);
    const ex = deployerMap.get(user) ?? { totalETH: 0, rounds: new Set<number>() };
    ex.totalETH += amount;
    ex.rounds.add(roundId);
    deployerMap.set(user, ex);
  }

  // Build topWinners with win rate
  const topWinners: WinnerData[] = Array.from(winnerMap.entries())
    .map(([address, wData]) => {
      const dData = deployerMap.get(address);
      const participatedRounds = dData ? dData.rounds.size : wData.wins;
      const totalETH = dData ? dData.totalETH : 0;
      return {
        address,
        wins: wData.wins,
        rounds: participatedRounds,
        totalETH: totalETH.toFixed(4),
        winRate: participatedRounds > 0 ? wData.wins / participatedRounds : 0,
        lastSeen: wData.lastSeen,
        avgETH: participatedRounds > 0 ? (totalETH / participatedRounds).toFixed(4) : "0",
      };
    })
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 20);

  const topDeployers = Array.from(deployerMap.entries())
    .map(([address, data]) => ({
      address,
      totalETH: data.totalETH.toFixed(4),
      rounds: data.rounds.size,
    }))
    .sort((a, b) => parseFloat(b.totalETH) - parseFloat(a.totalETH))
    .slice(0, 20);

  // Burn supply from Transfer to address(0)
  let burnedSupplyNum = 0;
  for (const log of burnLogs) {
    burnedSupplyNum += parseFloat(formatEther(log.args.value ?? 0n));
  }

  const settledCount = roundHistory.length;
  const avgYield = settledCount > 0 ? totalETHDeployedNum / settledCount : 0;

  const recentRounds = [...roundHistory].reverse().slice(0, 20);

  return {
    currentRound,
    totalRounds: currentRound,
    recentRounds,
    blockWinCounts,
    totalETHDeployed: totalETHDeployedNum.toFixed(4),
    beanSupply,
    topDeployers,
    roundHistory,
    topWinners,
    totalETHRewarded: totalETHRewardedNum.toFixed(4),
    avgYieldPerRound: avgYield.toFixed(4),
    bestRound,
    totalBeanpotDistributed: totalBeanpotNum.toFixed(4),
    burnedSupply: burnedSupplyNum.toFixed(4),
    currentRoundEndTime: currentRoundData?.endTime ?? 0,
    currentRoundTotalDeployed: currentRoundData?.totalDeployed ?? "0",
  };
}

async function _fetchFreeStats(): Promise<FreeStatsData> {
  const [currentRound, beanSupply, latestBlock] = await Promise.all([
    getCurrentRound(),
    getBeanSupply(),
    client.getBlockNumber(),
  ]);

  const currentRoundData = await getRoundData(currentRound).catch(() => null);

  const now = Math.floor(Date.now() / 1000);
  const roundStatus = currentRoundData && now < currentRoundData.endTime ? "live" : "ended";
  const timeRemaining = currentRoundData ? Math.max(0, currentRoundData.endTime - now) : 0;

  // Free stats only needs recent rounds — 9k blocks ≈ 5hrs, 3 getLogs calls
  const FREE_STATS_LOOKBACK = 9_000n;
  const fromBlock = latestBlock > FREE_STATS_LOOKBACK ? latestBlock - FREE_STATS_LOOKBACK : 0n;
  const settledLogs = await getLogsChunked(
    { address: GRID_MINING, event: ROUND_SETTLED_EVENT },
    fromBlock,
    latestBlock
  );

  const blockWinCounts = new Array(25).fill(0);
  const recentRounds: FreeStatsData["recentRounds"] = [];

  for (const log of [...settledLogs].reverse()) {
    const block = Number(log.args.winningBlock ?? 0);
    if (block >= 0 && block < 25) blockWinCounts[block]++;
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

export const fetchDashboardData = unstable_cache(
  _fetchDashboardData,
  ["dashboard-data"],
  { revalidate: 30 }
);

export const fetchFreeStats = unstable_cache(
  _fetchFreeStats,
  ["free-stats"],
  { revalidate: 30 }
);

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
