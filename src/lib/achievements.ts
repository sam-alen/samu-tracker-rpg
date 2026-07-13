import {
  Footprints, Target, Compass, Crown, Trophy,
  Flame, ShieldCheck, CalendarCheck, Layers, Medal,
  Star, Gem, Scale, BookOpenCheck, Sparkles,
  Sunrise, Shield, Swords, Rocket, Sun, Milestone,
  Zap, Waves, TrendingUp, Gauge, Coins, Wallet,
  PiggyBank, Landmark, Vault, CalendarDays, Anchor,
  Clock, Timer, BookMarked, GraduationCap, Library,
  NotebookPen, FileText, ScrollText, Album, Archive, Boxes,
  Hammer, Wrench, ListChecks, CheckCheck, Unlock,
  ThumbsUp, Gift, Receipt, Banknote, Award,
  type LucideIcon,
} from 'lucide-react';
import { storage } from './storage';
import { fx } from './fx';
import { todayISO } from './xp';
import { getTotalXP } from './titles';
import { ATTRIBUTES, ATTRIBUTE_TIERS } from './attributes';
import type {
  Habit, Mission, PlayerAttributes, XPState, StudySession, PomodoroState,
  Book, Project, BadHabit,
} from '../types';

export type AchievementCategory =
  | 'misiones' | 'habitos' | 'atributos'
  | 'nivel' | 'enfoque' | 'proyectos' | 'disciplina'
  | 'crecimiento' | 'tesoreria' | 'meta';

export interface Achievement {
  id: string;
  category: AchievementCategory;
  title: string; // the earned title, e.g. "Estratega"
  description: string;
  icon: LucideIcon;
  goldReward: number;
  /** Current progress vs. requirement, given the live stats snapshot */
  progress: (stats: AchievementStats) => { current: number; target: number };
}

export interface AchievementStats {
  totalMissionsDone: number;
  totalHabitCompletions: number;
  attributes: PlayerAttributes;
  level: number;
  totalXP: number;
  streak: number;
  gold: number;
  studyMinutes: number;
  studySessionCount: number;
  pomodoroCompleted: number;
  booksFinished: number;
  projectsCompleted: number;
  tasksCompleted: number;
  bestCleanStreak: number;
  recommendationsCompleted: number;
  monthlyReviewsWritten: number;
  rewardsClaimed: number;
  transactionsLogged: number;
  savings: number;
  unlockedCount: number;
}

// ─── Stat derivation ────────────────────────────────────────────────────────
// Every counter is derived live from data that already exists elsewhere in
// the app (habits/missions/etc. carry their own history), inheriting the
// same add/undo symmetry already established there. Nothing here is a new
// tracked counter except PomodoroState.totalCompleted (append-only, no undo
// path exists in the UI for a finished pomodoro) and unlockedCount (the
// achievement system's own ratchet, read before this pass began).

function maxAttributePoints(attrs: PlayerAttributes): number {
  return Math.max(...ATTRIBUTES.map(a => attrs[a] ?? 0));
}

function totalAttributePoints(attrs: PlayerAttributes): number {
  return ATTRIBUTES.reduce((sum, a) => sum + (attrs[a] ?? 0), 0);
}

function countAttributesAtLeast(attrs: PlayerAttributes, min: number): number {
  return ATTRIBUTES.filter(a => (attrs[a] ?? 0) >= min).length;
}

const tierMin = (name: string) => ATTRIBUTE_TIERS.find(t => t.name === name)!.min;

function cleanStreakDays(b: BadHabit, today: string): number {
  const last = ([...b.relapses].sort().pop() ?? b.createdAt).slice(0, 10);
  return Math.max(0, Math.floor((new Date(today + 'T00:00:00').getTime() - new Date(last + 'T00:00:00').getTime()) / 86400000));
}

export function computeStats(
  habits: Habit[],
  missions: Mission[],
  attributes: PlayerAttributes,
  xp: XPState,
  studySessions: StudySession[],
  pomodoro: PomodoroState,
  books: Book[],
  projects: Project[],
  badHabits: BadHabit[],
  recommendationsCompleted: number,
  monthlyReviewsWritten: number,
  rewardsClaimed: number,
  transactionsLogged: number,
  savings: number,
  unlockedCount: number,
): AchievementStats {
  const today = todayISO();
  return {
    totalMissionsDone: missions.filter(m => m.status === 'done').length,
    totalHabitCompletions: habits.reduce((sum, h) => sum + h.completedDates.length, 0),
    attributes,
    level: xp.level,
    totalXP: getTotalXP(xp),
    streak: xp.streak,
    gold: xp.gold ?? 0,
    studyMinutes: studySessions.reduce((sum, s) => sum + s.durationMinutes, 0),
    studySessionCount: studySessions.length,
    pomodoroCompleted: pomodoro.totalCompleted ?? 0,
    booksFinished: books.filter(b => b.status === 'done').length,
    projectsCompleted: projects.filter(p => p.status === 'done').length,
    tasksCompleted: projects.reduce((sum, p) => sum + p.tasks.filter(t => t.done).length, 0),
    bestCleanStreak: badHabits.length === 0 ? 0 : Math.max(...badHabits.map(b => cleanStreakDays(b, today))),
    recommendationsCompleted,
    monthlyReviewsWritten,
    rewardsClaimed,
    transactionsLogged,
    savings,
    unlockedCount,
  };
}

