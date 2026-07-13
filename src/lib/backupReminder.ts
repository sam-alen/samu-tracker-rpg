import type { BackupReminderState } from '../types';

const REMINDER_INTERVAL_DAYS = 14;
const SNOOZE_DAYS = 7;
/** Don't nag a brand-new profile with almost no data yet to protect */
const MIN_XP_TO_PROMPT = 50;

function daysSince(iso: string, now: number): number {
  return (now - new Date(iso).getTime()) / 86400000;
}

/** Pure decision function: is it time to nudge the user toward exporting a
 *  backup? Data lives only in this browser's localStorage — no account, no
 *  cloud sync — so this is the only safety net against clearing site data. */
export function shouldShowBackupReminder(state: BackupReminderState, totalXP: number, now = Date.now()): boolean {
  if (totalXP < MIN_XP_TO_PROMPT) return false;
  if (state.lastDismissedAt && daysSince(state.lastDismissedAt, now) < SNOOZE_DAYS) return false;
  if (!state.lastExportAt) return true;
  return daysSince(state.lastExportAt, now) >= REMINDER_INTERVAL_DAYS;
}
