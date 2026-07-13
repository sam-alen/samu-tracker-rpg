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
  }));
}
