import { PluginCondition, PluginConfig, restorePluginConfig } from '@/lib/plugin';
import { produce } from 'immer';
import { atom, DefaultValue, RecoilState, selector, selectorFamily } from 'recoil';

const PREFIX = 'plugin';

export const storageState = atom<PluginConfig>({
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

export const conditionsState = selector<PluginCondition[]>({
  key: `${PREFIX}conditionsState`,
  get: ({ get }) => {
    const storage = get(storageState);
    return storage.conditions;
  },
  set: ({ set }, newValue) => {
    if (newValue instanceof DefaultValue) {
      return;
    }
    set(storageState, (current) =>
      produce(current, (draft) => {
        draft.conditions = newValue;
      })
    );
  },
});

export const selectedConditionIdState = atom<string | null>({
  key: `${PREFIX}selectedConditionIdState`,
  default: selector<string | null>({
    key: `${PREFIX}selectedConditionIdStateDefault`,
    get: ({ get }) => {
      return get(conditionsState)[0]?.id ?? null;
    },
  }),
});

export const selectedConditionState = selector<PluginCondition>({
  key: `${PREFIX}selectedConditionState`,
  get: ({ get }) => {
    const conditions = get(conditionsState);
    const selectedId = get(selectedConditionIdState);
    return conditions.find((condition) => condition.id === selectedId) ?? conditions[0];
  },
  set: ({ get, set }, newValue) => {
    if (newValue instanceof DefaultValue) {
      return;
    }
    const conditions = get(conditionsState);
    const index = conditions.findIndex((condition) => condition.id === newValue.id);
    set(conditionsState, conditions.toSpliced(index, 1, newValue));
  },
});

const conditionPropertyState = selectorFamily<
  PluginCondition[keyof PluginCondition],
  keyof PluginCondition
>({
  key: `${PREFIX}conditionPropertyState`,
  get:
    (key) =>
    ({ get }) => {
      const selectedCondition = get(selectedConditionState);
      return selectedCondition[key];
    },
  set:
    (key) =>
    ({ get, set }, newValue) => {
      if (newValue instanceof DefaultValue) {
        process.env.NODE_ENV === 'development' && console.warn('newValue is DefaultValue');
        return;
      }
      set(selectedConditionState, (current) =>
        produce(current, (draft) => {
          // @ts-ignore
          draft[key] = newValue;
        })
      );
    },
});

export const getConditionPropertyState = <T extends keyof PluginCondition>(property: T) =>
  conditionPropertyState(property) as unknown as RecoilState<PluginCondition[T]>;
