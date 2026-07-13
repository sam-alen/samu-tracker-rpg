import { useState } from 'react';
import { Plus, Edit2, Trash2, CalendarCheck } from 'lucide-react';
import { Card, SectionHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input, TextArea } from '../ui/Input';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { storage } from '../../lib/storage';
import { checkAchievements } from '../../lib/achievements';
import type { MonthlyReview as IMonthlyReview } from '../../types';

function genId() { return Math.random().toString(36).slice(2, 10); }

function emptyForm(): Omit<IMonthlyReview, 'id' | 'createdAt'> {
  const d = new Date();
  const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return { month, achievements: '', failures: '', learnings: '', improvements: '', mainWins: '', mainDistractions: '', nextMonthFocus: '' };
}

const MONTH_NAMES: Record<string, string> = {
  '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
  '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
  '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre',
};

function formatMonth(m: string) {
  const [y, mo] = m.split('-');
  return `${MONTH_NAMES[mo] ?? mo} ${y}`;
}

export function MonthlyReview() {
  const [reviews, setReviews] = useLocalStorage<IMonthlyReview[]>(storage.keys.monthlyReviews, []);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IMonthlyReview | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [viewing, setViewing] = useState<IMonthlyReview | null>(null);

  function openNew() { setEditing(null); setForm(emptyForm()); setShowModal(true); }
  function openEdit(r: IMonthlyReview) {
    setEditing(r);
    setForm({ month: r.month, achievements: r.achievements, failures: r.failures, learnings: r.learnings, improvements: r.improvements, mainWins: r.mainWins, mainDistractions: r.mainDistractions, nextMonthFocus: r.nextMonthFocus });
    setShowModal(true);
  }

  function save() {
    if (!form.month) return;
    if (editing) {
      setReviews(prev => prev.map(r => r.id === editing.id ? { ...r, ...form } : r));
    } else {
      setReviews(prev => [{ ...form, id: genId(), createdAt: new Date().toISOString() }, ...prev]);
      checkAchievements();
    }
    setShowModal(false);
  }

  function remove(id: string) { setReviews(prev => prev.filter(r => r.id !== id)); }

  const f = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Revisión Mensual"
        subtitle="Reflexiona sobre tu progreso cada mes"
        action={<Button variant="primary" size="sm" onClick={openNew}><Plus size={14} className="mr-1 inline" />Nueva revisión</Button>}
      />

      {reviews.length === 0 && (
        <Card className="text-center py-10">
          <CalendarCheck size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Sin revisiones. Empieza con este mes.</p>
        </Card>
      )}

      <div className="space-y-3">
        {[...reviews].sort((a, b) => b.month.localeCompare(a.month)).map(r => (
          <Card key={r.id} onClick={() => setViewing(r)} className="cursor-pointer hover:border-gold-400/30 transition-colors">
            <div className="flex items-center gap-3">
              <CalendarCheck size={18} className="text-gold-300 shrink-0" />
              <div className="flex-1">
                <p className="text-base font-semibold text-white">{formatMonth(r.month)}</p>
                {r.nextMonthFocus && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">Enfoque siguiente: {r.nextMonthFocus}</p>
                )}
              </div>
              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                <button onClick={() => openEdit(r)} className="p-1.5 text-gray-600 hover:text-gray-300"><Edit2 size={14} /></button>
                <button onClick={() => remove(r.id)} className="p-1.5 text-gray-600 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* View modal */}
      {viewing && (
        <Modal open={!!viewing} onClose={() => setViewing(null)} title={`Revisión: ${formatMonth(viewing.month)}`} size="lg">
          <div className="space-y-5">
            {[
              { label: '🏆 Qué logré', value: viewing.achievements },
              { label: '❌ Qué falló', value: viewing.failures },
              { label: '📚 Qué aprendí', value: viewing.learnings },
              { label: '🔧 Qué debo mejorar', value: viewing.improvements },
              { label: '✨ Principales victorias', value: viewing.mainWins },
              { label: '😵 Principales distracciones', value: viewing.mainDistractions },
              { label: '🎯 Enfoque del siguiente mes', value: viewing.nextMonthFocus },
            ].map(item => item.value ? (
              <div key={item.label}>
                <p className="text-xs font-medium text-gray-400 mb-1">{item.label}</p>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{item.value}</p>
              </div>
            ) : null)}
          </div>
        </Modal>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar revisión' : 'Nueva revisión mensual'} size="lg">
        <div className="space-y-4">
          <Input label="Mes (YYYY-MM)" value={form.month} onChange={e => f('month', e.target.value)} placeholder="2026-05" />
          <TextArea label="🏆 Qué logré" value={form.achievements} onChange={e => f('achievements', e.target.value)} rows={3} />
          <TextArea label="❌ Qué falló" value={form.failures} onChange={e => f('failures', e.target.value)} rows={3} />
          <TextArea label="📚 Qué aprendí" value={form.learnings} onChange={e => f('learnings', e.target.value)} rows={3} />
          <TextArea label="🔧 Qué debo mejorar" value={form.improvements} onChange={e => f('improvements', e.target.value)} rows={3} />
          <TextArea label="✨ Principales victorias" value={form.mainWins} onChange={e => f('mainWins', e.target.value)} rows={2} />
          <TextArea label="😵 Principales distracciones" value={form.mainDistractions} onChange={e => f('mainDistractions', e.target.value)} rows={2} />
          <TextArea label="🎯 Enfoque del siguiente mes" value={form.nextMonthFocus} onChange={e => f('nextMonthFocus', e.target.value)} rows={2} />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={save}>Guardar revisión</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
