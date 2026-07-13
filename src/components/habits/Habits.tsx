import { useState } from 'react';
import { Plus, Edit2, Trash2, Check, Flame, CheckSquare, ShieldOff } from 'lucide-react';
import { Card, SectionHeader } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { BadHabits } from '../bad-habits/BadHabits';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { AttributeBadge, AttributePicker } from '../ui/AttributeBadge';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useXP } from '../../hooks/useXP';
import { useAttributes } from '../../hooks/useAttributes';
import { storage } from '../../lib/storage';
import { todayISO } from '../../lib/xp';
import { XP_REWARDS } from '../../lib/xp';
import { fx } from '../../lib/fx';
import { checkAchievements } from '../../lib/achievements';
import { initialHabits } from '../../data/initial';
import type { Habit, RPGAttribute } from '../../types';

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function getStreak(habit: Habit): number {
  let streak = 0;
  const d = new Date();
  while (true) {
    const s = d.toISOString().slice(0, 10);
    if (habit.completedDates.includes(s)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

export function Habits() {
  const [habits, setHabits] = useLocalStorage<Habit[]>(storage.keys.habits, initialHabits);
  const { gainXP, loseXP } = useXP();
  const { gainAttribute, loseAttribute } = useAttributes();
  const today = todayISO();

  const [tab, setTab] = useState<'daily' | 'avoid'>('daily');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [form, setForm] = useState<{ name: string; icon: string; attribute: RPGAttribute }>({ name: '', icon: '✅', attribute: 'INT' });

  function openNew() {
    setEditing(null);
    setForm({ name: '', icon: '✅', attribute: 'INT' });
    setShowModal(true);
  }

  function openEdit(h: Habit) {
    setEditing(h);
    setForm({ name: h.name, icon: h.icon, attribute: h.attribute ?? 'INT' });
    setShowModal(true);
  }

  function save() {
    if (!form.name.trim()) return;
    if (editing) {
      setHabits(prev => prev.map(h => h.id === editing.id ? { ...h, name: form.name, icon: form.icon, attribute: form.attribute } : h));
    } else {
      const newHabit: Habit = {
        id: generateId(),
        name: form.name,
        icon: form.icon,
        attribute: form.attribute,
        completedDates: [],
        createdAt: today,
      };
      setHabits(prev => [...prev, newHabit]);
    }
    setShowModal(false);
  }

  function remove(id: string) {
    setHabits(prev => prev.filter(h => h.id !== id));
  }

  // gainXP/gainAttribute outside the updater: StrictMode re-runs updaters, doubling side effects.
  // Un-marking reverts the award so stats stay coherent.
  function toggle(id: string, e?: React.MouseEvent) {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    const done = habit.completedDates.includes(today);
    setHabits(prev => prev.map(h => h.id === id
      ? {
          ...h,
          completedDates: done
            ? h.completedDates.filter(d => d !== today)
            : [...h.completedDates, today],
        }
      : h));
    if (!done) {
      gainXP(XP_REWARDS.habit);
      gainAttribute(habit.attribute ?? 'INT', XP_REWARDS.habit);
      fx.rewardAt(e ?? null, XP_REWARDS.habit);
      checkAchievements();
    } else {
      loseXP(XP_REWARDS.habit);
      loseAttribute(habit.attribute ?? 'INT', XP_REWARDS.habit);
    }
  }

  const doneToday = habits.filter(h => h.completedDates.includes(today)).length;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Hábitos"
        subtitle="Construye la disciplina un día a la vez"
        action={tab === 'daily'
          ? <Button variant="primary" size="sm" onClick={openNew}><Plus size={14} className="mr-1 inline" />Nuevo hábito</Button>
          : undefined}
      />

      <Tabs
        tabs={[
          { id: 'daily', label: 'Diarios', icon: <CheckSquare size={15} /> },
          { id: 'avoid', label: 'A evitar', icon: <ShieldOff size={15} /> },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'avoid' && <BadHabits />}

      {tab === 'daily' && <>

      {/* Progress */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-300">Hoy: <span className="text-white font-semibold">{doneToday}/{habits.length}</span></p>
          <Badge color={doneToday === habits.length && habits.length > 0 ? 'green' : 'gray'}>{Math.round((doneToday / Math.max(1, habits.length)) * 100)}%</Badge>
        </div>
        <ProgressBar value={(doneToday / Math.max(1, habits.length)) * 100} color="green" />
      </Card>

      {/* Habit list */}
      <div className="space-y-2">
        {habits.length === 0 && (
          <Card className="text-center py-8">
            <p className="text-gray-500 text-sm">No hay hábitos. Crea el primero.</p>
          </Card>
        )}
        {habits.map(h => {
          const done = h.completedDates.includes(today);
          const streak = getStreak(h);
          return (
            <div
              key={h.id}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-150
                ${done
                  ? 'bg-emerald-950/20 border-emerald-800/30 shadow-[inset_2px_0_0_rgba(52,192,139,0.5)]'
                  : 'bg-gradient-to-b from-[#0C1424] to-[#080D19] border-[#1B2A47] hover:border-gold-400/30'}`}
            >
              {/* Checkbox */}
              <button
                onClick={e => toggle(h.id, e)}
                className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all active:scale-90
                  ${done ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_8px_rgba(52,192,139,0.4)]' : 'border-gray-600 hover:border-gold-400'}`}
              >
                {done && <Check size={14} className="text-white" />}
              </button>

              <span className="text-xl">{h.icon}</span>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${done ? 'text-emerald-300 line-through opacity-70' : 'text-gray-200'}`}>{h.name}</p>
                {streak > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Flame size={11} className="text-orange-400" />
                    <span className="text-xs text-orange-400">{streak}d racha</span>
                  </div>
                )}
              </div>

              <AttributeBadge attr={h.attribute ?? 'INT'} />

              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(h)} className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => remove(h.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar hábito' : 'Nuevo hábito'}>
        <div className="space-y-4">
          <Input label="Emoji / Icono" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} placeholder="✅" />
          <Input label="Nombre del hábito" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Leer 20 minutos" autoFocus />
          <div>
            <p className="block text-xs font-medium text-gray-400 mb-1.5 tracking-wide">Atributo que desarrolla</p>
            <AttributePicker value={form.attribute} onChange={a => setForm(p => ({ ...p, attribute: a }))} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={save}>Guardar</Button>
          </div>
        </div>
      </Modal>

      </>}
    </div>
  );
}
