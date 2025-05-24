import { produce } from 'immer';
import { atom, WritableAtom, type PrimitiveAtom } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { atomWithDefault, RESET } from 'jotai/utils';
import { type SetStateAction } from 'react';

/**
 * 共通設定(`common`プロパティ)を使用する場合
 */
export function usePluginAtoms<
  T extends {
    common: Record<string, unknown>;
    conditions: ({ id: string } & Record<string, unknown>)[];
  },
>(
  pluginConfigAtom: PrimitiveAtom<T>,
  options: { enableCommonCondition: true }
): {
  pluginConditionsAtom: PrimitiveAtom<T['conditions']>;
  hasMultipleConditionsAtom: PrimitiveAtom<boolean>;
  conditionsLengthAtom: PrimitiveAtom<number>;
  selectedConditionIdAtom: WritableAtom<
    string | null,
    [typeof RESET | SetStateAction<string | null>],
    void
  >;
  isConditionIdUnselectedAtom: PrimitiveAtom<boolean>;
  selectedConditionAtom: PrimitiveAtom<T['conditions'][number]>;
  getConditionPropertyAtom: <F extends keyof T['conditions'][number]>(
    property: F
  ) => PrimitiveAtom<T['conditions'][number][F]>;
  commonConfigAtom: PrimitiveAtom<T['common']>;
  getCommonPropertyAtom: <K extends keyof T['common']>(
    property: K
  ) => WritableAtom<T['common'][K], [newValue: SetStateAction<T['common'][K]>], void>;
};

/**
 * 共通設定(`common`プロパティ)を使用しない場合
 */
export function usePluginAtoms<
  T extends { conditions: ({ id: string } & Record<string, unknown>)[] },
>(
  pluginConfigAtom: PrimitiveAtom<T>,
  options?: { enableCommonCondition?: false }
): {
  pluginConditionsAtom: PrimitiveAtom<T['conditions']>;
  hasMultipleConditionsAtom: PrimitiveAtom<boolean>;
  conditionsLengthAtom: PrimitiveAtom<number>;
  selectedConditionIdAtom: WritableAtom<
    string | null,
    [typeof RESET | SetStateAction<string | null>],
    void
  >;
  isConditionIdUnselectedAtom: PrimitiveAtom<boolean>;
  selectedConditionAtom: PrimitiveAtom<T['conditions'][number]>;
  getConditionPropertyAtom: <F extends keyof T['conditions'][number]>(
    property: F
  ) => PrimitiveAtom<T['conditions'][number][F]>;
};

export function usePluginAtoms<
  T extends {
    conditions: ({ id: string } & Record<string, unknown>)[];
  } & Partial<{
    common: Record<string, unknown>;
  }>,
>(
  pluginConfigAtom: PrimitiveAtom<T>,
  options?: {
    enableCommonCondition?: boolean;
  }
) {
  type Condition = T['conditions'][number];

  const { enableCommonCondition = false } = options || {};

  const pluginConditionsAtom: WritableAtom<Condition[], [SetStateAction<Condition[]>], void> =
    focusAtom(pluginConfigAtom, (s) => s.prop('conditions'));

  const hasMultipleConditionsAtom = atom((get) => {
    const conditions = get(pluginConditionsAtom);
    return conditions.length > 1;
  });

  const selectedConditionIdAtom = atomWithDefault<string | null>((get) =>
    enableCommonCondition ? null : (get(pluginConditionsAtom)[0]?.id ?? null)
  );

  const isConditionIdUnselectedAtom = atom((get) => get(selectedConditionIdAtom) === null);

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
    focusAtom(selectedConditionAtom, (s) => s.prop(property)) as PrimitiveAtom<Condition[F]>;

  if (!enableCommonCondition) {
    return {
      pluginConditionsAtom,
      hasMultipleConditionsAtom,
      conditionsLengthAtom: atom((get) => get(pluginConditionsAtom).length),
      selectedConditionIdAtom,
      isConditionIdUnselectedAtom,
      selectedConditionAtom,
      getConditionPropertyAtom,
    };
  }

  type CommonConfig = T['common'];

  const commonConfigAtom = focusAtom(pluginConfigAtom, (s) => s.prop('common'));

  const getCommonPropertyAtom = <CF extends keyof CommonConfig>(property: CF) =>
    focusAtom(commonConfigAtom, (s) => s.prop(property)) as PrimitiveAtom<CommonConfig[CF]>;

  return {
    pluginConditionsAtom,
    hasMultipleConditionsAtom,
    conditionsLengthAtom: atom((get) => get(pluginConditionsAtom).length),
    selectedConditionIdAtom,
    isConditionIdUnselectedAtom,
    selectedConditionAtom,
    getConditionPropertyAtom,
    commonConfigAtom,
    getCommonPropertyAtom,
  };
}
