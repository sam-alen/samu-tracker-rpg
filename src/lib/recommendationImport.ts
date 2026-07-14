import { RECOMMENDATION_CATEGORIES, RECOMMENDATION_TYPE_LABELS, RECOMMENDATION_DIFFICULTY_LABELS, RECOMMENDATION_COST_LABELS, genericSearchUrl } from '../data/recommendations';
import { normalizeUrl } from './url';
import type { RecommendationItem, RecommendationLanguage } from '../types';

// Widened to Set<string> — these validate untrusted, arbitrarily-wide
// strings pasted in by the user, not values already known to be narrow.
const VALID_CATEGORIES = new Set<string>(RECOMMENDATION_CATEGORIES.map(c => c.id));
const VALID_TYPES = new Set<string>(Object.keys(RECOMMENDATION_TYPE_LABELS));
const VALID_DIFFICULTIES = new Set<string>(Object.keys(RECOMMENDATION_DIFFICULTY_LABELS));
const VALID_COSTS = new Set<string>(Object.keys(RECOMMENDATION_COST_LABELS));
const VALID_LANGUAGES: RecommendationLanguage[] = ['es', 'en', 'ambos'];

const COMBINING_MARK_START = 0x0300;
const COMBINING_MARK_END = 0x036f;

function stripAccents(s: string): string {
  let out = '';
  for (const ch of s.normalize('NFD')) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < COMBINING_MARK_START || code > COMBINING_MARK_END) out += ch;
  }
  return out;
}

function slugify(s: string): string {
  return stripAccents(s.toLowerCase())
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export interface ImportResult {
  items: RecommendationItem[];
  errors: string[];
}

/** Parses and validates a JSON blob (single object or array) the user pastes
 *  in as their own catalog additions. Strict on `category` (it drives the
 *  whole scoring/bucket system — a bad value would silently misbehave rather
 *  than crash, which is worse), lenient with a warning on everything else so
 *  a small typo doesn't reject the whole batch.
 *
 *  Items are id'd from their title (or an explicit `id` field) so re-pasting
 *  an edited version of something already added *updates* it in place
 *  instead of creating a duplicate — matching the "keep adding things I find
 *  over time" workflow this is built for. */
export function parseCustomRecommendationJson(raw: string): ImportResult {
  const errors: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { items: [], errors: [`JSON inválido: ${e instanceof Error ? e.message : String(e)}`] };
  }

  const list = Array.isArray(parsed) ? parsed : [parsed];
  const items: RecommendationItem[] = [];

  list.forEach((raw, idx) => {
    const label = `Ítem ${idx + 1}`;
    if (typeof raw !== 'object' || raw === null) {
      errors.push(`${label}: no es un objeto JSON válido — se ignoró.`);
      return;
    }
    const o = raw as Record<string, unknown>;

    const title = typeof o.title === 'string' ? o.title.trim() : '';
    if (!title) {
      errors.push(`${label}: falta "title" — se ignoró.`);
      return;
    }

    const category = typeof o.category === 'string' ? o.category : '';
    if (!VALID_CATEGORIES.has(category)) {
      errors.push(`${label} ("${title}"): "category" inválida o ausente ("${category}"). Debe ser una de: ${[...VALID_CATEGORIES].join(', ')}. Se ignoró.`);
      return;
    }

    let type = typeof o.type === 'string' ? o.type : '';
    if (!VALID_TYPES.has(type)) {
      errors.push(`${label} ("${title}"): "type" inválido o ausente ("${type}") — se usó "article". Válidos: ${[...VALID_TYPES].join(', ')}.`);
      type = 'article';
    }

    let difficulty = typeof o.difficulty === 'string' ? o.difficulty : '';
    if (!VALID_DIFFICULTIES.has(difficulty)) {
      if (o.difficulty) errors.push(`${label} ("${title}"): "difficulty" inválida ("${o.difficulty}") — se usó "intermedio".`);
      difficulty = 'intermedio';
    }

    let cost = typeof o.cost === 'string' ? o.cost : '';
    if (!VALID_COSTS.has(cost)) {
      if (o.cost) errors.push(`${label} ("${title}"): "cost" inválido ("${o.cost}") — se usó "gratis".`);
      cost = 'gratis';
    }

    let language = typeof o.language === 'string' ? o.language : '';
    if (!VALID_LANGUAGES.includes(language as RecommendationLanguage)) {
      language = 'es';
    }

    const link = typeof o.link === 'string' && o.link.trim() ? normalizeUrl(o.link) : genericSearchUrl(`${title} ${typeof o.creator === 'string' ? o.creator : ''}`.trim());

    const id = typeof o.id === 'string' && o.id.trim() ? o.id.trim() : `custom-${slugify(title)}`;

    const priority = typeof o.priority === 'number' ? Math.min(5, Math.max(1, Math.round(o.priority))) as 1 | 2 | 3 | 4 | 5 : 3;
    const estimatedRating = typeof o.estimatedRating === 'number' ? Math.min(5, Math.max(0, o.estimatedRating)) : 4;
    const timeMinutes = typeof o.timeMinutes === 'number' && o.timeMinutes > 0 ? Math.round(o.timeMinutes) : 30;
    const addedOn = new Date().toISOString().slice(0, 10);

    items.push({
      id,
      title,
      category: category as RecommendationItem['category'],
      type: type as RecommendationItem['type'],
      difficulty: difficulty as RecommendationItem['difficulty'],
      cost: cost as RecommendationItem['cost'],
      language: language as RecommendationLanguage,
      link,
      creator: typeof o.creator === 'string' ? o.creator : '',
      description: typeof o.description === 'string' ? o.description : '',
      whyForYou: typeof o.whyForYou === 'string' ? o.whyForYou : (typeof o.description === 'string' ? o.description : `Lo agregaste tú el ${addedOn}.`),
      goalId: typeof o.goalId === 'string' ? o.goalId : undefined,
      tags: Array.isArray(o.tags) ? o.tags.filter((t): t is string => typeof t === 'string') : [],
      priority,
      estimatedRating,
      timeMinutes,
      lastVerified: typeof o.lastVerified === 'string' ? o.lastVerified : addedOn,
      officialSource: typeof o.officialSource === 'boolean' ? o.officialSource : false,
      relatedItemIds: Array.isArray(o.relatedItemIds) ? o.relatedItemIds.filter((t): t is string => typeof t === 'string') : undefined,
    });
  });

  return { items, errors };
}

/** Upserts by id: an item with an id that already exists gets replaced
 *  in place (same position) rather than duplicated — re-pasting an edited
 *  version of something you already added updates it. */
export function mergeCustomItems(existing: RecommendationItem[], incoming: RecommendationItem[]): RecommendationItem[] {
  const byId = new Map(existing.map(i => [i.id, i]));
  for (const item of incoming) byId.set(item.id, item);
  return [...byId.values()];
}

export const RECOMMENDATION_JSON_EXAMPLE = `[
  {
    "title": "Refactoring UI",
    "creator": "Adam Wathan & Steve Schoger",
    "type": "book",
    "category": "programacion",
    "description": "Guía práctica de diseño de interfaces para desarrolladores.",
    "whyForYou": "Complementa tu lado técnico con criterio visual real.",
    "difficulty": "intermedio",
    "timeMinutes": 30,
    "cost": "pago-unico",
    "language": "en",
    "link": "https://www.refactoringui.com",
    "tags": ["diseno", "ui"],
    "priority": 4
  }
]`;
