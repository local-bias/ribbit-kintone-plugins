import { restorePluginConfig } from '@/lib/plugin';
import { PluginCondition, PluginConfig } from '@/schema/plugin-config';
import { produce } from 'immer';
import { atom } from 'jotai';
import { atomWithDefault } from 'jotai/utils';
import { SetStateAction } from 'react';

export const pluginConfigAtom = atom<PluginConfig>(restorePluginConfig());

export const loadingAtom = atom<boolean>(false);

export const pluginConditionsAtom = atom(
  (get) => get(pluginConfigAtom).conditions,
  (_, set, newValue: SetStateAction<PluginCondition[]>) => {
    set(pluginConfigAtom, (current) =>
      produce(current, (draft) => {
        draft.conditions = typeof newValue === 'function' ? newValue(draft.conditions) : newValue;
      })
    );
  }
);

export const selectedConditionIdAtom = atomWithDefault<string>((get) => {
  const config = get(pluginConfigAtom);
  return config.conditions[0].id;
});

export const selectedConditionAtom = atom(
  (get) => {
    const conditions = get(pluginConditionsAtom);
    const selectedConditionId = get(selectedConditionIdAtom);
    return conditions.find((condition) => condition.id === selectedConditionId) ?? conditions[0]!;
  },
  (get, set, newValue: SetStateAction<PluginCondition>) => {
    const selectedConditionId = get(selectedConditionIdAtom);
    const conditions = get(pluginConditionsAtom);
    const index = conditions.findIndex((condition) => condition.id === selectedConditionId);
    if (index === -1) {
      return;
    }
    set(pluginConfigAtom, (current) =>
      produce(current, (draft) => {
        draft.conditions[index] =
          typeof newValue === 'function' ? newValue(draft.conditions[index]) : newValue;
      })
    );
  }
);

export const conditionsLengthAtom = atom<number>((get) => {
  const conditions = get(pluginConditionsAtom);
  return conditions.length;
});

export const getConditionPropertyAtom = <T extends keyof PluginCondition>(property: T) =>
  atom(
    (get) => {
      return get(selectedConditionAtom)[property];
    },
    (_, set, newValue: SetStateAction<PluginCondition[T]>) => {
      set(selectedConditionAtom, (condition) =>
        produce(condition, (draft) => {
          draft[property] = typeof newValue === 'function' ? newValue(draft[property]) : newValue;
        })
      );
    }
  );

export const conditionFieldCodeAtom = getConditionPropertyAtom('fieldCode');
export const conditionLabelAtom = getConditionPropertyAtom('label');
export const conditionTypeAtom = getConditionPropertyAtom('type');
export const conditionIconTypeAtom = getConditionPropertyAtom('iconType');
export const conditionIconColorAtom = getConditionPropertyAtom('iconColor');
export const conditionEmojiAtom = getConditionPropertyAtom('emoji');
