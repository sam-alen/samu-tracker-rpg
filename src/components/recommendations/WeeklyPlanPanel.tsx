import { RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import type { RecommendationInteraction, RecommendationItem, RecommendationWeeklyPlan, RecommendationWeeklyPlanSlot } from '../../types';

const ROLE_LABELS: Record<RecommendationWeeklyPlanSlot['role'], string> = {
  principal: 'Contenido principal',
  secundario: 'Secundario',
  gimnasio: 'Gimnasio / nutrición',
  ingles: 'Inglés',
  entretenimiento: 'Entretenimiento',
};

interface Props {
  plan: RecommendationWeeklyPlan;
  catalog: RecommendationItem[];
  interactions: Record<string, RecommendationInteraction>;
  regenCap: number;
  onOpenItem: (id: string) => void;
  onRegenerate: () => void;
}

export function WeeklyPlanPanel({ plan, catalog, interactions, regenCap, onOpenItem, onRegenerate }: Props) {
  const doneCount = plan.slots.filter(s => interactions[s.itemId]?.status === 'completed').length;
  const canRegenerate = plan.regenCount < regenCap;

  return (
    <div className="card-ornate rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">Plan de esta semana</p>
          <p className="text-xs text-gray-500">{doneCount}/{plan.slots.length} completados</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={!canRegenerate} title={canRegenerate ? 'Regenerar plan' : 'Ya usaste tus 3 regeneraciones de esta semana'}>
          <RefreshCw size={13} className="mr-1 inline" />
          Regenerar ({regenCap - plan.regenCount} restantes)
        </Button>
      </div>

      <div className="space-y-1.5">
        {plan.slots.map(slot => {
          const item = catalog.find(i => i.id === slot.itemId);
          if (!item) return null;
          const done = interactions[slot.itemId]?.status === 'completed';
          return (
            <button
              key={slot.itemId}
              onClick={() => onOpenItem(slot.itemId)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-colors
                ${done ? 'bg-emerald-950/20 border-emerald-800/30' : 'bg-[#0F1830] border-[#1B2A47] hover:border-gold-400/30'}`}
            >
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/40 text-gray-500 shrink-0">{ROLE_LABELS[slot.role]}</span>
              <span className={`text-sm truncate flex-1 ${done ? 'text-emerald-300 line-through' : 'text-gray-200'}`}>{item.title}</span>
            </button>
          );
        })}
      </div>

      {plan.explanation && <p className="text-[11px] text-gray-600 leading-relaxed border-t border-white/5 pt-2">{plan.explanation}</p>}
    </div>
  );
}
