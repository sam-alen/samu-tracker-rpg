import type { Mission, MissionTemplate } from '../types';

function genId() { return Math.random().toString(36).slice(2, 10); }

/** Active templates that don't already have an instance for `today`. */
export function pendingTemplatesForToday(
  templates: MissionTemplate[],
  missions: Mission[],
  today: string,
): MissionTemplate[] {
  const todayTemplateIds = new Set(
    missions.filter(m => m.date === today && m.templateId).map(m => m.templateId),
  );
  return templates.filter(t => t.active && !todayTemplateIds.has(t.id));
}

/** Builds today's Mission instances from templates, each linked via templateId
 *  so it's never re-suggested the same day and history survives template edits. */
export function instantiateTemplates(templates: MissionTemplate[], today: string): Mission[] {
  return templates.map(t => ({
    id: genId(),
    title: t.title,
    attribute: t.attribute,
    date: today,
    status: 'pending' as const,
    createdAt: today,
    templateId: t.id,
    difficulty: t.difficulty,
    estimatedDays: t.estimatedDays,
  }));
}

/** Daily missions: the ones that reset with `date`, shown only for `today`. */
export function dailyMissionsFor(missions: Mission[], today: string): Mission[] {
  return missions.filter(m => m.date === today && !m.special);
}

/** Special missions: persist regardless of `date` until completed. Pending
 *  ones are shown first (soonest deadline first), then completed ones. */
export function activeSpecialMissions(missions: Mission[]): Mission[] {
  return missions
    .filter(m => m.special)
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return a.createdAt.localeCompare(b.createdAt);
    });
}

export function daysUntil(deadline: string, today: string): number {
  return Math.round((new Date(deadline + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000);
}
