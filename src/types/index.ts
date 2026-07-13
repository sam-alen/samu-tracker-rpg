// ─── RPG Attributes ──────────────────────────────────────────────────────────
// Ported from the sibling Android app (STR/INT/DEX/VIT/WIS/CHA). No GOLD
// attribute here — this web app already has a real spendable "oro" currency
// and a full Finanzas module, so a duplicate abstract finance stat would be
// redundant and confusing next to the actual gold chip.

export type RPGAttribute = 'STR' | 'INT' | 'DEX' | 'VIT' | 'WIS' | 'CHA';

export interface PlayerAttributes {
  STR: number;
  INT: number;
  DEX: number;
  VIT: number;
  WIS: number;
  CHA: number;
}

/** Leftover XP toward each attribute's next point (0 to ATTRIBUTE_XP_PER_POINT-1) */
export type AttributeXP = Record<RPGAttribute, number>;

// ─── Profile ────────────────────────────────────────────────────────────────

export interface Profile {
  name: string;
  title: string;
  avatarUrl: string;
  mainGoal: string;
  accentColor: 'blue' | 'purple' | 'gold';
  /** May be missing in old saves — always fall back to defaultAttributes() */
  attributes?: PlayerAttributes;
  /** May be missing in old saves — always fall back to defaultAttributeXP() */
  attributeXP?: AttributeXP;
}

// ─── XP / Level ─────────────────────────────────────────────────────────────

export interface XPState {
  total: number;
  level: number;
  streak: number;
  lastActiveDate: string; // ISO date string YYYY-MM-DD
  gold: number; // spendable currency; may be missing in old saves → treat as 0
  /** How many reward-granting actions happened on lastActiveDate. When the
   *  last one of the day is undone, the streak bump for today reverts too.
   *  May be missing in old saves → treat as 0. */
  actionsToday?: number;
  /** lastActiveDate's value from before today's streak bump, so a full
   *  same-day revert can restore it exactly. May be missing in old saves. */
  previousActiveDate?: string;
}

// ─── Habits ─────────────────────────────────────────────────────────────────

export interface Habit {
  id: string;
  name: string;
  icon: string;
  completedDates: string[]; // ISO date strings
  createdAt: string;
  /** May be missing in old saves — default to a fallback attribute when reading */
  attribute?: RPGAttribute;
}

// ─── Missions ───────────────────────────────────────────────────────────────

export type MissionStatus = 'pending' | 'done';

/** Difficulty ladder — the top two tiers double as "boss fight" / "dungeon"
 *  framing for genuinely demanding, multi-session missions. Drives the XP
 *  (and therefore attribute XP) multiplier via lib/missionDifficulty.ts. */
export type MissionDifficulty = 'facil' | 'normal' | 'dificil' | 'epica' | 'boss' | 'mazmorra';

export interface Mission {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD – the day this mission belongs to (creation day for special missions)
  status: MissionStatus;
  createdAt: string;
  /** May be missing in old saves — default to a fallback attribute when reading */
  attribute?: RPGAttribute;
  /** Present if this instance was generated from a MissionTemplate */
  templateId?: string;
  /** Missing in old saves — defaults to 'normal' when reading */
  difficulty?: MissionDifficulty;
  /** Purely informational estimate of effort, in days */
  estimatedDays?: number;
  /** true = doesn't reset with `date` — lives in "Misiones especiales" until
   *  completed or past its deadline, instead of only appearing "today" */
  special?: boolean;
  /** Optional deadline for special missions, ISO date (YYYY-MM-DD) */
  deadline?: string;
  /** Actual XP granted when marked done — reverting always uses this exact
   *  stored amount (not a recompute from the mission's *current* difficulty),
   *  so editing difficulty after completion can never desync gain/undo. */
  xpAwarded?: number;
}

/** A recurring mission definition. Each active day, a Mission instance is
 *  created from it (linked via templateId) — deactivating or deleting a
 *  template never touches past instances, so history stays intact. */
