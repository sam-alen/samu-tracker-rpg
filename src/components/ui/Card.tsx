import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  ornate?: boolean;
}

export function Card({ children, className = '', onClick, ornate = false }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`${ornate
        ? 'card-ornate'
        : 'bg-gradient-to-b from-[#0C1424] to-[#080D19] border border-[#1B2A47] shadow-[inset_0_1px_0_rgba(232,241,255,0.04)]'
      } rounded-xl p-4 ${onClick ? 'cursor-pointer hover:border-gold-400/40 transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-gradient-gold uppercase tracking-wider">{title}</h1>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="divider-ornate mt-3 text-[8px]">◆</div>
    </div>
  );
}
