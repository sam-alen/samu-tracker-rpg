import { RECOMMENDATION_CATEGORIES, RECOMMENDATION_COST_LABELS, RECOMMENDATION_DIFFICULTY_LABELS, RECOMMENDATION_TYPE_LABELS } from '../../data/recommendations';
import { Select } from '../ui/Input';
import type { RecommendationFilters } from '../../lib/recommendationFilters';
import type { RecommendationCost, RecommendationDifficulty, RecommendationType } from '../../types';

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${
        active ? 'bg-gold-900/40 border-gold-600/50 text-gold-200' : 'bg-gray-800/40 border-gray-700/30 text-gray-500 hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

const TIME_BLOCKS = [
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1h+', value: 60 },
];

export function RecommendationFilterBar({ filters, onChange }: { filters: RecommendationFilters; onChange: (f: RecommendationFilters) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <Chip active={filters.category === 'all'} onClick={() => onChange({ ...filters, category: 'all' })}>Todas las categorías</Chip>
        {RECOMMENDATION_CATEGORIES.map(c => (
          <Chip key={c.id} active={filters.category === c.id} onClick={() => onChange({ ...filters, category: c.id })}>{c.label}</Chip>
        ))}
      </div>
      <div className="flex gap-1.5 flex-wrap items-center">
        <Chip active={filters.timeBlock === null} onClick={() => onChange({ ...filters, timeBlock: null })}>Cualquier duración</Chip>
        {TIME_BLOCKS.map(b => (
          <Chip key={b.value} active={filters.timeBlock === b.value} onClick={() => onChange({ ...filters, timeBlock: b.value })}>{b.label}</Chip>
        ))}
        <span className="w-px h-4 bg-[#1B2A47] mx-1" />
        <Chip active={filters.cost === 'all'} onClick={() => onChange({ ...filters, cost: 'all' })}>Cualquier costo</Chip>
        {(Object.keys(RECOMMENDATION_COST_LABELS) as RecommendationCost[]).map(c => (
          <Chip key={c} active={filters.cost === c} onClick={() => onChange({ ...filters, cost: c })}>{RECOMMENDATION_COST_LABELS[c]}</Chip>
        ))}
      </div>
      <div className="flex gap-1.5 flex-wrap items-center">
        <Chip active={filters.difficulty === 'all'} onClick={() => onChange({ ...filters, difficulty: 'all' })}>Cualquier nivel</Chip>
        {(Object.keys(RECOMMENDATION_DIFFICULTY_LABELS) as RecommendationDifficulty[]).map(d => (
          <Chip key={d} active={filters.difficulty === d} onClick={() => onChange({ ...filters, difficulty: d })}>{RECOMMENDATION_DIFFICULTY_LABELS[d]}</Chip>
        ))}
        <span className="w-px h-4 bg-[#1B2A47] mx-1" />
        <div className="w-40">
          <Select
            value={filters.type}
            onChange={e => onChange({ ...filters, type: e.target.value as RecommendationType | 'all' })}
            options={[{ value: 'all', label: 'Cualquier formato' }, ...Object.entries(RECOMMENDATION_TYPE_LABELS).map(([value, label]) => ({ value, label }))]}
          />
        </div>
      </div>
    </div>
  );
}
