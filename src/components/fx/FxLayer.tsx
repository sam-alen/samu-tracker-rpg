import { useEffect, useRef, useState } from 'react';
import { Zap, Coins, Trophy, Award, Sparkles } from 'lucide-react';
import { fx, type FxEvent } from '../../lib/fx';
import { goldForXP } from '../../lib/xp';
import { getRank } from '../../lib/titles';

interface Spark {
  dx: number;
  dy: number;
  color: string;
  size: number;
  delay: number;
}

interface Popup {
  id: number;
  x: number;
  y: number;
  label: string;
  sub?: string;
  tone: 'xp' | 'gold';
  sparks: Spark[];
}

interface BannerState {
  id: number;
  title: string;
  subtitle?: string;
}

interface AchievementFx {
  id: number;
  title: string;
  description: string;
  gold: number;
}

const XP_SPARK_COLORS = ['#4DA6FF', '#A8D4FF', '#8B5CF6', '#D6ECFF'];
const GOLD_SPARK_COLORS = ['#E3BC4B', '#F7E8B8', '#E3BC4B', '#A8D4FF'];

let nextId = 1;

function makeSparks(colors: string[]): Spark[] {
  return Array.from({ length: 10 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.6;
    const dist = 26 + Math.random() * 34;
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 10, // slight upward bias
      color: colors[i % colors.length],
      size: 3 + Math.random() * 3,
      delay: Math.random() * 90,
    };
  });
}

export function FxLayer() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const levelUpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The queue itself is the source of truth — its head is "current". This
  // avoids copying it into a second piece of state via an effect (which
  // would react to a state change by calling setState synchronously in the
  // effect body, the same anti-pattern already fixed in Pomodoro's timer).
  const [achievementQueue, setAchievementQueue] = useState<AchievementFx[]>([]);
  const currentAchievement = achievementQueue[0] ?? null;
  const achievementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return fx.subscribe((e: FxEvent) => {
      if (e.kind === 'reward' || e.kind === 'gold') {
        const id = nextId++;
        const popup: Popup = e.kind === 'reward'
          ? {
              id, x: e.x, y: e.y, tone: 'xp',
              label: `+${e.xp} XP`,
              sub: `+${goldForXP(e.xp)} oro`,
              sparks: makeSparks(XP_SPARK_COLORS),
            }
          : {
              id, x: e.x, y: e.y, tone: 'gold',
              label: `−${e.amount} oro`,
              sparks: makeSparks(GOLD_SPARK_COLORS),
            };
        setPopups(prev => [...prev.slice(-7), popup]);
        setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 1200);
      } else if (e.kind === 'banner') {
        const id = nextId++;
        setBanner({ id, title: e.title, subtitle: e.subtitle });
        setTimeout(() => setBanner(prev => (prev?.id === id ? null : prev)), 2800);
      } else if (e.kind === 'levelup') {
        setLevelUp(e.level);
        if (levelUpTimer.current) clearTimeout(levelUpTimer.current);
        levelUpTimer.current = setTimeout(() => setLevelUp(null), 3400);
      } else if (e.kind === 'achievement') {
        const id = nextId++;
        setAchievementQueue(prev => [...prev, { id, title: e.title, description: e.description, gold: e.gold }]);
      }
    });
  }, []);

  // Auto-advances the queue after each achievement's display window — the
  // setState lives inside the timer callback (a genuine async callback),
  // not the effect body reacting synchronously to a dependency.
  useEffect(() => {
    if (!currentAchievement) return;
    achievementTimer.current = setTimeout(() => setAchievementQueue(prev => prev.slice(1)), 4200);
    return () => { if (achievementTimer.current) clearTimeout(achievementTimer.current); };
  }, [currentAchievement]);

  function dismissLevelUp() {
    if (levelUpTimer.current) clearTimeout(levelUpTimer.current);
    setLevelUp(null);
  }

  function dismissAchievement() {
    if (achievementTimer.current) clearTimeout(achievementTimer.current);
    setAchievementQueue(prev => prev.slice(1));
  }

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none overflow-hidden">
      {/* ── Floating reward popups + sparks ─────────────────────────────── */}
      {popups.map(p => (
        <div key={p.id} className="absolute" style={{ left: p.x, top: p.y }}>
          {p.sparks.map((s, i) => (
            <span
              key={i}
              className="fx-spark"
              style={{
                '--dx': `${s.dx}px`,
                '--dy': `${s.dy}px`,
                width: s.size,
                height: s.size,
                background: s.color,
                animationDelay: `${s.delay}ms`,
                boxShadow: `0 0 6px ${s.color}`,
              } as React.CSSProperties}
            />
          ))}
          <div className={`fx-float flex flex-col items-center whitespace-nowrap font-display font-bold leading-tight ${
            p.tone === 'xp' ? '' : ''
          }`}>
            <span
              className={`flex items-center gap-1 text-base ${p.tone === 'xp' ? 'text-gold-200' : 'text-[#F0D26E]'}`}
              style={{ textShadow: p.tone === 'xp' ? '0 0 12px rgba(77,166,255,0.8)' : '0 0 12px rgba(227,188,75,0.8)' }}
            >
              {p.tone === 'xp' ? <Zap size={14} /> : <Coins size={14} />}
              {p.label}
            </span>
            {p.sub && (
              <span className="text-[11px] font-semibold text-[#E3BC4B]" style={{ textShadow: '0 0 8px rgba(227,188,75,0.6)' }}>
                {p.sub}
              </span>
            )}
          </div>
        </div>
      ))}

      {/* ── System banner (top center) ──────────────────────────────────── */}
      {banner && (
        <div key={banner.id} className="fx-banner absolute top-5 left-1/2 w-max max-w-[92vw] card-ornate rounded-xl px-5 py-3 text-center">
          <p className="font-display text-sm font-bold text-gradient-gold uppercase tracking-widest flex items-center gap-2 justify-center">
            <Trophy size={15} className="text-gold-300" />
            {banner.title}
          </p>
          {banner.subtitle && <p className="text-xs text-gray-400 mt-0.5">{banner.subtitle}</p>}
        </div>
      )}

      {/* ── Level-up system window ──────────────────────────────────────── */}
      {levelUp !== null && <LevelUpOverlay level={levelUp} onClose={dismissLevelUp} />}

      {/* ── Achievement unlock window ────────────────────────────────────── */}
      {currentAchievement && <AchievementOverlay achievement={currentAchievement} onClose={dismissAchievement} />}
    </div>
  );
}

