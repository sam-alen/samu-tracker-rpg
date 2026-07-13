import { useState } from 'react';
import { LayoutDashboard, CheckSquare, Target, BookOpen, Menu, X } from 'lucide-react';
import { navGroups, type NavSection } from './nav';

const primaryItems = [
  { id: 'dashboard' as NavSection, label: 'Inicio', icon: <LayoutDashboard size={20} /> },
  { id: 'missions' as NavSection, label: 'Misiones', icon: <Target size={20} /> },
  { id: 'habits' as NavSection, label: 'Hábitos', icon: <CheckSquare size={20} /> },
  { id: 'focus' as NavSection, label: 'Enfoque', icon: <BookOpen size={20} /> },
];

const primaryIds = new Set(primaryItems.map(i => i.id));

interface BottomNavProps {
  active: NavSection;
  onChange: (s: NavSection) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreActive = !primaryIds.has(active);

  function select(id: NavSection) {
    onChange(id);
    setMoreOpen(false);
  }

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#04060B]/95 backdrop-blur border-t border-[#1B2A47] flex">
        {primaryItems.map(item => (
          <button
            key={item.id}
            onClick={() => select(item.id)}
            className={`relative flex flex-col items-center gap-1 px-3 pt-2.5 pb-2 flex-1 text-[10px] transition-colors
              ${active === item.id ? 'text-gold-300' : 'text-gray-600'}`}
          >
            {active === item.id && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gold-400 shadow-[0_0_6px_rgba(77,166,255,0.6)]" />
            )}
            {item.icon}
            <span className="tracking-wide">{item.label}</span>
          </button>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className={`relative flex flex-col items-center gap-1 px-3 pt-2.5 pb-2 flex-1 text-[10px] transition-colors
            ${isMoreActive ? 'text-gold-300' : 'text-gray-600'}`}
        >
          {isMoreActive && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gold-400 shadow-[0_0_6px_rgba(77,166,255,0.6)]" />
          )}
          <Menu size={20} />
          <span className="tracking-wide">Más</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
          <div className="relative w-full max-h-[75vh] overflow-y-auto card-ornate rounded-t-2xl shadow-2xl sheet-up pb-[max(env(safe-area-inset-bottom),1rem)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1B2A47] sticky top-0 bg-[#0B1120] z-10">
              <h2 className="font-display text-base font-bold text-gold-200 uppercase tracking-wider">Navegación</h2>
              <button onClick={() => setMoreOpen(false)} className="text-gray-500 hover:text-gold-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {navGroups.map(group => (
                <div key={group.title}>
                  <p className="mb-2 text-[10px] font-semibold text-gray-600 uppercase tracking-[0.18em]">{group.title}</p>
                  <div className="flex flex-col gap-1.5">
                    {group.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => select(item.id)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
                          ${active === item.id
                            ? 'bg-gold-900/40 text-gold-200 border border-gold-700/40'
                            : 'text-gray-400 bg-[#0F1830] border border-[#1B2A47] hover:text-gray-200'}`}
                      >
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
