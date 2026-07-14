import { useMemo, useState } from 'react';
import {
  Flame, Zap, Trophy, BookOpen, Wallet, ShieldCheck,
  Target, User, TrendingUp, ChevronRight, Star, Coins, Check, Sparkles, Repeat,
  ChevronLeft, ChevronRight as ChevronRightIcon, Calendar, DatabaseBackup, X,
  Link2, Plus, ExternalLink, Trash2,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { NavSection } from '../layout/Sidebar';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import { useXP } from '../../hooks/useXP';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { storage } from '../../lib/storage';
import { todayISO, XP_REWARDS, dateToLocalISO } from '../../lib/xp';
import { fx } from '../../lib/fx';
import { checkAchievements, computeStats, getClosestAchievement } from '../../lib/achievements';
import { pendingTemplatesForToday, instantiateTemplates, dailyMissionsFor } from '../../lib/missions';
import { missionXPReward, getMissionDifficulty } from '../../lib/missionDifficulty';
import { STREAK_GRACE_MIN } from '../../lib/xp';
import { getRank, getNextRank, getStreakTitle, getTotalXP, getRankProgress } from '../../lib/titles';
import { computeHunterPower, getHunterRank, getNextHunterRank, getHunterRankProgress } from '../../lib/hunterRank';
import { shouldShowBackupReminder } from '../../lib/backupReminder';
import { normalizeUrl, displayUrl } from '../../lib/url';
import { DAY_LABELS, habitsScheduledOnDate } from '../../lib/habits';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import {
  ATTRIBUTES, ATTRIBUTE_COLORS, ATTRIBUTE_ICONS,
  applyAttributeXP, defaultAttributes, defaultAttributeXP, totalAttributePoints, getAttributeTier, resolveAttributes,
} from '../../lib/attributes';
import { motivationalQuotes } from '../../data/initial';
import type {
  Profile, Habit, Mission, MissionTemplate, StudySession, Transaction, PomodoroState,
  BadHabit, RPGAttribute, PlayerAttributes, AttributeXP,
  Book, Project, MonthlyReview, Reward, FinanceAccounts, QuickLink,
} from '../../types';

function genId() { return Math.random().toString(36).slice(2, 10); }

function getDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function getDailyQuote(): string {
  const idx = new Date().getDate() % motivationalQuotes.length;
  return motivationalQuotes[idx];
}

// Last 7 days as YYYY-MM-DD strings, most recent first
function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return dateToLocalISO(d);
  });
}


