import { useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useXP } from './useXP';
import { storage } from '../lib/storage';
import { XP_REWARDS } from '../lib/xp';
import { fx } from '../lib/fx';
import { checkAchievements } from '../lib/achievements';
import { RECOMMENDATION_CATALOG } from '../data/recommendations';
import { defaultRecommendationProfile } from '../data/recommendationProfile';
import {
  computeAffinityDelta, generateWeeklyPlan, getAfterGym, getBecauseYouCompleted,
  getBeforeWork, getContinueLearning, getForCategory, getForPrimaryGoal, getForgottenSaved,
  getForTraining, getFreeResources, getISOWeek, getMatchingBooks, getShortCourses,
  getSimilarToInterests, getWeekendPicks, pickExploratoryItem, rankItems,
  type RecommendationSection, type ScoredItem,
} from '../lib/recommendations';
import type {
  CategoryAffinity, RecommendationFeedbackFlag, RecommendationInteraction,
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

  const now = new Date();
  const currentWeek = getISOWeek(now);

  // Deterministic given the same profile/interactions/affinity/date, so it's
  // safe to (re)compute on the fly without persisting — persistence only
  // happens explicitly via regenerateWeeklyPlan(), avoiding any write-during-
  // render/effect purity concern (same lesson learned with recurring missions).
  const weeklyPlan = weeklyPlanStored?.week === currentWeek
    ? weeklyPlanStored
    : generateWeeklyPlan(profile, affinity, interactions, now, 0, []);

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

    const item = RECOMMENDATION_CATALOG.find(i => i.id === id);
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

  const REGEN_CAP = 3;
  function regenerateWeeklyPlan() {
    const base = weeklyPlanStored?.week === currentWeek ? weeklyPlanStored : null;
    const regenCount = base?.regenCount ?? 0;
    if (regenCount >= REGEN_CAP) return;
    const excludedIds = [...(base?.excludedIds ?? []), ...(base?.slots.map(s => s.itemId) ?? [])];
    const next = generateWeeklyPlan(profile, affinity, interactions, now, regenCount + 1, excludedIds);
    storage.setRecommendationWeeklyPlan(next);
    setWeeklyPlanStored(next);
  }

  const scoredCatalog: ScoredItem[] = useMemo(
    () => rankItems(profile, affinity, interactions, { now }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, affinity, interactions],
  );

  const sections: RecommendationSection[] = useMemo(() => {
    const exploratory = pickExploratoryItem(profile, affinity, interactions, now);
    const becauseCompleted = getBecauseYouCompleted(interactions);
    const raw: RecommendationSection[] = [
      { id: 'continuar', title: 'Continúa aprendiendo', items: getContinueLearning(interactions) },
      { id: 'meta-principal', title: 'Para tu meta principal', items: getForPrimaryGoal(profile, affinity, interactions, now) },
      { id: 'antes-trabajo', title: 'Para antes del trabajo', items: getBeforeWork(profile, affinity, interactions, now) },
      { id: 'despues-gym', title: 'Para después del gimnasio', items: getAfterGym(profile, affinity, interactions, now) },
      { id: 'fin-semana', title: 'Para el fin de semana', items: getWeekendPicks(profile, affinity, interactions, now) },
      { id: 'gratis', title: 'Recursos gratuitos', items: getFreeResources(profile, affinity, interactions, now) },
      { id: 'cursos-cortos', title: 'Cursos cortos', items: getShortCourses(profile, affinity, interactions, now) },
      { id: 'ingles', title: 'Para tu inglés', items: getForCategory('ingles', profile, affinity, interactions, now) },
      { id: 'salesforce', title: 'Para avanzar en Salesforce', items: getForCategory('salesforce', profile, affinity, interactions, now) },
      { id: 'entrenamiento', title: 'Para tu entrenamiento', items: getForTraining(profile, affinity, interactions, now) },
      { id: 'libros', title: 'Libros que encajan con tus intereses', items: getMatchingBooks(profile, affinity, interactions, now) },
      { id: 'explorar', title: 'Algo diferente para explorar', items: exploratory ? [exploratory] : [] },
      { id: 'porque-completaste', title: becauseCompleted ? `Porque completaste "${becauseCompleted.basedOn.title}"` : '', items: becauseCompleted?.items ?? [] },
      { id: 'similares', title: 'Más en tu línea', items: getSimilarToInterests(profile, affinity, interactions, now) },
      { id: 'olvidadas', title: 'Guardadas que quizá se te olvidaron', items: getForgottenSaved(interactions, now) },
    ];
    return raw.filter(s => s.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, affinity, interactions]);

  const savedItems = useMemo(() => RECOMMENDATION_CATALOG.filter(item => interactions[item.id]?.status === 'saved'), [interactions]);
  const completedItems = useMemo(() => RECOMMENDATION_CATALOG.filter(item => interactions[item.id]?.status === 'completed'), [interactions]);
  const dismissedItems = useMemo(() => RECOMMENDATION_CATALOG.filter(item => interactions[item.id]?.status === 'dismissed'), [interactions]);

  return {
    profile, affinity, interactions, weeklyPlan,
    scoredCatalog, sections, savedItems, completedItems, dismissedItems,
    markCompleted, undoComplete, toggleSaved, dismiss, undoDismiss, rate, markViewed, addFeedback,
    updateProfile, regenerateWeeklyPlan,
    regenCap: REGEN_CAP,
  };
}
