import type { RoundData } from "@/lib/minebean";

interface RoundHistoryProps {
  rounds: RoundData[];
}

export function RoundHistory({ rounds }: RoundHistoryProps) {
  if (!rounds.length) {
    return <p className="text-zinc-500 text-sm">No settled rounds yet.</p>;
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase">
            <th className="pb-2 pr-4">Round</th>
            <th className="pb-2 pr-4">Winner Block</th>
            <th className="pb-2 pr-4">ETH Deployed</th>
            <th className="pb-2 pr-4">Miners</th>
            <th className="pb-2">Top Miner</th>
          </tr>
        </thead>
        <tbody>
          {rounds.map((r) => (
            <tr key={r.roundId} className="border-b border-zinc-800/50">
              <td className="py-2 pr-4 font-mono text-emerald-400">
                #{r.roundId}
              </td>
              <td className="py-2 pr-4">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-emerald-500/20 text-xs font-bold text-emerald-400">
                  {r.winningBlock}
                </span>
              </td>
              <td className="py-2 pr-4 font-mono">
                {parseFloat(r.totalDeployed).toFixed(4)}
              </td>
              <td className="py-2 pr-4">{r.minerCount}</td>
              <td className="py-2 font-mono text-xs text-zinc-400">
                {r.topMiner
                  ? `${r.topMiner.slice(0, 6)}...${r.topMiner.slice(-4)}`
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
