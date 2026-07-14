import { createContext, useContext } from 'react';
import type { SessionMode } from '../lib/pomodoroModes';
import type { PomodoroModeId, PomodoroPrefs } from '../types';

export interface PomodoroTimerValue {
  mode: SessionMode;
  modeId: PomodoroModeId;
  isBreak: boolean;
  running: boolean;
  seconds: number;
  completedToday: number;
  prefs: PomodoroPrefs;
  notifPermission: NotificationPermission | 'unsupported';
  notificationsAvailable: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  selectMode: (id: PomodoroModeId) => void;
  toggleSound: () => void;
  toggleNotifications: () => Promise<void>;
}

// Split from usePomodoroTimer.tsx: react-refresh only allows a file to
// export components when it's fast-refresh-friendly — a file exporting both
// the Provider component and this hook trips that rule (same reason nav.tsx
// was split out of Sidebar.tsx earlier in this project).
export const PomodoroTimerContext = createContext<PomodoroTimerValue | null>(null);

export function usePomodoroTimer(): PomodoroTimerValue {
  const ctx = useContext(PomodoroTimerContext);
  if (!ctx) throw new Error('usePomodoroTimer must be used within a PomodoroTimerProvider');
  return ctx;
}