export function Dashboard({ onNavigate }: { onNavigate?: (s: NavSection) => void }) {
  const { xp, gainXP, loseXP, progress } = useXP();
  const [profile, setProfile] = useLocalStorage<Profile>(storage.keys.profile, storage.getProfile());
  const attributes = profile.attributes ?? defaultAttributes();
  const attributeXP = profile.attributeXP ?? defaultAttributeXP();
  const [habits, setHabits] = useLocalStorage<Habit[]>(storage.keys.habits, []);
  const [missions, setMissions] = useLocalStorage<Mission[]>(storage.keys.missions, []);
  const [missionTemplates] = useLocalStorage<MissionTemplate[]>(storage.keys.missionTemplates, []);
  const [badHabits] = useLocalStorage<BadHabit[]>(storage.keys.badHabits, []);
  const [studySessions] = useLocalStorage<StudySession[]>(storage.keys.studySessions, []);
  const [transactions] = useLocalStorage<Transaction[]>(storage.keys.transactions, []);
  const [pomState] = useLocalStorage<PomodoroState>(storage.keys.pomodoro, { completedToday: 0, lastDate: '' });
  // Only needed for the achievement teaser card below — Dashboard doesn't
  // otherwise touch these sections' data.
  const [books] = useLocalStorage<Book[]>(storage.keys.books, []);
  const [projects] = useLocalStorage<Project[]>(storage.keys.projects, []);
  const [recommendationsProgress] = useLocalStorage<string[]>(storage.keys.recommendationsProgress, []);
  const [monthlyReviews] = useLocalStorage<MonthlyReview[]>(storage.keys.monthlyReviews, []);
  const [rewards] = useLocalStorage<Reward[]>(storage.keys.rewards, []);
  const [financeAccounts] = useLocalStorage<FinanceAccounts>(storage.keys.financeAccounts, { account: 0, savings: 0, history: [] });
  const [unlockedAchievements] = useLocalStorage<string[]>(storage.keys.unlockedAchievements, []);
  const [backupReminder, setBackupReminder] = useLocalStorage(storage.keys.backupReminder, storage.getBackupReminder());
  const [quickLinks, setQuickLinks] = useLocalStorage<QuickLink[]>(storage.keys.quickLinks, []);

  const today = todayISO();
  const last7 = useMemo(() => getLast7Days(), []);

  // ─── Title system ──────────────────────────────────────────────────────────
  const rank = getRank(xp.level);
  const nextRank = getNextRank(xp.level);
  const streakTitle = getStreakTitle(xp.streak);
  const rankProgress = getRankProgress(xp.level);
  const totalXP = getTotalXP(xp);

  // ─── Backup reminder ────────────────────────────────────────────────────────
  const showBackupReminder = shouldShowBackupReminder(backupReminder, totalXP);

  function exportBackupNow() {
    const json = storage.exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `samu-tracker-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupReminder({ ...backupReminder, lastExportAt: new Date().toISOString() });
  }

  function dismissBackupReminder() {
    setBackupReminder({ ...backupReminder, lastDismissedAt: new Date().toISOString() });
  }

  // ─── Hunter rank (Solo Leveling style E→S) ─────────────────────────────────
  const hunterPower = computeHunterPower(totalXP, totalAttributePoints(attributes), unlockedAchievements.length);
  const hunterRank = getHunterRank(hunterPower);
  const nextHunterRank = getNextHunterRank(hunterPower);
  const hunterProgress = getHunterRankProgress(hunterPower);

  // ─── Today stats ───────────────────────────────────────────────────────────
  // Only habits scheduled for today's day of week count — a Mon–Fri gym
  // habit shouldn't drag the weekend completion % down.
  const habitsScheduledToday = useMemo(() => habitsScheduledOnDate(habits, today), [habits, today]);
  const habitsToday = useMemo(() => ({
    done: habitsScheduledToday.filter(h => h.completedDates.includes(today)).length,
    total: habitsScheduledToday.length,
  }), [habitsScheduledToday, today]);

  const missionsToday = useMemo(() => {
    const ms = missions.filter(m => m.date === today);
    return { done: ms.filter(m => m.status === 'done').length, total: ms.length };
  }, [missions, today]);

  const pomodorosToday = pomState.lastDate === today ? pomState.completedToday : 0;

  const studyToday = useMemo(() =>
    studySessions.filter(s => s.date === today).reduce((a, s) => a + s.durationMinutes, 0),
    [studySessions, today]);

  // Overall day completion % (habits + missions combined)
  const dayTotalItems = habitsToday.total + missionsToday.total;
  const dayDoneItems = habitsToday.done + missionsToday.done;
  const dayPct = dayTotalItems > 0 ? Math.round((dayDoneItems / dayTotalItems) * 100) : 0;

  // ─── Weekly stats ──────────────────────────────────────────────────────────
  const weekStart = last7[6]; // 7 days ago

  const weekMissionsDone = useMemo(() =>
    missions.filter(m => m.date >= weekStart && m.date <= today && m.status === 'done').length,
    [missions, weekStart, today]);

  const weekStudyMin = useMemo(() =>
    studySessions.filter(s => s.date >= weekStart && s.date <= today).reduce((a, s) => a + s.durationMinutes, 0),
    [studySessions, weekStart, today]);

  // Habit consistency: for each of the last 7 days, was at least 1 habit completed?
  const habitConsistency = useMemo(() =>
    last7.map(d => ({
      date: d,
      label: DAY_LABELS[new Date(d + 'T12:00:00').getDay()],
      done: habits.some(h => h.completedDates.includes(d)),
      isToday: d === today,
    })),
    [habits, last7, today]);

  const consistencyPct = useMemo(() => {
    const active = habitConsistency.filter(d => d.done).length;
    return Math.round((active / 7) * 100);
  }, [habitConsistency]);

  // ─── Finances ──────────────────────────────────────────────────────────────
  const thisMonth = useMemo(() => {
    const ym = today.slice(0, 7);
    const income = transactions.filter(t => t.type === 'income' && t.date.startsWith(ym)).reduce((a, t) => a + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense' && t.date.startsWith(ym)).reduce((a, t) => a + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions, today]);

  // Weakest clean streak among bad habits (days since last relapse)
  const cleanStreak = useMemo(() => {
    if (badHabits.length === 0) return null;
    const todayMs = new Date(today + 'T00:00:00').getTime();
    const days = badHabits.map(b => {
      // stored values may be full ISO datetimes — normalize to YYYY-MM-DD
      const last = ([...b.relapses].sort().pop() ?? b.createdAt).slice(0, 10);
      return Math.max(0, Math.floor((todayMs - new Date(last + 'T00:00:00').getTime()) / 86400000));
    });
    return Math.min(...days);
  }, [badHabits, today]);

  const dateLabel = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // ─── Quick actions (complete quests right from the dashboard) ─────────────
  // gainXP/gainAttribute must stay outside the state updaters: React re-runs
  // updaters in StrictMode, so a side effect inside one would double-award.
  // Mirrors useAttributes.ts — Dashboard already owns a `profile` instance,
  // so it applies deltas directly instead of a second hook on the same key.
  function gainAttribute(attr: RPGAttribute, delta: number) {
    const current = storage.getProfile();
    const prevAttrs = current.attributes ?? defaultAttributes();
    const prevXP = current.attributeXP ?? defaultAttributeXP();
    const { attributes: nextAttrs, attributeXP: nextXP } = applyAttributeXP(prevAttrs, prevXP, attr, delta);
    const next = { ...current, attributes: nextAttrs, attributeXP: nextXP };
    storage.setProfile(next);
    setProfile(next);

    if (delta > 0) {
      const before = getAttributeTier(prevAttrs[attr] ?? 0).tier.name;
      const after = getAttributeTier(nextAttrs[attr] ?? 0).tier.name;
      if (after !== before) {
        fx.emit({ kind: 'banner', title: `${attr} alcanzó rango ${after}`, subtitle: 'Sigue así — cada acción suma' });
      }
    }
  }

  // Habits/missions can build more than one attribute at once (e.g. reading
  // → WIS + INT) — each gets the FULL delta, not a split (derived stat, not
  // spendable currency, so no farming risk in stacking attributes).
  function gainAttributes(attrs: RPGAttribute[], delta: number) {
    attrs.forEach(a => gainAttribute(a, delta));
  }

  // Un-marking reverts the award (XP, gold, attribute, all-done bonus) so
  // stats stay coherent — same logic as the Hábitos/Misiones sections.
  function toggleHabit(id: string, e?: React.MouseEvent) {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    const done = habit.completedDates.includes(today);
    setHabits(prev => prev.map(h => h.id === id
      ? {
          ...h,
          completedDates: done
            ? h.completedDates.filter(d => d !== today)
            : [...h.completedDates, today],
        }
      : h));
    if (!done) {
      gainXP(XP_REWARDS.habit);
      gainAttributes(resolveAttributes(habit, 'INT'), XP_REWARDS.habit);
      fx.rewardAt(e ?? null, XP_REWARDS.habit);
      checkAchievements();
    } else {
      loseXP(XP_REWARDS.habit);
      gainAttributes(resolveAttributes(habit, 'INT'), -XP_REWARDS.habit);
    }
  }

  // Mirrors Missions.tsx's toggle() — kept in sync: reward scales with
  // difficulty, the actual granted amount is stored on the mission
  // (xpAwarded) so reverting never desyncs from a later difficulty edit,
  // and the all-done bonus only considers daily (non-special) missions.
  function toggleMission(id: string, e?: React.MouseEvent) {
    const mission = missions.find(m => m.id === id);
    if (!mission) return;
    const nowDone = mission.status !== 'done';
    const dailyBefore = dailyMissionsFor(missions, today);
    const wasAllDone = dailyBefore.length > 0 && dailyBefore.every(m => m.status === 'done');
    const reward = nowDone ? missionXPReward(mission.difficulty) : (mission.xpAwarded ?? missionXPReward(mission.difficulty));
    const updated = missions.map(m => m.id === id
      ? { ...m, status: nowDone ? 'done' as const : 'pending' as const, xpAwarded: nowDone ? reward : undefined }
      : m);
    setMissions(updated);
    if (nowDone) {
      gainXP(reward);
      gainAttributes(resolveAttributes(mission, 'DEX'), reward);
      fx.rewardAt(e ?? null, reward);
      checkAchievements();
      if (!mission.special) {
        const dailyUpdated = dailyMissionsFor(updated, today);
        if (dailyUpdated.length > 0 && dailyUpdated.every(m => m.status === 'done')) {
          gainXP(XP_REWARDS.allMissionsBonus);
          fx.emit({
            kind: 'banner',
            title: 'Misiones diarias completadas',
            subtitle: `+${XP_REWARDS.allMissionsBonus} XP de bonus por limpiar el día`,
          });
        }
      }
    } else {
      loseXP(reward);
      gainAttributes(resolveAttributes(mission, 'DEX'), -reward);
      if (!mission.special && wasAllDone) loseXP(XP_REWARDS.allMissionsBonus);
    }
  }

  const todayMissionList = useMemo(() => dailyMissionsFor(missions, today), [missions, today]);
  const pendingTemplates = useMemo(
    () => pendingTemplatesForToday(missionTemplates, missions, today),
    [missionTemplates, missions, today],
  );

  function addPendingTemplatesToday() {
    setMissions(prev => [...prev, ...instantiateTemplates(pendingTemplates, today)]);
  }

  // ─── Achievement teaser ─────────────────────────────────────────────────────
  const unlockedSet = useMemo(() => new Set(unlockedAchievements), [unlockedAchievements]);
  const achievementStats = useMemo(() => computeStats(
    habits, missions, attributes, xp, studySessions, pomState, books, projects,
    badHabits, recommendationsProgress.length, monthlyReviews.length,
    rewards.filter(r => r.claimedAt).length, transactions.length, financeAccounts.savings,
    unlockedSet.size,
  ), [
    habits, missions, attributes, xp, studySessions, pomState, books, projects,
    badHabits, recommendationsProgress, monthlyReviews, rewards, transactions,
    financeAccounts, unlockedSet,
  ]);
  const closestAchievement = useMemo(
    () => getClosestAchievement(achievementStats, unlockedSet),
    [achievementStats, unlockedSet],
  );

  return (
    <div className="space-y-5">

      {/* ── Hero: Profile + Rank ─────────────────────────────────────────── */}
      <div className="card-ornate rounded-2xl p-5">
        <div className="flex items-start gap-4">
          {/* Avatar with level badge */}
          <div className="relative shrink-0">
            <div className="w-18 h-18 w-[72px] h-[72px] rounded-xl border-2 border-gold-600/50 shadow-[0_0_14px_rgba(77,166,255,0.18)] overflow-hidden bg-[#04060B] flex items-center justify-center">
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <User size={28} className="text-gray-600" />
              }
            </div>
            {/* Level badge */}
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-b from-gold-300 to-gold-600 border border-gold-200/70 rounded-md px-1.5 py-0.5 flex items-center gap-0.5 shadow-[0_0_8px_rgba(77,166,255,0.45)]">
              <Zap size={9} className="text-[#03101F]" />
              <span className="text-xs font-bold text-[#03101F] leading-none">{xp.level}</span>
            </div>
            {/* Hunter rank badge (Solo Leveling style E→S) */}
            <div
              title={hunterRank.title}
              className="absolute -top-2 -left-2 w-6 h-6 rounded-md flex items-center justify-center font-display font-bold text-sm"
              style={{ color: hunterRank.color, backgroundColor: `${hunterRank.color}26`, border: `1.5px solid ${hunterRank.color}`, boxShadow: `0 0 8px ${hunterRank.color}66` }}
            >
              {hunterRank.letter}
            </div>
          </div>

          {/* Name + rank */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">{getDayGreeting()}</p>
            <h1 className="font-display text-xl font-bold text-white leading-tight">{profile.name}</h1>

            {/* Rank title */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm">{rank.badge}</span>
              <span className={`font-display text-sm font-bold uppercase tracking-wider ${rank.textColor}`}>{rank.title}</span>
            </div>

            {/* Hunter rank */}
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ color: hunterRank.color, backgroundColor: `${hunterRank.color}26`, border: `1px solid ${hunterRank.color}66` }}
              >
                RANGO {hunterRank.letter}
              </span>
              <span className="text-xs text-gray-500">{hunterRank.title}</span>
            </div>

            {/* Streak title */}
            {streakTitle && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs">{streakTitle.badge}</span>
                <span className={`text-xs font-medium ${streakTitle.textColor}`}>{streakTitle.title}</span>
                <span className="text-xs text-gray-600">· {xp.streak}d</span>
              </div>
            )}

            {/* Rank description */}
            <p className="text-xs text-gray-500 mt-1.5 italic leading-tight">{rank.description}</p>
          </div>

          {/* Gold + date */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold-900/40 border border-gold-600/40 shadow-[0_0_8px_rgba(77,166,255,0.15)]" title="Oro disponible para la Tienda">
              <Coins size={13} className="text-gold-300" />
              <span className="font-display text-sm font-bold text-gold-200 leading-none">{xp.gold.toLocaleString()}</span>
            </div>
            <p className="hidden md:block text-right text-xs text-gray-500 capitalize leading-relaxed">
              {dateLabel.split(',').map((part, i) => (
                <span key={i} className="block">{part.trim()}</span>
              ))}
            </p>
          </div>
        </div>

        {/* XP Bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5 text-xs">
            <span className="text-gray-400">Lv. {xp.level}</span>
            <span className="text-gray-500">{progress.current} / {progress.needed} XP</span>
            <span className="text-gray-400">Lv. {xp.level + 1}</span>
          </div>
          <ProgressBar value={progress.pct} animate height="lg" />
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-gray-600">{totalXP.toLocaleString()} XP totales acumulados</span>
            <span className={`font-medium ${rank.textColor}`}>{progress.pct}% completado</span>
          </div>
        </div>

        {/* Rank progress toward next title + next Hunter Rank, side by side */}
        <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {nextRank && (
            <div title={`Nivel ${xp.level} de ${nextRank.minLevel - 1} en este rango`}>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-gray-600">Título</span>
                <span className={nextRank.textColor}>→ {nextRank.title}</span>
              </div>
              <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-arcane-600 to-gold-400 shadow-[0_0_6px_rgba(77,166,255,0.4)]"
                  style={{ width: `${rankProgress.pct}%` }}
                />
              </div>
            </div>
          )}

          <div title={`${hunterPower.toLocaleString()} pts de poder`}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-gray-600">Cazador</span>
              {nextHunterRank ? (
                <span style={{ color: nextHunterRank.color }}>→ Rango {nextHunterRank.letter}</span>
              ) : (
                <span className="text-gray-500">Rango máximo</span>
              )}
            </div>
            <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${hunterProgress.pct}%`, background: `linear-gradient(to right, ${hunterRank.color}, ${nextHunterRank?.color ?? hunterRank.color})`, boxShadow: `0 0 6px ${hunterRank.color}66` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Today's habits chips ────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between gap-4 mb-3">
          <p className="text-sm font-medium text-white whitespace-nowrap">Hábitos de hoy</p>
          <div className="w-28 shrink-0">
            <ProgressBar
              value={habitsToday.total > 0 ? (habitsToday.done / habitsToday.total) * 100 : 0}
              color="green"
              height="sm"
            />
          </div>
        </div>
        {habitsScheduledToday.length === 0
          ? <p className="text-xs text-gray-600">{habits.length === 0 ? 'Sin hábitos creados.' : 'Ningún hábito programado para hoy.'}</p>
          : (
            <div className="flex flex-wrap gap-2">
              {habitsScheduledToday.map(h => {
                const done = h.completedDates.includes(today);
                const attrColor = ATTRIBUTE_COLORS[resolveAttributes(h, 'INT')[0]];
                return (
                  <button
                    key={h.id}
                    onClick={e => toggleHabit(h.id, e)}
                    title={done ? 'Desmarcar' : `Completar (+${XP_REWARDS.habit} XP)`}
                    className={`text-xs pl-2 pr-2.5 py-1.5 rounded-lg border transition-all active:scale-95 inline-flex items-center gap-1.5
                      ${done
                        ? 'bg-emerald-900/25 border-emerald-700/50 text-emerald-300 shadow-[0_0_8px_rgba(52,192,139,0.2)]'
                        : 'bg-gray-800/40 border-gray-700/40 text-gray-400 hover:border-gold-400/40 hover:text-gray-200'
                      }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: done ? '#34C08B' : attrColor, boxShadow: `0 0 4px ${done ? '#34C08B' : attrColor}99` }}
                    />
                    {done && <Check size={10} className="-mr-0.5" />}
                    {h.icon} {h.name}
                  </button>
                );
              })}
            </div>
          )
        }
        <p className="text-[10px] text-gray-700 mt-2.5">Toca un hábito para completarlo · +{XP_REWARDS.habit} XP</p>
      </Card>

      {pendingTemplates.length > 0 && (
        <div className="card-ornate rounded-xl p-4 flex items-center gap-3">
          <Repeat size={16} className="text-arcane-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">
              {pendingTemplates.length} misión{pendingTemplates.length !== 1 ? 'es' : ''} recurrente{pendingTemplates.length !== 1 ? 's' : ''} para hoy
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={addPendingTemplatesToday}>Agregar</Button>
        </div>
      )}

      {/* ── Today's missions (quick actions) ────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between gap-4 mb-3">
          <p className="text-sm font-medium text-white whitespace-nowrap">Misiones de hoy</p>
          <span className="text-xs text-gray-500">{missionsToday.done}/{missionsToday.total}</span>
        </div>
        {todayMissionList.length === 0
          ? <p className="text-xs text-gray-600">Sin misiones para hoy. Créalas en la sección Misiones.</p>
          : (
            <div className="space-y-1.5">
              {todayMissionList.map(m => {
                const done = m.status === 'done';
                const attrColor = ATTRIBUTE_COLORS[resolveAttributes(m, 'DEX')[0]];
                const diff = getMissionDifficulty(m.difficulty);
                return (
                  <button
                    key={m.id}
                    onClick={e => toggleMission(m.id, e)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all active:scale-[0.99]
                      ${done ? 'bg-emerald-950/15' : 'bg-[#0F1830] hover:brightness-110'}`}
                    style={{
                      borderLeft: `3px solid ${done ? '#34C08B' : attrColor}`,
                      borderTop: `1px solid ${done ? 'rgba(52,192,139,0.18)' : '#1B2A47'}`,
                      borderRight: `1px solid ${done ? 'rgba(52,192,139,0.18)' : '#1B2A47'}`,
                      borderBottom: `1px solid ${done ? 'rgba(52,192,139,0.18)' : '#1B2A47'}`,
                    }}
                  >
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all"
                      style={{ border: `1.5px solid ${done ? '#34C08B' : '#2B4066'}`, background: done ? '#34C08B' : 'transparent' }}
                    >
                      {done && <Check size={11} className="text-[#03101F]" strokeWidth={3} />}
                    </span>
                    <span className={`flex-1 text-xs font-medium ${done ? 'text-emerald-300/70 line-through' : 'text-gray-300'}`}>
                      {m.title}
                    </span>
                    {m.difficulty && m.difficulty !== 'normal' && (
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1"
                        style={{ color: diff.color, backgroundColor: `${diff.color}1F`, border: `1px solid ${diff.color}55` }}
                      >
                        <diff.icon size={9} />{diff.label}
                      </span>
                    )}
                    <span className={`text-[10px] font-semibold shrink-0 ${done ? 'text-emerald-400' : 'text-gold-400/80'}`}>+{missionXPReward(m.difficulty)}</span>
                  </button>
                );
              })}
            </div>
          )
        }
      </Card>

      {/* ── Quick links ──────────────────────────────────────────────────── */}
      <QuickLinksCard links={quickLinks} onChange={setQuickLinks} />

      {/* ── Backup reminder ─────────────────────────────────────────────── */}
      {showBackupReminder && (
        <div className="card-ornate rounded-xl p-4 flex items-center gap-3">
          <DatabaseBackup size={18} className="text-arcane-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">
              {backupReminder.lastExportAt ? 'Hace tiempo que no exportas un backup' : 'Nunca has exportado un backup de tus datos'}
            </p>
            <p className="text-xs text-gray-500">
              Todo vive solo en este navegador — un respaldo periódico te protege de perderlo todo.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={exportBackupNow}>Exportar ahora</Button>
          <button onClick={dismissBackupReminder} className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors shrink-0" title="Recordar más tarde">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Attributes ───────────────────────────────────────────────────── */}
      <AttributesCard attributes={attributes} attributeXP={attributeXP} />

      {/* ── Achievement teaser ──────────────────────────────────────────── */}
      <AchievementTeaser
        unlockedCount={unlockedSet.size}
        closest={closestAchievement}
        onNavigate={onNavigate}
      />

      {/* ── Motivational quote ───────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-arcane-900/30 via-transparent to-gold-900/25 border border-arcane-700/30 rounded-xl px-4 py-3">
        <span className="absolute left-3 -top-2.5 text-gold-400/60 text-lg leading-none select-none">❝</span>
        <p className="text-sm text-arcane-200/90 italic pl-3">{getDailyQuote()}</p>
      </div>

      {/* ── Today snapshot ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Day completion ring */}
        <Card className="flex flex-col items-center justify-center py-5 gap-3">
          <DayRing pct={dayPct} />
          <div className="text-center">
            <p className="text-xs text-gray-400">Día completado</p>
            <p className="text-xs text-gray-600 mt-0.5">{dayDoneItems}/{dayTotalItems} tareas</p>
          </div>
        </Card>

        {/* Quick stats 2x2 */}
        <div className="grid grid-cols-2 gap-2">
          <MiniStat
            icon={<Flame size={13} className="text-orange-400" />}
            label="Racha"
            value={`${xp.streak}d`}
            sub={streakTitle ? streakTitle.title : xp.streak === 0 ? 'Sin racha' : 'Activa'}
            color="orange"
          />
          <MiniStat
            icon={<Zap size={13} className="text-blue-400" />}
            label="XP nivel"
            value={`${progress.current}`}
            sub={`→ ${progress.needed}`}
            color="blue"
          />
          <MiniStat
            icon={<Trophy size={13} className="text-amber-400" />}
            label="Hábitos"
            value={`${habitsToday.done}/${habitsToday.total}`}
            sub={habitsToday.done === habitsToday.total && habitsToday.total > 0 ? '¡Todos!' : 'hoy'}
            color="gold"
          />
          <MiniStat
            icon={<Target size={13} className="text-purple-400" />}
            label="Misiones"
            value={`${missionsToday.done}/${missionsToday.total}`}
            sub={missionsToday.done === missionsToday.total && missionsToday.total > 0 ? '¡Todas!' : 'hoy'}
            color="purple"
          />
        </div>
      </div>

      {/* ── Weekly consistency ──────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-white">Consistencia esta semana</p>
          <Badge color={consistencyPct >= 80 ? 'green' : consistencyPct >= 50 ? 'gold' : 'gray'}>
            {consistencyPct}%
          </Badge>
        </div>
        {/* Day dots */}
        <div className="flex justify-between gap-1 mb-3">
          {[...habitConsistency].reverse().map(d => (
            <div key={d.date} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className="w-full max-w-[32px] h-7 rounded-md flex items-center justify-center transition-all"
                style={d.done
                  ? {
                      background: d.isToday ? 'linear-gradient(180deg, #6EE0B4, #34C08B)' : 'linear-gradient(180deg, rgba(52,192,139,0.55), rgba(52,192,139,0.3))',
                      border: '1px solid rgba(52,192,139,0.6)',
                      boxShadow: d.isToday ? '0 0 10px rgba(52,192,139,0.45)' : '0 0 6px rgba(52,192,139,0.15)',
                    }
                  : {
                      background: '#131C2E',
                      border: d.isToday ? '1px solid rgba(77,166,255,0.5)' : '1px solid #1B2A47',
                      boxShadow: d.isToday ? '0 0 8px rgba(77,166,255,0.25)' : 'none',
                    }}
              >
                {d.done && <Check size={12} className={d.isToday ? 'text-[#03101F]' : 'text-emerald-300'} />}
              </div>
              <span className={`text-xs ${d.isToday ? 'text-gold-300 font-semibold' : 'text-gray-600'}`}>
                {d.label}
              </span>
            </div>
          ))}
        </div>

        {/* Week numbers */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#1B2A47]">
          <div className="text-center">
            <p className="text-base font-bold text-white">{weekMissionsDone}</p>
            <p className="text-xs text-gray-500 mt-0.5">misiones (7d)</p>
          </div>
          <div className="text-center border-x border-[#1B2A47]">
            <p className="text-base font-bold text-white">
              {weekStudyMin >= 60
                ? `${Math.floor(weekStudyMin / 60)}h ${weekStudyMin % 60}m`
                : `${weekStudyMin}m`}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">estudiado</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-white">{pomodorosToday}</p>
            <p className="text-xs text-gray-500 mt-0.5">pomodoros hoy</p>
          </div>
        </div>
      </Card>

      {/* ── Streak milestones ───────────────────────────────────────────── */}
      <StreakMilestones streak={xp.streak} />

      {/* ── Summary cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Clean streak (bad habits) */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={15} className="text-emerald-400" />
            <p className="text-sm font-medium text-white">Racha limpia</p>
          </div>
          {cleanStreak !== null ? (
            <div className="space-y-1">
              <div className="flex items-end gap-1">
                <p className="text-2xl font-bold text-emerald-400">{cleanStreak}</p>
                <p className="text-xs text-gray-400 mb-1">día{cleanStreak !== 1 ? 's' : ''} sin recaídas</p>
              </div>
              <p className="text-xs text-gray-600">Vigilando {badHabits.length} hábito{badHabits.length !== 1 ? 's' : ''} a evitar</p>
              {cleanStreak >= 7 && <Badge color="green">¡Mente de acero!</Badge>}
            </div>
          ) : <p className="text-xs text-gray-600">Sin hábitos a evitar registrados</p>}
        </Card>

        {/* Study */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={15} className="text-blue-400" />
            <p className="text-sm font-medium text-white">Estudio</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-end gap-1">
              <p className="text-2xl font-bold text-white">{studyToday}</p>
              <p className="text-xs text-gray-400 mb-1">min hoy</p>
            </div>
            <p className="text-xs text-gray-600">
              Esta semana: <span className="text-blue-300 font-medium">
                {weekStudyMin >= 60
                  ? `${Math.floor(weekStudyMin / 60)}h ${weekStudyMin % 60}m`
                  : `${weekStudyMin}m`}
              </span>
            </p>
            {studyToday === 0 && <p className="text-xs text-gray-600 mt-1">Sin sesiones hoy</p>}
            {studyToday > 0 && <Badge color="blue">Activo hoy</Badge>}
          </div>
        </Card>

        {/* Finance */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={15} className="text-amber-400" />
            <p className="text-sm font-medium text-white">Finanzas (mes)</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-end gap-1">
              <p className={`text-2xl font-bold ${thisMonth.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${Math.abs(thisMonth.balance).toLocaleString()}
              </p>
              <p className={`text-xs mb-1 ${thisMonth.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {thisMonth.balance >= 0 ? 'positivo' : 'negativo'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <TrendingUp size={11} className="text-emerald-500" />
              <span>${thisMonth.income.toLocaleString()}</span>
              <span className="text-gray-700">·</span>
              <span className="text-red-500">-${thisMonth.expense.toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Monthly calendar ────────────────────────────────────────────── */}
      <MonthCalendar habits={habits} missions={missions} />

      {/* ── Main goal ───────────────────────────────────────────────────── */}
      {profile.mainGoal && (
        <div className="flex items-center gap-3 bg-[#04060B] border border-[#1B2A47] rounded-xl px-4 py-3">
          <Star size={14} className="text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600">Meta principal</p>
            <p className="text-sm text-gray-300">{profile.mainGoal}</p>
          </div>
          <ChevronRight size={14} className="text-gray-700" />
        </div>
      )}

    </div>
  );
}

// ─── Monthly Calendar ───────────────────────────────────────────────────────

function MonthCalendar({ habits, missions }: { habits: Habit[]; missions: Mission[] }) {
  const today = todayISO();
  const [offset, setOffset] = useState(0); // months back from current

  const { label, days } = useMemo(() => {
    const base = new Date();
    base.setDate(1);
    base.setMonth(base.getMonth() - offset);
    const y = base.getFullYear();
    const m = base.getMonth(); // 0-indexed
    const monthLabel = base.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDow = new Date(y, m, 1).getDay(); // 0=Sun

    // Build grid: blanks + day cells
    const cells: Array<{ date: string | null; day: number | null }> = [];
    for (let i = 0; i < firstDow; i++) cells.push({ date: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ date: dateStr, day: d });
    }

    return { label: monthLabel, days: cells };
  }, [offset]);

  function dayStats(date: string) {
    const scheduled = habitsScheduledOnDate(habits, date);
    const habitsTotal = scheduled.length;
    const habitsDone = scheduled.filter(h => h.completedDates.includes(date)).length;
    const dayMissions = missions.filter(m => m.date === date);
    const missionsDone = dayMissions.filter(m => m.status === 'done').length;
    const total = habitsTotal + dayMissions.length;
    const done = habitsDone + missionsDone;
    const pct = total > 0 ? Math.round((done / total) * 100) : -1; // -1 = no data
    return { pct, done, total };
  }

  function cellColor(pct: number, isToday: boolean, isFuture: boolean) {
    if (isFuture) return 'bg-gray-900/20 border-gray-800/20';
    if (pct === -1) return isToday ? 'bg-gold-900/25 border-gold-700/30' : 'bg-gray-800/20 border-gray-800/20';
    if (pct === 100) return 'bg-emerald-900/50 border-emerald-700/40';
    if (pct >= 75) return 'bg-emerald-900/30 border-emerald-800/30';
    if (pct >= 50) return 'bg-yellow-900/30 border-yellow-800/30';
    if (pct >= 25) return 'bg-orange-900/30 border-orange-800/30';
    if (pct > 0) return 'bg-red-900/25 border-red-900/30';
    return 'bg-gray-800/30 border-gray-700/20';
  }

  function pctTextColor(pct: number) {
    if (pct === 100) return 'text-emerald-400';
    if (pct >= 75) return 'text-emerald-500';
    if (pct >= 50) return 'text-yellow-400';
    if (pct >= 25) return 'text-orange-400';
    return 'text-red-500';
  }


  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-blue-400" />
          <p className="text-sm font-medium text-white capitalize">{label}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOffset(o => o + 1)}
            className="p-1 rounded-md text-gray-600 hover:text-gray-300 hover:bg-gray-800/50 transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          {offset > 0 && (
            <button
              onClick={() => setOffset(0)}
              className="text-xs px-2 py-0.5 rounded text-gold-300 hover:bg-gold-900/30 transition-colors"
            >
              Hoy
            </button>
          )}
          <button
            onClick={() => setOffset(o => Math.max(0, o - 1))}
            disabled={offset === 0}
            className="p-1 rounded-md text-gray-600 hover:text-gray-300 hover:bg-gray-800/50 transition-colors disabled:opacity-30"
          >
            <ChevronRightIcon size={15} />
          </button>
        </div>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-xs text-gray-700 py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((cell, idx) => {
          if (!cell.date) {
            return <div key={`blank-${idx}`} />;
          }
          const isToday = cell.date === today;
          const isFuture = cell.date > today;
          const { pct, done, total } = dayStats(cell.date);

          return (
            <div
              key={cell.date}
              title={pct >= 0 ? `${cell.date}: ${done}/${total} (${pct}%)` : cell.date}
              className={`
                relative rounded-md border aspect-square flex flex-col items-center justify-center
                transition-all cursor-default
                ${cellColor(pct, isToday, isFuture)}
                ${isToday ? 'ring-1 ring-gold-400/60' : ''}
              `}
            >
              <span className={`text-xs font-medium leading-none ${
                isToday ? 'text-gold-200' : isFuture ? 'text-gray-700' : pct >= 0 ? pctTextColor(pct) : 'text-gray-600'
              }`}>
                {cell.day}
              </span>
              {!isFuture && pct >= 0 && (
                <span className="text-[9px] text-gray-600 leading-none mt-0.5">{pct}%</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#1B2A47] flex-wrap">
        <p className="text-xs text-gray-700">Completado:</p>
        {[
          { label: '0%', cls: 'bg-gray-800/40' },
          { label: '25%+', cls: 'bg-red-900/40' },
          { label: '50%+', cls: 'bg-orange-900/40' },
          { label: '75%+', cls: 'bg-yellow-900/40' },
          { label: '100%', cls: 'bg-emerald-700/50' },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${cls} border border-white/5`} />
            <span className="text-xs text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Attributes (RPG character sheet) ──────────────────────────────────────

function AttributesCard({ attributes, attributeXP }: { attributes: PlayerAttributes; attributeXP: AttributeXP }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-gold-300" />
          <p className="text-sm font-medium text-white">Atributos</p>
        </div>
        <span className="text-xs text-gray-600">{totalAttributePoints(attributes)} pts totales</span>
      </div>
      <div className="space-y-2">
        {ATTRIBUTES.map(attr => {
          const value = attributes[attr] ?? 0;
          const { tier, next, pct } = getAttributeTier(value, attributeXP[attr] ?? 0);
          const color = ATTRIBUTE_COLORS[attr];
          const Icon = ATTRIBUTE_ICONS[attr];
          const tierTitle = next ? `${tier.name} → ${next.name} (${next.min})` : `${tier.name} · rango máximo`;
          return (
            <div key={attr} className="flex items-center gap-2.5" title={tierTitle}>
              <Icon size={14} className="shrink-0" style={{ color }} />
              <span className="text-xs font-bold w-8 shrink-0" style={{ color }}>{attr}</span>
              <div className="flex-1 h-2.5 bg-black/40 border border-white/5 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}99, ${color})`, boxShadow: `0 0 6px ${color}80` }}
                />
              </div>
              <span className="text-[10px] w-[74px] shrink-0 truncate hidden sm:inline" style={{ color }}>{tier.name}</span>
              <span className="text-xs text-gray-400 w-6 text-right shrink-0 tabular-nums">{value}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Achievement teaser ─────────────────────────────────────────────────────

function AchievementTeaser({
  unlockedCount, closest, onNavigate,
}: {
  unlockedCount: number;
  closest: ReturnType<typeof getClosestAchievement>;
  onNavigate?: (s: NavSection) => void;
}) {
  const clickable = !!onNavigate;
  return (
    <div
      onClick={() => onNavigate?.('achievements')}
      className={`card-ornate rounded-xl p-4 ${clickable ? 'cursor-pointer hover:border-gold-400/40 transition-colors' : ''}`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Trophy size={15} className="text-gold-300" />
          <p className="text-sm font-medium text-white">Logros</p>
        </div>
        <span className="text-xs text-gray-500">{unlockedCount}/100 desbloqueados</span>
      </div>
      {closest ? (
        <div className="mt-2">
          <div className="flex items-center gap-2.5">
            <closest.achievement.icon size={15} className="text-arcane-300 shrink-0" />
            <p className="text-xs text-gray-300 flex-1 min-w-0 truncate">
              Próximo: <span className="text-white font-medium">{closest.achievement.title}</span>
            </p>
            <span className="text-[10px] text-gray-600 tabular-nums shrink-0">{closest.current}/{closest.target}</span>
          </div>
          <div className="w-full h-1.5 bg-black/40 border border-white/5 rounded-full overflow-hidden mt-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-arcane-600 to-arcane-400 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((closest.current / closest.target) * 100))}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-600 mt-1">¡Desbloqueaste todos los logros disponibles!</p>
      )}
    </div>
  );
}

// ─── Day completion ring ────────────────────────────────────────────────────

function DayRing({ pct }: { pct: number }) {
  const r = 28;
  const circum = 2 * Math.PI * r;
  const offset = circum * (1 - pct / 100);
  const [from, to] = pct === 100 ? ['#34C08B', '#6EE0B4'] : pct >= 60 ? ['#1F66B8', '#7CBEFF'] : pct >= 30 ? ['#7C3AED', '#A78BFA'] : ['#2B4066', '#4A5872'];

  return (
    <div className="relative w-20 h-20" style={{ filter: pct > 0 ? `drop-shadow(0 0 6px ${from}55)` : undefined }}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 70 70">
        <defs>
          <linearGradient id="dayring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx="35" cy="35" r={r} fill="none" stroke="#131C2E" strokeWidth="6" />
        <circle
          cx="35" cy="35" r={r} fill="none"
          stroke="url(#dayring-grad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circum}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white leading-none">{pct}%</span>
      </div>
    </div>
  );
}

// ─── Mini stat chip ─────────────────────────────────────────────────────────

function MiniStat({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: 'orange' | 'blue' | 'gold' | 'purple';
}) {
  const styleMap = {
    orange: { border: 'border-orange-800/30', accent: '#F59E0B', chip: 'bg-orange-900/30 border-orange-700/40' },
    blue: { border: 'border-blue-800/30', accent: '#4DA6FF', chip: 'bg-blue-900/30 border-blue-700/40' },
    gold: { border: 'border-amber-800/30', accent: '#E3BC4B', chip: 'bg-amber-900/30 border-amber-700/40' },
    purple: { border: 'border-purple-800/30', accent: '#A78BFA', chip: 'bg-purple-900/30 border-purple-700/40' },
  };
  const s = styleMap[color];
  return (
    <div
      className={`${s.border} border rounded-xl p-2.5 flex flex-col gap-1.5 bg-gradient-to-b from-[#0C1424] to-[#080D19]`}
      style={{ boxShadow: `inset 2px 0 0 ${s.accent}66` }}
    >
      <div className="flex items-center gap-1.5">
        <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${s.chip}`}>{icon}</span>
        <p className="text-[11px] text-gray-500 leading-none">{label}</p>
      </div>
      <p className="font-display text-lg font-bold text-white leading-none">{value}</p>
      <p className="text-[10px] text-gray-600 leading-none truncate">{sub}</p>
    </div>
  );
}

// ─── Quick links ────────────────────────────────────────────────────────────

function QuickLinksCard({ links, onChange }: { links: QuickLink[]; onChange: (next: QuickLink[]) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', icon: '🔗' });

  function openNew() {
    setForm({ title: '', url: '', icon: '🔗' });
    setShowModal(true);
  }

  function add() {
    if (!form.title.trim() || !form.url.trim()) return;
    const link: QuickLink = { id: genId(), title: form.title.trim(), url: normalizeUrl(form.url), icon: form.icon.trim() || '🔗', createdAt: todayISO() };
    onChange([...links, link]);
    setShowModal(false);
  }

  function remove(id: string) {
    onChange(links.filter(l => l.id !== id));
  }

  return (
    <div className="bg-gradient-to-b from-[#0C1424] to-[#080D19] border border-[#1B2A47] rounded-2xl px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Link2 size={15} className="text-blue-300" />
          <p className="text-sm font-medium text-white">Accesos rápidos</p>
        </div>
        <button onClick={openNew} title="Agregar acceso rápido" className="text-gray-500 hover:text-gold-300 transition-colors">
          <Plus size={16} />
        </button>
      </div>

      {links.length === 0 ? (
        <p className="text-xs text-gray-600">Agrega enlaces a las herramientas que usas todos los días.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {links.map(l => (
            <div
              key={l.id}
              className="group flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-lg bg-[#0F1830] border border-[#1B2A47] hover:border-gold-400/40 transition-colors"
            >
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                title={displayUrl(l.url)}
                className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white"
              >
                <span>{l.icon}</span>
                {l.title}
                <ExternalLink size={10} className="text-gray-600" />
              </a>
              <button
                onClick={() => remove(l.id)}
                title="Eliminar"
                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-600 hover:text-red-400 transition-all"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo acceso rápido">
        <div className="space-y-4">
          <Input label="Emoji / Icono" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} placeholder="🔗" />
          <Input label="Título" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ej: Trailhead" autoFocus />
          <Input label="URL" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="trailhead.salesforce.com" />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={add}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Streak milestones ───────────────────────────────────────────────────────

const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 90];

function StreakMilestones({ streak }: { streak: number }) {
  const next = STREAK_MILESTONES.find(m => m > streak);
  const last = STREAK_MILESTONES.filter(m => m <= streak).pop() ?? 0;

  if (streak === 0 && next === undefined) return null;

  const labels: Record<number, string> = {
    3: '3d', 7: '1sem', 14: '2sem', 21: '3sem', 30: '1mes', 60: '2mes', 90: '3mes',
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={15} className="text-orange-400" />
          <p className="text-sm font-medium text-white">Racha actual</p>
          <span className="text-lg font-bold text-orange-400">{streak}</span>
          <span className="text-xs text-gray-500">días</span>
        </div>
        {next && (
          <span className="text-xs text-gray-600">
            Siguiente hito: <span className="text-orange-400 font-medium">{labels[next] ?? `${next}d`}</span>
          </span>
        )}
      </div>

      {/* Milestones row */}
      <div className="flex items-center gap-1 mb-2">
        {STREAK_MILESTONES.map(m => (
          <div
            key={m}
            className={`flex-1 flex flex-col items-center gap-1`}
          >
            <div
              className="w-full h-1.5 rounded-full"
              style={streak >= m
                ? { background: 'linear-gradient(90deg, #D97706, #F59E0B)', boxShadow: '0 0 6px rgba(245,158,11,0.45)' }
                : { background: '#1B2A47' }}
            />
            <span className={`text-xs ${streak >= m ? 'text-orange-400' : 'text-gray-700'}`}>
              {labels[m]}
            </span>
          </div>
        ))}
      </div>

      {next && (
        <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
          <span>{streak - last} días desde el último hito</span>
          <span className="text-orange-400/70">{next - streak} días para {labels[next] ?? `${next}d`}</span>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-[#1B2A47] flex items-center gap-2">
        <ShieldCheck size={13} className={streak >= STREAK_GRACE_MIN ? 'text-emerald-400' : 'text-gray-700'} />
        <p className="text-[11px] text-gray-600">
          {streak >= STREAK_GRACE_MIN
            ? <span className="text-emerald-400/80">Racha protegida: una falta de 1 día no la rompe</span>
            : `Llega a ${STREAK_GRACE_MIN} días para proteger tu racha contra 1 día fallado`}
        </p>
      </div>
    </Card>
  );
}
