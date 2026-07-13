import { Circle, Target, Flame, Sparkles, Skull, Castle, type LucideIcon } from 'lucide-react';
import { XP_REWARDS } from './xp';
import type { MissionDifficulty } from '../types';

export interface MissionDifficultyInfo {
  id: MissionDifficulty;
  label: string;
  xpMultiplier: number;
  icon: LucideIcon;
  color: string;
  description: string;
}

// Colors reuse hexes already dataviz-validated elsewhere in the app
// (ATTRIBUTE_COLORS / hunterRank), shown one at a time on a mission row —
// never as a simultaneous side-by-side legend — so no fresh validation pass
// is needed (same reasoning already applied to RANKS/HUNTER_RANKS).
export const MISSION_DIFFICULTIES: MissionDifficultyInfo[] = [
  { id: 'facil', label: 'Fácil', xpMultiplier: 0.6, icon: Circle, color: '#7E92B4', description: 'Tarea rápida, poco esfuerzo' },
  { id: 'normal', label: 'Normal', xpMultiplier: 1, icon: Target, color: '#4DA6FF', description: 'Una misión estándar del día a día' },
  { id: 'dificil', label: 'Difícil', xpMultiplier: 1.6, icon: Flame, color: '#D97706', description: 'Exige más esfuerzo o concentración' },
  { id: 'epica', label: 'Épica', xpMultiplier: 2.5, icon: Sparkles, color: '#8B5CF6', description: 'Un reto grande, con recompensa a la altura' },
  { id: 'boss', label: 'Jefe', xpMultiplier: 4, icon: Skull, color: '#EF4444', description: 'Un desafío mayor — la tarea que sueles evitar' },
  { id: 'mazmorra', label: 'Mazmorra', xpMultiplier: 6, icon: Castle, color: '#DC2626', description: 'Proyecto largo y exigente, de varios días' },
];

const DEFAULT_DIFFICULTY: MissionDifficulty = 'normal';

export function getMissionDifficulty(id?: MissionDifficulty): MissionDifficultyInfo {
  return MISSION_DIFFICULTIES.find(d => d.id === id) ?? MISSION_DIFFICULTIES.find(d => d.id === DEFAULT_DIFFICULTY)!;
}

/** XP granted for completing a mission at this difficulty — also used as
 *  the attribute-XP amount (same established pattern as every other reward
 *  in the app: attribute XP mirrors the action's XP_REWARDS value). */
export function missionXPReward(difficulty?: MissionDifficulty): number {
  return Math.max(1, Math.round(XP_REWARDS.mission * getMissionDifficulty(difficulty).xpMultiplier));
}

/** true for the top two tiers — used to apply boss/dungeon visual framing */
export function isBossTier(difficulty?: MissionDifficulty): boolean {
  return difficulty === 'boss' || difficulty === 'mazmorra';
}

export const ESTIMATED_DAYS_PRESETS: { days: number; label: string }[] = [
  { days: 1, label: '1 día' },
  { days: 2, label: '2 días' },
  { days: 3, label: '3 días' },
  { days: 7, label: '1 semana' },
  { days: 14, label: '2 semanas' },
  { days: 30, label: '1 mes' },
];

export function formatEstimatedDays(days?: number): string | null {
  if (!days) return null;
  const preset = ESTIMATED_DAYS_PRESETS.find(p => p.days === days);
  if (preset) return preset.label;
  if (days === 1) return '1 día';
  return `${days} días`;
}
