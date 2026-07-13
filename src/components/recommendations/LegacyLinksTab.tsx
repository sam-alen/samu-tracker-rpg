import { useState } from 'react';
import { PlayCircle, BookOpen, Check, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input, Select, TextArea } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useXP } from '../../hooks/useXP';
import { storage } from '../../lib/storage';
import { todayISO, XP_REWARDS } from '../../lib/xp';
import { fx } from '../../lib/fx';
import { checkAchievements } from '../../lib/achievements';
import { RECOMMENDATION_CATEGORIES, youtubeSearchUrl, bookSearchUrl } from '../../data/recommendations';
import type { CustomRecommendation, RecommendationCategory, RecommendationType } from '../../types';

function genId() { return Math.random().toString(36).slice(2, 10); }

function emptyForm(): Omit<CustomRecommendation, 'id' | 'createdAt'> {
  return { type: 'youtube', category: 'habitos-productividad', title: '', creator: '', note: '' };
}

export function LegacyLinksTab() {
  const { gainXP, loseXP } = useXP();
  const [progress, setProgress] = useLocalStorage<string[]>(storage.keys.recommendationsProgress, []);
  const [custom, setCustom] = useLocalStorage<CustomRecommendation[]>(storage.keys.customRecommendations, []);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm());

  // Un-marking reverts the award so this list can't be farmed
  function toggle(id: string, e?: React.MouseEvent) {
    const done = progress.includes(id);
    setProgress(prev => done ? prev.filter(p => p !== id) : [...prev, id]);
    if (!done) {
      gainXP(XP_REWARDS.recommendation);
      fx.rewardAt(e ?? null, XP_REWARDS.recommendation);
      checkAchievements();
    } else {
      loseXP(XP_REWARDS.recommendation);
    }
  }

  function saveCustom() {
    if (!form.title.trim()) return;
    const item: CustomRecommendation = { ...form, id: genId(), createdAt: todayISO() };
    setCustom(prev => [item, ...prev]);
    setShowModal(false);
    setForm(emptyForm());
  }

  function removeCustom(id: string) {
    setCustom(prev => prev.filter(c => c.id !== id));
    setProgress(prev => prev.filter(p => p !== id));
    if (progress.includes(id)) loseXP(XP_REWARDS.recommendation);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">Tus propios enlaces guardados, fuera del catálogo curado.</p>
        <Button variant="primary" size="sm" onClick={() => { setForm(emptyForm()); setShowModal(true); }}>
          <Plus size={14} className="mr-1 inline" />Agregar
        </Button>
      </div>

      {custom.length === 0 ? (
        <Card className="text-center py-8"><p className="text-gray-500 text-sm">Aún no agregas ningún enlace propio.</p></Card>
      ) : (
        <div className="space-y-2">
          {custom.map(item => {
            const done = progress.includes(item.id);
            const link = item.type === 'youtube' ? youtubeSearchUrl(`${item.title} ${item.creator}`) : bookSearchUrl(item.title, item.creator);
            const category = RECOMMENDATION_CATEGORIES.find(c => c.id === item.category);
            return (
              <div key={item.id} className={`flex items-start gap-3 rounded-xl px-4 py-3 border transition-all
                ${done ? 'bg-emerald-950/20 border-emerald-800/30' : 'bg-gradient-to-b from-[#0C1424] to-[#080D19] border-[#1B2A47] hover:border-gold-400/20'}`}>
                <button
                  onClick={e => toggle(item.id, e)}
                  title={done ? 'Desmarcar' : `Marcar como completado (+${XP_REWARDS.recommendation} XP)`}
                  className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
                    ${done ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_8px_rgba(52,192,139,0.4)]' : 'border-gray-600 hover:border-gold-400'}`}
                >
                  {done && <Check size={13} className="text-white" />}
                </button>
                <div className={`mt-0.5 shrink-0 ${item.type === 'youtube' ? 'text-red-400' : 'text-gold-300'}`}>
                  {item.type === 'youtube' ? <PlayCircle size={16} /> : <BookOpen size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium ${done ? 'text-emerald-300' : 'text-gray-200'}`}>{item.title}</p>
                    <Badge color="gray">{category?.label ?? item.category}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{item.creator}</p>
                  {item.note && <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.note}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a href={link} target="_blank" rel="noopener noreferrer" title="Buscar" className="p-1.5 text-gray-500 hover:text-gold-300 transition-colors">
                    <ExternalLink size={14} />
                  </a>
                  <button onClick={() => removeCustom(item.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Agregar enlace propio">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Tipo"
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value as RecommendationType }))}
              options={[{ value: 'youtube', label: 'YouTube' }, { value: 'book', label: 'Libro' }]}
            />
            <Select
              label="Categoría"
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value as RecommendationCategory }))}
              options={RECOMMENDATION_CATEGORIES.map(c => ({ value: c.id, label: c.label }))}
            />
          </div>
          <Input
            label={form.type === 'youtube' ? 'Título del video / canal' : 'Título del libro'}
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            autoFocus
          />
          <Input
            label={form.type === 'youtube' ? 'Creador' : 'Autor'}
            value={form.creator}
            onChange={e => setForm(p => ({ ...p, creator: e.target.value }))}
          />
          <TextArea
            label="Nota (opcional)"
            value={form.note}
            onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
            placeholder="Por qué te lo recomendaron / qué esperas sacar de esto..."
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={saveCustom}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
