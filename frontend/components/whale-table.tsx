interface WhaleTableProps {
  deployers: { address: string; totalETH: string; rounds: number }[];
}

export function WhaleTable({ deployers }: WhaleTableProps) {
  if (!deployers.length) {
    return <p className="text-zinc-500 text-sm">No deployment data yet.</p>;
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase">
            <th className="pb-2 pr-4">#</th>
            <th className="pb-2 pr-4">Address</th>
            <th className="pb-2 pr-4">ETH Deployed</th>
            <th className="pb-2">Rounds</th>
          </tr>
        </thead>
        <tbody>
          {deployers.slice(0, 10).map((d, i) => (
            <tr key={d.address} className="border-b border-zinc-800/50">
              <td className="py-2 pr-4 text-zinc-500">{i + 1}</td>
              <td className="py-2 pr-4 font-mono text-xs">
                {d.address.slice(0, 6)}...{d.address.slice(-4)}
              </td>
              <td className="py-2 pr-4 font-mono text-emerald-400">
                {d.totalETH}
              </td>
              <td className="py-2">{d.rounds}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
