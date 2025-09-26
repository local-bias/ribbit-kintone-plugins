import { PluginCondition } from '@/lib/plugin';
import { LOCAL_STORAGE_KEY } from '@/lib/static';
import { getCurrentRecord, getYuruChara, setCurrentRecord } from '@konomi-app/kintone-utilities';
import { atom, selector } from 'recoil';

const PREFIX = 'autocomplete';

export const autoCompleteOptionsState = atom<Plugin.AutocompleteOption[]>({
  key: `${PREFIX}/autoCompleteOptionsState`,
  default: [],
});

export const pluginConditionState = atom<PluginCondition | null>({
  key: `${PREFIX}/pluginConditionState`,
  default: null,
});

export const cacheState = selector<Plugin.CacheData>({
  key: `${PREFIX}/cacheState`,
  get: () => {
    const item = localStorage.getItem(LOCAL_STORAGE_KEY) || '{}';
    return JSON.parse(item);
  },
});

export const cachedOptionsState = selector<string[]>({
  key: `${PREFIX}/cachedOptionsState`,
  get: ({ get }) => {
    const condition = get(pluginConditionState);
    if (!condition) {
      return [];
    }
    const cache = get(cacheState);
    return cache[condition.cacheId] || [];
  },
});

export const inputValueState = atom<string>({
  key: `${PREFIX}/inputValueState`,
  default: '',
  effects: [
    ({ onSet, getPromise }) => {
      onSet(async (newValue) => {
        const condition = await getPromise(pluginConditionState);
        if (!condition?.targetFieldCode) {
          return;
        }
        const { record } = getCurrentRecord();
        record[condition.targetFieldCode].value = newValue;
        setCurrentRecord({ record });
      });
    },
  ],
});

export const optionCursorState = atom<number>({
  key: `${PREFIX}/optionCursorState`,
  default: -1,
});

export const filteredOptionsState = selector({
  key: `${PREFIX}/filteredOptionsState`,
  get: ({ get }) => {
    const inputValue = get(inputValueState);
    const condition = get(pluginConditionState);
    const options = get(autoCompleteOptionsState);

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
  },
});
