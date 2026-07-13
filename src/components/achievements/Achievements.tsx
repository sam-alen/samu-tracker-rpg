import { useState, useMemo } from 'react';
import {
  Lock, Coins, Target, Flame, Sparkles as SparklesIcon, Trophy,
  Milestone, BookOpen, Hammer, ShieldCheck, GraduationCap, Landmark, Unlock,
} from 'lucide-react';
import { SectionHeader } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAttributes } from '../../hooks/useAttributes';
import { useXP } from '../../hooks/useXP';
import { storage } from '../../lib/storage';
import { ACHIEVEMENTS, computeStats, type AchievementCategory } from '../../lib/achievements';
import type {
  Habit, Mission, StudySession, PomodoroState, Book, Project, BadHabit,
  MonthlyReview, Reward, Transaction, FinanceAccounts,
} from '../../types';

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  misiones: 'Misiones',
  habitos: 'Hábitos',
  atributos: 'Atributos',
  nivel: 'Nivel',
  enfoque: 'Enfoque',
  proyectos: 'Proyectos',
  disciplina: 'Disciplina',
  crecimiento: 'Crecimiento',
  tesoreria: 'Tesorería',
  meta: 'Meta',
};

const CATEGORY_ICONS: Record<AchievementCategory, React.ReactNode> = {
  misiones: <Target size={15} />,
  habitos: <Flame size={15} />,
  atributos: <SparklesIcon size={15} />,
  nivel: <Milestone size={15} />,
  enfoque: <BookOpen size={15} />,
  proyectos: <Hammer size={15} />,
  disciplina: <ShieldCheck size={15} />,
  crecimiento: <GraduationCap size={15} />,
  tesoreria: <Landmark size={15} />,
  meta: <Unlock size={15} />,
};

const CATEGORY_ORDER: AchievementCategory[] = [
  'nivel', 'misiones', 'habitos', 'atributos', 'enfoque',
  'proyectos', 'disciplina', 'crecimiento', 'tesoreria', 'meta',
];

export function Achievements() {
  const [habits] = useLocalStorage<Habit[]>(storage.keys.habits, []);
  const [missions] = useLocalStorage<Mission[]>(storage.keys.missions, []);
  const [unlocked] = useLocalStorage<string[]>(storage.keys.unlockedAchievements, []);
  const [studySessions] = useLocalStorage<StudySession[]>(storage.keys.studySessions, []);
  const [pomodoro] = useLocalStorage<PomodoroState>(storage.keys.pomodoro, { completedToday: 0, lastDate: '' });
  const [books] = useLocalStorage<Book[]>(storage.keys.books, []);
  const [projects] = useLocalStorage<Project[]>(storage.keys.projects, []);
  const [badHabits] = useLocalStorage<BadHabit[]>(storage.keys.badHabits, []);
  const [recommendationsProgress] = useLocalStorage<string[]>(storage.keys.recommendationsProgress, []);
  const [monthlyReviews] = useLocalStorage<MonthlyReview[]>(storage.keys.monthlyReviews, []);
  const [rewards] = useLocalStorage<Reward[]>(storage.keys.rewards, []);
  const [transactions] = useLocalStorage<Transaction[]>(storage.keys.transactions, []);
  const [financeAccounts] = useLocalStorage<FinanceAccounts>(storage.keys.financeAccounts, { account: 0, savings: 0, history: [] });
  const { attributes } = useAttributes();
  const { xp } = useXP();

  const [tab, setTab] = useState<AchievementCategory | 'todos'>('todos');

  const unlockedSet = useMemo(() => new Set(unlocked), [unlocked]);

  const stats = useMemo(() => computeStats(
    habits, missions, attributes, xp, studySessions, pomodoro, books, projects,
    badHabits, recommendationsProgress.length, monthlyReviews.length,
    rewards.filter(r => r.claimedAt).length, transactions.length, financeAccounts.savings,
    unlockedSet.size,
  ), [
    habits, missions, attributes, xp, studySessions, pomodoro, books, projects,
    badHabits, recommendationsProgress, monthlyReviews, rewards, transactions,
    financeAccounts, unlockedSet,
  ]);

  const filtered = tab === 'todos' ? ACHIEVEMENTS : ACHIEVEMENTS.filter(a => a.category === tab);
  const unlockedCount = unlockedSet.size;
  const goldEarned = ACHIEVEMENTS.filter(a => unlockedSet.has(a.id)).reduce((sum, a) => sum + a.goldReward, 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Logros"
        subtitle="Títulos y recompensas que desbloqueas al cruzar hitos reales"
      />

      <div className="card-ornate rounded-xl p-4 flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-gradient-to-b from-arcane-500 to-arcane-700 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(139,92,246,0.35)] border border-arcane-300/50">
          <Trophy size={19} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-display text-lg font-bold text-gradient-gold leading-tight">
            {unlockedCount}/{ACHIEVEMENTS.length} desbloqueados
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Una vez ganado, un logro es tuyo para siempre</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold-900/40 border border-gold-600/40 shrink-0">
          <Coins size={13} className="text-gold-300" />
          <span className="font-display text-sm font-bold text-gold-200">{goldEarned}</span>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'todos', label: 'Todos' },
          ...CATEGORY_ORDER.map(c => ({ id: c, label: CATEGORY_LABELS[c], icon: CATEGORY_ICONS[c] })),
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="space-y-2">
        {filtered.map(a => {
          const isUnlocked = unlockedSet.has(a.id);
          const { current, target } = a.progress(stats);
          const pct = Math.min(100, Math.round((current / target) * 100));
          const Icon = a.icon;
          return (
            <div
              key={a.id}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors
                ${isUnlocked
                  ? 'bg-arcane-950/25 border-arcane-700/40'
                  : 'bg-gradient-to-b from-[#0C1424] to-[#080D19] border-[#1B2A47]'}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border
                ${isUnlocked
                  ? 'bg-gradient-to-b from-arcane-500 to-arcane-700 border-arcane-300/60 shadow-[0_0_10px_rgba(139,92,246,0.35)]'
                  : 'bg-gray-900 border-gray-700 text-gray-600'}`}
              >
                {isUnlocked ? <Icon size={17} className="text-white" /> : <Lock size={15} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-semibold ${isUnlocked ? 'text-arcane-200' : 'text-gray-300'}`}>{a.title}</p>
                  {isUnlocked && <Badge color="purple">Desbloqueado</Badge>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>
                {!isUnlocked && (
                  <div className="mt-2">
                    <div className="w-full h-1.5 bg-black/40 border border-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1 tabular-nums">{current} / {target}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0 px-2 py-1 rounded-md bg-gold-900/30 border border-gold-700/30">
                <Coins size={11} className="text-gold-400" />
                <span className="text-xs text-gold-300 font-semibold">{a.goldReward}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
