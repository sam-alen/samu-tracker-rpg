import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input, TextArea, Select } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useXP } from '../../hooks/useXP';
import { useAttributes } from '../../hooks/useAttributes';
import { storage } from '../../lib/storage';
import { XP_REWARDS, todayISO } from '../../lib/xp';
import { fx } from '../../lib/fx';
import { checkAchievements } from '../../lib/achievements';
import type { StudySession, StudyArea, FocusLevel } from '../../types';

const AREAS: StudyArea[] = [
  'Salesforce Admin', 'Salesforce Developer', 'Apex', 'LWC',
  'JavaScript', 'Git / DevOps', 'Inglés técnico', 'Arquitectura / Clean Code', 'Otro',
];

function genId() { return Math.random().toString(36).slice(2, 10); }

function emptyForm(): Omit<StudySession, 'id' | 'xpAwarded'> {
  return {
    date: todayISO(),
    topic: '',
    area: 'Salesforce Admin',
    durationMinutes: 30,
    focusLevel: 3,
    notes: '',
    resources: '',
  };
}

export function Study() {
  const [sessions, setSessions] = useLocalStorage<StudySession[]>(storage.keys.studySessions, []);
  const { gainXP, loseXP } = useXP();
  const { gainAttribute, loseAttribute } = useAttributes();
  const today = todayISO();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<StudySession | null>(null);
  const [form, setForm] = useState(emptyForm());

  const todayMinutes = useMemo(() => sessions.filter(s => s.date === today).reduce((a, s) => a + s.durationMinutes, 0), [sessions, today]);

  const weekStart = (() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay());
    return d.toISOString().slice(0, 10);
  })();
  const weekMinutes = useMemo(() => sessions.filter(s => s.date >= weekStart).reduce((a, s) => a + s.durationMinutes, 0), [sessions, weekStart]);

  const topAreas = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach(s => { map[s.area] = (map[s.area] || 0) + s.durationMinutes; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [sessions]);

  function openNew() { setEditing(null); setForm(emptyForm()); setShowModal(true); }
  function openEdit(s: StudySession) {
    setEditing(s);
    setForm({ date: s.date, topic: s.topic, area: s.area, durationMinutes: s.durationMinutes, focusLevel: s.focusLevel, notes: s.notes, resources: s.resources });
    setShowModal(true);
  }

  function save() {
    if (!form.topic.trim()) return;
    if (editing) {
      setSessions(prev => prev.map(s => s.id === editing.id ? { ...s, ...form } : s));
    } else {
      setSessions(prev => [{ ...form, id: genId(), xpAwarded: true }, ...prev]);
      gainXP(XP_REWARDS.study);
      gainAttribute('INT', XP_REWARDS.study);
      fx.rewardAt(null, XP_REWARDS.study);
      checkAchievements();
    }
    setShowModal(false);
  }

  // Deleting a session that awarded XP takes its reward with it
  function remove(id: string) {
    const session = sessions.find(s => s.id === id);
    setSessions(prev => prev.filter(s => s.id !== id));
    if (session?.xpAwarded) {
      loseXP(XP_REWARDS.study);
      loseAttribute('INT', XP_REWARDS.study);
    }
  }

  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  const focusColors: Record<FocusLevel, string> = {
    1: 'text-red-400', 2: 'text-orange-400', 3: 'text-yellow-400', 4: 'text-arcane-300', 5: 'text-emerald-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Registra tus sesiones de aprendizaje</p>
        <Button variant="primary" size="sm" onClick={openNew}><Plus size={14} className="mr-1 inline" />Nueva sesión</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-white">{todayMinutes}<span className="text-sm text-gray-400 font-normal"> min</span></p>
          <p className="text-xs text-gray-400 mt-1">Estudiado hoy</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-white">{weekMinutes}<span className="text-sm text-gray-400 font-normal"> min</span></p>
          <p className="text-xs text-gray-400 mt-1">Esta semana</p>
        </Card>
        <Card className="text-center col-span-2 md:col-span-1">
          <p className="text-2xl font-bold text-white">{sessions.length}</p>
          <p className="text-xs text-gray-400 mt-1">Sesiones totales</p>
        </Card>
      </div>

      {/* Top areas */}
      {topAreas.length > 0 && (
        <Card>
          <p className="text-sm font-medium text-white mb-3">Áreas más estudiadas</p>
          <div className="space-y-2">
            {topAreas.map(([area, mins]) => (
              <div key={area} className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{area}</span>
                <span className="text-xs text-gold-300 font-medium">{mins} min</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {sorted.length === 0 && (
        <Card className="text-center py-10">
          <BookOpen size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay sesiones aún. ¡Comienza a estudiar!</p>
        </Card>
      )}

      <div className="space-y-2">
        {sorted.map(s => (
          <Card key={s.id}>
            <div className="flex items-start gap-3">
              <BookOpen size={16} className="text-arcane-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-medium text-gray-200">{s.topic}</p>
                  <Badge color="blue">{s.area}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{s.date}</span>
                  <span className="flex items-center gap-1"><Clock size={10} />{s.durationMinutes} min</span>
                  <span className={`font-medium ${focusColors[s.focusLevel]}`}>Foco: {s.focusLevel}/5</span>
                </div>
                {s.notes && <p className="text-xs text-gray-500 mt-1.5 italic">{s.notes}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(s)} className="p-1.5 text-gray-600 hover:text-gray-300">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => remove(s.id)} className="p-1.5 text-gray-600 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar sesión' : 'Nueva sesión de estudio'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Fecha" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            <Input label="Duración (min)" type="number" value={form.durationMinutes} onChange={e => setForm(p => ({ ...p, durationMinutes: Number(e.target.value) }))} />
          </div>
          <Input label="Tema estudiado" value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} placeholder="Ej: SOQL queries avanzadas" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Área"
              value={form.area}
              onChange={e => setForm(p => ({ ...p, area: e.target.value as StudyArea }))}
              options={AREAS.map(a => ({ value: a, label: a }))}
            />
            <Select
              label="Nivel de foco (1-5)"
              value={String(form.focusLevel)}
              onChange={e => setForm(p => ({ ...p, focusLevel: Number(e.target.value) as FocusLevel }))}
              options={[1,2,3,4,5].map(n => ({ value: String(n), label: `${n} - ${'⭐'.repeat(n)}` }))}
            />
          </div>
          <Input label="Recursos usados" value={form.resources} onChange={e => setForm(p => ({ ...p, resources: e.target.value }))} placeholder="Trailhead, documentación, video..." />
          <TextArea label="Notas" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="¿Qué aprendiste? ¿Qué falta?" />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={save}>Guardar sesión</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
