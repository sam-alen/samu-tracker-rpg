import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Check, Zap, Repeat, ToggleLeft, ToggleRight, Clock, CalendarClock } from 'lucide-react';
import { Card, SectionHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { AttributeBadgeList, AttributePicker } from '../ui/AttributeBadge';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useXP } from '../../hooks/useXP';
import { useAttributes } from '../../hooks/useAttributes';
import { storage } from '../../lib/storage';
import { todayISO } from '../../lib/xp';
import { XP_REWARDS } from '../../lib/xp';
import { fx } from '../../lib/fx';
import { checkAchievements } from '../../lib/achievements';
import { pendingTemplatesForToday, instantiateTemplates, dailyMissionsFor, activeSpecialMissions, daysUntil } from '../../lib/missions';
import {
  MISSION_DIFFICULTIES, ESTIMATED_DAYS_PRESETS, getMissionDifficulty, missionXPReward,
  isBossTier, formatEstimatedDays,
} from '../../lib/missionDifficulty';
import { initialMissions } from '../../data/initial';
import { resolveAttributes } from '../../lib/attributes';
import type { Mission, MissionTemplate, MissionDifficulty, RPGAttribute } from '../../types';

function generateId() { return Math.random().toString(36).slice(2, 10); }

interface FormState {
  title: string;
  attributes: RPGAttribute[];
  difficulty: MissionDifficulty;
  estimatedDays?: number;
  repeatDaily: boolean;
  special: boolean;
  deadline: string;
}

function emptyForm(): FormState {
  return { title: '', attributes: ['DEX'], difficulty: 'normal', estimatedDays: undefined, repeatDaily: false, special: false, deadline: '' };
}

function DifficultyPicker({ value, onChange }: { value: MissionDifficulty; onChange: (d: MissionDifficulty) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {MISSION_DIFFICULTIES.map(d => {
        const active = value === d.id;
        const Icon = d.icon;
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => onChange(d.id)}
            title={d.description}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all"
            style={active
              ? { borderColor: d.color, backgroundColor: `${d.color}1F`, color: d.color }
              : { borderColor: 'rgba(148,163,184,0.15)', color: '#7E92B4', backgroundColor: 'transparent' }}
          >
            <Icon size={13} />
            {d.label}
          </button>
        );
      })}
    </div>
  );
}

