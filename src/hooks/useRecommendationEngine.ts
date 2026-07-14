import { useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useXP } from './useXP';
import { storage } from '../lib/storage';
import { XP_REWARDS } from '../lib/xp';
import { fx } from '../lib/fx';
import { checkAchievements } from '../lib/achievements';
import { RECOMMENDATION_CATALOG } from '../data/recommendations';
import { defaultRecommendationProfile } from '../data/recommendationProfile';
import { parseCustomRecommendationJson, mergeCustomItems, type ImportResult } from '../lib/recommendationImport';
import {
  computeAffinityDelta, generateWeeklyPlan, getAfterGym, getBecauseYouCompleted,
  getBeforeWork, getContinueLearning, getForCategory, getForPrimaryGoal, getForgottenSaved,
  getForTraining, getFreeResources, getISOWeek, getMatchingBooks, getShortCourses,
  getSimilarToInterests, getWeekendPicks, pickExploratoryItem, rankItems,
  type RecommendationSection, type ScoredItem,
} from '../lib/recommendations';
import type {
  CategoryAffinity, RecommendationFeedbackFlag, RecommendationInteraction, RecommendationItem,
  RecommendationProfile, RecommendationWeeklyPlan,
} from '../types';

function nowISO(): string { return new Date().toISOString(); }

function ensureInteraction(interactions: Record<string, RecommendationInteraction>, id: string): RecommendationInteraction {
  return interactions[id] ?? { itemId: id, status: 'none', feedback: [], brokenLink: false, updatedAt: nowISO() };
}

