import { Bookmark, BookmarkCheck, Check, X, Layers, Clock } from 'lucide-react';
import { RECOMMENDATION_CATEGORIES, RECOMMENDATION_COST_LABELS, RECOMMENDATION_DIFFICULTY_LABELS, RECOMMENDATION_TYPE_LABELS } from '../../data/recommendations';
import type { RecommendationInteraction, RecommendationItem } from '../../types';

interface RecommendationCardProps {
  item: RecommendationItem;
  interaction?: RecommendationInteraction;
  reason: string;
  onOpen: () => void;
  onToggleSaved: () => void;
  onComplete: (e: React.MouseEvent) => void;
  onDismiss: () => void;
  onSimilar: () => void;
  width?: 'fixed' | 'full';
}

export function RecommendationCard({
  item, interaction, reason, onOpen, onToggleSaved, onComplete, onDismiss, onSimilar, width = 'fixed',
}: RecommendationCardProps) {
  const meta = RECOMMENDATION_CATEGORIES.find(c => c.id === item.category)!;
  const Icon = meta.icon;
  const saved = interaction?.status === 'saved';
  const completed = interaction?.status === 'completed';
  const completeLabel = item.type === 'book' || item.type === 'audiobook' ? 'Ya lo leí'
    : item.type === 'youtube' || item.type === 'movie-series' || item.type === 'documentary' ? 'Ya lo vi'
    : 'Completado';

  return (
    <div
      className={`${width === 'fixed' ? 'w-[240px] shrink-0' : 'w-full'} rounded-xl border p-3.5 transition-all
        ${completed ? 'bg-emerald-950/20 border-emerald-800/30' : 'bg-gradient-to-b from-[#0C1424] to-[#080D19] border-[#1B2A47] hover:border-gold-400/30'}`}
    >
      <button onClick={onOpen} className="flex items-start gap-2.5 text-left w-full mb-2.5">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ color: meta.color, backgroundColor: `${meta.color}1F`, border: `1px solid ${meta.color}4D` }}
        >
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium leading-snug line-clamp-2 ${completed ? 'text-emerald-300' : 'text-gray-100'}`}>{item.title}</p>
          <p className="text-[11px] text-gray-600 mt-0.5 truncate">{item.creator}</p>
        </div>
      </button>

      <div className="flex flex-wrap gap-1 mb-2">
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-900 text-gray-400 border border-gray-700">{RECOMMENDATION_TYPE_LABELS[item.type]}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-900 text-gray-400 border border-gray-700 inline-flex items-center gap-1">
          <Clock size={9} />{item.timeMinutes} min
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-900 text-gray-400 border border-gray-700">{RECOMMENDATION_DIFFICULTY_LABELS[item.difficulty]}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-900 text-gray-400 border border-gray-700">{RECOMMENDATION_COST_LABELS[item.cost]}</span>
      </div>

      <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 mb-3">{reason}</p>

      <div className="flex items-center gap-1 border-t border-white/5 pt-2">
        <button onClick={onToggleSaved} title={saved ? 'Quitar de guardados' : 'Guardar'} className={`p-1.5 rounded-md transition-colors ${saved ? 'text-gold-300' : 'text-gray-600 hover:text-gray-300'}`}>
          {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
        </button>
        <button onClick={onComplete} title={completeLabel} className={`p-1.5 rounded-md transition-colors ${completed ? 'text-emerald-400' : 'text-gray-600 hover:text-emerald-400'}`}>
          <Check size={14} />
        </button>
        <button onClick={onDismiss} title="No me interesa" className="p-1.5 rounded-md text-gray-600 hover:text-red-400 transition-colors">
          <X size={14} />
        </button>
        <button onClick={onSimilar} title="Ver similares" className="p-1.5 rounded-md text-gray-600 hover:text-arcane-300 transition-colors ml-auto">
          <Layers size={14} />
        </button>
      </div>
    </div>
  );
}