function LevelUpOverlay({ level, onClose }: { level: number; onClose: () => void }) {
  const rank = getRank(level);
  return (
    <div
      className="absolute inset-0 pointer-events-auto flex items-center justify-center fx-overlay cursor-pointer"
      onClick={onClose}
      role="dialog"
      aria-label={`Nivel ${level} alcanzado`}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      <div className="relative fx-card-in card-ornate rounded-2xl px-12 py-9 text-center">
        {/* expanding rings */}
        <span className="fx-ring absolute inset-0 rounded-2xl border-2 border-gold-400/70" />
        <span className="fx-ring absolute inset-0 rounded-2xl border border-arcane-500/50" style={{ animationDelay: '180ms' }} />

        <p className="font-display text-[10px] tracking-[0.4em] text-gold-400 uppercase">◆ Sistema ◆</p>

        <p className="fx-glow font-display text-5xl font-bold text-gradient-gold mt-3 leading-none">
          Nivel {level}
        </p>
        <p className="font-display text-xs tracking-[0.25em] text-gray-400 uppercase mt-2">¡Has subido de nivel!</p>

        <div className="divider-ornate my-4 text-[7px]">◆</div>

        <p className="text-sm">
          <span className="mr-1.5">{rank.badge}</span>
          <span className={`font-display font-bold uppercase tracking-wider ${rank.textColor}`}>{rank.title}</span>
        </p>
        <p className="text-xs text-gray-500 italic mt-1.5 max-w-[240px]">{rank.description}</p>

        <p className="text-[10px] text-gray-700 mt-5 uppercase tracking-widest">Toca para continuar</p>
      </div>
    </div>
  );
}

function AchievementOverlay({ achievement, onClose }: { achievement: AchievementFx; onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 pointer-events-auto flex items-center justify-center fx-overlay cursor-pointer"
      onClick={onClose}
      role="dialog"
      aria-label={`Logro desbloqueado: ${achievement.title}`}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      <div className="relative fx-card-in card-ornate rounded-2xl px-12 py-9 text-center max-w-[340px]">
        <span className="fx-ring absolute inset-0 rounded-2xl border-2 border-arcane-400/70" />
        <span className="fx-ring absolute inset-0 rounded-2xl border border-gold-400/50" style={{ animationDelay: '180ms' }} />

        <p className="font-display text-[10px] tracking-[0.4em] text-arcane-300 uppercase flex items-center justify-center gap-1.5">
          <Sparkles size={11} /> Logro Desbloqueado <Sparkles size={11} />
        </p>

        <div className="w-16 h-16 rounded-full mx-auto mt-4 flex items-center justify-center bg-gradient-to-b from-arcane-500 to-arcane-700 border-2 border-arcane-300/70 shadow-[0_0_24px_rgba(139,92,246,0.55)]">
          <Award size={28} className="text-white" />
        </div>

        <p className="fx-glow font-display text-2xl font-bold text-gradient-gold mt-4 leading-tight">
          {achievement.title}
        </p>
        <p className="text-xs text-gray-400 mt-1.5">{achievement.description}</p>

        <div className="divider-ornate my-4 text-[7px]">◆</div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gold-900/40 border border-gold-600/40">
          <Coins size={13} className="text-gold-300" />
          <span className="font-display text-sm font-bold text-gold-200">+{achievement.gold} oro</span>
        </div>

        <p className="text-[10px] text-gray-700 mt-5 uppercase tracking-widest">Toca para continuar</p>
      </div>
    </div>
  );
}
