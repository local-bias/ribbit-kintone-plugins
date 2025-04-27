import { produce } from 'immer';
import { atom, PrimitiveAtom } from 'jotai';
import { atomWithDefault } from 'jotai/utils';
import { SetStateAction } from 'react';

export function usePluginAtoms<
  T extends { conditions: ({ id: string } & Record<string, unknown>)[] },
>(
  pluginConfigAtom: PrimitiveAtom<T>,
  options?: {
    enableCommonCondition?: boolean;
  }
) {
  type Condition = T['conditions'][number];

  const { enableCommonCondition = false } = options || {};

  const pluginConditionsAtom = atom(
    (get) => get(pluginConfigAtom).conditions as Condition[],
    (_, set, newValue: SetStateAction<Condition[]>) => {
      set(pluginConfigAtom, (current) => {
        if (typeof newValue === 'function') {
          return {
            ...current,
            conditions: newValue(current.conditions),
          };
        }
        return {
          ...current,
          conditions: newValue,
        };
      });
    }
  );

  const selectedConditionIdAtom = atomWithDefault<string | null>((get) =>
    enableCommonCondition ? null : (get(pluginConditionsAtom)[0]?.id ?? null)
  );

  const selectedConditionAtom = atom(
    (get) => {
      const conditions = get(pluginConditionsAtom);
      const selectedConditionId = get(selectedConditionIdAtom);
      return conditions.find((condition) => condition.id === selectedConditionId) ?? conditions[0]!;
    },
    (get, set, newValue: SetStateAction<Condition>) => {
      const selectedConditionId = get(selectedConditionIdAtom);
      set(pluginConditionsAtom, (current) =>
        produce(current, (draft) => {
          const index = draft.findIndex((condition) => condition.id === selectedConditionId);
          if (index !== -1) {
            //@ts-ignore
            draft[index] = typeof newValue === 'function' ? newValue(draft[index]!) : newValue;
          }
        })
      );
    }
  );

  const getConditionPropertyAtom = <F extends keyof Condition>(property: F) =>
    atom(
      (get) => {
        return get(selectedConditionAtom)[property];
      },
      (_, set, newValue: SetStateAction<Condition[F]>) => {
        set(selectedConditionAtom, (condition) =>
          produce(condition, (draft) => {
            //@ts-ignore
            draft[property] = typeof newValue === 'function' ? newValue(draft[property]) : newValue;
          })
        );
      }
    );

  return {
    pluginConditionsAtom,
    conditionsLengthAtom: atom((get) => get(pluginConditionsAtom).length),
    selectedConditionIdAtom,
    selectedConditionAtom,
    getConditionPropertyAtom,
  };
}
