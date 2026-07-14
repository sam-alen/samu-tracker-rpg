import type { Habit } from '../types';

/** Sun..Sat, matching Date.getDay() index — the single source of truth for
 *  this label set (previously duplicated separately in a couple of places). */
export const DAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
export const DAY_LABELS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
/** Handy preset for the common "weekdays only" case (e.g. a gym routine Mon–Fri) */
export const WEEKDAYS = [1, 2, 3, 4, 5];

export function isHabitScheduledOn(habit: Habit, dayOfWeek: number): boolean {
  return !habit.activeDays || habit.activeDays.length === 0 || habit.activeDays.includes(dayOfWeek);
}

/** `date` is a YYYY-MM-DD string — parsed at local noon to avoid an
 *  off-by-one day from timezone rounding (same trick already used elsewhere
 *  in the app for date-string → day-of-week conversions). */
export function isHabitScheduledOnDate(habit: Habit, date: string): boolean {
  return isHabitScheduledOn(habit, new Date(date + 'T12:00:00').getDay());
}

export function habitsScheduledOnDate(habits: Habit[], date: string): Habit[] {
  return habits.filter(h => isHabitScheduledOnDate(h, date));
}
