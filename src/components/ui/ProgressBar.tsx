interface ProgressBarProps {
  value: number; // 0–100
  color?: 'blue' | 'purple' | 'gold' | 'green';
  animate?: boolean;
  showLabel?: boolean;
  height?: 'sm' | 'md' | 'lg';
}

const colorMap = {
  blue: 'bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_8px_rgba(109,141,246,0.3)]',
  purple: 'bg-gradient-to-r from-arcane-600 to-arcane-400 shadow-[0_0_8px_rgba(139,92,246,0.3)]',
  gold: 'bg-gradient-to-r from-gold-600 to-gold-300 shadow-[0_0_8px_rgba(77,166,255,0.35)]',
  green: 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(52,192,139,0.3)]',
};

const heightMap = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function ProgressBar({
  value,
  color = 'gold',
  animate = false,
  showLabel = false,
  height = 'md',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-end mb-1">
          <span className="text-xs text-gray-400">{pct}%</span>
        </div>
      )}
      <div className={`w-full bg-black/40 border border-white/5 rounded-full overflow-hidden ${heightMap[height]} shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${animate ? 'xp-bar' : colorMap[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
