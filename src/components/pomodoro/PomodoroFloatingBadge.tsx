import { Coffee, Timer } from 'lucide-react';
import { usePomodoroTimer } from '../../hooks/pomodoroTimerContext';

/** Shown whenever a session is counting down and the user has navigated away
 *  from the Enfoque section — the whole point of running the timer outside
 *  the Pomodoro screen is invisible without some always-on indicator that
 *  it's still going. Clicking it jumps back to Enfoque. */
export function PomodoroFloatingBadge({ onOpen }: { onOpen: () => void }) {
  const { running, seconds, isBreak, mode } = usePomodoroTimer();
  if (!running) return null;

  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');

  return (
    <button
      onClick={onOpen}
      title="Sesión de enfoque en curso — clic para volver"
      className="fixed bottom-[76px] right-4 md:bottom-5 md:right-6 z-40 flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-full border shadow-lg backdrop-blur transition-transform active:scale-95"
      style={{
        borderColor: `${isBreak ? '#34C08B' : mode.ringColor}66`,
        backgroundColor: '#0B1120E6',
        boxShadow: `0 0 16px ${isBreak ? '#34C08B' : mode.ringColor}40`,
      }}
    >
      {isBreak
        ? <Coffee size={15} className="text-emerald-400 animate-pulse" />
        : <Timer size={15} style={{ color: mode.ringColor }} className="animate-pulse" />}
      <span className="text-sm font-mono font-semibold text-white tracking-tight">{mins}:{secs}</span>
    </button>
  );
}
