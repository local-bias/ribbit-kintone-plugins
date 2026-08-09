import { restorePluginConfig } from '@/lib/plugin';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import type { PluginConfig, PluginCondition } from '@/schema/plugin-config';

export const storageAtom = atom<PluginConfig>(restorePluginConfig());

export const loadingAtom = atom<boolean>(false);

export const commonAtom = atom(
  (get) => get(storageAtom).common,
  (get, set, newValue: PluginConfig['common']) => {
    const current = get(storageAtom);
    set(storageAtom, { ...current, common: newValue });
  }
);

export const typeAtom = atom(
  (get) => get(commonAtom).type,
  (get, set, newValue: PluginConfig['common']['type']) => {
    const current = get(commonAtom);
    set(commonAtom, { ...current, type: newValue });
  }
);

export const tocTitleAtom = atom(
  (get) => get(commonAtom).tocTitle,
  (get, set, newValue: string) => {
    const current = get(commonAtom);
    set(commonAtom, { ...current, tocTitle: newValue });
  }
);

export const maxWidthAtom = atom(
  (get) => get(commonAtom).maxWidth,
  (get, set, newValue: number | null) => {
    const current = get(commonAtom);
    set(commonAtom, { ...current, maxWidth: newValue });
  }
);

export const conditionsAtom = atom(
  (get) => get(storageAtom).conditions,
  (get, set, newValue: PluginCondition[]) => {
    const current = get(storageAtom);
    set(storageAtom, { ...current, conditions: newValue });
  }
);

export const conditionsLengthAtom = atom((get) => get(conditionsAtom).length);

export const conditionRowAtom = atomFamily((index: number) =>
  atom(
    (get) => get(conditionsAtom)[index],
    (get, set, newValue: PluginCondition) => {
      const current = get(conditionsAtom);
      const updated = [...current];
      updated[index] = newValue;
      set(conditionsAtom, updated);
    }
  )
);

export const getConditionLabelAtom = atomFamily((index: number) =>
  atom(
    (get) => get(conditionRowAtom(index)).label,
    (get, set, newValue: string) => {
      const current = get(conditionRowAtom(index));
      set(conditionRowAtom(index), { ...current, label: newValue });
    }
  )
);

export const getConditionColorAtom = atomFamily((index: number) =>
  atom(
    (get) => get(conditionRowAtom(index)).color,
    (get, set, newValue: string) => {
      const current = get(conditionRowAtom(index));
      set(conditionRowAtom(index), { ...current, color: newValue });
    }
  )
);

export const getConditionSpaceIdAtom = atomFamily((index: number) =>
  atom(
    (get) => get(conditionRowAtom(index)).spaceId,
    (get, set, newValue: string) => {
      const current = get(conditionRowAtom(index));
      set(conditionRowAtom(index), { ...current, spaceId: newValue });
    }
  )
);