function DaysPicker({ value, onChange }: { value?: number; onChange: (d: number | undefined) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      <button
        type="button"
        onClick={() => onChange(undefined)}
        className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${!value ? 'border-gold-400 bg-gold-900/20 text-gold-200' : 'border-[#2B4066] text-gray-500'}`}
      >
        Sin estimar
      </button>
      {ESTIMATED_DAYS_PRESETS.map(p => (
        <button
          key={p.days}
          type="button"
          onClick={() => onChange(p.days)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${value === p.days ? 'border-gold-400 bg-gold-900/20 text-gold-200' : 'border-[#2B4066] text-gray-500'}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function Missions() {
  const [missions, setMissions] = useLocalStorage<Mission[]>(storage.keys.missions, initialMissions);
  const [templates, setTemplates] = useLocalStorage<MissionTemplate[]>(storage.keys.missionTemplates, []);
  const { gainXP, loseXP } = useXP();
  const { gainAttributes, loseAttributes } = useAttributes();
  const today = todayISO();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Mission | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const todayMissions = useMemo(() => dailyMissionsFor(missions, today), [missions, today]);
  const doneMissions = todayMissions.filter(m => m.status === 'done');
  const specialMissions = useMemo(() => activeSpecialMissions(missions), [missions]);
  const pending = useMemo(() => pendingTemplatesForToday(templates, missions, today), [templates, missions, today]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setShowModal(true);
  }

  function openEdit(m: Mission) {
    setEditing(m);
    setForm({
      title: m.title,
      attributes: resolveAttributes(m, 'DEX'),
      difficulty: m.difficulty ?? 'normal',
      estimatedDays: m.estimatedDays,
      repeatDaily: false,
      special: !!m.special,
      deadline: m.deadline ?? '',
    });
    setShowModal(true);
  }

  function save() {
    if (!form.title.trim()) return;
    const { title, attributes, difficulty, estimatedDays, special, deadline } = form;
    if (editing) {
      setMissions(prev => prev.map(m => m.id === editing.id
        ? { ...m, title, attributes, attribute: undefined, difficulty, estimatedDays, special, deadline: special && deadline ? deadline : undefined }
        : m));
    } else if (form.repeatDaily) {
      const templateId = generateId();
      setTemplates(prev => [...prev, { id: templateId, title, attributes, difficulty, estimatedDays, active: true, createdAt: today }]);
      setMissions(prev => [...prev, {
        id: generateId(), title, attributes, difficulty, estimatedDays, date: today, status: 'pending', createdAt: today, templateId,
      }]);
    } else {
      setMissions(prev => [...prev, {
        id: generateId(), title, attributes, difficulty, estimatedDays, date: today, status: 'pending', createdAt: today,
        special, deadline: special && deadline ? deadline : undefined,
      }]);
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
  // The reward is stored on the mission at completion time (xpAwarded) and
  // that exact stored amount is what gets reverted — never a recompute from
  // the mission's *current* difficulty — so editing difficulty after
  // completion can never desync the gain/undo symmetry.
  function toggle(id: string, e?: React.MouseEvent) {
    const mission = missions.find(m => m.id === id);
    if (!mission) return;
    const nowDone = mission.status !== 'done';
    const dailyBefore = dailyMissionsFor(missions, today);
    const wasAllDone = dailyBefore.length > 0 && dailyBefore.every(m => m.status === 'done');
    const reward = nowDone ? missionXPReward(mission.difficulty) : (mission.xpAwarded ?? missionXPReward(mission.difficulty));
    const updated = missions.map(m => m.id === id
      ? { ...m, status: nowDone ? 'done' as const : 'pending' as const, xpAwarded: nowDone ? reward : undefined }
      : m);
    setMissions(updated);
    if (nowDone) {
      gainXP(reward);
      gainAttributes(resolveAttributes(mission, 'DEX'), reward);
      fx.rewardAt(e ?? null, reward);
      checkAchievements();
      if (!mission.special) {
        const dailyUpdated = dailyMissionsFor(updated, today);
        if (dailyUpdated.length > 0 && dailyUpdated.every(m => m.status === 'done')) {
          gainXP(XP_REWARDS.allMissionsBonus);
          fx.emit({
            kind: 'banner',
            title: 'Misiones diarias completadas',
            subtitle: `+${XP_REWARDS.allMissionsBonus} XP de bonus por limpiar el día`,
          });
        }
      }
    } else {
      loseXP(reward);
      loseAttributes(resolveAttributes(mission, 'DEX'), reward);
      if (!mission.special && wasAllDone) loseXP(XP_REWARDS.allMissionsBonus);
    }
  }

  function remove(id: string) {
    const mission = missions.find(m => m.id === id);
    setMissions(prev => prev.filter(m => m.id !== id));
    // Deleting a completed mission takes its reward with it
    if (mission?.status === 'done') {
      const reward = mission.xpAwarded ?? missionXPReward(mission.difficulty);
      loseXP(reward);
      loseAttributes(resolveAttributes(mission, 'DEX'), reward);
    }
  }

  const pct = todayMissions.length > 0 ? (doneMissions.length / todayMissions.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Misiones"
        subtitle="Diarias, y especiales para retos que llevan más tiempo"
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
        {todayMissions.map(m => {
          const diff = getMissionDifficulty(m.difficulty);
          const timeLabel = formatEstimatedDays(m.estimatedDays);
          return (
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
                <span className="text-xs text-gold-200 font-semibold">+{missionXPReward(m.difficulty)}</span>
              </div>

              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                {m.templateId && <Repeat size={11} className="text-arcane-400 shrink-0" />}
                <p className={`text-sm font-medium truncate ${m.status === 'done' ? 'text-purple-300 line-through opacity-70' : 'text-gray-200'}`}>
                  {m.title}
                </p>
                {timeLabel && (
                  <span className="text-[10px] text-gray-600 shrink-0 flex items-center gap-0.5"><Clock size={9} />{timeLabel}</span>
                )}
              </div>

              {m.difficulty && m.difficulty !== 'normal' && (
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-1"
                  style={{ color: diff.color, backgroundColor: `${diff.color}1F`, border: `1px solid ${diff.color}66` }}
                >
                  <diff.icon size={10} />{diff.label}
                </span>
              )}

              <AttributeBadgeList attrs={resolveAttributes(m, 'DEX')} />

              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(m)} className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => remove(m.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Special missions: bosses, dungeons, multi-day projects — persist regardless of date */}
      {specialMissions.length > 0 && (
        <div>
          <p className="text-sm font-medium text-white mb-3">Misiones especiales</p>
          <div className="space-y-2">
            {specialMissions.map(m => {
              const diff = getMissionDifficulty(m.difficulty);
              const boss = isBossTier(m.difficulty);
              const timeLabel = formatEstimatedDays(m.estimatedDays);
              const dueDays = m.deadline ? daysUntil(m.deadline, today) : null;
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${m.status === 'done' ? 'opacity-60' : ''}`}
                  style={{
                    background: boss ? 'linear-gradient(180deg, rgba(220,38,38,0.08), #080D19)' : 'linear-gradient(180deg, #0C1424, #080D19)',
                    borderColor: m.status === 'done' ? '#1B2A47' : `${diff.color}55`,
                    boxShadow: boss && m.status !== 'done' ? `0 0 14px ${diff.color}33` : undefined,
                  }}
                >
                  <button
                    onClick={e => toggle(m.id, e)}
                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all active:scale-90
                      ${m.status === 'done' ? 'bg-arcane-600 border-arcane-400' : 'border-gray-600 hover:border-gold-400'}`}
                  >
                    {m.status === 'done' && <Check size={14} className="text-white" />}
                  </button>

                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ color: diff.color, backgroundColor: `${diff.color}1F`, border: `1px solid ${diff.color}66` }}>
                    <diff.icon size={15} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className={`text-sm font-medium truncate ${m.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-100'}`}>{m.title}</p>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0" style={{ color: diff.color, backgroundColor: `${diff.color}1F` }}>
                        {diff.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 mt-0.5 text-[10px] text-gray-600">
                      {timeLabel && <span className="flex items-center gap-0.5"><Clock size={9} />{timeLabel}</span>}
                      {dueDays !== null && m.status !== 'done' && (
                        <span className={`flex items-center gap-0.5 ${dueDays < 0 ? 'text-red-400' : dueDays <= 2 ? 'text-amber-400' : ''}`}>
                          <CalendarClock size={9} />
                          {dueDays < 0 ? `Vencida hace ${Math.abs(dueDays)}d` : dueDays === 0 ? 'Vence hoy' : `Vence en ${dueDays}d`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-md bg-gold-900/40 border border-gold-700/40">
                    <Zap size={11} className="text-gold-300" />
                    <span className="text-xs text-gold-200 font-semibold">+{missionXPReward(m.difficulty)}</span>
                  </div>

                  <AttributeBadgeList attrs={resolveAttributes(m, 'DEX')} />

                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(m)} className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => remove(m.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                <AttributeBadgeList attrs={resolveAttributes(t, 'DEX')} />
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
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="Ej: Completar módulo de Apex"
            autoFocus
          />
          <div>
            <p className="block text-xs font-medium text-gray-400 mb-1.5 tracking-wide">Atributos que desarrolla</p>
            <AttributePicker value={form.attributes} onChange={attrs => setForm(p => ({ ...p, attributes: attrs }))} />
          </div>
          <div>
            <p className="block text-xs font-medium text-gray-400 mb-1.5 tracking-wide">
              Dificultad — {missionXPReward(form.difficulty)} XP
            </p>
            <DifficultyPicker value={form.difficulty} onChange={d => setForm(p => ({ ...p, difficulty: d }))} />
          </div>
          <div>
            <p className="block text-xs font-medium text-gray-400 mb-1.5 tracking-wide">Duración estimada</p>
            <DaysPicker value={form.estimatedDays} onChange={m => setForm(p => ({ ...p, estimatedDays: m }))} />
          </div>

          {!editing && (
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.repeatDaily}
                onChange={e => setForm(p => ({ ...p, repeatDaily: e.target.checked, special: e.target.checked ? false : p.special }))}
                className="accent-[#4DA6FF]"
              />
              <Repeat size={12} className="text-arcane-300" />
              Repetir cada día (se agrega sola hasta que la desactives)
            </label>
          )}

          {!form.repeatDaily && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.special}
                  onChange={e => setForm(p => ({ ...p, special: e.target.checked }))}
                  className="accent-[#4DA6FF]"
                />
                <CalendarClock size={12} className="text-arcane-300" />
                Misión especial (no se reinicia hoy — queda activa hasta que la completes)
              </label>
              {form.special && (
                <Input
                  label="Fecha límite (opcional)"
                  type="date"
                  value={form.deadline}
                  onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                />
              )}
            </div>
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
