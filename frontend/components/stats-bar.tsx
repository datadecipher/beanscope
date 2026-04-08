interface StatsBarProps {
  currentRound: number;
  beanSupply: string;
}

export function StatsBar({ currentRound, beanSupply }: StatsBarProps) {
  return (
    <section className="border-y border-zinc-800 bg-zinc-900/50">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-8 px-4 py-6 text-center sm:gap-16">
        <Stat label="Rounds Played" value={currentRound.toLocaleString()} />
        <Stat
          label="BEAN Supply"
          value={`${parseFloat(beanSupply).toLocaleString(undefined, { maximumFractionDigits: 0 })} / 3M`}
        />
        <Stat label="Network" value="Base" />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl font-bold text-emerald-400 sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-zinc-500 uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}
