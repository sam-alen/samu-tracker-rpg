import { useLocalStorage } from './useLocalStorage';
import { storage } from '../lib/storage';
import { applyAttributeXP, defaultAttributes, defaultAttributeXP, getAttributeTier } from '../lib/attributes';
import { fx } from '../lib/fx';
import type { Profile, RPGAttribute } from '../types';

export function useAttributes() {
  const [profile, setProfile] = useLocalStorage<Profile>(storage.keys.profile, storage.getProfile());
  const attributes = profile.attributes ?? defaultAttributes();
  const attributeXP = profile.attributeXP ?? defaultAttributeXP();

  // Reads/persists localStorage directly (always fresh), mirroring useXP —
  // needed so the tier-up check runs outside any setState updater
  // (StrictMode re-runs updaters, which would double-fire the celebration).
  function applyDelta(attr: RPGAttribute, delta: number) {
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

  function gainAttribute(attr: RPGAttribute, amount: number) {
    applyDelta(attr, amount);
  }

  /** Inverse of gainAttribute for un-completing something */
  function loseAttribute(attr: RPGAttribute, amount: number) {
    applyDelta(attr, -amount);
  }

  return { attributes, attributeXP, gainAttribute, loseAttribute };
}
