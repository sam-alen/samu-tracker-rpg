import type { XPState } from '../types';

// ─── Rank by Level ────────────────────────────────────────────────────────────

export interface RankInfo {
  title: string;
  badge: string;
  description: string;
  textColor: string;    // tailwind text color
  borderColor: string;  // tailwind border/bg glow
  bgColor: string;
  minLevel: number;
  maxLevel?: number;
}

export const RANKS: RankInfo[] = [
  {
    minLevel: 1, maxLevel: 2,
    badge: '🌱', title: 'Iniciado',
    description: 'El viaje comienza aquí. Un paso a la vez.',
    textColor: 'text-gray-400', borderColor: 'border-gray-700/60', bgColor: 'bg-gray-800/20',
  },
  {
    minLevel: 3, maxLevel: 4,
    badge: '⚡', title: 'Despertar',
    description: 'Algo está despertando. La chispa prende.',
    textColor: 'text-sky-400', borderColor: 'border-sky-800/50', bgColor: 'bg-sky-900/15',
  },
  {
    minLevel: 5, maxLevel: 7,
    badge: '🗡️', title: 'Aprendiz Disciplinado',
    description: 'Los cimientos se forjan con repetición.',
    textColor: 'text-blue-300', borderColor: 'border-blue-700/50', bgColor: 'bg-blue-900/15',
  },
  {
    minLevel: 8, maxLevel: 11,
    badge: '🛡️', title: 'Guerrero del Hábito',
    description: 'La disciplina no es motivación. Es identidad.',
    textColor: 'text-indigo-300', borderColor: 'border-indigo-700/50', bgColor: 'bg-indigo-900/15',
  },
  {
    minLevel: 12, maxLevel: 15,
    badge: '🔰', title: 'Developer Enfocado',
    description: 'El foco profundo es tu ventaja competitiva.',
    textColor: 'text-violet-300', borderColor: 'border-violet-700/50', bgColor: 'bg-violet-900/15',
  },
  {
    minLevel: 16, maxLevel: 20,
    badge: '⚔️', title: 'Maestro del Foco',
    description: 'Élite. Pocos llegan al nivel de consistencia que tienes.',
    textColor: 'text-purple-300', borderColor: 'border-purple-600/50', bgColor: 'bg-purple-900/20',
  },
  {
    minLevel: 21, maxLevel: 26,
    badge: '🌟', title: 'Arquitecto de Logros',
    description: 'Construyes imperios ladrillo a ladrillo, día a día.',
    textColor: 'text-amber-300', borderColor: 'border-amber-700/50', bgColor: 'bg-amber-900/15',
  },
  {
    minLevel: 27, maxLevel: 34,
    badge: '💎', title: 'Élite Imparable',
    description: 'Muy pocos llegan aquí. Eres el estándar.',
    textColor: 'text-amber-200', borderColor: 'border-amber-500/50', bgColor: 'bg-amber-900/20',
  },
  {
    minLevel: 35, maxLevel: 49,
    badge: '👑', title: 'Leyenda Viviente',
    description: 'Más allá de los límites de lo que creías posible.',
    textColor: 'text-yellow-300', borderColor: 'border-yellow-500/50', bgColor: 'bg-yellow-900/20',
  },
  {
    minLevel: 50,
    badge: '☀️', title: 'Inmortal',
    description: 'La disciplina encarnada. Eres inspiración.',
    textColor: 'text-orange-200', borderColor: 'border-orange-400/50', bgColor: 'bg-orange-900/20',
  },
];

// ─── Streak Title ─────────────────────────────────────────────────────────────

export interface StreakTitleInfo {
  badge: string;
  title: string;
  description: string;
  textColor: string;
  minStreak: number;
}

export const STREAK_TITLES: StreakTitleInfo[] = [
  {
    minStreak: 7,
    badge: '🔥', title: 'Racha de Fuego',
    description: '7+ días seguidos. El fuego está prendido.',
    textColor: 'text-orange-400',
  },
  {
    minStreak: 14,
    badge: '🔥🔥', title: 'Imparable',
    description: '2 semanas sin parar. Nadie puede contigo.',
    textColor: 'text-orange-300',
  },
  {
    minStreak: 21,
    badge: '🌪️', title: 'Fénix en Llamas',
    description: '21 días. El hábito ya es parte de ti.',
    textColor: 'text-red-300',
  },
  {
    minStreak: 30,
    badge: '💎', title: 'Constancia Élite',
    description: '30 días consecutivos. Esto es disciplina real.',
    textColor: 'text-amber-300',
  },
  {
    minStreak: 60,
    badge: '👑⚡', title: 'Modo Inmortal',
    description: '60+ días. Eres una fuerza de la naturaleza.',
    textColor: 'text-yellow-200',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getRank(level: number): RankInfo {
  // Walk from highest to lowest to find the best matching rank
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (level >= RANKS[i].minLevel) return RANKS[i];
  }
  return RANKS[0];
}

export function getNextRank(level: number): RankInfo | null {
  const current = getRank(level);
  const idx = RANKS.indexOf(current);
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
}

export function getStreakTitle(streak: number): StreakTitleInfo | null {
  for (let i = STREAK_TITLES.length - 1; i >= 0; i--) {
    if (streak >= STREAK_TITLES[i].minStreak) return STREAK_TITLES[i];
  }
  return null;
}

/** Total XP ever accumulated (across all levels) */
export function getTotalXP(state: XPState): number {
  // sum of xpForLevel(i) for i = 1..level-1, plus current progress
  // = 100 * (level-1)*level/2 + xp.total
  return 100 * ((state.level - 1) * state.level) / 2 + state.total;
}

/** Level-up progress expressed as levels-within-rank */
export function getRankProgress(level: number): { levelsInRank: number; rankSize: number; pct: number } {
  const rank = getRank(level);
  const next = getNextRank(level);
  if (!next) return { levelsInRank: 0, rankSize: 1, pct: 100 };

  const rankSize = next.minLevel - rank.minLevel;
  const levelsInRank = level - rank.minLevel;
  return {
    levelsInRank,
    rankSize,
    pct: Math.round((levelsInRank / rankSize) * 100),
  };
}
