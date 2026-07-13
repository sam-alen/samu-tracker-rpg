import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Check, Zap, Repeat, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, SectionHeader } from '../ui/Card';
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
import { pendingTemplatesForToday, instantiateTemplates } from '../../lib/missions';
import { initialMissions } from '../../data/initial';
import type { Mission, MissionTemplate, RPGAttribute } from '../../types';

function generateId() { return Math.random().toString(36).slice(2, 10); }

export function Missions() {
  const [missions, setMissions] = useLocalStorage<Mission[]>(storage.keys.missions, initialMissions);
  const [templates, setTemplates] = useLocalStorage<MissionTemplate[]>(storage.keys.missionTemplates, []);
  const { gainXP, loseXP } = useXP();
  const { gainAttribute, loseAttribute } = useAttributes();
  const today = todayISO();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Mission | null>(null);
  const [title, setTitle] = useState('');
  const [attribute, setAttribute] = useState<RPGAttribute>('DEX');
  const [repeatDaily, setRepeatDaily] = useState(false);

  const todayMissions = missions.filter(m => m.date === today);
  const doneMissions = todayMissions.filter(m => m.status === 'done');
  const pending = useMemo(() => pendingTemplatesForToday(templates, missions, today), [templates, missions, today]);

  function openNew() {
    setEditing(null);
    setTitle('');
    setAttribute('DEX');
    setRepeatDaily(false);
    setShowModal(true);
  }

  function openEdit(m: Mission) {
    setEditing(m);
    setTitle(m.title);
    setAttribute(m.attribute ?? 'DEX');
    setShowModal(true);
  }

  function save() {
    if (!title.trim()) return;
    if (editing) {
      setMissions(prev => prev.map(m => m.id === editing.id ? { ...m, title, attribute } : m));
    } else if (repeatDaily) {
      const templateId = generateId();
      setTemplates(prev => [...prev, { id: templateId, title, attribute, active: true, createdAt: today }]);
      setMissions(prev => [...prev, { id: generateId(), title, attribute, date: today, status: 'pending', createdAt: today, templateId }]);
    } else {
      setMissions(prev => [...prev, { id: generateId(), title, attribute, date: today, status: 'pending', createdAt: today }]);
    }
    setShowModal(false);
  }

  // Bulk-creates today's instances for every active template not yet added —
  // one tap instead of re-typing the same missions every day.
  function addPendingToday() {
    setMissions(prev => [...prev, ...instantiateTemplates(pending, today)]);
  }

  function toggleTemplateActive(id: string) {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  }

  function removeTemplate(id: string) {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }

  // gainXP/gainAttribute outside the updater: StrictMode re-runs updaters, doubling side effects.
  // Un-marking reverts everything the marking awarded (XP, gold, attribute, and
  // the all-done bonus if the day was complete) so stats can't be farmed.
  function toggle(id: string, e?: React.MouseEvent) {
    const mission = missions.find(m => m.id === id);
    if (!mission) return;
    const nowDone = mission.status !== 'done';
    const todayBefore = missions.filter(m => m.date === today);
    const wasAllDone = todayBefore.length > 0 && todayBefore.every(m => m.status === 'done');
    const updated = missions.map(m => m.id === id
      ? { ...m, status: nowDone ? 'done' as const : 'pending' as const }
      : m);
    setMissions(updated);
    if (nowDone) {
      gainXP(XP_REWARDS.mission);
      gainAttribute(mission.attribute ?? 'DEX', XP_REWARDS.mission);
      fx.rewardAt(e ?? null, XP_REWARDS.mission);
      checkAchievements();
      const todayUpdated = updated.filter(m => m.date === today);
      if (todayUpdated.length > 0 && todayUpdated.every(m => m.status === 'done')) {
        gainXP(XP_REWARDS.allMissionsBonus);
        fx.emit({
          kind: 'banner',
          title: 'Misiones diarias completadas',
          subtitle: `+${XP_REWARDS.allMissionsBonus} XP de bonus por limpiar el día`,
        });
      }
    } else {
      loseXP(XP_REWARDS.mission);
      loseAttribute(mission.attribute ?? 'DEX', XP_REWARDS.mission);
      if (wasAllDone) loseXP(XP_REWARDS.allMissionsBonus);
    }
  }

  function remove(id: string) {
    const mission = missions.find(m => m.id === id);
    setMissions(prev => prev.filter(m => m.id !== id));
    // Deleting a completed mission takes its reward with it
    if (mission?.status === 'done') {
      loseXP(XP_REWARDS.mission);
      loseAttribute(mission.attribute ?? 'DEX', XP_REWARDS.mission);
    }
  }

  const pct = todayMissions.length > 0 ? (doneMissions.length / todayMissions.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Misiones Diarias"
        subtitle="Completa todas las misiones para obtener bonus de XP"
        action={<Button variant="primary" size="sm" onClick={openNew}><Plus size={14} className="mr-1 inline" />Nueva misión</Button>}
      />

      {pending.length > 0 && (
        <div className="card-ornate rounded-xl p-4 flex items-center gap-3">
          <Repeat size={18} className="text-arcane-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">
              {pending.length} misión{pending.length !== 1 ? 'es' : ''} recurrente{pending.length !== 1 ? 's' : ''} lista{pending.length !== 1 ? 's' : ''} para hoy
            </p>
            <p className="text-xs text-gray-500">Se agregan tal cual las dejaste configuradas</p>
          </div>
          <Button variant="primary" size="sm" onClick={addPendingToday}>Agregar</Button>
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-300">Hoy: <span className="text-white font-semibold">{doneMissions.length}/{todayMissions.length}</span></p>
          {doneMissions.length === todayMissions.length && todayMissions.length > 0 && (
            <Badge color="gold"><Zap size={10} className="inline mr-1" />+{XP_REWARDS.allMissionsBonus} XP bonus!</Badge>
          )}
        </div>
        <ProgressBar value={pct} color="purple" />
      </Card>

      {todayMissions.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-gray-500 text-sm">No hay misiones para hoy.</p>
        </Card>
      )}

      <div className="space-y-2">
        {todayMissions.map(m => (
          <div
            key={m.id}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all
              ${m.status === 'done'
                ? 'bg-arcane-900/20 border-arcane-700/30 shadow-[inset_2px_0_0_rgba(139,92,246,0.5)]'
                : 'bg-gradient-to-b from-[#0C1424] to-[#080D19] border-[#1B2A47] hover:border-gold-400/30'}`}
          >
            <button
              onClick={e => toggle(m.id, e)}
              className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all active:scale-90
                ${m.status === 'done' ? 'bg-arcane-600 border-arcane-400 shadow-[0_0_8px_rgba(139,92,246,0.4)]' : 'border-gray-600 hover:border-gold-400'}`}
            >
              {m.status === 'done' && <Check size={14} className="text-white" />}
            </button>

            <div className="flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-md bg-gold-900/40 border border-gold-700/40">
              <Zap size={11} className="text-gold-300" />
              <span className="text-xs text-gold-200 font-semibold">+{XP_REWARDS.mission}</span>
            </div>

            <div className="flex-1 min-w-0 flex items-center gap-1.5">
              {m.templateId && <Repeat size={11} className="text-arcane-400 shrink-0" />}
              <p className={`text-sm font-medium truncate ${m.status === 'done' ? 'text-purple-300 line-through opacity-70' : 'text-gray-200'}`}>
                {m.title}
              </p>
            </div>

            <AttributeBadge attr={m.attribute ?? 'DEX'} />

            <div className="flex items-center gap-1">
              <button onClick={() => openEdit(m)} className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors">
                <Edit2 size={14} />
              </button>
              <button onClick={() => remove(m.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length > 0 && (
        <div>
          <p className="text-sm font-medium text-white mb-3">Misiones recurrentes</p>
          <div className="space-y-1.5">
            {templates.map(t => (
              <div key={t.id} className="flex items-center gap-3 bg-gradient-to-b from-[#0C1424] to-[#080D19] border border-[#1B2A47] rounded-xl px-4 py-2.5">
                <button
                  onClick={() => toggleTemplateActive(t.id)}
                  title={t.active ? 'Desactivar' : 'Activar'}
                  className={t.active ? 'text-arcane-300' : 'text-gray-700'}
                >
                  {t.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                </button>
                <AttributeBadge attr={t.attribute ?? 'DEX'} />
                <p className={`flex-1 text-sm truncate ${t.active ? 'text-gray-200' : 'text-gray-600 line-through'}`}>{t.title}</p>
                <button onClick={() => removeTemplate(t.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar misión' : 'Nueva misión'}>
        <div className="space-y-4">
          <Input
            label="Título de la misión"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej: Completar módulo de Apex"
            autoFocus
          />
          <div>
            <p className="block text-xs font-medium text-gray-400 mb-1.5 tracking-wide">Atributo que desarrolla</p>
            <AttributePicker value={attribute} onChange={setAttribute} />
          </div>
          {!editing && (
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={repeatDaily}
                onChange={e => setRepeatDaily(e.target.checked)}
                className="accent-[#4DA6FF]"
              />
              <Repeat size={12} className="text-arcane-300" />
              Repetir cada día (se agrega sola hasta que la desactives)
            </label>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={save}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
