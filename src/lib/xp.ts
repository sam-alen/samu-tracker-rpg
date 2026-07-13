import type { XPState } from '../types';

export const XP_REWARDS = {
  habit: 10,
  mission: 20,
  study: 25,
  recommendation: 15,
  pomodoro25: 5,
  pomodoro50: 12,
  pomodoro120: 30,
  allMissionsBonus: 50,
} as const;

// Gold: spendable currency for the shop. XP never gets spent — it only levels you up.
export function goldForXP(xpAmount: number): number {
  return Math.max(1, Math.round(xpAmount / 2));
}

export function xpForLevel(level: number): number {
  return level * 100;
}

export function addXP(state: XPState, amount: number): XPState {
  let total = state.total + amount;
  let level = state.level;

  while (total >= xpForLevel(level)) {
    total -= xpForLevel(level);
    level++;
  }

  return { ...state, total, level, gold: (state.gold ?? 0) + goldForXP(amount) };
}

/** Exact inverse of addXP (un-completing something): levels can go back down,
 *  and the gold that came with the XP leaves too (clamped at 0 if already spent). */
export function removeXP(state: XPState, amount: number): XPState {
  let total = state.total - amount;
  let level = state.level;

  while (total < 0 && level > 1) {
    level--;
    total += xpForLevel(level);
  }
  if (total < 0) total = 0;

  return { ...state, total, level, gold: Math.max(0, (state.gold ?? 0) - goldForXP(amount)) };
}

export function xpProgress(state: XPState): { current: number; needed: number; pct: number } {
  const needed = xpForLevel(state.level);
  const pct = Math.min(100, Math.round((state.total / needed) * 100));
  return { current: state.total, needed, pct };
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Streaks of at least this length survive ONE missed day (grace bridge) —
 *  a single bad day shouldn't wipe out weeks of consistency. */
export const STREAK_GRACE_MIN = 7;

/** Called on every reward-granting action. Bumps the streak only on the
 *  day's first action; every action after that just increments the
 *  same-day counter (actionsToday) so a partial undo doesn't touch it.
 *
 *  Grace rule: a streak >= STREAK_GRACE_MIN also continues across a single
 *  missed day. This is stateless (no consumable counter), which keeps
 *  revertStreak exactly symmetric with zero new fields — the documented
 *  trade-off is that a >=7 streak could technically be kept alive on
 *  alternating days, accepted for a personal self-honesty app. */
export function updateStreak(state: XPState): XPState {
  const today = todayISO();

  if (state.lastActiveDate === today) {
    return { ...state, actionsToday: (state.actionsToday ?? 1) + 1 };
  }

  const continues = state.lastActiveDate === daysAgoISO(1)
    || (state.streak >= STREAK_GRACE_MIN && state.lastActiveDate === daysAgoISO(2));
  const streak = continues ? state.streak + 1 : 1;
  return {
    ...state,
    streak,
    previousActiveDate: state.lastActiveDate,
    lastActiveDate: today,
    actionsToday: 1,
  };
}

/** Inverse of updateStreak for one undone action. Only reverts the streak
 *  bump itself once actionsToday reaches 0 — i.e. when the LAST rewarded
 *  action of today is undone, not on every partial undo. */
export function revertStreak(state: XPState): XPState {
  const today = todayISO();
  if (state.lastActiveDate !== today) return state; // nothing from today to undo

  const actionsToday = (state.actionsToday ?? 1) - 1;
  if (actionsToday > 0) {
    return { ...state, actionsToday };
  }

  return {
    ...state,
    streak: Math.max(0, state.streak - 1),
    lastActiveDate: state.previousActiveDate ?? '',
    actionsToday: 0,
  };
}