export interface MissionTemplate {
  id: string;
  title: string;
  attribute?: RPGAttribute;
  active: boolean;
  createdAt: string;
  difficulty?: MissionDifficulty;
  estimatedDays?: number;
}

// ─── Study ──────────────────────────────────────────────────────────────────

export type StudyArea =
  | 'Salesforce Admin'
  | 'Salesforce Developer'
  | 'Apex'
  | 'LWC'
  | 'JavaScript'
  | 'Git / DevOps'
  | 'Inglés técnico'
  | 'Arquitectura / Clean Code'
  | 'Otro';

export type FocusLevel = 1 | 2 | 3 | 4 | 5;

export interface StudySession {
  id: string;
  date: string;
  topic: string;
  area: StudyArea;
  durationMinutes: number;
  focusLevel: FocusLevel;
  notes: string;
  resources: string;
  xpAwarded: boolean;
}

// ─── Pomodoro ────────────────────────────────────────────────────────────────

export type FocusLinkCategory = 'focus' | 'gym' | 'worship' | 'ambient' | 'anime' | 'dev';

export interface FocusLink {
  id: string;
  name: string;
  url: string;
  category: FocusLinkCategory;
}

export interface PomodoroState {
  completedToday: number;
  lastDate: string;
  /** Lifetime count of completed work sessions (never resets, no undo path
   *  exists in the UI for a finished pomodoro — always append-only). May be
   *  missing in old saves — treat as 0. */
  totalCompleted?: number;
}

// ─── Finances ────────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense';
export type FinanceCategory =
  | 'Comida'
  | 'Transporte'
  | 'Familia'
  | 'Suscripciones'
  | 'Herramientas dev'
  | 'Educación'
  | 'Gym / salud'
  | 'Otros';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  category: FinanceCategory;
  note: string;
  /** true if this movement adjusted the account balance when created */
  appliedToBalance?: boolean;
}

/** Fixed monthly (passive) expense — rent, subscriptions, etc. */
export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: FinanceCategory;
  paidMonths: string[]; // 'YYYY-MM' entries already paid
}

export interface BalanceSnapshot {
  date: string; // YYYY-MM-DD
  account: number;
  savings: number;
}

export interface FinanceAccounts {
  account: number; // money in the main account
  savings: number; // money set aside
  history: BalanceSnapshot[]; // evolution over time, one entry per day with changes
}

// ─── Rewards ─────────────────────────────────────────────────────────────────

export interface Reward {
  id: string;
  title: string;
  goldCost: number;
  /** Legacy field from the XP-priced shop; migrated to goldCost on read */
  xpCost?: number;
  claimedAt?: string; // ISO datetime if claimed
}

// ─── Monthly Review ──────────────────────────────────────────────────────────

export interface MonthlyReview {
  id: string;
  month: string; // e.g. "2026-05"
  achievements: string;
  failures: string;
  learnings: string;
  improvements: string;
  mainWins: string;
  mainDistractions: string;
  nextMonthFocus: string;
  createdAt: string;
}

// ─── Bad Habits ───────────────────────────────────────────────────────────────

export interface BadHabit {
  id: string;
  name: string;
  icon: string;
  relapses: string[]; // ISO date strings when relapse occurred
  createdAt: string;
}

// ─── Books ───────────────────────────────────────────────────────────────────

export type BookStatus = 'want-to-read' | 'reading' | 'done' | 'dropped';

export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  rating: number; // 0-5
  notes: string;
  startDate: string;
  finishDate: string;
  totalPages: number;
  currentPage: number;
  createdAt: string;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export type ProjectStatus = 'idea' | 'active' | 'paused' | 'done';

export interface ProjectTask {
  id: string;
  name: string;
  done: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  tasks: ProjectTask[];
  createdAt: string;
}

// ─── Recommendations ────────────────────────────────────────────────────────
// "Recomendado para ti" — personalized recommendation engine. Catalog items
// live in code (data/recommendations.ts), never localStorage. Only the
// user's profile/interactions/affinity/weekly-plan snapshot is persisted.

