import { getCurrentRecord, getYuruChara, setCurrentRecord } from '@konomi-app/kintone-utilities';
import { atom } from '@repo/jotai';
import { atomEffect } from 'jotai-effect';
import type { PluginCondition } from '@/lib/plugin';

// Basic atoms
export const autoCompleteOptionsAtom = atom<Plugin.AutocompleteOption[]>([]);

export const pluginConditionAtom = atom<PluginCondition | null>(null);

export const inputValueAtom = atom<string>('');

export const optionCursorAtom = atom<number>(-1);

// Tracks whether inputValueSyncEffect has already run once, so the initial
// (mount-time) value isn't written back to the kintone record. Recoil's
// `onSet` never fired for the value set via `initializeState`; atomEffect has
// no equivalent, so this guard reproduces the same behavior.
const hasSyncedOnceAtom = atom(false);

export const filteredOptionsAtom = atom((get) => {
  const inputValue = get(inputValueAtom);
  const condition = get(pluginConditionAtom);
  const options = get(autoCompleteOptionsAtom);

  const limit = condition?.limit ? condition.limit : null;

  if (!inputValue) {
    process.env.NODE_ENV === 'development' &&
      console.log('入力値が空欄のため、オプションを全て表示します。');
    return limit ? options.slice(0, limit) : options;
  }

  const words = getYuruChara(inputValue).split(/\s+/g);
  const filtered = options.filter(({ quickSearch }) =>
    words.every((word) => quickSearch.includes(word))
  );
  return limit ? filtered.slice(0, limit) : filtered;
});

// Effect for syncing inputValue to kintone record (replaces Recoil effects)
export const inputValueSyncEffect = atomEffect((get, set) => {
  const inputValue = get(inputValueAtom);
  const condition = get(pluginConditionAtom);

  // Skip the first run, which fires synchronously for the initial value as
  // soon as this effect is subscribed. Writing back to the record at that
  // point can race with kintone's own in-progress screen update (e.g. when
  // navigating from the record detail screen to the edit screen), causing
  // kintone.app.record.set() to throw. Checked before the targetFieldCode
  // guard so the "first run" flag is always set on the effect's actual first
  // invocation, regardless of condition shape.
  if (!get(hasSyncedOnceAtom)) {
    set(hasSyncedOnceAtom, true);
    return;
  }

  if (!condition?.targetFieldCode) {
    return;
  }

  const { record } = getCurrentRecord();
  record[condition.targetFieldCode]!.value = inputValue;
  setCurrentRecord({ record });
});
