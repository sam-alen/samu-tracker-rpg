import { XP_REWARDS } from './xp';
import type { PomodoroModeId } from '../types';

export interface SessionMode {
  id: PomodoroModeId;
  label: string;
  sublabel: string;
  workSeconds: number;
  breakSeconds: number;
  breakLabel: string;
  xp: number;
  color: string;
  ringColor: string;
}

export const MODES: SessionMode[] = [
  {
    id: '25',
    label: '25 min',
    sublabel: 'Pomodoro clásico',
    workSeconds: 25 * 60,
    breakSeconds: 5 * 60,
    breakLabel: '5 min',
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
    breakLabel: '10 min',
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
    breakLabel: '20 min',
    xp: XP_REWARDS.pomodoro120,
    color: 'border-orange-600/50 bg-orange-950/30 text-orange-300 shadow-[0_0_10px_rgba(232,133,61,0.15)]',
    ringColor: '#E8853D',
  },
];

export function getMode(id: PomodoroModeId): SessionMode {
  return MODES.find(m => m.id === id) ?? MODES[0];
}