export type RecommendationCategory =
  | 'salesforce' | 'programacion' | 'ia' | 'sql-datos' | 'certificaciones'
  | 'ingles' | 'gimnasio' | 'nutricion' | 'habitos-productividad'
  | 'filosofia-pensamiento-critico' | 'psicologia-comportamiento'
  | 'fantasia-scifi' | 'videojuegos' | 'entretenimiento'
  | 'proposito-crecimiento-personal' | 'desarrollo-profesional' | 'finanzas';

/** Coarser grouping used for the 6 editable weight sliders. 'exploratorio'
 *  has no categories hard-mapped to it — it's a sampling behavior, not a
 *  fixed bucket (see pickExploratoryItem in lib/recommendations.ts). */
export type RecommendationBucket =
  | 'desarrollo-profesional' | 'salud' | 'ingles'
  | 'habitos-crecimiento' | 'hobbies-entretenimiento' | 'exploratorio';

export type RecommendationType =
  | 'youtube' | 'book' | 'audiobook' | 'course' | 'learning-path' | 'podcast'
  | 'article' | 'documentary' | 'movie-series' | 'video-game'
  | 'coding-exercise' | 'practical-project' | 'gym-routine' | 'recipe'
  | 'habit' | 'weekly-challenge' | 'tool-app' | 'certification'
  | 'community' | 'official-resource';

export type RecommendationDifficulty = 'principiante' | 'intermedio' | 'avanzado';
export type RecommendationCost = 'gratis' | 'pago-unico' | 'suscripcion';
export type RecommendationLanguage = 'es' | 'en' | 'ambos';

/** Built-in catalog item — content lives in data/recommendations.ts, never
 *  localStorage. Replaces the old CuratedRecommendation with a much richer
 *  shape while keeping every existing id stable (old recommendationsProgress
 *  entries stay valid). */
export interface RecommendationItem {
  id: string;
  type: RecommendationType;
  category: RecommendationCategory;
  title: string;
  creator: string; // author / channel / platform / publisher
  description: string;
  /** Hand-authored, tied to Samu's real profile facts — not a generic blurb */
  whyForYou: string;
  /** References RecommendationProfile.goals[].id, if it maps to one */
  goalId?: string;
  difficulty: RecommendationDifficulty;
  /** Approx length of ONE sitting/session in minutes — drives time-block filters */
  timeMinutes: number;
  cost: RecommendationCost;
  language: RecommendationLanguage;
  /** Constructed search URL, or a genuinely stable official root domain — never a guessed deep link */
  link: string;
  tags: string[];
  /** Curator-assigned baseline importance, 1 (low) to 5 (high) */
  priority: 1 | 2 | 3 | 4 | 5;
  /** Editorial estimate, 0-5 — UI must label it as such, not a crowd rating */
  estimatedRating: number;
  /** ISO date the curator last confirmed this real resource genuinely exists */
  lastVerified: string;
  officialSource?: boolean;
  /** Powers "porque completaste X" */
  relatedItemIds?: string[];
}

/** User-added recommendation, fully CRUD like the rest of the app (kept as
 *  the "Mis enlaces" tab, unchanged behavior from the original feature) */
export interface CustomRecommendation {
  id: string;
  type: RecommendationType;
  category: RecommendationCategory;
  title: string;
  creator: string;
  note: string;
  createdAt: string;
}

// ─── Recommendation profile (editable "Mi perfil de recomendaciones") ────────

export interface RecommendationGoal {
  id: string;
  label: string;
}

export interface RecommendationSchedule {
  workStart: string; // 'HH:MM'
  workEnd: string;
  gymStart: string;
  gymEnd: string;
  weekdayFreeMinutes: number;
  weekendFreeMinutes: number;
}

