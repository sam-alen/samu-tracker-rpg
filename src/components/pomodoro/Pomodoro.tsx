import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Plus, Trash2, ExternalLink, Timer, Coffee, Volume2, VolumeX, Bell, BellOff } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input, Select } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useXP } from '../../hooks/useXP';
import { storage } from '../../lib/storage';
import { XP_REWARDS, todayISO } from '../../lib/xp';
import { fx } from '../../lib/fx';
import { checkAchievements } from '../../lib/achievements';
import { initialFocusLinks } from '../../data/initial';
import {
  playCompletionSound, showCompletionNotification, notificationsSupported,
  notificationPermission, requestNotificationPermission,
} from '../../lib/pomodoroAlert';
import type { FocusLink, FocusLinkCategory, PomodoroState, PomodoroPrefs } from '../../types';

function genId() { return Math.random().toString(36).slice(2, 10); }

interface SessionMode {
  id: '25' | '50' | '120';
  label: string;
  sublabel: string;
  workSeconds: number;
  breakSeconds: number;
  xp: number;
  color: string;
  ringColor: string;
}

const MODES: SessionMode[] = [
  {
    id: '25',
    label: '25 min',
    sublabel: 'Pomodoro clásico',
    workSeconds: 25 * 60,
    breakSeconds: 5 * 60,
    xp: XP_REWARDS.pomodoro25,
    color: 'border-arcane-600/50 bg-arcane-900/25 text-arcane-300 shadow-[0_0_10px_rgba(139,92,246,0.15)]',
    ringColor: '#8B5CF6',
  },
  {
    id: '50',
    label: '50 min',
    sublabel: 'Trabajo profundo',
    workSeconds: 50 * 60,
    breakSeconds: 10 * 60,
    xp: XP_REWARDS.pomodoro50,
    color: 'border-gold-600/50 bg-gold-900/40 text-gold-200 shadow-[0_0_10px_rgba(77,166,255,0.15)]',
    ringColor: '#4DA6FF',
  },
  {
    id: '120',
    label: '2 horas',
    sublabel: 'Modo flow',
    workSeconds: 120 * 60,
    breakSeconds: 20 * 60,
    xp: XP_REWARDS.pomodoro120,
    color: 'border-orange-600/50 bg-orange-950/30 text-orange-300 shadow-[0_0_10px_rgba(232,133,61,0.15)]',
    ringColor: '#E8853D',
  },
];

const CAT_LABELS: Record<FocusLinkCategory, string> = {
  focus: 'Focus', gym: 'Gym', worship: 'Worship', ambient: 'Ambient', anime: 'Anime', dev: 'Dev',
};
const CAT_COLORS: Record<FocusLinkCategory, 'blue' | 'green' | 'purple' | 'gray' | 'gold'> = {
  focus: 'blue', gym: 'green', worship: 'purple', ambient: 'gray', anime: 'gold', dev: 'blue',
};

