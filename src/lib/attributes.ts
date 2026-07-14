import { Swords, Brain, Wind, HeartPulse, Gem, MessageCircle, type LucideIcon } from 'lucide-react';
import type { AttributeXP, PlayerAttributes, RPGAttribute } from '../types';

export const ATTRIBUTES: RPGAttribute[] = ['STR', 'INT', 'DEX', 'VIT', 'WIS', 'CHA'];

export const ATTRIBUTE_LABELS: Record<RPGAttribute, string> = {
  STR: 'Fuerza',
  INT: 'Inteligencia',
  DEX: 'Destreza',
  VIT: 'Vitalidad',
  WIS: 'Sabiduría',
  CHA: 'Carisma',
};

// Vector icons, not emoji: emoji glyphs (e.g. ⚔️) render inconsistently
// across browsers/fonts — some environments fall back to a garbled glyph.
export const ATTRIBUTE_ICONS: Record<RPGAttribute, LucideIcon> = {
  STR: Swords,
  INT: Brain,
  DEX: Wind,
  VIT: HeartPulse,
  WIS: Gem,
  CHA: MessageCircle,
};

export const ATTRIBUTE_DESCRIPTIONS: Record<RPGAttribute, string> = {
  STR: 'Ejercicio físico, disciplina corporal',
  INT: 'Estudio, código, aprendizaje técnico',
  DEX: 'Tareas rápidas, productividad, ejecución',
  VIT: 'Salud, sueño, hábitos de bienestar',
  WIS: 'Lectura, reflexión, planificación',
  CHA: 'Comunicación, familia, vida social',
};

// Colors validated against the app's dark card surface (#0B1120) with the
// dataviz palette validator — categorical, CVD-safe, contrast ≥ 3:1.
export const ATTRIBUTE_COLORS: Record<RPGAttribute, string> = {
  STR: '#EF4444',
  INT: '#3B82F6',
  DEX: '#D97706',
  VIT: '#16A34A',
  WIS: '#8B5CF6',
  CHA: '#EA580C',
};

export function defaultAttributes(): PlayerAttributes {
  return { STR: 0, INT: 0, DEX: 0, VIT: 0, WIS: 0, CHA: 0 };
}

export function totalAttributePoints(attrs: PlayerAttributes): number {
  return ATTRIBUTES.reduce((sum, a) => sum + (attrs[a] ?? 0), 0);
}

/** A habit/mission can grant more than one attribute (e.g. reading builds
 *  both WIS and INT) — `attributes` is the source of truth, `attribute`
 *  (singular) is the pre-multi-attribute field kept only so old saves keep
 *  reading correctly. Never falls through to an empty array. */
export function resolveAttributes(
  entity: { attributes?: RPGAttribute[]; attribute?: RPGAttribute },
  fallback: RPGAttribute,
): RPGAttribute[] {
  if (entity.attributes?.length) return entity.attributes;
  if (entity.attribute) return [entity.attribute];
  return [fallback];
}

// ─── Attribute XP (nested leveling, one point at a time) ──────────────────
// Completing something doesn't jump a stat by a whole point — it adds XP
// toward that attribute, and every ATTRIBUTE_XP_PER_POINT of it converts
// into +1 point (carrying the remainder). Mirrors the same addXP/removeXP
// carry logic the character level already uses, just scoped per attribute.

export const ATTRIBUTE_XP_PER_POINT = 30;

/** Finishing a book has no matching regular XP_REWARDS entry (books award
 *  no XP/gold, only WIS) — this is exactly one point's worth. */
export const BOOK_FINISH_ATTRIBUTE_XP = ATTRIBUTE_XP_PER_POINT;

export function defaultAttributeXP(): AttributeXP {
  return { STR: 0, INT: 0, DEX: 0, VIT: 0, WIS: 0, CHA: 0 };
}

/** Bidirectional: positive delta gains XP (carrying up into new points),
 *  negative delta loses XP (carrying down, dropping points if needed).
 *  Both attribute points and leftover XP are clamped at 0. */
export function applyAttributeXP(
  attrs: PlayerAttributes,
  xpState: AttributeXP,
  attr: RPGAttribute,
  delta: number,
): { attributes: PlayerAttributes; attributeXP: AttributeXP } {
  let xp = (xpState[attr] ?? 0) + delta;
  let points = attrs[attr] ?? 0;

  while (xp >= ATTRIBUTE_XP_PER_POINT) {
    xp -= ATTRIBUTE_XP_PER_POINT;
    points += 1;
  }
  while (xp < 0 && points > 0) {
    points -= 1;
    xp += ATTRIBUTE_XP_PER_POINT;
  }
  xp = Math.max(0, xp);

  return {
    attributes: { ...attrs, [attr]: points },
    attributeXP: { ...xpState, [attr]: xp },
  };
}

// ─── Tiers ──────────────────────────────────────────────────────────────────
// Each attribute is ranked on its OWN fixed scale (not relative to your other
// stats) so a bar never reads as "maxed" just because it's your current
// leading stat — it only fills as you approach that attribute's next tier.

export interface AttributeTier {
  name: string;
  min: number;
}

export const ATTRIBUTE_TIERS: AttributeTier[] = [
  { name: 'Novato', min: 0 },
  { name: 'Principiante', min: 5 },
  { name: 'Aprendiz', min: 12 },
  { name: 'Competente', min: 25 },
  { name: 'Hábil', min: 45 },
  { name: 'Avanzado', min: 75 },
  { name: 'Experto', min: 120 },
  { name: 'Virtuoso', min: 180 },
  { name: 'Maestro', min: 260 },
  { name: 'Leyenda', min: 400 },
];

export interface AttributeTierProgress {
  tier: AttributeTier;
  next: AttributeTier | null;
  /** % filled toward the next tier (100 if at the final tier) */
  pct: number;
}

/**
 * @param xpIntoNextPoint leftover XP already earned toward the point after
 *   `value` — lets the bar creep forward on every single completion instead
 *   of only jumping when a whole point lands.
 */
export function getAttributeTier(value: number, xpIntoNextPoint = 0): AttributeTierProgress {
  let index = 0;
  for (let i = ATTRIBUTE_TIERS.length - 1; i >= 0; i--) {
    if (value >= ATTRIBUTE_TIERS[i].min) { index = i; break; }
  }
  const tier = ATTRIBUTE_TIERS[index];
  const next = ATTRIBUTE_TIERS[index + 1] ?? null;

  if (!next) return { tier, next, pct: 100 };

  const pointsNeeded = next.min - tier.min;
  const pointsInto = (value - tier.min) + Math.min(1, xpIntoNextPoint / ATTRIBUTE_XP_PER_POINT);
  const pct = Math.min(100, Math.round((pointsInto / pointsNeeded) * 100));
  return { tier, next, pct };
}
