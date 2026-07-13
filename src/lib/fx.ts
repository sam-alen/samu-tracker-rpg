// Tiny pub/sub for visual reward effects ("game juice"). Components emit
// events at interaction time; the FxLayer mounted in App renders them.
// No dependencies, no context — a module singleton is enough for one app root.

export type FxEvent =
  | { kind: 'reward'; x: number; y: number; xp: number }
  | { kind: 'gold'; x: number; y: number; amount: number }
  | { kind: 'levelup'; level: number }
  | { kind: 'banner'; title: string; subtitle?: string }
  | { kind: 'achievement'; title: string; description: string; gold: number };

type Handler = (e: FxEvent) => void;

const handlers = new Set<Handler>();

export const fx = {
  subscribe(h: Handler): () => void {
    handlers.add(h);
    return () => { handlers.delete(h); };
  },

  emit(e: FxEvent): void {
    handlers.forEach(h => h(e));
  },

  /** Reward popup at the click point, or at a sensible center if no event */
  rewardAt(e: { clientX: number; clientY: number } | null, xp: number): void {
    fx.emit({
      kind: 'reward',
      x: e?.clientX ?? window.innerWidth / 2,
      y: e?.clientY ?? window.innerHeight * 0.35,
      xp,
    });
  },
};
