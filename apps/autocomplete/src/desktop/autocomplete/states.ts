import { PluginCondition } from '@/lib/plugin';
import { LOCAL_STORAGE_KEY } from '@/lib/static';
import { getCurrentRecord, getYuruChara, setCurrentRecord } from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';
import { atomEffect } from 'jotai-effect';

// Basic atoms
export const autoCompleteOptionsAtom = atom<Plugin.AutocompleteOption[]>([]);

export const pluginConditionAtom = atom<PluginCondition | null>(null);

export const inputValueAtom = atom<string>('');

export const optionCursorAtom = atom<number>(-1);

// Derived atoms (equivalent to Recoil selectors)
export const cacheAtom = atom<Plugin.CacheData>(() => {
  const item = localStorage.getItem(LOCAL_STORAGE_KEY) || '{}';
  return JSON.parse(item);
});

export const cachedOptionsAtom = atom<string[]>((get) => {
  const condition = get(pluginConditionAtom);
  if (!condition) {
    return [];
  }
  const cache = get(cacheAtom);
  return cache[condition.cacheId] || [];
});

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
export const inputValueSyncEffect = atomEffect((get) => {
  const inputValue = get(inputValueAtom);
  const condition = get(pluginConditionAtom);

  if (!condition?.targetFieldCode) {
    return;
  }

  const { record } = getCurrentRecord();
  record[condition.targetFieldCode]!.value = inputValue;
  setCurrentRecord({ record });
});
