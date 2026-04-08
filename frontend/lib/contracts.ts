export const BEAN_TOKEN = "0x5c72992b83e74c4d5200a8e8920fb946214a5a5d" as const;
export const GRID_MINING = "0x9632495bdb93fd6b0740ab69cc6c71c9c01da4f0" as const;
export const BEAN_SCOPE_ACCESS = (process.env.NEXT_PUBLIC_ACCESS_CONTRACT ?? "") as `0x${string}`;
export const BASE_CHAIN_ID = 8453;

export const BEAN_TOKEN_ABI = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export const GRID_MINING_ABI = [
  {
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
  {
    type: "event",
    name: "RoundSettled",
    inputs: [
      { name: "roundId", type: "uint64", indexed: true },
      { name: "winningBlock", type: "uint8", indexed: false },
      { name: "topMiner", type: "address", indexed: false },
      { name: "totalWinnings", type: "uint256", indexed: false },
      { name: "topMinerReward", type: "uint256", indexed: false },
      { name: "beanpotAmount", type: "uint256", indexed: false },
      { name: "isSplit", type: "bool", indexed: false },
      { name: "topMinerSeed", type: "uint256", indexed: false },
      { name: "winnersDeployed", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "GameStarted",
    inputs: [
      { name: "roundId", type: "uint64", indexed: true },
      { name: "startTime", type: "uint256", indexed: false },
      { name: "endTime", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ClaimedBEAN",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "minedBean", type: "uint256", indexed: false },
      { name: "roastedBean", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
      { name: "net", type: "uint256", indexed: false },
    ],
  },
  {
    type: "function",
    name: "currentRoundId",
    inputs: [],
    outputs: [{ type: "uint64" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRound",
    inputs: [{ name: "roundId", type: "uint64" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "startTime", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "deployed", type: "uint256[25]" },
          { name: "totalDeployed", type: "uint256" },
          { name: "totalWinnings", type: "uint256" },
          { name: "winnersDeployed", type: "uint256" },
          { name: "winningBlock", type: "uint8" },
          { name: "topMiner", type: "address" },
          { name: "topMinerReward", type: "uint256" },
          { name: "beanpotAmount", type: "uint256" },
          { name: "vrfRequestId", type: "uint256" },
          { name: "topMinerSeed", type: "uint256" },
          { name: "settled", type: "bool" },
          { name: "minerCount", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMinerInfo",
    inputs: [
      { name: "roundId", type: "uint64" },
      { name: "user", type: "address" },
    ],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "deployedMask", type: "uint256" },
          { name: "amountPerBlock", type: "uint256" },
          { name: "checkpointed", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "userUnclaimedETH",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "userUnclaimedBEAN",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export const BEAN_SCOPE_ACCESS_ABI = [
  {
    type: "function",
    name: "hasAccess",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "buyDayPass",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "buyWeekPass",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "buyLifetime",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "dayPassPrice",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "weekPassPrice",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "lifetimePrice",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;
