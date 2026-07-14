import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useXP } from './useXP';
import { useAttributes } from './useAttributes';
import { storage } from '../lib/storage';
import { todayISO } from '../lib/xp';
import { fx } from '../lib/fx';
import { checkAchievements } from '../lib/achievements';
import { checkObjectiveMissions } from '../lib/objectiveMissions';
import { getMode } from '../lib/pomodoroModes';
import {
  playCompletionSound, showCompletionNotification, notificationsSupported,
  notificationPermission as getNotifPermission, requestNotificationPermission,
} from '../lib/pomodoroAlert';
import { PomodoroTimerContext, type PomodoroTimerValue } from './pomodoroTimerContext';
import type { Mission, PomodoroModeId, PomodoroPrefs, PomodoroSession, PomodoroState } from '../types';

function computeSecondsLeft(session: PomodoroSession): number {
  if (!session.running || session.endsAt == null) return session.remainingSeconds;
  return Math.max(0, Math.ceil((session.endsAt - Date.now()) / 1000));
}

/** Owns the Pomodoro countdown as a single source of truth, mounted once at
 *  the app root (see App.tsx) instead of inside the Pomodoro screen — so
 *  navigating to another section (or an accidental page reload) no longer
 *  resets a running session. The countdown is derived from an absolute
 *  `endsAt` timestamp rather than a per-tick decrement, so it can't drift
 *  even if the tab is backgrounded and the browser throttles its timers. */
export function PomodoroTimerProvider({ children }: { children: ReactNode }) {
  const { gainXP } = useXP();
  const { gainAttributes } = useAttributes();
  const [pomState, setPomState] = useLocalStorage<PomodoroState>(storage.keys.pomodoro, { completedToday: 0, lastDate: '' });
  const [prefs, setPrefs] = useLocalStorage<PomodoroPrefs>(storage.keys.pomodoroPrefs, { sound: true, notifications: false });
  const [missions, setMissions] = useLocalStorage<Mission[]>(storage.keys.missions, []);
  const [notifPermission, setNotifPermission] = useState(getNotifPermission());

  const [session, setSessionState] = useState<PomodoroSession>(() => storage.getPomodoroSession());
  // Persisted only on meaningful transitions (start/pause/reset/mode/phase
  // change) — never once a second, the live countdown is derived state, not
  // stored every tick.
  const setSession = useCallback((updater: PomodoroSession | ((p: PomodoroSession) => PomodoroSession)) => {
    setSessionState(prev => {
      const next = typeof updater === 'function' ? (updater as (p: PomodoroSession) => PomodoroSession)(prev) : updater;
      storage.setPomodoroSession(next);
      return next;
    });
  }, []);

  const mode = getMode(session.modeId);
  const today = todayISO();
  const completedToday = pomState.lastDate === today ? pomState.completedToday : 0;

  // Only ticks while running — while paused/idle, `seconds` below reads
  // `session.remainingSeconds` directly (a plain render-time derivation,
  // no effect needed for that case).
  const [liveSeconds, setLiveSeconds] = useState<number>(() => computeSecondsLeft(session));
  const seconds = session.running ? liveSeconds : session.remainingSeconds;

  const handleComplete = useCallback(() => {
    if (prefs.sound) playCompletionSound();
    if (!session.isBreak) {
      gainXP(mode.xp);
      setPomState(prev => ({
        completedToday: (prev.lastDate === today ? prev.completedToday : 0) + 1,
        lastDate: today,
        totalCompleted: (prev.totalCompleted ?? 0) + 1,
        completedDates: [...(prev.completedDates ?? []), today],
      }));
      setSession(prev => ({ ...prev, isBreak: true, running: false, endsAt: null, remainingSeconds: mode.breakSeconds }));
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
      checkObjectiveMissions(missions, setMissions, gainXP, gainAttributes);
    } else {
      setSession(prev => ({ ...prev, isBreak: false, running: false, endsAt: null, remainingSeconds: mode.workSeconds }));
      if (prefs.notifications) {
        showCompletionNotification('Descanso terminado', 'Hora de volver al enfoque');
      }
    }
  }, [session.isBreak, mode, today, gainXP, gainAttributes, setPomState, setSession, prefs.sound, prefs.notifications, missions, setMissions]);

  // Interval is torn down and recreated whenever running/endsAt change
  // (start, pause, phase transition) — cheap since it ticks at most once a
  // second, and guarantees the countdown always re-derives from the real
  // clock instead of accumulating drift. The interval's own tick clears
  // itself the instant it detects completion (not relying solely on the
  // effect's cleanup, which React may run a beat late) so a finished
  // session can never fire its reward twice.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!session.running) return; // nothing to tick — `seconds` already reflects remainingSeconds directly
    const tick = () => {
      const left = computeSecondsLeft(session);
      if (left <= 0) {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        setLiveSeconds(0);
        handleComplete();
        return;
      }
      setLiveSeconds(left);
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [session, handleComplete]);

  const start = useCallback(() => {
    setSession(prev => {
      const secondsNow = computeSecondsLeft(prev);
      return { ...prev, running: true, endsAt: Date.now() + secondsNow * 1000, remainingSeconds: secondsNow };
    });
  }, [setSession]);

  const pause = useCallback(() => {
    setSession(prev => ({ ...prev, running: false, endsAt: null, remainingSeconds: computeSecondsLeft(prev) }));
  }, [setSession]);

  const reset = useCallback(() => {
    setSession(prev => ({ ...prev, running: false, isBreak: false, endsAt: null, remainingSeconds: getMode(prev.modeId).workSeconds }));
  }, [setSession]);

  const selectMode = useCallback((id: PomodoroModeId) => {
    setSession(prev => {
      if (prev.running) return prev; // blocked while running, same as before
      return { ...prev, modeId: id, isBreak: false, endsAt: null, remainingSeconds: getMode(id).workSeconds };
    });
  }, [setSession]);

  const toggleSound = useCallback(() => {
    setPrefs(p => ({ ...p, sound: !p.sound }));
  }, [setPrefs]);

  // Turning notifications ON requests browser permission — must happen from
  // this click's own call stack (a real user gesture), never automatically.
  // If the user denies it, the toggle stays off (nothing to fire silently).
  const toggleNotifications = useCallback(async () => {
    if (prefs.notifications) {
      setPrefs(p => ({ ...p, notifications: false }));
      return;
    }
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === 'granted') setPrefs(p => ({ ...p, notifications: true }));
  }, [prefs.notifications, setPrefs]);

  const value: PomodoroTimerValue = {
    mode, modeId: session.modeId, isBreak: session.isBreak, running: session.running, seconds, completedToday,
    prefs, notifPermission, notificationsAvailable: notificationsSupported(),
    start, pause, reset, selectMode, toggleSound, toggleNotifications,
  };

  return <PomodoroTimerContext.Provider value={value}>{children}</PomodoroTimerContext.Provider>;
}