export interface RecommendationProfile {
  profession: string;
  experienceLevel: 'junior' | 'mid' | 'senior-track';
  currentSkills: string[];
  skillsToLearn: string[];
  desiredCertifications: string[];
  goals: RecommendationGoal[];
  primaryGoalId: string;
  secondaryGoalIds: string[];
  hobbies: string[];
  favoriteGenres: string[];
  favoriteAuthors: string[];
  trainingType: string;
  physicalGoals: string[];
  dietaryRestrictions: string[];
  budget: 'gratis-only' | 'pago-ocasional' | 'suscripciones-ok';
  languages: string[];
  englishLevel: string;
  schedule: RecommendationSchedule;
  preferredFormats: RecommendationType[];
  favoritePlatforms: string[];
  excludedTopics: string[];
  recommendationIntensity: 'bajo' | 'medio' | 'alto';
  maxWeeklyRecommendations: number;
  categoryWeights: Record<RecommendationBucket, number>; // editable, should sum ~100
}

// ─── Recommendation interactions & learned affinity ──────────────────────────

export type RecommendationFeedbackFlag =
  | 'interesa' | 'no-interesa' | 'mas-como-esto' | 'menos-como-esto'
  | 'muy-basico' | 'muy-avanzado' | 'enlace-roto';

export interface RecommendationFeedbackEntry {
  flag: RecommendationFeedbackFlag;
  at: string; // ISO datetime
}

export interface RecommendationInteraction {
  itemId: string;
  status: 'none' | 'saved' | 'dismissed' | 'completed';
  rating?: 1 | 2 | 3 | 4 | 5;
  feedback: RecommendationFeedbackEntry[];
  brokenLink: boolean;
  lastViewedAt?: string;
  savedAt?: string;
  dismissedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

/** Learned nudge layer, -10..+10 per category, kept separate from the
 *  explicit editable profile — profile is what the user tells the app,
 *  affinity is what it infers from behavior. */
export type CategoryAffinity = Record<RecommendationCategory, number>;

export interface RecommendationWeeklyPlanSlot {
  role: 'principal' | 'secundario' | 'gimnasio' | 'ingles' | 'entretenimiento';
  itemId: string;
}

export interface RecommendationWeeklyPlan {
  week: string; // ISO week, e.g. '2026-W29'
  regenCount: number;
  excludedIds: string[];
  slots: RecommendationWeeklyPlanSlot[];
  explanation: string;
  generatedAt: string;
}

// ─── Saved Links ─────────────────────────────────────────────────────────────

export type LinkCategory = 'personal' | 'diversion' | 'mejora' | 'compras';

export interface SavedLink {
  id: string;
  title: string;
  url: string;
  category: LinkCategory;
  createdAt: string;
}

// ─── Backup reminder ───────────────────────────────────────────────────────────

export interface BackupReminderState {
  /** ISO datetime of the last time the user exported a backup, or null if never */
  lastExportAt: string | null;
  /** ISO datetime the reminder banner was last dismissed, or null if never shown/dismissed */
  lastDismissedAt: string | null;
}

// ─── Full App State ───────────────────────────────────────────────────────────

export interface AppState {
  profile: Profile;
  xp: XPState;
  habits: Habit[];
  missions: Mission[];
  missionTemplates: MissionTemplate[];
  studySessions: StudySession[];
  focusLinks: FocusLink[];
  pomodoro: PomodoroState;
  transactions: Transaction[];
  recurringExpenses: RecurringExpense[];
  financeAccounts: FinanceAccounts;
  rewards: Reward[];
  monthlyReviews: MonthlyReview[];
  badHabits: BadHabit[];
  books: Book[];
  projects: Project[];
  customRecommendations: CustomRecommendation[];
  recommendationsProgress: string[];
  recommendationProfile: RecommendationProfile;
  recommendationInteractions: Record<string, RecommendationInteraction>;
  recommendationAffinity: CategoryAffinity;
  recommendationWeeklyPlan: RecommendationWeeklyPlan | null;
  savedLinks: SavedLink[];
  unlockedAchievements: string[];
  backupReminder: BackupReminderState;
}