// ─── Definitions ────────────────────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
  // ── Misiones — total misiones completadas (histórico, baja si borras una completada) ──
  {
    id: 'mission-1', category: 'misiones', title: 'Primer Paso',
    description: 'Completa tu primera misión', icon: Footprints, goldReward: 20,
    progress: s => ({ current: s.totalMissionsDone, target: 1 }),
  },
  {
    id: 'mission-10', category: 'misiones', title: 'Cazador de Tareas',
    description: 'Completa 10 misiones', icon: Target, goldReward: 50,
    progress: s => ({ current: s.totalMissionsDone, target: 10 }),
  },
  {
    id: 'mission-50', category: 'misiones', title: 'Estratega',
    description: 'Completa 50 misiones', icon: Compass, goldReward: 150,
    progress: s => ({ current: s.totalMissionsDone, target: 50 }),
  },
  {
    id: 'mission-150', category: 'misiones', title: 'Comandante de Misiones',
    description: 'Completa 150 misiones', icon: Crown, goldReward: 400,
    progress: s => ({ current: s.totalMissionsDone, target: 150 }),
  },
  {
    id: 'mission-500', category: 'misiones', title: 'Leyenda de la Ejecución',
    description: 'Completa 500 misiones', icon: Trophy, goldReward: 1000,
    progress: s => ({ current: s.totalMissionsDone, target: 500 }),
  },

  // ── Hábitos — total de check-ins acumulados en todos tus hábitos ──
  {
    id: 'habit-1', category: 'habitos', title: 'El Comienzo',
    description: 'Completa tu primer hábito', icon: Flame, goldReward: 20,
    progress: s => ({ current: s.totalHabitCompletions, target: 1 }),
  },
  {
    id: 'habit-25', category: 'habitos', title: 'Constructor de Hábitos',
    description: 'Acumula 25 check-ins de hábitos', icon: ShieldCheck, goldReward: 60,
    progress: s => ({ current: s.totalHabitCompletions, target: 25 }),
  },
  {
    id: 'habit-100', category: 'habitos', title: 'Disciplina de Hierro',
    description: 'Acumula 100 check-ins de hábitos', icon: CalendarCheck, goldReward: 200,
    progress: s => ({ current: s.totalHabitCompletions, target: 100 }),
  },
  {
    id: 'habit-365', category: 'habitos', title: 'Un Año de Constancia',
    description: 'Acumula 365 check-ins de hábitos', icon: Layers, goldReward: 600,
    progress: s => ({ current: s.totalHabitCompletions, target: 365 }),
  },
  {
    id: 'habit-1000', category: 'habitos', title: 'Maestro de la Rutina',
    description: 'Acumula 1000 check-ins de hábitos', icon: Medal, goldReward: 1500,
    progress: s => ({ current: s.totalHabitCompletions, target: 1000 }),
  },

  // ── Atributos — basados en los rangos ya existentes (lib/attributes.ts) ──
  {
    id: 'attr-aprendiz', category: 'atributos', title: 'Especialización',
    description: 'Lleva un atributo a rango Aprendiz', icon: Star, goldReward: 50,
    progress: s => ({ current: Math.min(maxAttributePoints(s.attributes), tierMin('Aprendiz')), target: tierMin('Aprendiz') }),
  },
  {
    id: 'attr-experto', category: 'atributos', title: 'Dominio',
    description: 'Lleva un atributo a rango Experto', icon: Gem, goldReward: 300,
    progress: s => ({ current: Math.min(maxAttributePoints(s.attributes), tierMin('Experto')), target: tierMin('Experto') }),
  },
  {
    id: 'attr-leyenda', category: 'atributos', title: 'Ascendencia',
    description: 'Lleva un atributo a rango Leyenda', icon: Sparkles, goldReward: 1200,
    progress: s => ({ current: Math.min(maxAttributePoints(s.attributes), tierMin('Leyenda')), target: tierMin('Leyenda') }),
  },
  {
    id: 'attr-balance', category: 'atributos', title: 'Equilibrio Total',
    description: 'Lleva los 6 atributos a rango Competente', icon: Scale, goldReward: 500,
    progress: s => ({ current: countAttributesAtLeast(s.attributes, tierMin('Competente')), target: 6 }),
  },
  {
    id: 'attr-pantheon', category: 'atributos', title: 'Panteón de Estadísticas',
    description: 'Acumula 500 puntos de atributo en total', icon: BookOpenCheck, goldReward: 400,
    progress: s => ({ current: Math.min(totalAttributePoints(s.attributes), 500), target: 500 }),
  },

  // ── Nivel — nivel de personaje ──
  { id: 'level-5', category: 'nivel', title: 'Despertar del Poder', description: 'Alcanza el nivel 5', icon: Sunrise, goldReward: 40, progress: s => ({ current: Math.min(s.level, 5), target: 5 }) },
  { id: 'level-10', category: 'nivel', title: 'Guerrero Novato', description: 'Alcanza el nivel 10', icon: Shield, goldReward: 80, progress: s => ({ current: Math.min(s.level, 10), target: 10 }) },
  { id: 'level-15', category: 'nivel', title: 'Forjado en la Disciplina', description: 'Alcanza el nivel 15', icon: Swords, goldReward: 150, progress: s => ({ current: Math.min(s.level, 15), target: 15 }) },
  { id: 'level-20', category: 'nivel', title: 'Veterano', description: 'Alcanza el nivel 20', icon: Rocket, goldReward: 250, progress: s => ({ current: Math.min(s.level, 20), target: 20 }) },
  { id: 'level-25', category: 'nivel', title: 'Señor de la Rutina', description: 'Alcanza el nivel 25', icon: Compass, goldReward: 400, progress: s => ({ current: Math.min(s.level, 25), target: 25 }) },
  { id: 'level-30', category: 'nivel', title: 'Campeón Constante', description: 'Alcanza el nivel 30', icon: Crown, goldReward: 600, progress: s => ({ current: Math.min(s.level, 30), target: 30 }) },
  { id: 'level-40', category: 'nivel', title: 'Titán del Hábito', description: 'Alcanza el nivel 40', icon: Sun, goldReward: 1000, progress: s => ({ current: Math.min(s.level, 40), target: 40 }) },
  { id: 'level-50', category: 'nivel', title: 'Ascendido', description: 'Alcanza el nivel 50', icon: Milestone, goldReward: 2000, progress: s => ({ current: Math.min(s.level, 50), target: 50 }) },

  // ── Nivel — XP total acumulada de por vida ──
  { id: 'xp-500', category: 'nivel', title: 'Primeras Chispas', description: 'Acumula 500 XP en total', icon: Zap, goldReward: 30, progress: s => ({ current: Math.min(s.totalXP, 500), target: 500 }) },
  { id: 'xp-2000', category: 'nivel', title: 'Motor en Marcha', description: 'Acumula 2,000 XP en total', icon: Waves, goldReward: 100, progress: s => ({ current: Math.min(s.totalXP, 2000), target: 2000 }) },
  { id: 'xp-5000', category: 'nivel', title: 'Fuerza Imparable', description: 'Acumula 5,000 XP en total', icon: TrendingUp, goldReward: 250, progress: s => ({ current: Math.min(s.totalXP, 5000), target: 5000 }) },
  { id: 'xp-15000', category: 'nivel', title: 'Río de Experiencia', description: 'Acumula 15,000 XP en total', icon: Gauge, goldReward: 700, progress: s => ({ current: Math.min(s.totalXP, 15000), target: 15000 }) },
  { id: 'xp-50000', category: 'nivel', title: 'Océano de Esfuerzo', description: 'Acumula 50,000 XP en total', icon: Sparkles, goldReward: 2000, progress: s => ({ current: Math.min(s.totalXP, 50000), target: 50000 }) },

  // ── Nivel — racha de días activos ──
  { id: 'streak-3', category: 'nivel', title: 'Encendido', description: 'Alcanza una racha de 3 días', icon: Flame, goldReward: 15, progress: s => ({ current: Math.min(s.streak, 3), target: 3 }) },
  { id: 'streak-7', category: 'nivel', title: 'Una Semana Sólida', description: 'Alcanza una racha de 7 días', icon: CalendarDays, goldReward: 40, progress: s => ({ current: Math.min(s.streak, 7), target: 7 }) },
  { id: 'streak-14', category: 'nivel', title: 'Quincena de Hierro', description: 'Alcanza una racha de 14 días', icon: CalendarCheck, goldReward: 80, progress: s => ({ current: Math.min(s.streak, 14), target: 14 }) },
  { id: 'streak-30', category: 'nivel', title: 'Mes Perfecto', description: 'Alcanza una racha de 30 días', icon: Anchor, goldReward: 150, progress: s => ({ current: Math.min(s.streak, 30), target: 30 }) },
  { id: 'streak-60', category: 'nivel', title: 'Bimestre de Acero', description: 'Alcanza una racha de 60 días', icon: Shield, goldReward: 300, progress: s => ({ current: Math.min(s.streak, 60), target: 60 }) },
  { id: 'streak-90', category: 'nivel', title: 'Trimestre Titánico', description: 'Alcanza una racha de 90 días', icon: Trophy, goldReward: 500, progress: s => ({ current: Math.min(s.streak, 90), target: 90 }) },
  { id: 'streak-365', category: 'nivel', title: 'Ciclo Completo', description: 'Alcanza una racha de 365 días', icon: Sun, goldReward: 3000, progress: s => ({ current: Math.min(s.streak, 365), target: 365 }) },

  // ── Nivel — oro disponible ──
  { id: 'gold-100', category: 'nivel', title: 'Primer Cofre', description: 'Ten 100 de oro disponible', icon: Coins, goldReward: 10, progress: s => ({ current: Math.min(s.gold, 100), target: 100 }) },
  { id: 'gold-500', category: 'nivel', title: 'Bolsillo Lleno', description: 'Ten 500 de oro disponible', icon: Wallet, goldReward: 30, progress: s => ({ current: Math.min(s.gold, 500), target: 500 }) },
  { id: 'gold-1500', category: 'nivel', title: 'Arcas Crecientes', description: 'Ten 1,500 de oro disponible', icon: PiggyBank, goldReward: 80, progress: s => ({ current: Math.min(s.gold, 1500), target: 1500 }) },
  { id: 'gold-5000', category: 'nivel', title: 'Tesoro Personal', description: 'Ten 5,000 de oro disponible', icon: Landmark, goldReward: 200, progress: s => ({ current: Math.min(s.gold, 5000), target: 5000 }) },
  { id: 'gold-15000', category: 'nivel', title: 'Fortuna Acumulada', description: 'Ten 15,000 de oro disponible', icon: Vault, goldReward: 500, progress: s => ({ current: Math.min(s.gold, 15000), target: 15000 }) },

  // ── Enfoque — minutos de estudio acumulados ──
  { id: 'study-min-60', category: 'enfoque', title: 'Primera Hora', description: 'Estudia 60 minutos en total', icon: Clock, goldReward: 15, progress: s => ({ current: Math.min(s.studyMinutes, 60), target: 60 }) },
  { id: 'study-min-300', category: 'enfoque', title: 'Cinco Horas Hondas', description: 'Estudia 300 minutos en total', icon: Timer, goldReward: 50, progress: s => ({ current: Math.min(s.studyMinutes, 300), target: 300 }) },
  { id: 'study-min-1000', category: 'enfoque', title: 'Mil Minutos de Foco', description: 'Estudia 1,000 minutos en total', icon: BookMarked, goldReward: 120, progress: s => ({ current: Math.min(s.studyMinutes, 1000), target: 1000 }) },
  { id: 'study-min-3000', category: 'enfoque', title: 'Estudiante Serio', description: 'Estudia 3,000 minutos en total', icon: GraduationCap, goldReward: 300, progress: s => ({ current: Math.min(s.studyMinutes, 3000), target: 3000 }) },
  { id: 'study-min-6000', category: 'enfoque', title: 'Erudito en Formación', description: 'Estudia 6,000 minutos en total', icon: Library, goldReward: 600, progress: s => ({ current: Math.min(s.studyMinutes, 6000), target: 6000 }) },
  { id: 'study-min-12000', category: 'enfoque', title: 'Sabio Autodidacta', description: 'Estudia 12,000 minutos en total', icon: Gauge, goldReward: 1200, progress: s => ({ current: Math.min(s.studyMinutes, 12000), target: 12000 }) },

  // ── Enfoque — sesiones de estudio registradas ──
  { id: 'study-sessions-1', category: 'enfoque', title: 'Primera Lección', description: 'Registra tu primera sesión de estudio', icon: NotebookPen, goldReward: 15, progress: s => ({ current: Math.min(s.studySessionCount, 1), target: 1 }) },
  { id: 'study-sessions-10', category: 'enfoque', title: 'Ritmo de Estudio', description: 'Registra 10 sesiones de estudio', icon: FileText, goldReward: 60, progress: s => ({ current: Math.min(s.studySessionCount, 10), target: 10 }) },
  { id: 'study-sessions-50', category: 'enfoque', title: 'Hábito Académico', description: 'Registra 50 sesiones de estudio', icon: ScrollText, goldReward: 200, progress: s => ({ current: Math.min(s.studySessionCount, 50), target: 50 }) },
  { id: 'study-sessions-200', category: 'enfoque', title: 'Maestría Constante', description: 'Registra 200 sesiones de estudio', icon: GraduationCap, goldReward: 600, progress: s => ({ current: Math.min(s.studySessionCount, 200), target: 200 }) },

  // ── Enfoque — sesiones Pomodoro completadas ──
  { id: 'pomo-1', category: 'enfoque', title: 'Primer Sprint', description: 'Completa tu primera sesión de enfoque', icon: Timer, goldReward: 15, progress: s => ({ current: Math.min(s.pomodoroCompleted, 1), target: 1 }) },
  { id: 'pomo-10', category: 'enfoque', title: 'Ritmo Pomodoro', description: 'Completa 10 sesiones de enfoque', icon: Zap, goldReward: 60, progress: s => ({ current: Math.min(s.pomodoroCompleted, 10), target: 10 }) },
  { id: 'pomo-50', category: 'enfoque', title: 'Foco Entrenado', description: 'Completa 50 sesiones de enfoque', icon: Gauge, goldReward: 200, progress: s => ({ current: Math.min(s.pomodoroCompleted, 50), target: 50 }) },
  { id: 'pomo-150', category: 'enfoque', title: 'Máquina de Enfoque', description: 'Completa 150 sesiones de enfoque', icon: Rocket, goldReward: 500, progress: s => ({ current: Math.min(s.pomodoroCompleted, 150), target: 150 }) },
  { id: 'pomo-500', category: 'enfoque', title: 'Guardián del Tiempo', description: 'Completa 500 sesiones de enfoque', icon: Crown, goldReward: 1200, progress: s => ({ current: Math.min(s.pomodoroCompleted, 500), target: 500 }) },
  { id: 'pomo-1000', category: 'enfoque', title: 'Leyenda del Pomodoro', description: 'Completa 1,000 sesiones de enfoque', icon: Trophy, goldReward: 2500, progress: s => ({ current: Math.min(s.pomodoroCompleted, 1000), target: 1000 }) },

  // ── Enfoque — libros terminados ──
  { id: 'books-1', category: 'enfoque', title: 'Primera Portada Cerrada', description: 'Termina tu primer libro', icon: BookMarked, goldReward: 20, progress: s => ({ current: Math.min(s.booksFinished, 1), target: 1 }) },
  { id: 'books-5', category: 'enfoque', title: 'Lector Constante', description: 'Termina 5 libros', icon: Library, goldReward: 80, progress: s => ({ current: Math.min(s.booksFinished, 5), target: 5 }) },
  { id: 'books-15', category: 'enfoque', title: 'Biblioteca Personal', description: 'Termina 15 libros', icon: Album, goldReward: 250, progress: s => ({ current: Math.min(s.booksFinished, 15), target: 15 }) },
  { id: 'books-30', category: 'enfoque', title: 'Devorador de Libros', description: 'Termina 30 libros', icon: Archive, goldReward: 600, progress: s => ({ current: Math.min(s.booksFinished, 30), target: 30 }) },
  { id: 'books-75', category: 'enfoque', title: 'Sabiduría de Papel', description: 'Termina 75 libros', icon: Boxes, goldReward: 1500, progress: s => ({ current: Math.min(s.booksFinished, 75), target: 75 }) },

  // ── Proyectos — completados ──
  { id: 'project-1', category: 'proyectos', title: 'Primer Lanzamiento', description: 'Completa tu primer proyecto', icon: Hammer, goldReward: 20, progress: s => ({ current: Math.min(s.projectsCompleted, 1), target: 1 }) },
  { id: 'project-5', category: 'proyectos', title: 'Constructor', description: 'Completa 5 proyectos', icon: Wrench, goldReward: 80, progress: s => ({ current: Math.min(s.projectsCompleted, 5), target: 5 }) },
  { id: 'project-15', category: 'proyectos', title: 'Arquitecto de Ideas', description: 'Completa 15 proyectos', icon: Rocket, goldReward: 250, progress: s => ({ current: Math.min(s.projectsCompleted, 15), target: 15 }) },
  { id: 'project-40', category: 'proyectos', title: 'Fábrica de Proyectos', description: 'Completa 40 proyectos', icon: Crown, goldReward: 700, progress: s => ({ current: Math.min(s.projectsCompleted, 40), target: 40 }) },

  // ── Proyectos — tareas completadas ──
  { id: 'task-5', category: 'proyectos', title: 'Primeras Piezas', description: 'Completa 5 tareas de proyectos', icon: ListChecks, goldReward: 15, progress: s => ({ current: Math.min(s.tasksCompleted, 5), target: 5 }) },
  { id: 'task-25', category: 'proyectos', title: 'Ejecutor', description: 'Completa 25 tareas de proyectos', icon: CheckCheck, goldReward: 60, progress: s => ({ current: Math.min(s.tasksCompleted, 25), target: 25 }) },
  { id: 'task-100', category: 'proyectos', title: 'Máquina de Tareas', description: 'Completa 100 tareas de proyectos', icon: Hammer, goldReward: 200, progress: s => ({ current: Math.min(s.tasksCompleted, 100), target: 100 }) },
  { id: 'task-300', category: 'proyectos', title: 'Imparable en la Ejecución', description: 'Completa 300 tareas de proyectos', icon: Trophy, goldReward: 500, progress: s => ({ current: Math.min(s.tasksCompleted, 300), target: 300 }) },

  // ── Disciplina — mejor racha limpia entre tus malos hábitos ──
  { id: 'clean-7', category: 'disciplina', title: 'Primera Semana Limpia', description: 'Mantén un mal hábito limpio 7 días', icon: ShieldCheck, goldReward: 40, progress: s => ({ current: Math.min(s.bestCleanStreak, 7), target: 7 }) },
  { id: 'clean-30', category: 'disciplina', title: 'Un Mes de Control', description: 'Mantén un mal hábito limpio 30 días', icon: Shield, goldReward: 150, progress: s => ({ current: Math.min(s.bestCleanStreak, 30), target: 30 }) },
  { id: 'clean-90', category: 'disciplina', title: 'Trimestre de Voluntad', description: 'Mantén un mal hábito limpio 90 días', icon: Flame, goldReward: 400, progress: s => ({ current: Math.min(s.bestCleanStreak, 90), target: 90 }) },
  { id: 'clean-180', category: 'disciplina', title: 'Medio Año Firme', description: 'Mantén un mal hábito limpio 180 días', icon: Sun, goldReward: 800, progress: s => ({ current: Math.min(s.bestCleanStreak, 180), target: 180 }) },
  { id: 'clean-365', category: 'disciplina', title: 'Un Año de Libertad', description: 'Mantén un mal hábito limpio 365 días', icon: Crown, goldReward: 2000, progress: s => ({ current: Math.min(s.bestCleanStreak, 365), target: 365 }) },

  // ── Crecimiento — recomendaciones completadas ──
  { id: 'rec-1', category: 'crecimiento', title: 'Primer Aprendizaje', description: 'Completa tu primera recomendación', icon: Compass, goldReward: 15, progress: s => ({ current: Math.min(s.recommendationsCompleted, 1), target: 1 }) },
  { id: 'rec-5', category: 'crecimiento', title: 'Curioso Constante', description: 'Completa 5 recomendaciones', icon: GraduationCap, goldReward: 50, progress: s => ({ current: Math.min(s.recommendationsCompleted, 5), target: 5 }) },
  { id: 'rec-10', category: 'crecimiento', title: 'Mitad del Camino', description: 'Completa 10 recomendaciones', icon: ThumbsUp, goldReward: 100, progress: s => ({ current: Math.min(s.recommendationsCompleted, 10), target: 10 }) },
  { id: 'rec-20', category: 'crecimiento', title: 'Guía Completada', description: 'Completa 20 recomendaciones', icon: Star, goldReward: 200, progress: s => ({ current: Math.min(s.recommendationsCompleted, 20), target: 20 }) },

  // ── Crecimiento — revisiones mensuales escritas ──
  { id: 'review-1', category: 'crecimiento', title: 'Primera Mirada Atrás', description: 'Escribe tu primera revisión mensual', icon: NotebookPen, goldReward: 20, progress: s => ({ current: Math.min(s.monthlyReviewsWritten, 1), target: 1 }) },
  { id: 'review-3', category: 'crecimiento', title: 'Trimestre Reflexivo', description: 'Escribe 3 revisiones mensuales', icon: FileText, goldReward: 80, progress: s => ({ current: Math.min(s.monthlyReviewsWritten, 3), target: 3 }) },
  { id: 'review-6', category: 'crecimiento', title: 'Medio Año de Introspección', description: 'Escribe 6 revisiones mensuales', icon: ScrollText, goldReward: 200, progress: s => ({ current: Math.min(s.monthlyReviewsWritten, 6), target: 6 }) },
  { id: 'review-12', category: 'crecimiento', title: 'Un Año Documentado', description: 'Escribe 12 revisiones mensuales', icon: CalendarDays, goldReward: 500, progress: s => ({ current: Math.min(s.monthlyReviewsWritten, 12), target: 12 }) },

  // ── Tesorería — recompensas canjeadas en la Tienda ──
  { id: 'reward-1', category: 'tesoreria', title: 'Primer Premio', description: 'Canjea tu primera recompensa', icon: Gift, goldReward: 15, progress: s => ({ current: Math.min(s.rewardsClaimed, 1), target: 1 }) },
  { id: 'reward-5', category: 'tesoreria', title: 'Sabes Disfrutar', description: 'Canjea 5 recompensas', icon: ThumbsUp, goldReward: 50, progress: s => ({ current: Math.min(s.rewardsClaimed, 5), target: 5 }) },
  { id: 'reward-15', category: 'tesoreria', title: 'Equilibrio Ganado', description: 'Canjea 15 recompensas', icon: Star, goldReward: 150, progress: s => ({ current: Math.min(s.rewardsClaimed, 15), target: 15 }) },
  { id: 'reward-30', category: 'tesoreria', title: 'Maestro de tus Recompensas', description: 'Canjea 30 recompensas', icon: Crown, goldReward: 350, progress: s => ({ current: Math.min(s.rewardsClaimed, 30), target: 30 }) },

  // ── Tesorería — transacciones registradas ──
  { id: 'tx-1', category: 'tesoreria', title: 'Primer Registro', description: 'Registra tu primer movimiento financiero', icon: Receipt, goldReward: 10, progress: s => ({ current: Math.min(s.transactionsLogged, 1), target: 1 }) },
  { id: 'tx-10', category: 'tesoreria', title: 'Control en Marcha', description: 'Registra 10 movimientos financieros', icon: FileText, goldReward: 40, progress: s => ({ current: Math.min(s.transactionsLogged, 10), target: 10 }) },
  { id: 'tx-50', category: 'tesoreria', title: 'Contador Disciplinado', description: 'Registra 50 movimientos financieros', icon: TrendingUp, goldReward: 120, progress: s => ({ current: Math.min(s.transactionsLogged, 50), target: 50 }) },
  { id: 'tx-150', category: 'tesoreria', title: 'Radiografía Financiera', description: 'Registra 150 movimientos financieros', icon: Banknote, goldReward: 300, progress: s => ({ current: Math.min(s.transactionsLogged, 150), target: 150 }) },

  // ── Tesorería — ahorro acumulado ──
  { id: 'save-100', category: 'tesoreria', title: 'Primeros Ahorros', description: 'Ten 100 ahorrados', icon: PiggyBank, goldReward: 20, progress: s => ({ current: Math.min(s.savings, 100), target: 100 }) },
  { id: 'save-1000', category: 'tesoreria', title: 'Colchón Financiero', description: 'Ten 1,000 ahorrados', icon: Wallet, goldReward: 150, progress: s => ({ current: Math.min(s.savings, 1000), target: 1000 }) },
  { id: 'save-5000', category: 'tesoreria', title: 'Reserva Sólida', description: 'Ten 5,000 ahorrados', icon: Vault, goldReward: 600, progress: s => ({ current: Math.min(s.savings, 5000), target: 5000 }) },
  { id: 'save-20000', category: 'tesoreria', title: 'Patrimonio en Crecimiento', description: 'Ten 20,000 ahorrados', icon: Landmark, goldReward: 2000, progress: s => ({ current: Math.min(s.savings, 20000), target: 20000 }) },

  // ── Meta — logros desbloqueados ──
  { id: 'meta-5', category: 'meta', title: 'Coleccionista Novato', description: 'Desbloquea 5 logros', icon: Unlock, goldReward: 50, progress: s => ({ current: Math.min(s.unlockedCount, 5), target: 5 }) },
  { id: 'meta-15', category: 'meta', title: 'Cazador de Logros', description: 'Desbloquea 15 logros', icon: Medal, goldReward: 150, progress: s => ({ current: Math.min(s.unlockedCount, 15), target: 15 }) },
  { id: 'meta-30', category: 'meta', title: 'Vitrina de Triunfos', description: 'Desbloquea 30 logros', icon: Trophy, goldReward: 350, progress: s => ({ current: Math.min(s.unlockedCount, 30), target: 30 }) },
  { id: 'meta-50', category: 'meta', title: 'Mitad de Leyenda', description: 'Desbloquea 50 logros', icon: Crown, goldReward: 700, progress: s => ({ current: Math.min(s.unlockedCount, 50), target: 50 }) },
  { id: 'meta-75', category: 'meta', title: 'Casi Legendario', description: 'Desbloquea 75 logros', icon: Sparkles, goldReward: 1200, progress: s => ({ current: Math.min(s.unlockedCount, 75), target: 75 }) },
  { id: 'meta-95', category: 'meta', title: 'Panteón de Samu', description: 'Desbloquea 95 logros', icon: Award, goldReward: 2500, progress: s => ({ current: Math.min(s.unlockedCount, 95), target: 95 }) },
];

