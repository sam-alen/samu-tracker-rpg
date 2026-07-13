import { useLocalStorage } from './useLocalStorage';
import { addXP, removeXP, updateStreak, revertStreak, xpProgress, goldForXP } from '../lib/xp';
import { storage } from '../lib/storage';
import { fx } from '../lib/fx';
import type { XPState } from '../types';

const defaultXP: XPState = {
  total: 0,
  level: 1,
  streak: 0,
  lastActiveDate: '',
  gold: 0,
};

export function useXP() {
  const [xp, setXP] = useLocalStorage<XPState>(storage.keys.xp, defaultXP);

  // Old saves lack `gold`
  const gold = xp.gold ?? 0;

  // Reads localStorage directly (always fresh) and persists synchronously,
  // so two gainXP calls in the same tick (mission + all-done bonus) compose
  // correctly — React state alone would be stale for the second call. The
  // level-up check runs here, outside any setState updater (StrictMode-safe).
  function gainXP(amount: number) {
    const current = storage.getXP();
    const next = addXP(updateStreak(current), amount);
    storage.setXP(next);
    setXP(next);
    if (next.level > current.level) {
      fx.emit({ kind: 'levelup', level: next.level });
    }
  }

  /** Inverse of gainXP for un-completing. Reverts today's streak bump too,
   *  but only once the LAST rewarded action of the day is undone — partial
   *  undos (one of several completed items) leave the streak alone. */
  function loseXP(amount: number) {
    const current = storage.getXP();
    const next = removeXP(revertStreak(current), amount);
    storage.setXP(next);
    setXP(next);
  }

  function spendGold(amount: number): boolean {
    const current = storage.getXP();
    if ((current.gold ?? 0) < amount) return false;
    const next = { ...current, gold: (current.gold ?? 0) - amount };
    storage.setXP(next);
    setXP(next);
    return true;
  }

  /** Inverse of spendGold (e.g. restoring a claimed shop reward) */
  function refundGold(amount: number) {
    const current = storage.getXP();
    const next = { ...current, gold: (current.gold ?? 0) + amount };
    storage.setXP(next);
    setXP(next);
  }

  const progress = xpProgress(xp);

  return { xp: { ...xp, gold }, gainXP, loseXP, spendGold, refundGold, goldForXP, progress };
}
