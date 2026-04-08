interface HeatmapGridProps {
  data: number[];
}

export function HeatmapGrid({ data }: HeatmapGridProps) {
  const max = Math.max(...data, 1);

  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {data.map((count, i) => {
        const intensity = count / max;
        return (
          <div
            key={i}
            className="relative aspect-square rounded-md flex items-center justify-center text-xs font-mono"
            style={{
              backgroundColor: `rgba(16, 185, 129, ${0.1 + intensity * 0.7})`,
              border: `1px solid rgba(16, 185, 129, ${0.2 + intensity * 0.5})`,
            }}
            title={`Block ${i}: ${count} wins`}
          >
            <span className="text-zinc-300 text-[10px] sm:text-xs">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
