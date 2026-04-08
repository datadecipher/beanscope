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

export async function fetchDashboardData(): Promise<DashboardData> {
  const currentRound = await getCurrentRound();
  const beanSupply = await getBeanSupply();

  // Fetch last 20 settled rounds for analytics
  const roundCount = Math.min(currentRound, 20);
  const startRound = Math.max(1, currentRound - roundCount + 1);

  const roundPromises: Promise<RoundData>[] = [];
  for (let i = currentRound; i >= startRound; i--) {
    roundPromises.push(getRoundData(i));
  }
  const rounds = await Promise.all(roundPromises);
  const settledRounds = rounds.filter((r) => r.settled);

  // Block win frequency heatmap
  const blockWinCounts = new Array(25).fill(0);
  let totalETH = 0;
  const deployerMap = new Map<string, { totalETH: number; rounds: number }>();

  for (const r of settledRounds) {
    blockWinCounts[r.winningBlock]++;
    totalETH += parseFloat(r.totalDeployed);
    if (r.topMiner && r.topMiner !== "0x0000000000000000000000000000000000000000") {
      const existing = deployerMap.get(r.topMiner) ?? { totalETH: 0, rounds: 0 };
      existing.rounds++;
      deployerMap.set(r.topMiner, existing);
    }
  }

  // Fetch RoundSettled events for whale tracking (last 500 blocks ~17 min)
  try {
    const logs = await client.getLogs({
      address: GRID_MINING,
      event: {
        type: "event",
        name: "Deployed",
        inputs: [
          { name: "roundId", type: "uint64", indexed: true },
          { name: "user", type: "address", indexed: true },
          { name: "amountPerBlock", type: "uint256", indexed: false },
          { name: "blockMask", type: "uint256", indexed: false },
          { name: "totalAmount", type: "uint256", indexed: false },
        ],
      },
      fromBlock: BigInt(Math.max(0, Number(await client.getBlockNumber()) - 500)),
    });

    for (const log of logs) {
      const user = log.args.user as string;
      const amount = parseFloat(formatEther(log.args.totalAmount ?? 0n));
      const existing = deployerMap.get(user) ?? { totalETH: 0, rounds: 0 };
      existing.totalETH += amount;
      existing.rounds++;
      deployerMap.set(user, existing);
    }
  } catch {
    // RPC may not support large range — degrade gracefully
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
    recentRounds: settledRounds.slice(0, 20),
    blockWinCounts,
    totalETHDeployed: totalETH.toFixed(4),
    beanSupply,
    topDeployers,
  };
}

export async function fetchFreeStats(): Promise<FreeStatsData> {
  const [currentRound, beanSupply] = await Promise.all([
    getCurrentRound(),
    getBeanSupply(),
  ]);

  const currentRoundData = await getRoundData(currentRound);
  const now = Math.floor(Date.now() / 1000);
  const roundStatus = now < currentRoundData.endTime ? "live" : "ended";
  const timeRemaining = Math.max(0, currentRoundData.endTime - now);

  // Fetch last 3 settled rounds
  const recentPromises: Promise<RoundData>[] = [];
  for (let i = currentRound - 1; i >= Math.max(1, currentRound - 10) && recentPromises.length < 3; i--) {
    recentPromises.push(getRoundData(i));
  }
  const recentAll = await Promise.all(recentPromises);
  const recentSettled = recentAll.filter((r) => r.settled).slice(0, 3);

  // Heatmap from last 20 settled rounds
  const heatmapPromises: Promise<RoundData>[] = [];
  for (let i = currentRound; i >= Math.max(1, currentRound - 19); i--) {
    heatmapPromises.push(getRoundData(i));
  }
  const allRounds = await Promise.all(heatmapPromises);
  const blockWinCounts = new Array(25).fill(0);
  for (const r of allRounds.filter((r) => r.settled)) {
    blockWinCounts[r.winningBlock]++;
  }

  return {
    currentRound,
    beanSupply,
    roundStatus,
    timeRemaining,
    recentRounds: recentSettled.map((r) => ({
      roundId: r.roundId,
      topMiner: r.topMiner,
      totalDeployed: r.totalDeployed,
      settled: r.settled,
    })),
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
