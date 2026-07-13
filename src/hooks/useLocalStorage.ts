import { useState, useCallback } from 'react';

function readStorage<T>(key: string, initialValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : initialValue;
  } catch {
    return initialValue;
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => readStorage(key, initialValue));

  // Writes localStorage synchronously, right here — not inside a setState
  // updater. React may defer running that updater until after this handler
  // returns, and if some other code does its own direct storage write in
  // between (e.g. checkAchievements() granting gold right after gainXP()),
  // the deferred updater would flush its own stale captured value afterward
  // and silently clobber the newer write. Basing `prev` on a fresh read
  // (not React's possibly-stale `stored`) closes that race for good.
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      const current = readStorage(key, initialValue);
      const next = typeof value === 'function' ? (value as (p: T) => T)(current) : value;
      localStorage.setItem(key, JSON.stringify(next));
      setStored(next);
    },
    [key, initialValue],
  );

  return [stored, setValue];
}