export function useRecommendationEngine() {
  const { gainXP, loseXP } = useXP();
  const [profile, setProfile] = useLocalStorage<RecommendationProfile>(storage.keys.recommendationProfile, defaultRecommendationProfile());
  const [interactions, setInteractions] = useLocalStorage<Record<string, RecommendationInteraction>>(storage.keys.recommendationInteractions, {});
  const [affinity, setAffinity] = useLocalStorage<CategoryAffinity>(storage.keys.recommendationAffinity, storage.getRecommendationAffinity());
  const [weeklyPlanStored, setWeeklyPlanStored] = useLocalStorage<RecommendationWeeklyPlan | null>(storage.keys.recommendationWeeklyPlan, null);
  const [customItems, setCustomItems] = useLocalStorage<RecommendationItem[]>(storage.keys.recommendationCustomItems, []);

  // The catalog fed to every scoring/section/weekly-plan function below —
  // built-in items + whatever the user has imported via JSON, merged once
  // here so user-added content gets identical treatment everywhere.
  const catalog = useMemo(() => [...RECOMMENDATION_CATALOG, ...customItems], [customItems]);

  const now = new Date();
  const currentWeek = getISOWeek(now);

  // Deterministic given the same catalog/profile/interactions/affinity/date,
  // so it's safe to (re)compute on the fly without persisting — persistence
  // only happens explicitly via regenerateWeeklyPlan(), avoiding any
  // write-during-render/effect purity concern (same lesson learned with
  // recurring missions).
  const weeklyPlan = weeklyPlanStored?.week === currentWeek
    ? weeklyPlanStored
    : generateWeeklyPlan(catalog, profile, affinity, interactions, now, 0, []);

  function updateInteraction(id: string, patch: Partial<RecommendationInteraction>) {
    const current = storage.getRecommendationInteractions();
    const interaction = ensureInteraction(current, id);
    const next = { ...current, [id]: { ...interaction, ...patch, updatedAt: nowISO() } };
    storage.setRecommendationInteractions(next);
    setInteractions(next);
  }

  // Only these two touch XP/gold/achievements — every other interaction below
  // is reward-neutral, closing off any farming surface.
  function markCompleted(id: string, e?: { clientX: number; clientY: number }) {
    const progress = storage.getRecommendationsProgress();
    if (progress.includes(id)) return;
    storage.setRecommendationsProgress([...progress, id]);
    updateInteraction(id, { status: 'completed', completedAt: nowISO() });
    gainXP(XP_REWARDS.recommendation);
    fx.rewardAt(e ?? null, XP_REWARDS.recommendation);
    checkAchievements();
  }

  function undoComplete(id: string) {
    const progress = storage.getRecommendationsProgress();
    if (!progress.includes(id)) return;
    storage.setRecommendationsProgress(progress.filter(p => p !== id));
    updateInteraction(id, { status: 'none', completedAt: undefined });
    loseXP(XP_REWARDS.recommendation);
  }

  function toggleSaved(id: string) {
    const interaction = ensureInteraction(storage.getRecommendationInteractions(), id);
    if (interaction.status === 'saved') {
      updateInteraction(id, { status: 'none', savedAt: undefined });
    } else {
      updateInteraction(id, { status: 'saved', savedAt: nowISO() });
    }
  }

  function dismiss(id: string) {
    updateInteraction(id, { status: 'dismissed', dismissedAt: nowISO() });
  }

  function undoDismiss(id: string) {
    updateInteraction(id, { status: 'none', dismissedAt: undefined });
  }

  function rate(id: string, stars: 1 | 2 | 3 | 4 | 5) {
    updateInteraction(id, { rating: stars });
  }

  function markViewed(id: string) {
    updateInteraction(id, { lastViewedAt: nowISO() });
  }

  function addFeedback(id: string, flag: RecommendationFeedbackFlag) {
    const current = ensureInteraction(storage.getRecommendationInteractions(), id);
    const patch: Partial<RecommendationInteraction> = { feedback: [...current.feedback, { flag, at: nowISO() }] };
    if (flag === 'enlace-roto') patch.brokenLink = true;
    updateInteraction(id, patch);

    const item = catalog.find(i => i.id === id);
    if (item) {
      const currentAffinity = storage.getRecommendationAffinity();
      const nextValue = computeAffinityDelta(currentAffinity[item.category] ?? 0, flag);
      const nextAffinity = { ...currentAffinity, [item.category]: nextValue };
      storage.setRecommendationAffinity(nextAffinity);
      setAffinity(nextAffinity);
    }
  }

  function updateProfile(next: RecommendationProfile) {
    storage.setRecommendationProfile(next);
    setProfile(next);
  }

  // Parses + validates the pasted JSON and upserts by id (re-pasting an
  // edited version of something already added updates it in place rather
  // than duplicating it) — this is the "keep scaling the catalog with
  // things I find" entry point.
  function importCustomItemsFromJson(raw: string): ImportResult {
    const result = parseCustomRecommendationJson(raw);
    if (result.items.length > 0) {
      const current = storage.getRecommendationCustomItems();
      const merged = mergeCustomItems(current, result.items);
      storage.setRecommendationCustomItems(merged);
      setCustomItems(merged);
    }
    return result;
  }

  function removeCustomItem(id: string) {
    const next = customItems.filter(i => i.id !== id);
    storage.setRecommendationCustomItems(next);
    setCustomItems(next);
    // A removed catalog item shouldn't leave orphaned interaction/progress state behind
    const progress = storage.getRecommendationsProgress();
    if (progress.includes(id)) storage.setRecommendationsProgress(progress.filter(p => p !== id));
  }

  const REGEN_CAP = 3;
  function regenerateWeeklyPlan() {
    const base = weeklyPlanStored?.week === currentWeek ? weeklyPlanStored : null;
    const regenCount = base?.regenCount ?? 0;
    if (regenCount >= REGEN_CAP) return;
    const excludedIds = [...(base?.excludedIds ?? []), ...(base?.slots.map(s => s.itemId) ?? [])];
    const next = generateWeeklyPlan(catalog, profile, affinity, interactions, now, regenCount + 1, excludedIds);
    storage.setRecommendationWeeklyPlan(next);
    setWeeklyPlanStored(next);
  }

  const scoredCatalog: ScoredItem[] = useMemo(
    () => rankItems(catalog, profile, affinity, interactions, { now }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalog, profile, affinity, interactions],
  );

  const sections: RecommendationSection[] = useMemo(() => {
    const exploratory = pickExploratoryItem(catalog, profile, affinity, interactions, now);
    const becauseCompleted = getBecauseYouCompleted(catalog, interactions);
    const raw: RecommendationSection[] = [
      { id: 'continuar', title: 'Continúa aprendiendo', items: getContinueLearning(catalog, interactions) },
      { id: 'meta-principal', title: 'Para tu meta principal', items: getForPrimaryGoal(catalog, profile, affinity, interactions, now) },
      { id: 'antes-trabajo', title: 'Para antes del trabajo', items: getBeforeWork(catalog, profile, affinity, interactions, now) },
      { id: 'despues-gym', title: 'Para después del gimnasio', items: getAfterGym(catalog, profile, affinity, interactions, now) },
      { id: 'fin-semana', title: 'Para el fin de semana', items: getWeekendPicks(catalog, profile, affinity, interactions, now) },
      { id: 'gratis', title: 'Recursos gratuitos', items: getFreeResources(catalog, profile, affinity, interactions, now) },
      { id: 'cursos-cortos', title: 'Cursos cortos', items: getShortCourses(catalog, profile, affinity, interactions, now) },
      { id: 'ingles', title: 'Para tu inglés', items: getForCategory(catalog, 'ingles', profile, affinity, interactions, now) },
      { id: 'salesforce', title: 'Para avanzar en Salesforce', items: getForCategory(catalog, 'salesforce', profile, affinity, interactions, now) },
      { id: 'entrenamiento', title: 'Para tu entrenamiento', items: getForTraining(catalog, profile, affinity, interactions, now) },
      { id: 'libros', title: 'Libros que encajan con tus intereses', items: getMatchingBooks(catalog, profile, affinity, interactions, now) },
      { id: 'explorar', title: 'Algo diferente para explorar', items: exploratory ? [exploratory] : [] },
      { id: 'porque-completaste', title: becauseCompleted ? `Porque completaste "${becauseCompleted.basedOn.title}"` : '', items: becauseCompleted?.items ?? [] },
      { id: 'similares', title: 'Más en tu línea', items: getSimilarToInterests(catalog, profile, affinity, interactions, now) },
      { id: 'olvidadas', title: 'Guardadas que quizá se te olvidaron', items: getForgottenSaved(catalog, interactions, now) },
    ];
    return raw.filter(s => s.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, profile, affinity, interactions]);

  const savedItems = useMemo(() => catalog.filter(item => interactions[item.id]?.status === 'saved'), [catalog, interactions]);
  const completedItems = useMemo(() => catalog.filter(item => interactions[item.id]?.status === 'completed'), [catalog, interactions]);
  const dismissedItems = useMemo(() => catalog.filter(item => interactions[item.id]?.status === 'dismissed'), [catalog, interactions]);

  return {
    profile, affinity, interactions, weeklyPlan, catalog, customItems,
    scoredCatalog, sections, savedItems, completedItems, dismissedItems,
    markCompleted, undoComplete, toggleSaved, dismiss, undoDismiss, rate, markViewed, addFeedback,
    updateProfile, regenerateWeeklyPlan, importCustomItemsFromJson, removeCustomItem,
    regenCap: REGEN_CAP,
  };
}