// ─── Unlock check ───────────────────────────────────────────────────────────

/**
 * Re-evaluates all achievements against fresh, live state and unlocks any
 * newly-qualifying ones (persisting the gold reward + the permanent unlock
 * flag, and firing the celebration FX for each). Achievements are a ratchet:
 * once unlocked they stay unlocked even if the underlying live counter later
 * dips back below the requirement (e.g. deleting a completed mission) — the
 * gold was already paid out and isn't reclaimed either.
 *
 * `meta-*` achievements check `unlockedCount` as it stood BEFORE this pass —
 * they light up on the check *after* the count crosses their threshold, one
 * action later, avoiding any self-referential ordering weirdness.
 *
 * Reads/writes localStorage directly so it can be called as a plain function
 * from anywhere right after a reward-granting action, with no hook wiring.
 */
export function checkAchievements(): void {
  const habits = storage.getHabits();
  const missions = storage.getMissions();
  const profile = storage.getProfile();
  const attributes = profile.attributes ?? ATTRIBUTES.reduce((a, k) => ({ ...a, [k]: 0 }), {} as PlayerAttributes);
  const xp = storage.getXP();
  const studySessions = storage.getStudySessions();
  const pomodoro = storage.getPomodoro();
  const books = storage.getBooks();
  const projects = storage.getProjects();
  const badHabits = storage.getBadHabits();
  const recommendationsCompleted = storage.getRecommendationsProgress().length;
  const monthlyReviewsWritten = storage.getMonthlyReviews().length;
  const rewardsClaimed = storage.getRewards().filter(r => r.claimedAt).length;
  const transactionsLogged = storage.getTransactions().length;
  const savings = storage.getFinanceAccounts().savings;

  const unlocked = new Set(storage.getUnlockedAchievements());
  const stats = computeStats(
    habits, missions, attributes, xp, studySessions, pomodoro, books, projects,
    badHabits, recommendationsCompleted, monthlyReviewsWritten, rewardsClaimed,
    transactionsLogged, savings, unlocked.size,
  );

  let goldToAdd = 0;
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlocked.has(achievement.id)) continue;
    const { current, target } = achievement.progress(stats);
    if (current >= target) {
      unlocked.add(achievement.id);
      goldToAdd += achievement.goldReward;
      newlyUnlocked.push(achievement);
    }
  }

  if (newlyUnlocked.length === 0) return;

  storage.setUnlockedAchievements([...unlocked]);
  if (goldToAdd > 0) {
    const freshXP = storage.getXP();
    storage.setXP({ ...freshXP, gold: (freshXP.gold ?? 0) + goldToAdd });
  }

  // FxLayer queues 'achievement' events itself, so simultaneous unlocks
  // (e.g. crossing two thresholds in one action) display one after another
  // instead of overlapping.
  newlyUnlocked.forEach(achievement => {
    fx.emit({
      kind: 'achievement',
      title: achievement.title,
      description: achievement.description,
      gold: achievement.goldReward,
    });
  });
}

// ─── Dashboard teaser ───────────────────────────────────────────────────────

export interface ClosestAchievement {
  achievement: Achievement;
  current: number;
  target: number;
}

/** The not-yet-unlocked achievement with the highest completion ratio —
 *  "closest to landing" — for a Dashboard teaser card. Pure function of the
 *  same stats snapshot everything else here already builds. */
export function getClosestAchievement(stats: AchievementStats, unlocked: Set<string>): ClosestAchievement | null {
  let best: ClosestAchievement | null = null;
  let bestRatio = -1;

  for (const achievement of ACHIEVEMENTS) {
    if (unlocked.has(achievement.id)) continue;
    const { current, target } = achievement.progress(stats);
    const ratio = target > 0 ? current / target : 0;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = { achievement, current, target };
    }
  }

  return best;
}
