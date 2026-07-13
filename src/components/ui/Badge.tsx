import { type ReactNode } from 'react';

type BadgeColor = 'blue' | 'purple' | 'gold' | 'green' | 'red' | 'gray';

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
}

const colorClasses: Record<BadgeColor, string> = {
  blue: 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/50',
  purple: 'bg-arcane-900/60 text-arcane-300 border border-arcane-700/50',
  gold: 'bg-gold-900/60 text-gold-200 border border-gold-600/50 shadow-[0_0_8px_rgba(77,166,255,0.12)]',
  green: 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50',
  red: 'bg-red-950/60 text-red-300 border border-red-900/50',
  gray: 'bg-gray-900 text-gray-400 border border-gray-700',
};

export function Badge({ children, color = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium tracking-wide ${colorClasses[color]}`}>
      {children}
    </span>
  );
}
