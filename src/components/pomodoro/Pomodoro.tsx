import { useState } from 'react';
import { Play, Pause, RotateCcw, Plus, Trash2, ExternalLink, Timer, Coffee, Volume2, VolumeX, Bell, BellOff } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input, Select } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { usePomodoroTimer } from '../../hooks/pomodoroTimerContext';
import { MODES } from '../../lib/pomodoroModes';
import { storage } from '../../lib/storage';
import { initialFocusLinks } from '../../data/initial';
import type { FocusLink, FocusLinkCategory } from '../../types';

function genId() { return Math.random().toString(36).slice(2, 10); }

const CAT_LABELS: Record<FocusLinkCategory, string> = {
  focus: 'Focus', gym: 'Gym', worship: 'Worship', ambient: 'Ambient', anime: 'Anime', dev: 'Dev',
};
const CAT_COLORS: Record<FocusLinkCategory, 'blue' | 'green' | 'purple' | 'gray' | 'gold'> = {
  focus: 'blue', gym: 'green', worship: 'purple', ambient: 'gray', anime: 'gold', dev: 'blue',
};

export function Pomodoro() {
  const [links, setLinks] = useLocalStorage<FocusLink[]>(storage.keys.focusLinks, initialFocusLinks);
  const {
    mode, modeId, isBreak, running, seconds, completedToday, prefs, notifPermission, notificationsAvailable,
    habits, linkedHabitId, setLinkedHabit,
    start, pause, reset, selectMode, toggleSound, toggleNotifications,
  } = usePomodoroTimer();
  const linkedHabit = habits.find(h => h.id === linkedHabitId);

  const total = isBreak ? mode.breakSeconds : mode.workSeconds;
  const pct = ((total - seconds) / total) * 100;
  const circum = 2 * Math.PI * 54;
  const offset = circum * (1 - pct / 100);

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  const timeDisplay = hrs > 0 ? `${hrs}:${mins}:${secs}` : `${mins}:${secs}`;

  // Focus links modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkForm, setLinkForm] = useState({ name: '', url: '', category: 'focus' as FocusLinkCategory });

  function saveLink() {
    if (!linkForm.name.trim() || !linkForm.url.trim()) return;
    setLinks(prev => [...prev, { ...linkForm, id: genId() }]);
    setShowLinkModal(false);
    setLinkForm({ name: '', url: '', category: 'focus' });
  }

  function removeLink(id: string) { setLinks(prev => prev.filter(l => l.id !== id)); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-gray-500">Elige tu modo de enfoque y trabaja sin distracciones</p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleSound}
            title={prefs.sound ? 'Sonido activado — clic para silenciar' : 'Sonido silenciado — clic para activar'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all
              ${prefs.sound ? 'border-gold-600/50 bg-gold-900/30 text-gold-200' : 'border-[#1B2A47] text-gray-500 hover:text-gray-300'}`}
          >
            {prefs.sound ? <Volume2 size={13} /> : <VolumeX size={13} />}
            Sonido
          </button>
          <button
            onClick={toggleNotifications}
            disabled={!notificationsAvailable || notifPermission === 'denied'}
            title={
              !notificationsAvailable ? 'Tu navegador no soporta notificaciones'
              : notifPermission === 'denied' ? 'Bloqueaste las notificaciones para este sitio — habilítalas desde los ajustes del navegador'
              : prefs.notifications ? 'Notificaciones activadas — clic para desactivar'
              : 'Clic para pedir permiso y activar notificaciones'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all
              ${prefs.notifications ? 'border-arcane-600/50 bg-arcane-900/30 text-arcane-200' : 'border-[#1B2A47] text-gray-500 hover:text-gray-300'}
              ${(!notificationsAvailable || notifPermission === 'denied') ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {prefs.notifications ? <Bell size={13} /> : <BellOff size={13} />}
            Notificaciones
          </button>
        </div>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-3 gap-3">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => selectMode(m.id)}
            disabled={running}
            className={`rounded-xl border p-3 text-left transition-all duration-150
              ${modeId === m.id
                ? m.color
                : 'border-[#1B2A47] bg-gradient-to-b from-[#0C1424] to-[#080D19] text-gray-500 hover:border-gold-400/30 hover:text-gray-300'
              }
              ${running && modeId !== m.id ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <p className="text-sm font-bold">{m.label}</p>
            <p className="text-xs opacity-70 mt-0.5">{m.sublabel}</p>
            <p className="text-xs mt-2 opacity-60">+{m.xp} XP</p>
          </button>
        ))}
      </div>

      {/* Linked habit — purely a time log, never completes the habit itself */}
      <Card>
        {habits.length > 0 ? (
          <>
            <Select
              label="¿En qué hábito estás trabajando? (opcional)"
              value={linkedHabitId ?? ''}
              onChange={e => setLinkedHabit(e.target.value || null)}
              options={[{ value: '', label: 'Sin vincular' }, ...habits.map(h => ({ value: h.id, label: `${h.icon} ${h.name}` }))]}
            />
            <p className="text-[10px] text-gray-600 mt-1.5">
              Solo registra el tiempo de la sesión en ese hábito — no lo completa. Tienes que marcarlo tú.
            </p>
          </>
        ) : (
          <p className="text-xs text-gray-500">Crea hábitos en la sección Hábitos para poder vincular el tiempo de tus sesiones a uno.</p>
        )}
      </Card>

      {/* Timer */}
      <Card>
        <div className="flex flex-col items-center py-6 gap-6">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            {isBreak
              ? <Badge color="green"><Coffee size={11} className="inline mr-1" />Descanso · {mode.breakLabel}</Badge>
              : <Badge color={mode.id === '25' ? 'purple' : mode.id === '50' ? 'gold' : 'red'}>
                  🎯 {mode.sublabel}
                </Badge>
            }
          </div>

          {/* Ring */}
          <div className="relative w-44 h-44">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#1B2A47" strokeWidth="6" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke={isBreak ? '#34C08B' : mode.ringColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circum}
                strokeDashoffset={offset}
                className="transition-all duration-1000"
                style={{ filter: `drop-shadow(0 0 6px ${isBreak ? '#34C08B' : mode.ringColor}80)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <span className="text-4xl font-bold text-white font-mono tracking-tight drop-shadow-[0_0_12px_rgba(77,166,255,0.25)]">{timeDisplay}</span>
              <span className="text-xs text-gray-500">{isBreak ? 'descansando' : mode.label}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="md" onClick={reset} title="Reiniciar">
              <RotateCcw size={16} />
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={running ? pause : start}
              className="min-w-[110px]"
              style={!running ? { backgroundColor: mode.ringColor, borderColor: mode.ringColor } : {}}
            >
              {running
                ? <><Pause size={16} className="inline mr-1.5" />Pausar</>
                : <><Play size={16} className="inline mr-1.5" />Iniciar</>
              }
            </Button>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap justify-center">
            <span className="flex items-center gap-1.5">
              <Timer size={13} />
              Sesiones hoy: <span className="text-white font-semibold ml-1">{completedToday}</span>
            </span>
            <span className="text-gray-700">·</span>
            <span className="text-xs">
              Ganando <span style={{ color: mode.ringColor }} className="font-semibold">+{mode.xp} XP</span> al completar
            </span>
          </div>

          {linkedHabit && !isBreak && (
            <p className="text-xs text-arcane-300 flex items-center gap-1.5">
              <span>{linkedHabit.icon}</span>
              Registrando tiempo en <span className="font-semibold">{linkedHabit.name}</span>
            </p>
          )}
        </div>
      </Card>

      {/* Mode reference */}
      <Card>
        <p className="text-xs font-medium text-gray-400 mb-3">Referencia de modos</p>
        <div className="space-y-2">
          {MODES.map(m => (
            <div key={m.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.ringColor }} />
                <span className="text-gray-300 font-medium">{m.label}</span>
                <span className="text-gray-600">— {m.sublabel}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-500">
                <span>Descanso: {m.breakLabel}</span>
                <span style={{ color: m.ringColor }}>+{m.xp} XP</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Focus links */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-bold text-gold-200 uppercase tracking-wider">Links de concentración</h2>
          <Button variant="primary" size="sm" onClick={() => setShowLinkModal(true)}>
            <Plus size={14} className="mr-1 inline" />Agregar
          </Button>
        </div>

        <div className="space-y-2">
          {links.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-gray-500 text-sm">Agrega tus playlists favoritas.</p>
            </Card>
          )}
          {links.map(l => (
            <div key={l.id} className="flex items-center gap-3 bg-gradient-to-b from-[#0C1424] to-[#080D19] border border-[#1B2A47] hover:border-gold-400/20 transition-colors rounded-xl p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{l.name}</p>
                <p className="text-xs text-gray-600 truncate">{l.url}</p>
              </div>
              <Badge color={CAT_COLORS[l.category]}>{CAT_LABELS[l.category]}</Badge>
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-500 hover:text-gold-300 transition-colors">
                <ExternalLink size={14} />
              </a>
              <button onClick={() => removeLink(l.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Modal open={showLinkModal} onClose={() => setShowLinkModal(false)} title="Agregar link de concentración">
        <div className="space-y-4">
          <Input label="Nombre" value={linkForm.name} onChange={e => setLinkForm(p => ({ ...p, name: e.target.value }))} placeholder="Lo-Fi Radio" autoFocus />
          <Input label="URL" value={linkForm.url} onChange={e => setLinkForm(p => ({ ...p, url: e.target.value }))} placeholder="https://youtube.com/..." />
          <Select
            label="Categoría"
            value={linkForm.category}
            onChange={e => setLinkForm(p => ({ ...p, category: e.target.value as FocusLinkCategory }))}
            options={Object.entries(CAT_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowLinkModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={saveLink}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
