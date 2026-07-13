import { Swords } from 'lucide-react';
import { navGroups, type NavSection } from './nav';
export type { NavSection } from './nav';

interface SidebarProps {
  active: NavSection;
  onChange: (s: NavSection) => void;
}

export function Sidebar({ active, onChange }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-[#04060B]/90 border-r border-[#1B2A47] py-6 px-3 shrink-0 relative z-10">
      {/* Emblem */}
      <div className="flex items-center gap-3 px-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-b from-gold-300 to-gold-600 flex items-center justify-center shadow-[0_0_14px_rgba(77,166,255,0.35)] border border-gold-200/60">
          <Swords size={19} className="text-[#03101F]" />
        </div>
        <div>
          <p className="font-display text-sm font-bold text-gradient-gold leading-none tracking-widest">SAMU</p>
          <p className="text-[10px] text-arcane-400 leading-none mt-1 uppercase tracking-[0.2em]">Tracker RPG</p>
        </div>
      </div>

      <div className="divider-ornate mx-3 mb-4 text-[7px]">◆</div>

      {/* Nav groups */}
      <nav className="flex flex-col flex-1 overflow-y-auto">
        {navGroups.map(group => (
          <div key={group.title} className="mb-4">
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-600 uppercase tracking-[0.18em]">
              {group.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => onChange(item.id)}
                  className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 text-left
                    ${active === item.id
                      ? 'bg-gradient-to-r from-gold-900/50 to-transparent text-gold-200 shadow-[inset_2px_0_0_#4DA6FF]'
                      : 'text-gray-500 hover:text-gray-200 hover:bg-[#101B31]'
                    }`}
                >
                  <span className={active === item.id ? 'text-gold-300' : ''}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <p className="px-3 text-[10px] text-gray-700 mt-2 tracking-wide">v2.0 · Solo para uso personal</p>
    </aside>
  );
}
