import { storage } from './storage';
import { todayISO } from './xp';
import { fx } from './fx';
import { checkAchievements } from './achievements';
import { missionXPReward } from './missionDifficulty';
import { resolveAttributes } from './attributes';
import type { Habit, Mission, MissionObjective, PomodoroState, RPGAttribute, StudySession } from '../types';

/** How many events count toward an objective's target, given its window
 *  (`windowStart` to the mission's own `deadline`, if any — never counts
 *  events from before the mission was created). */
export function computeObjectiveProgress(
  objective: MissionObjective,
  deadline: string | undefined,
  habits: Habit[],
  studySessions: StudySession[],
  pomodoro: PomodoroState,
): number {
  const inWindow = (date: string) => date >= objective.windowStart && (!deadline || date <= deadline);

  if (objective.metric === 'habit-completions') {
    const habit = habits.find(h => h.id === objective.habitId);
    return habit ? habit.completedDates.filter(inWindow).length : 0;
  }
  if (objective.metric === 'study-sessions') {
    return studySessions.filter(s => inWindow(s.date)).length;
  }
  return (pomodoro.completedDates ?? []).filter(inWindow).length; // 'pomodoro-sessions'
}

/** Human label for what an objective is counting — the habit's own name for
 *  habit-linked objectives, a fixed label otherwise. */
export function objectiveLabel(objective: MissionObjective, habits: Habit[]): string {
  if (objective.metric === 'habit-completions') {
    return habits.find(h => h.id === objective.habitId)?.name ?? 'Hábito eliminado';
  }
  return objective.metric === 'study-sessions' ? 'Sesiones de estudio' : 'Pomodoros';
}

/** Auto-completes any pending mission whose objective target has been
 *  reached. Called right after any action that could move an objective's
 *  counter — a habit toggle, a new study session, a completed pomodoro.
 *
 *  Takes the caller's own `missions`/`gainXP`/`gainAttributes` instead of
 *  writing storage directly (unlike checkAchievements, which only touches
 *  flat gold nobody renders live): several screens (Dashboard.tsx) hold
 *  their own React copy of missions/xp/attributes via their own
 *  useLocalStorage instances. Routing the update through the CALLER's own
 *  functions keeps it on the same React state channel that screen already
 *  uses, so nothing goes stale — no separate resync step needed anywhere.
 *
 *  No auto-revert: if the underlying data that fed an objective's counter
 *  later drops (e.g. a study session gets deleted), an already-completed
 *  objective mission is NOT automatically un-completed — same permanent-
 *  ratchet principle already established for achievements. It keeps its
 *  normal manual checkbox for Samu to undo by hand if wanted (exact revert
 *  via the mission's own stored xpAwarded, no changes needed there). */
export function checkObjectiveMissions(
  missions: Mission[],
  setMissions: (m: Mission[]) => void,
  gainXP: (amount: number) => void,
  gainAttributes: (attrs: RPGAttribute[], amount: number) => void,
): void {
  const habits = storage.getHabits();
  const studySessions = storage.getStudySessions();
  const pomodoro = storage.getPomodoro();

  let changed = false;
  const updated = missions.map(m => {
    if (m.status !== 'pending' || !m.objective || m.objective.completedOnceAt) return m;
    const progress = computeObjectiveProgress(m.objective, m.deadline, habits, studySessions, pomodoro);
    if (progress < m.objective.target) return m;

    changed = true;
    const reward = missionXPReward(m.difficulty);
    gainXP(reward);
    gainAttributes(resolveAttributes(m, 'DEX'), reward);
    fx.rewardAt(null, reward);
    fx.emit({
      kind: 'banner',
      title: 'Misión objetivo completada',
      subtitle: `"${m.title}" — meta alcanzada`,
    });
    return { ...m, status: 'done' as const, xpAwarded: reward, objective: { ...m.objective, completedOnceAt: todayISO() } };
  });

  if (!changed) return;
  setMissions(updated);
  checkAchievements();
}
