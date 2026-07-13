// Hunter Rank — Solo Leveling style E→S classification, distinct from the
// per-level flavor title in lib/titles.ts. Where RANKS tells a "story" name
// tied linearly to level, HunterRank is a composite "power" assessment
// (XP + attribute points + achievements) — closer to how the Hunter
// Association grades hunters on overall combined strength, not just level.

export interface HunterRank {
  letter: string;
  title: string;
  description: string;
  color: string; // reuses already dataviz-validated hexes from ATTRIBUTE_COLORS
  minPower: number;
}

export const HUNTER_RANKS: HunterRank[] = [
  { letter: 'E', title: 'Cazador Rango E', description: 'Recién despertado. Todo cazador empieza aquí.', color: '#7E92B4', minPower: 0 },
  { letter: 'D', title: 'Cazador Rango D', description: 'Ya no eres un novato. Las mazmorras fáciles te reconocen.', color: '#16A34A', minPower: 1000 },
  { letter: 'C', title: 'Cazador Rango C', description: 'Consistencia real. Empiezas a destacar del resto.', color: '#4DA6FF', minPower: 4500 },
  { letter: 'B', title: 'Cazador Rango B', description: 'Fuerza notable. Pocos cazadores llegan tan lejos.', color: '#8B5CF6', minPower: 12000 },
  { letter: 'A', title: 'Cazador Rango A', description: 'Élite. La Asociación te vigila de cerca.', color: '#D97706', minPower: 30000 },
  { letter: 'S', title: 'Cazador Rango S', description: 'El escalón más alto reconocido. Muy pocos llegan aquí.', color: '#EF4444', minPower: 70000 },
  { letter: 'M', title: 'Monarca de las Sombras', description: 'Trascendiste la clasificación. Ya no compites — dominas.', color: '#E8F1FF', minPower: 150000 },
];

/** Deterministic composite score — no new tracked counters, purely derived
 *  from data that already exists: lifetime XP, total attribute points across
 *  the 6 stats, and achievements unlocked. */
export function computeHunterPower(totalXP: number, attributePoints: number, achievementsUnlocked: number): number {
  return totalXP + attributePoints * 15 + achievementsUnlocked * 60;
}

export function getHunterRank(power: number): HunterRank {
  for (let i = HUNTER_RANKS.length - 1; i >= 0; i--) {
    if (power >= HUNTER_RANKS[i].minPower) return HUNTER_RANKS[i];
  }
  return HUNTER_RANKS[0];
}

export function getNextHunterRank(power: number): HunterRank | null {
  const current = getHunterRank(power);
  const idx = HUNTER_RANKS.indexOf(current);
  return idx < HUNTER_RANKS.length - 1 ? HUNTER_RANKS[idx + 1] : null;
}

export function getHunterRankProgress(power: number): { pct: number; pointsToNext: number } {
  const current = getHunterRank(power);
  const next = getNextHunterRank(power);
  if (!next) return { pct: 100, pointsToNext: 0 };
  const span = next.minPower - current.minPower;
  const into = power - current.minPower;
  return { pct: Math.max(0, Math.min(100, Math.round((into / span) * 100))), pointsToNext: next.minPower - power };
}
