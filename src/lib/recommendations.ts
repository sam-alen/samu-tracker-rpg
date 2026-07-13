import { RECOMMENDATION_CATALOG, BUCKET_OF } from '../data/recommendations';
import type {
  CategoryAffinity, RecommendationCategory, RecommendationDifficulty, RecommendationFeedbackFlag,
  RecommendationInteraction, RecommendationItem, RecommendationProfile, RecommendationWeeklyPlan,
  RecommendationWeeklyPlanSlot,
} from '../types';

// ─── Small pure helpers ─────────────────────────────────────────────────────

/** ISO week string, e.g. '2026-W29'. Used to key the weekly plan so it stays
 *  stable if the page reloads mid-week. */
export function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Deterministic [0,1) fraction from a string — used only to break ties
 *  between equal integer scores, never as a source of real randomness. */
function hashFraction(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function interactionFor(id: string, interactions: Record<string, RecommendationInteraction>): RecommendationInteraction | undefined {
  return interactions[id];
}

const DIFFICULTY_RANK: Record<RecommendationDifficulty, number> = { principiante: 0, intermedio: 1, avanzado: 2 };

function expectedDifficulty(profile: RecommendationProfile): RecommendationDifficulty {
  if (profile.experienceLevel === 'junior') return 'principiante';
  if (profile.experienceLevel === 'senior-track') return 'avanzado';
  return 'intermedio';
}

// ─── Scoring ────────────────────────────────────────────────────────────────

export interface ScoreContext {
  now: Date;
  /** Currently selected time-block filter, in minutes. Undefined = no constraint. */
  timeBlockMinutes?: number;
}

export interface ScoreBreakdown {
  goalMatch: number;
  categoryWeight: number;
  affinity: number;
  difficultyFit: number;
  timeFit: number;
  costFit: number;
  quality: number;
  recency: number;
  formatFit: number;
}

export interface ScoredItem {
  item: RecommendationItem;
  total: number;
  breakdown: ScoreBreakdown;
}

/** Deterministic 0-100 heuristic — not ML. Every factor is auditable and
 *  reproducible given the same profile/interactions/affinity/date, so
 *  editing the profile visibly and predictably reorders the feed. */
export function scoreItem(
  item: RecommendationItem,
  profile: RecommendationProfile,
  affinity: CategoryAffinity,
  context: ScoreContext,
): ScoredItem {
  const bucket = BUCKET_OF[item.category];

  const goalMatch = item.goalId === profile.primaryGoalId ? 25
    : item.goalId && profile.secondaryGoalIds.includes(item.goalId) ? 15
    : 0;

  const categoryWeight = (profile.categoryWeights[bucket] ?? 0) / 100 * 20;

  const affinityScore = clamp(affinity[item.category] ?? 0, -10, 10);

  const expected = expectedDifficulty(profile);
  const diffGap = Math.abs(DIFFICULTY_RANK[item.difficulty] - DIFFICULTY_RANK[expected]);
  const difficultyFit = diffGap === 0 ? 10 : diffGap === 1 ? 5 : 0;

  let timeFit = 10;
  if (context.timeBlockMinutes != null) {
    const over = item.timeMinutes - context.timeBlockMinutes;
    timeFit = over <= 0 ? 10 : clamp(10 - (over / context.timeBlockMinutes) * 10, 0, 10);
  }

  const costFit = item.cost === 'gratis' ? 5
    : profile.budget === 'gratis-only' ? 0
    : 5;

  const quality = item.priority * 2;

  const monthsSinceVerified = (context.now.getTime() - new Date(item.lastVerified).getTime()) / (1000 * 60 * 60 * 24 * 30);
  const recency = monthsSinceVerified <= 18 ? 5 : clamp(5 - ((monthsSinceVerified - 18) / 18) * 5, 0, 5);

  const formatFit = profile.preferredFormats.includes(item.type) ? 5 : 0;

  const breakdown: ScoreBreakdown = { goalMatch, categoryWeight, affinity: affinityScore, difficultyFit, timeFit, costFit, quality, recency, formatFit };
  const total = clamp(Object.values(breakdown).reduce((a, b) => a + b, 0), 0, 100);

  return { item, total, breakdown };
}

const FACTOR_LABELS: { key: keyof ScoreBreakdown; label: (profile: RecommendationProfile, item: RecommendationItem) => string }[] = [
  { key: 'goalMatch', label: (profile, item) => {
    const goal = profile.goals.find(g => g.id === item.goalId);
    return goal ? `Coincide con tu meta: "${goal.label}"` : 'Coincide con una de tus metas';
  } },
  { key: 'categoryWeight', label: (profile, item) => {
    const bucket = BUCKET_OF[item.category];
    return `Está en una categoría a la que le das prioridad (${profile.categoryWeights[bucket] ?? 0}%)`;
  } },
  { key: 'affinity', label: () => 'Le has dado buen feedback a contenido similar' },
  { key: 'formatFit', label: (_p, item) => `Es tu formato preferido (${item.type})` },
];

/** Builds the human-readable "why", never a generic "podría interesarte" —
 *  takes the 1-2 highest-scoring factors and phrases them concretely, then
 *  appends the hand-authored whyForYou tied to Samu's real profile facts. */
export function composeReason(scored: ScoredItem, profile: RecommendationProfile): string {
  const top = FACTOR_LABELS
    .filter(f => scored.breakdown[f.key] > 0)
    .sort((a, b) => scored.breakdown[b.key] - scored.breakdown[a.key])
    .slice(0, 2)
    .map(f => f.label(profile, scored.item));
  return [...top, scored.item.whyForYou].filter(Boolean).join('. ');
}

// ─── Ranking ────────────────────────────────────────────────────────────────

export interface RankOptions {
  includeCompleted?: boolean;
  includeDismissed?: boolean;
  excludeIds?: string[];
}

/** Scores + hard-excludes dismissed/completed/broken-link items (unless
 *  explicitly opted back in for history views), then applies a variety
 *  penalty (-5 per repeated category already seen in this ranked batch,
 *  capped at -15) via a single greedy pass over the score-sorted list. */
export function rankItems(
  profile: RecommendationProfile,
  affinity: CategoryAffinity,
  interactions: Record<string, RecommendationInteraction>,
  context: ScoreContext,
  options: RankOptions = {},
): ScoredItem[] {
  const excluded = new Set(options.excludeIds ?? []);
  const weekSeed = getISOWeek(context.now);

  const eligible = RECOMMENDATION_CATALOG.filter(item => {
    if (excluded.has(item.id)) return false;
    const interaction = interactionFor(item.id, interactions);
    if (!interaction) return true;
    if (interaction.brokenLink) return false;
    if (interaction.status === 'dismissed' && !options.includeDismissed) return false;
    if (interaction.status === 'completed' && !options.includeCompleted) return false;
    return true;
  });

  const scored = eligible
    .map(item => scoreItem(item, profile, affinity, context))
    .sort((a, b) => (b.total - a.total) || (hashFraction(weekSeed + a.item.id) - hashFraction(weekSeed + b.item.id)));

  const seenCategories = new Map<RecommendationCategory, number>();
  const withVariety = scored.map(s => {
    const seen = seenCategories.get(s.item.category) ?? 0;
    seenCategories.set(s.item.category, seen + 1);
    const penalty = Math.min(15, seen * 5);
    return { ...s, total: clamp(s.total - penalty, 0, 100) };
  });

  return withVariety.sort((a, b) => (b.total - a.total) || (hashFraction(weekSeed + a.item.id) - hashFraction(weekSeed + b.item.id)));
}

// ─── Affinity learning ──────────────────────────────────────────────────────

const AFFINITY_DELTA: Record<RecommendationFeedbackFlag, number> = {
  'interesa': 2,
  'mas-como-esto': 2,
  'no-interesa': -2,
  'menos-como-esto': -2,
  'muy-basico': -1,
  'muy-avanzado': -1,
  'enlace-roto': 0,
};

export function computeAffinityDelta(current: number, flag: RecommendationFeedbackFlag): number {
  return clamp(current + (AFFINITY_DELTA[flag] ?? 0), -10, 10);
}

// ─── Exploratory pick (the 'exploratorio' bucket is a behavior, not a fixed category) ─

export function pickExploratoryItem(
  profile: RecommendationProfile,
  affinity: CategoryAffinity,
  interactions: Record<string, RecommendationInteraction>,
  now: Date,
): RecommendationItem | null {
  const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const recentCategories = new Set<RecommendationCategory>();
  for (const item of RECOMMENDATION_CATALOG) {
    const interaction = interactionFor(item.id, interactions);
    if (interaction && new Date(interaction.updatedAt).getTime() > thirtyDaysAgo) {
      recentCategories.add(item.category);
    }
  }
  const candidates = rankItems(profile, affinity, interactions, { now })
    .filter(s => !recentCategories.has(s.item.category));
  if (candidates.length === 0) return null;
  const weighted = candidates.sort((a, b) => b.item.priority - a.item.priority);
  return weighted[0]?.item ?? null;
}

// ─── Contextual sections ────────────────────────────────────────────────────

export interface RecommendationSection {
  id: string;
  title: string;
  items: RecommendationItem[];
}

function toItems(scored: ScoredItem[], limit: number): RecommendationItem[] {
  return scored.slice(0, limit).map(s => s.item);
}

export function getContinueLearning(interactions: Record<string, RecommendationInteraction>): RecommendationItem[] {
  const viewed = Object.values(interactions)
    .filter(i => i.lastViewedAt && i.status !== 'completed' && i.status !== 'dismissed')
    .sort((a, b) => new Date(b.lastViewedAt!).getTime() - new Date(a.lastViewedAt!).getTime());
  const ids = viewed.map(i => i.itemId);
  return RECOMMENDATION_CATALOG.filter(item => ids.includes(item.id)).slice(0, 6);
}

export function getForPrimaryGoal(profile: RecommendationProfile, affinity: CategoryAffinity, interactions: Record<string, RecommendationInteraction>, now: Date): RecommendationItem[] {
  return toItems(rankItems(profile, affinity, interactions, { now }).filter(s => s.item.goalId === profile.primaryGoalId), 6);
}

export function getBeforeWork(profile: RecommendationProfile, affinity: CategoryAffinity, interactions: Record<string, RecommendationInteraction>, now: Date): RecommendationItem[] {
  const [h, m] = profile.schedule.workStart.split(':').map(Number);
  const workStartMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (nowMinutes >= workStartMinutes) return [];
  return toItems(rankItems(profile, affinity, interactions, { now, timeBlockMinutes: 15 }), 6);
}

export function getAfterGym(profile: RecommendationProfile, affinity: CategoryAffinity, interactions: Record<string, RecommendationInteraction>, now: Date): RecommendationItem[] {
  const [h, m] = profile.schedule.gymEnd.split(':').map(Number);
  const gymEndMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (nowMinutes < gymEndMinutes || nowMinutes > gymEndMinutes + 120) return [];
  return toItems(rankItems(profile, affinity, interactions, { now }).filter(s =>
    s.item.category === 'nutricion' || s.item.category === 'gimnasio' || BUCKET_OF[s.item.category] === 'hobbies-entretenimiento',
  ), 6);
}

export function getWeekendPicks(profile: RecommendationProfile, affinity: CategoryAffinity, interactions: Record<string, RecommendationInteraction>, now: Date): RecommendationItem[] {
  const day = now.getDay();
  if (day !== 0 && day !== 6) return [];
  return toItems(rankItems(profile, affinity, interactions, { now }).filter(s => s.item.timeMinutes >= 45), 6);
}

export function getFreeResources(profile: RecommendationProfile, affinity: CategoryAffinity, interactions: Record<string, RecommendationInteraction>, now: Date): RecommendationItem[] {
  return toItems(rankItems(profile, affinity, interactions, { now }).filter(s => s.item.cost === 'gratis'), 8);
}

export function getShortCourses(profile: RecommendationProfile, affinity: CategoryAffinity, interactions: Record<string, RecommendationInteraction>, now: Date): RecommendationItem[] {
  return toItems(rankItems(profile, affinity, interactions, { now }).filter(s =>
    (s.item.type === 'course' || s.item.type === 'learning-path') && s.item.timeMinutes <= 30,
  ), 6);
}

export function getForCategory(category: RecommendationCategory, profile: RecommendationProfile, affinity: CategoryAffinity, interactions: Record<string, RecommendationInteraction>, now: Date, limit = 6): RecommendationItem[] {
  return toItems(rankItems(profile, affinity, interactions, { now }).filter(s => s.item.category === category), limit);
}

export function getForTraining(profile: RecommendationProfile, affinity: CategoryAffinity, interactions: Record<string, RecommendationInteraction>, now: Date): RecommendationItem[] {
  return toItems(rankItems(profile, affinity, interactions, { now }).filter(s => s.item.category === 'gimnasio' || s.item.category === 'nutricion'), 6);
}

export function getMatchingBooks(profile: RecommendationProfile, affinity: CategoryAffinity, interactions: Record<string, RecommendationInteraction>, now: Date): RecommendationItem[] {
  return toItems(rankItems(profile, affinity, interactions, { now }).filter(s =>
    (s.item.type === 'book' || s.item.type === 'audiobook') &&
    s.item.tags.some(t => profile.favoriteGenres.some(g => g.toLowerCase().includes(t) || t.includes(g.toLowerCase()))),
  ), 6);
}

export function getBecauseYouCompleted(interactions: Record<string, RecommendationInteraction>): { basedOn: RecommendationItem; items: RecommendationItem[] } | null {
  const completed = Object.values(interactions)
    .filter(i => i.status === 'completed' && i.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
  const last = completed[0];
  if (!last) return null;
  const basedOn = RECOMMENDATION_CATALOG.find(i => i.id === last.itemId);
  if (!basedOn?.relatedItemIds?.length) return null;
  const items = RECOMMENDATION_CATALOG.filter(i => basedOn.relatedItemIds!.includes(i.id));
  return items.length > 0 ? { basedOn, items } : null;
}

export function getSimilarToInterests(profile: RecommendationProfile, affinity: CategoryAffinity, interactions: Record<string, RecommendationInteraction>, now: Date): RecommendationItem[] {
  return toItems(rankItems(profile, affinity, interactions, { now }), 8);
}

export function getForgottenSaved(interactions: Record<string, RecommendationInteraction>, now: Date): RecommendationItem[] {
  const twentyOneDaysAgo = now.getTime() - 21 * 24 * 60 * 60 * 1000;
  const forgotten = Object.values(interactions).filter(i =>
    i.status === 'saved' && i.savedAt && new Date(i.savedAt).getTime() < twentyOneDaysAgo,
  );
  const ids = forgotten.map(i => i.itemId);
  return RECOMMENDATION_CATALOG.filter(item => ids.includes(item.id));
}

// ─── Weekly plan ────────────────────────────────────────────────────────────

function pickAndRemove(pool: ScoredItem[], predicate: (s: ScoredItem) => boolean, usedCategories: Set<RecommendationCategory>): ScoredItem | undefined {
  const idx = pool.findIndex(predicate);
  if (idx === -1) return undefined;
  const [picked] = pool.splice(idx, 1);
  usedCategories.add(picked.item.category);
  return picked;
}

export function generateWeeklyPlan(
  profile: RecommendationProfile,
  affinity: CategoryAffinity,
  interactions: Record<string, RecommendationInteraction>,
  now: Date,
  regenCount: number,
  excludedIds: string[],
): RecommendationWeeklyPlan {
  const week = getISOWeek(now);
  const pool = rankItems(profile, affinity, interactions, { now }, { excludeIds: excludedIds });
  const usedCategories = new Set<RecommendationCategory>();
  const slots: RecommendationWeeklyPlanSlot[] = [];

  const principal = pickAndRemove(pool, s => s.item.goalId === profile.primaryGoalId, usedCategories)
    ?? pickAndRemove(pool, s => BUCKET_OF[s.item.category] === 'desarrollo-profesional', usedCategories);
  if (principal) slots.push({ role: 'principal', itemId: principal.item.id });

  const gym = pickAndRemove(pool, s => s.item.category === 'gimnasio' || s.item.category === 'nutricion', usedCategories);
  if (gym) slots.push({ role: 'gimnasio', itemId: gym.item.id });

  const english = pickAndRemove(pool, s => s.item.category === 'ingles', usedCategories);
  if (english) slots.push({ role: 'ingles', itemId: english.item.id });

  const entertainment = pickAndRemove(pool, s => BUCKET_OF[s.item.category] === 'hobbies-entretenimiento' && s.item.category !== principal?.item.category, usedCategories);
  if (entertainment) slots.push({ role: 'entretenimiento', itemId: entertainment.item.id });

  for (let i = 0; i < 2; i++) {
    const secondary = pickAndRemove(pool, s => !usedCategories.has(s.item.category), usedCategories)
      ?? pickAndRemove(pool, () => true, usedCategories);
    if (secondary) slots.push({ role: 'secundario', itemId: secondary.item.id });
  }

  const explanationParts = slots.map(slot => {
    const item = RECOMMENDATION_CATALOG.find(i => i.id === slot.itemId);
    if (!item) return '';
    const scored = scoreItem(item, profile, affinity, { now });
    return `"${item.title}" — ${composeReason(scored, profile)}`;
  }).filter(Boolean);

  return {
    week,
    regenCount,
    excludedIds,
    slots,
    explanation: explanationParts.join(' · '),
    generatedAt: now.toISOString(),
  };
}
