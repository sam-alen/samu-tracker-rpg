import type { Habit, Mission, Reward, FocusLink } from '../types';
import { todayISO } from '../lib/xp';

const today = todayISO();

export const initialHabits: Habit[] = [
  { id: 'h1', name: 'Levantarme temprano', icon: '🌅', attribute: 'VIT', completedDates: [], createdAt: today },
  { id: 'h2', name: 'Orar / devocional', icon: '🙏', attribute: 'WIS', completedDates: [], createdAt: today },
  { id: 'h3', name: 'Tomar agua', icon: '💧', attribute: 'VIT', completedDates: [], createdAt: today },
  { id: 'h4', name: 'Entrenar', icon: '💪', attribute: 'STR', completedDates: [], createdAt: today },
  { id: 'h5', name: 'Estudiar Salesforce', icon: '☁️', attribute: 'INT', completedDates: [], createdAt: today },
  { id: 'h6', name: 'Leer', icon: '📚', attribute: 'WIS', completedDates: [], createdAt: today },
  { id: 'h7', name: 'Dormir temprano', icon: '🌙', attribute: 'VIT', completedDates: [], createdAt: today },
];

export const initialMissions: Mission[] = [
  { id: 'm1', title: 'Completar rutina de mañana', attribute: 'DEX', date: today, status: 'pending', createdAt: today },
  { id: 'm2', title: 'Hacer 1 sesión de estudio profundo', attribute: 'INT', date: today, status: 'pending', createdAt: today },
  { id: 'm3', title: 'Entrenar', attribute: 'STR', date: today, status: 'pending', createdAt: today },
  { id: 'm4', title: 'Avanzar en un proyecto personal', attribute: 'DEX', date: today, status: 'pending', createdAt: today },
  { id: 'm5', title: 'Revisar finanzas del día', attribute: 'WIS', date: today, status: 'pending', createdAt: today },
];

export const initialRewards: Reward[] = [
  { id: 'r1', title: 'Ver una película', goldCost: 60 },
  { id: 'r2', title: 'Comprar algo pequeño', goldCost: 150 },
  { id: 'r3', title: 'Jugar videojuegos (2h)', goldCost: 80 },
  { id: 'r4', title: 'Descanso especial', goldCost: 100 },
  { id: 'r5', title: 'Comida especial', goldCost: 120 },
  { id: 'r6', title: 'Upgrade para setup', goldCost: 500 },
];

export const initialFocusLinks: FocusLink[] = [
  { id: 'l1', name: 'Lo-Fi Hip Hop Radio', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', category: 'focus' },
  { id: 'l2', name: 'Study with Me - Pomodoro', url: 'https://www.youtube.com/watch?v=t1uBEp3GQBU', category: 'focus' },
];

export const motivationalQuotes: string[] = [
  'La disciplina es el puente entre metas y logros.',
  'Cada día es una nueva oportunidad de ser mejor que ayer.',
  'El progreso, no la perfección.',
  'Haz hoy lo que otros no hacen para mañana tener lo que otros no tienen.',
  'La consistencia es lo que transforma el promedio en excelencia.',
  'Un día a la vez, un hábito a la vez.',
  'El éxito es la suma de pequeños esfuerzos repetidos día tras día.',
  'No cuentes los días. Haz que los días cuenten.',
  'Modo bestia activado. Sin excusas.',
  'Tu futuro yo te lo agradecerá.',
  'El talento te lleva al partido. El trabajo duro te mantiene en él.',
  'Disciplina > Motivación.',
];