export function Pomodoro() {
  const [pomState, setPomState] = useLocalStorage<PomodoroState>(storage.keys.pomodoro, { completedToday: 0, lastDate: '' });
  const [links, setLinks] = useLocalStorage<FocusLink[]>(storage.keys.focusLinks, initialFocusLinks);
  const [prefs, setPrefs] = useLocalStorage<PomodoroPrefs>(storage.keys.pomodoroPrefs, { sound: true, notifications: false });
  const [notifPermission, setNotifPermission] = useState(notificationPermission());
  const { gainXP } = useXP();
  const today = todayISO();

  const completedToday = pomState.lastDate === today ? pomState.completedToday : 0;

  const [modeId, setModeId] = useState<SessionMode['id']>('25');
  const [isBreak, setIsBreak] = useState(false);
  const [running, setRunning] = useState(false);

  const mode = MODES.find(m => m.id === modeId)!;
  const [seconds, setSeconds] = useState(mode.workSeconds);

  // When mode changes (and not running), reset the timer
  const prevModeRef = useRef(modeId);
  useEffect(() => {
    if (prevModeRef.current !== modeId) {
      prevModeRef.current = modeId;
      setIsBreak(false);
      setSeconds(mode.workSeconds);
      setRunning(false);
    }
  }, [modeId, mode.workSeconds]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Mirrors `seconds` for the interval tick to read/decrement without a
  // stale closure — the tick callback is the only writer during a run.
  const secondsRef = useRef(seconds);
  useEffect(() => { secondsRef.current = seconds; }, [seconds]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
  }, []);

  const handleComplete = useCallback(() => {
    stop();
    if (prefs.sound) playCompletionSound();
    if (!isBreak) {
      gainXP(mode.xp);
      setPomState({ completedToday: completedToday + 1, lastDate: today, totalCompleted: (pomState.totalCompleted ?? 0) + 1 });
      setIsBreak(true);
      setSeconds(mode.breakSeconds);
      fx.rewardAt(null, mode.xp);
      fx.emit({
        kind: 'banner',
        title: 'Sesión de enfoque completada',
        subtitle: `${mode.label} de trabajo profundo · ahora toca descansar`,
      });
      if (prefs.notifications) {
        showCompletionNotification('Sesión de enfoque completada', `${mode.label} de trabajo profundo · +${mode.xp} XP · ahora toca descansar`);
      }
      checkAchievements();
    } else {
      setIsBreak(false);
      setSeconds(mode.workSeconds);
      if (prefs.notifications) {
        showCompletionNotification('Descanso terminado', 'Hora de volver al enfoque');
      }
    }
  }, [isBreak, mode, completedToday, today, gainXP, setPomState, stop, pomState.totalCompleted, prefs.sound, prefs.notifications]);

  // handleComplete fires from the timer's own tick callback — a genuine
  // external-system callback, not a setState updater (StrictMode-safe,
  // no double XP) and not an effect body reacting to state (lint-safe).
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      const next = secondsRef.current - 1;
      if (next <= 0) {
        secondsRef.current = 0;
        setSeconds(0);
        handleComplete();
      } else {
        secondsRef.current = next;
        setSeconds(next);
      }
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, handleComplete]);

  function reset() {
    stop();
    setIsBreak(false);
    setSeconds(mode.workSeconds);
  }

  function selectMode(id: SessionMode['id']) {
    if (running) return; // block mode change while running
    setModeId(id);
  }

  function toggleSound() {
    setPrefs(p => ({ ...p, sound: !p.sound }));
  }

  // Turning notifications ON requests browser permission — must happen from
  // this click's own call stack (a real user gesture), never on page load.
  // If the user denies it, the toggle stays off (nothing to fire silently).
  async function toggleNotifications() {
    if (prefs.notifications) {
      setPrefs(p => ({ ...p, notifications: false }));
      return;
    }
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === 'granted') setPrefs(p => ({ ...p, notifications: true }));
  }

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

  const breakLabel = mode.id === '25' ? '5 min' : mode.id === '50' ? '10 min' : '20 min';

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
            disabled={!notificationsSupported() || notifPermission === 'denied'}
            title={
              !notificationsSupported() ? 'Tu navegador no soporta notificaciones'
              : notifPermission === 'denied' ? 'Bloqueaste las notificaciones para este sitio — habilítalas desde los ajustes del navegador'
              : prefs.notifications ? 'Notificaciones activadas — clic para desactivar'
              : 'Clic para pedir permiso y activar notificaciones'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all
              ${prefs.notifications ? 'border-arcane-600/50 bg-arcane-900/30 text-arcane-200' : 'border-[#1B2A47] text-gray-500 hover:text-gray-300'}
              ${(!notificationsSupported() || notifPermission === 'denied') ? 'opacity-40 cursor-not-allowed' : ''}`}
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

      {/* Timer */}
      <Card>
        <div className="flex flex-col items-center py-6 gap-6">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            {isBreak
              ? <Badge color="green"><Coffee size={11} className="inline mr-1" />Descanso · {breakLabel}</Badge>
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
              onClick={() => setRunning(r => !r)}
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
                <span>Descanso: {m.id === '25' ? '5min' : m.id === '50' ? '10min' : '20min'}</span>
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
