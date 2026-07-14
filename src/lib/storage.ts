import type { AppState } from '../types';
import { defaultAttributes, defaultAttributeXP } from './attributes';
import { defaultRecommendationProfile } from '../data/recommendationProfile';
import { defaultCategoryAffinity } from '../data/recommendations';
import { MODES } from './pomodoroModes';

function defaultPomodoroSession(): AppState['pomodoroSession'] {
  return { modeId: '25', isBreak: false, running: false, endsAt: null, remainingSeconds: MODES[0].workSeconds };
}

const KEYS = {
  profile: 'rpg_profile',
  xp: 'rpg_xp',
  habits: 'rpg_habits',
  missions: 'rpg_missions',
  missionTemplates: 'rpg_mission_templates',
  studySessions: 'rpg_study',
  focusLinks: 'rpg_focus_links',
  pomodoro: 'rpg_pomodoro',
  pomodoroPrefs: 'rpg_pomodoro_prefs',
  pomodoroSession: 'rpg_pomodoro_session',
  transactions: 'rpg_transactions',
  recurringExpenses: 'rpg_recurring_expenses',
  financeAccounts: 'rpg_finance_accounts',
  rewards: 'rpg_rewards',
  monthlyReviews: 'rpg_monthly_reviews',
  badHabits: 'rpg_bad_habits',
  books: 'rpg_books',
  projects: 'rpg_projects',
  customRecommendations: 'rpg_custom_recommendations',
  recommendationsProgress: 'rpg_recommendations_progress',
  savedLinks: 'rpg_saved_links',
  quickLinks: 'rpg_quick_links',
  unlockedAchievements: 'rpg_unlocked_achievements',
  recommendationProfile: 'rpg_recommendation_profile',
  recommendationInteractions: 'rpg_recommendation_interactions',
  recommendationAffinity: 'rpg_recommendation_affinity',
  recommendationWeeklyPlan: 'rpg_recommendation_weekly_plan',
  recommendationCustomItems: 'rpg_recommendation_custom_items',
  backupReminder: 'rpg_backup_reminder',
} as const;

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  keys: KEYS,

  getProfile: () => {
    const profile = get<AppState['profile']>(KEYS.profile, {
      name: 'Samu',
      title: 'Developer en entrenamiento',
      avatarUrl: '',
      mainGoal: 'Certificarme en Salesforce',
      accentColor: 'blue',
      attributes: defaultAttributes(),
      attributeXP: defaultAttributeXP(),
    });
    return {
      ...profile,
      attributes: profile.attributes ?? defaultAttributes(),
      attributeXP: profile.attributeXP ?? defaultAttributeXP(),
    };
  },
  setProfile: (v: AppState['profile']) => set(KEYS.profile, v),

  getXP: () => {
    const xp = get<AppState['xp']>(KEYS.xp, {
      total: 0,
      level: 1,
      streak: 0,
      lastActiveDate: '',
      gold: 0,
    });
    return { ...xp, gold: xp.gold ?? 0 };
  },
  setXP: (v: AppState['xp']) => set(KEYS.xp, v),

  getHabits: () => get<AppState['habits']>(KEYS.habits, []),
  setHabits: (v: AppState['habits']) => set(KEYS.habits, v),

  getMissions: () => get<AppState['missions']>(KEYS.missions, []),
  setMissions: (v: AppState['missions']) => set(KEYS.missions, v),

  getMissionTemplates: () => get<AppState['missionTemplates']>(KEYS.missionTemplates, []),
  setMissionTemplates: (v: AppState['missionTemplates']) => set(KEYS.missionTemplates, v),

  getStudySessions: () => get<AppState['studySessions']>(KEYS.studySessions, []),
  setStudySessions: (v: AppState['studySessions']) => set(KEYS.studySessions, v),

  getFocusLinks: () => get<AppState['focusLinks']>(KEYS.focusLinks, []),
  setFocusLinks: (v: AppState['focusLinks']) => set(KEYS.focusLinks, v),

  getPomodoro: () => get<AppState['pomodoro']>(KEYS.pomodoro, { completedToday: 0, lastDate: '' }),
  setPomodoro: (v: AppState['pomodoro']) => set(KEYS.pomodoro, v),

  getPomodoroPrefs: () => get<AppState['pomodoroPrefs']>(KEYS.pomodoroPrefs, { sound: true, notifications: false }),
  setPomodoroPrefs: (v: AppState['pomodoroPrefs']) => set(KEYS.pomodoroPrefs, v),

  getPomodoroSession: () => get<AppState['pomodoroSession']>(KEYS.pomodoroSession, defaultPomodoroSession()),
  setPomodoroSession: (v: AppState['pomodoroSession']) => set(KEYS.pomodoroSession, v),

  getTransactions: () => get<AppState['transactions']>(KEYS.transactions, []),
  setTransactions: (v: AppState['transactions']) => set(KEYS.transactions, v),

  getRecurringExpenses: () => get<AppState['recurringExpenses']>(KEYS.recurringExpenses, []),
  setRecurringExpenses: (v: AppState['recurringExpenses']) => set(KEYS.recurringExpenses, v),

  getFinanceAccounts: () => get<AppState['financeAccounts']>(KEYS.financeAccounts, { account: 0, savings: 0, history: [] }),
  setFinanceAccounts: (v: AppState['financeAccounts']) => set(KEYS.financeAccounts, v),

  getRewards: () => get<AppState['rewards']>(KEYS.rewards, []),
  setRewards: (v: AppState['rewards']) => set(KEYS.rewards, v),

  getMonthlyReviews: () => get<AppState['monthlyReviews']>(KEYS.monthlyReviews, []),
  setMonthlyReviews: (v: AppState['monthlyReviews']) => set(KEYS.monthlyReviews, v),

  getBadHabits: () => get<AppState['badHabits']>(KEYS.badHabits, []),
  setBadHabits: (v: AppState['badHabits']) => set(KEYS.badHabits, v),

  getBooks: () => get<AppState['books']>(KEYS.books, []),
  setBooks: (v: AppState['books']) => set(KEYS.books, v),

  getProjects: () => get<AppState['projects']>(KEYS.projects, []),
  setProjects: (v: AppState['projects']) => set(KEYS.projects, v),

  getCustomRecommendations: () => get<AppState['customRecommendations']>(KEYS.customRecommendations, []),
  setCustomRecommendations: (v: AppState['customRecommendations']) => set(KEYS.customRecommendations, v),

  getRecommendationsProgress: () => get<AppState['recommendationsProgress']>(KEYS.recommendationsProgress, []),
  setRecommendationsProgress: (v: AppState['recommendationsProgress']) => set(KEYS.recommendationsProgress, v),

  getSavedLinks: () => get<AppState['savedLinks']>(KEYS.savedLinks, []),
  setSavedLinks: (v: AppState['savedLinks']) => set(KEYS.savedLinks, v),

  getQuickLinks: () => get<AppState['quickLinks']>(KEYS.quickLinks, []),
  setQuickLinks: (v: AppState['quickLinks']) => set(KEYS.quickLinks, v),

  getUnlockedAchievements: () => get<AppState['unlockedAchievements']>(KEYS.unlockedAchievements, []),
  setUnlockedAchievements: (v: AppState['unlockedAchievements']) => set(KEYS.unlockedAchievements, v),

  getRecommendationProfile: () => get<AppState['recommendationProfile']>(KEYS.recommendationProfile, defaultRecommendationProfile()),
  setRecommendationProfile: (v: AppState['recommendationProfile']) => set(KEYS.recommendationProfile, v),

  getRecommendationInteractions: () => get<AppState['recommendationInteractions']>(KEYS.recommendationInteractions, {}),
  setRecommendationInteractions: (v: AppState['recommendationInteractions']) => set(KEYS.recommendationInteractions, v),

  getRecommendationAffinity: () => get<AppState['recommendationAffinity']>(KEYS.recommendationAffinity, defaultCategoryAffinity()),
  setRecommendationAffinity: (v: AppState['recommendationAffinity']) => set(KEYS.recommendationAffinity, v),

  getRecommendationWeeklyPlan: () => get<AppState['recommendationWeeklyPlan']>(KEYS.recommendationWeeklyPlan, null),
  setRecommendationWeeklyPlan: (v: AppState['recommendationWeeklyPlan']) => set(KEYS.recommendationWeeklyPlan, v),

  getRecommendationCustomItems: () => get<AppState['recommendationCustomItems']>(KEYS.recommendationCustomItems, []),
  setRecommendationCustomItems: (v: AppState['recommendationCustomItems']) => set(KEYS.recommendationCustomItems, v),

  getBackupReminder: () => get<AppState['backupReminder']>(KEYS.backupReminder, { lastExportAt: null, lastDismissedAt: null }),
  setBackupReminder: (v: AppState['backupReminder']) => set(KEYS.backupReminder, v),

  exportAll(): string {
    const data: AppState = {
      profile: this.getProfile(),
      xp: this.getXP(),
      habits: this.getHabits(),
      missions: this.getMissions(),
      missionTemplates: this.getMissionTemplates(),
      studySessions: this.getStudySessions(),
      focusLinks: this.getFocusLinks(),
      pomodoro: this.getPomodoro(),
      pomodoroPrefs: this.getPomodoroPrefs(),
      pomodoroSession: this.getPomodoroSession(),
      transactions: this.getTransactions(),
      recurringExpenses: this.getRecurringExpenses(),
      financeAccounts: this.getFinanceAccounts(),
      rewards: this.getRewards(),
      monthlyReviews: this.getMonthlyReviews(),
      badHabits: this.getBadHabits(),
      books: this.getBooks(),
      projects: this.getProjects(),
      customRecommendations: this.getCustomRecommendations(),
      recommendationsProgress: this.getRecommendationsProgress(),
      savedLinks: this.getSavedLinks(),
      quickLinks: this.getQuickLinks(),
      unlockedAchievements: this.getUnlockedAchievements(),
      recommendationProfile: this.getRecommendationProfile(),
      recommendationInteractions: this.getRecommendationInteractions(),
      recommendationAffinity: this.getRecommendationAffinity(),
      recommendationWeeklyPlan: this.getRecommendationWeeklyPlan(),
      recommendationCustomItems: this.getRecommendationCustomItems(),
      backupReminder: this.getBackupReminder(),
    };
    return JSON.stringify(data, null, 2);
  },

  importAll(json: string): void {
    const data = JSON.parse(json) as Partial<AppState>;
    if (data.profile) this.setProfile(data.profile);
    if (data.xp) this.setXP(data.xp);
    if (data.habits) this.setHabits(data.habits);
    if (data.missions) this.setMissions(data.missions);
    if (data.missionTemplates) this.setMissionTemplates(data.missionTemplates);
    if (data.studySessions) this.setStudySessions(data.studySessions);
    if (data.focusLinks) this.setFocusLinks(data.focusLinks);
    if (data.pomodoro) this.setPomodoro(data.pomodoro);
    if (data.pomodoroPrefs) this.setPomodoroPrefs(data.pomodoroPrefs);
    if (data.pomodoroSession) this.setPomodoroSession(data.pomodoroSession);
    if (data.transactions) this.setTransactions(data.transactions);
    if (data.recurringExpenses) this.setRecurringExpenses(data.recurringExpenses);
    if (data.financeAccounts) this.setFinanceAccounts(data.financeAccounts);
    if (data.rewards) this.setRewards(data.rewards);
    if (data.monthlyReviews) this.setMonthlyReviews(data.monthlyReviews);
    if (data.badHabits) this.setBadHabits(data.badHabits);
    if (data.books) this.setBooks(data.books);
    if (data.projects) this.setProjects(data.projects);
    if (data.customRecommendations) this.setCustomRecommendations(data.customRecommendations);
    if (data.recommendationsProgress) this.setRecommendationsProgress(data.recommendationsProgress);
    if (data.savedLinks) this.setSavedLinks(data.savedLinks);
    if (data.quickLinks) this.setQuickLinks(data.quickLinks);
    if (data.unlockedAchievements) this.setUnlockedAchievements(data.unlockedAchievements);
    if (data.recommendationProfile) this.setRecommendationProfile(data.recommendationProfile);
    if (data.recommendationInteractions) this.setRecommendationInteractions(data.recommendationInteractions);
    if (data.recommendationAffinity) this.setRecommendationAffinity(data.recommendationAffinity);
    if (data.recommendationWeeklyPlan) this.setRecommendationWeeklyPlan(data.recommendationWeeklyPlan);
    if (data.recommendationCustomItems) this.setRecommendationCustomItems(data.recommendationCustomItems);
    if (data.backupReminder) this.setBackupReminder(data.backupReminder);
  },

  clearAll(): void {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  },
};
