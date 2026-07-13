import { type ReactNode } from 'react';

export interface TabDef<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
}

interface TabsProps<T extends string> {
  tabs: TabDef<T>[];
  active: T;
  onChange: (id: T) => void;
}

export function Tabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
  return (
    <div className="flex gap-1 border-b border-[#1B2A47] mb-5 overflow-x-auto">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`relative flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors -mb-px shrink-0
            ${active === t.id
              ? 'text-gold-200'
              : 'text-gray-500 hover:text-gray-300'
            }`}
        >
          {t.icon}
          {t.label}
          {active === t.id && (
            <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gold-400 shadow-[0_0_6px_rgba(77,166,255,0.6)]" />
          )}
        </button>
      ))}
    </div>
  );
}
