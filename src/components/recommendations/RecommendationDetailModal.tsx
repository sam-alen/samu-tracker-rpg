import { Star, ExternalLink, Bookmark, BookmarkCheck, Check, Undo2, X, ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { RECOMMENDATION_CATEGORIES, RECOMMENDATION_COST_LABELS, RECOMMENDATION_DIFFICULTY_LABELS, RECOMMENDATION_TYPE_LABELS } from '../../data/recommendations';
import type { RecommendationFeedbackFlag, RecommendationInteraction, RecommendationItem, RecommendationProfile } from '../../types';
import type { ScoredItem } from '../../lib/recommendations';

const FEEDBACK_OPTIONS: { flag: RecommendationFeedbackFlag; label: string }[] = [
  { flag: 'interesa', label: 'Me interesa' },
  { flag: 'no-interesa', label: 'No me interesa' },
  { flag: 'mas-como-esto', label: 'Más como esto' },
  { flag: 'menos-como-esto', label: 'Menos como esto' },
  { flag: 'muy-basico', label: 'Muy básico' },
  { flag: 'muy-avanzado', label: 'Muy avanzado' },
  { flag: 'enlace-roto', label: 'El enlace no funciona' },
];

const BREAKDOWN_LABELS: Record<string, string> = {
  goalMatch: 'Coincidencia con tu meta',
  categoryWeight: 'Peso de la categoría',
  affinity: 'Afinidad aprendida',
  difficultyFit: 'Ajuste de dificultad',
  timeFit: 'Ajuste de tiempo',
  costFit: 'Costo/presupuesto',
  quality: 'Calidad curada',
  recency: 'Vigencia',
  formatFit: 'Formato preferido',
};

interface RecommendationDetailModalProps {
  item: RecommendationItem | null;
  scored?: ScoredItem;
  profile: RecommendationProfile;
  interaction?: RecommendationInteraction;
  onClose: () => void;
  onToggleSaved: () => void;
  onComplete: (e: React.MouseEvent) => void;
  onUndoComplete: () => void;
  onDismiss: () => void;
  onUndoDismiss: () => void;
  onRate: (stars: 1 | 2 | 3 | 4 | 5) => void;
  onFeedback: (flag: RecommendationFeedbackFlag) => void;
}

export function RecommendationDetailModal({
  item, scored, profile, interaction, onClose, onToggleSaved, onComplete, onUndoComplete, onDismiss, onUndoDismiss, onRate, onFeedback,
}: RecommendationDetailModalProps) {
  if (!item) return null;
  const meta = RECOMMENDATION_CATEGORIES.find(c => c.id === item.category)!;
  const Icon = meta.icon;
  const goal = profile.goals.find(g => g.id === item.goalId);
  const saved = interaction?.status === 'saved';
  const completed = interaction?.status === 'completed';
  const dismissed = interaction?.status === 'dismissed';

  return (
    <Modal open={!!item} onClose={onClose} title={meta.label} size="lg">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ color: meta.color, backgroundColor: `${meta.color}1F`, border: `1px solid ${meta.color}4D` }}>
            <Icon size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-white leading-snug">{item.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{item.creator}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge color="gray">{RECOMMENDATION_TYPE_LABELS[item.type]}</Badge>
          <Badge color="gray">{item.timeMinutes} min</Badge>
          <Badge color="gray">{RECOMMENDATION_DIFFICULTY_LABELS[item.difficulty]}</Badge>
          <Badge color="gray">{RECOMMENDATION_COST_LABELS[item.cost]}</Badge>
          <Badge color="gray">{item.language === 'ambos' ? 'ES/EN' : item.language.toUpperCase()}</Badge>
          {item.officialSource && <Badge color="green"><ShieldCheck size={10} className="inline mr-1" />Fuente oficial</Badge>}
        </div>

        <p className="text-sm text-gray-300 leading-relaxed">{item.description}</p>

        <div className="card-ornate rounded-lg p-3">
          <p className="text-xs font-semibold text-gold-200 mb-1">Por qué te lo recomendamos</p>
          <p className="text-xs text-gray-400 leading-relaxed">{item.whyForYou}</p>
          {goal && <p className="text-xs text-gray-600 mt-1.5">Meta relacionada: <span className="text-gray-400">{goal.label}</span></p>}
        </div>

        {scored && (
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-1.5">Desglose de puntuación ({scored.total}/100 — heurística transparente, no IA)</p>
            <div className="space-y-1">
              {Object.entries(scored.breakdown).filter(([, v]) => v !== 0).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-600">{BREAKDOWN_LABELS[key] ?? key}</span>
                  <span className={value > 0 ? 'text-emerald-400' : 'text-red-400'}>{value > 0 ? '+' : ''}{Math.round(value * 10) / 10}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {item.tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-900 text-gray-500 border border-gray-800">#{t}</span>)}
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1.5">Calificación estimada (editorial, no de usuarios): {item.estimatedRating}/5</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => onRate(n as 1 | 2 | 3 | 4 | 5)}>
                <Star size={18} className={n <= (interaction?.rating ?? 0) ? 'text-gold-300 fill-gold-300' : 'text-gray-700'} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1.5">Ajustar recomendaciones</p>
          <div className="flex flex-wrap gap-1.5">
            {FEEDBACK_OPTIONS.map(o => (
              <button
                key={o.flag}
                onClick={() => onFeedback(o.flag)}
                className="text-[11px] px-2.5 py-1.5 rounded-lg border border-[#1B2A47] bg-[#0F1830] text-gray-400 hover:text-gold-200 hover:border-gold-400/40 transition-colors"
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
          <a href={item.link} target="_blank" rel="noopener noreferrer">
            <Button variant="primary" size="sm"><ExternalLink size={13} className="mr-1 inline" />Buscar / abrir</Button>
          </a>
          <Button variant="ghost" size="sm" onClick={onToggleSaved}>
            {saved ? <BookmarkCheck size={13} className="mr-1 inline" /> : <Bookmark size={13} className="mr-1 inline" />}
            {saved ? 'Guardado' : 'Guardar'}
          </Button>
          {completed ? (
            <Button variant="ghost" size="sm" onClick={onUndoComplete}><Undo2 size={13} className="mr-1 inline" />Desmarcar completado</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onComplete}><Check size={13} className="mr-1 inline" />Marcar completado</Button>
          )}
          {dismissed ? (
            <Button variant="ghost" size="sm" onClick={onUndoDismiss}><Undo2 size={13} className="mr-1 inline" />Restaurar</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onDismiss}><X size={13} className="mr-1 inline" />No me interesa</Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
