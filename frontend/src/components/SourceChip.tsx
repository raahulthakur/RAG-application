"use client";

interface SourceChipProps {
  source: string;
  index: number;
}

export function SourceChip({ source, index }: SourceChipProps) {
  const filename = source.split("/").pop() ?? source;
  const short =
    filename.length > 28 ? filename.slice(0, 25) + "…" : filename;

  return (
    <span
      title={source}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors cursor-default"
    >
      <span className="opacity-60">[{index + 1}]</span>
      <span>{short}</span>
    </span>
  );
}
