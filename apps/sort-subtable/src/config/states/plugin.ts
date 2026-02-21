import { restorePluginConfig } from '@/lib/plugin';
import { produce } from 'immer';
import { DefaultValue, atom, selector } from 'recoil';

const PREFIX = 'plugin';

export const storageState = atom<kintone.plugin.Storage>({
  key: `${PREFIX}storageState`,
  default: restorePluginConfig(),
});

export const loadingState = atom<boolean>({
  key: `${PREFIX}loadingState`,
  default: false,
});

export const tabIndexState = atom<number>({
  key: `${PREFIX}tabIndexState`,
  default: 0,
});

export const ignoreFieldsState = selector<string[]>({
  key: `${PREFIX}ignoreFieldsState`,
  get: ({ get }) => {
    const config = get(storageState);
    return config.ignoreFields;
  },
  set: ({ set }, newValue) => {
    set(storageState, (current) =>
      produce(current, (draft) => {
        if (newValue instanceof DefaultValue) {
          return;
        }
        draft.ignoreFields = newValue;
      })
    );
  },
});
