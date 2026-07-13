import { useState, useMemo } from 'react';
import { ShieldOff, Plus, RotateCcw, Flame, AlertTriangle, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { storage } from '../../lib/storage';
import type { BadHabit } from '../../types';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function streakDays(relapses: string[]): number {
  if (relapses.length === 0) return 0;
  const sorted = [...relapses].sort();
  const lastRelapse = sorted[sorted.length - 1];
  const today = todayISO();
  const diff = Math.floor(
    (new Date(today).getTime() - new Date(lastRelapse).getTime()) / 86400000
  );
  return diff;
}

function cleanStreak(badHabit: BadHabit): number {
  if (badHabit.relapses.length === 0) {
    const created = badHabit.createdAt.slice(0, 10);
    const today = todayISO();
    return Math.floor(
      (new Date(today).getTime() - new Date(created).getTime()) / 86400000
    );
  }
  return streakDays(badHabit.relapses);
}

const EMOJI_OPTIONS = ['🚫', '⛔', '🧠', '💪', '🔥', '⚠️', '😤', '🛑'];

export function BadHabits() {
  const [badHabits, setBadHabits] = useLocalStorage<BadHabit[]>(
    storage.keys.badHabits, []
  );
  const [showAdd, setShowAdd] = useState(false);
  const [confirmRelapse, setConfirmRelapse] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🚫');

  const sorted = useMemo(
    () => [...badHabits].sort((a, b) => cleanStreak(b) - cleanStreak(a)),
    [badHabits]
  );

  function addBadHabit() {
    if (!newName.trim()) return;
    const habit: BadHabit = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      icon: newIcon,
      relapses: [],
      createdAt: new Date().toISOString(),
    };
    setBadHabits([...badHabits, habit]);
    setNewName('');
    setNewIcon('🚫');
    setShowAdd(false);
  }

  function logRelapse(id: string) {
    setBadHabits(badHabits.map(h =>
      h.id === id
        ? { ...h, relapses: [...h.relapses, new Date().toISOString()] }
        : h
    ));
    setConfirmRelapse(null);
  }

  function deleteBadHabit(id: string) {
    setBadHabits(badHabits.filter(h => h.id !== id));
  }

  function streakColor(days: number) {
    if (days >= 30) return 'text-emerald-400';
    if (days >= 7) return 'text-arcane-300';
    if (days >= 3) return 'text-yellow-400';
    return 'text-red-400';
  }

  function streakLabel(days: number) {
    if (days >= 90) return 'Maestro';
    if (days >= 30) return 'Limpio';
    if (days >= 14) return 'En racha';
    if (days >= 7) return '1 semana';
    if (days >= 3) return 'Inicio';
    if (days === 0) return 'Recaída reciente';
    return `${days}d`;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Registra recaídas y mide tu tiempo limpio. Cada día limpio es una victoria.</p>
        <Button onClick={() => setShowAdd(true)} size="sm">
          <Plus size={14} /> Agregar
        </Button>
      </div>

      {sorted.length === 0 && (
        <Card className="text-center py-10">
          <ShieldOff size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Sin malos hábitos registrados</p>
          <p className="text-gray-700 text-xs mt-1">Agrega los que quieres evitar</p>
        </Card>
      )}

      <div className="space-y-3">
        {sorted.map(habit => {
          const days = cleanStreak(habit);
          const totalRelapses = habit.relapses.length;
          const lastRelapse = habit.relapses.length > 0
            ? [...habit.relapses].sort().pop()!.slice(0, 10)
            : null;

          return (
            <Card key={habit.id} className="relative">
              <div className="flex items-start gap-4">
                <div className="text-3xl shrink-0">{habit.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white text-sm">{habit.name}</h3>
                    <Badge color={days >= 7 ? 'green' : days >= 3 ? 'gold' : 'red'}>
                      {streakLabel(days)}
                    </Badge>
                  </div>

                  {/* Streak display */}
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <Flame size={14} className={streakColor(days)} />
                    <span className={`text-2xl font-bold ${streakColor(days)}`}>{days}</span>
                    <span className="text-xs text-gray-500">días sin recaída</span>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                    <span>{totalRelapses} recaída{totalRelapses !== 1 ? 's' : ''} total</span>
                    {lastRelapse && <span>Última: {lastRelapse}</span>}
                  </div>

                  {/* Progress bar for 30-day milestone */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-700 mb-1">
                      <span>Meta 30 días</span>
                      <span>{Math.min(days, 30)}/30</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min((days / 30) * 100, 100)}%`,
                          background: days >= 30 ? '#34C08B' : days >= 14 ? '#8B5CF6' : '#4DA6FF',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => setConfirmRelapse(habit.id)}
                    className="text-xs px-2 py-1.5 rounded-lg bg-red-900/20 border border-red-800/30 text-red-400 hover:bg-red-900/40 transition-colors flex items-center gap-1"
                    title="Registrar recaída"
                  >
                    <RotateCcw size={11} />
                    Recaída
                  </button>
                  <button
                    onClick={() => deleteBadHabit(habit.id)}
                    className="text-xs px-2 py-1.5 rounded-lg bg-gray-800/40 border border-gray-700/30 text-gray-600 hover:text-red-400 transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nuevo mal hábito">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Nombre</label>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="ej. Fap, Redes sociales excesivas..."
              onKeyDown={e => e.key === 'Enter' && addBadHabit()}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-2">Ícono</label>
            <div className="flex gap-2 flex-wrap">
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  onClick={() => setNewIcon(e)}
                  className={`text-2xl p-2 rounded-lg border transition-all ${newIcon === e ? 'border-gold-400 bg-gold-900/30' : 'border-gray-700 bg-gray-800/40 hover:border-gray-500'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={addBadHabit} disabled={!newName.trim()} className="flex-1">
              Agregar
            </Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm relapse modal */}
      <Modal
        open={!!confirmRelapse}
        onClose={() => setConfirmRelapse(null)}
        title="Confirmar recaída"
      >
        <div className="text-center space-y-4">
          <AlertTriangle size={40} className="text-red-400 mx-auto" />
          <p className="text-gray-300 text-sm">
            ¿Registrar una recaída hoy? Esto reiniciará tu racha.
          </p>
          <p className="text-gray-500 text-xs">
            Ser honesto contigo mismo es el primer paso.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => confirmRelapse && logRelapse(confirmRelapse)}
              className="flex-1 bg-red-700 hover:bg-red-600"
            >
              Sí, registrar
            </Button>
            <Button variant="ghost" onClick={() => setConfirmRelapse(null)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
