import { produce } from 'immer';
import { atom, WritableAtom, type PrimitiveAtom } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { atomWithDefault, RESET } from 'jotai/utils';
import { type SetStateAction } from 'react';

/**
 * プラグインの状態を管理するatomのコレクションを提供します。
 * 共通設定(`common`プロパティ)を使用する場合のオーバーロードです。
 *
 * @param pluginConfigAtom プラグイン設定のベースとなるatom
 * @param options 設定オプション。`enableCommonCondition: true`を指定すると共通設定が有効になります
 * @returns プラグイン設定を操作するためのatomのコレクション
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
  /**
   * プラグインの条件リストを管理するatom
   */
  pluginConditionsAtom: PrimitiveAtom<T['conditions']>;
  /**
   * 複数の条件が存在するかどうかを示すatom
   */
  hasMultipleConditionsAtom: PrimitiveAtom<boolean>;
  /**
   * 条件の数を提供するatom
   */
  conditionsLengthAtom: PrimitiveAtom<number>;
  /**
   * 現在選択されている条件のIDを管理するatom
   * nullの場合は共通設定が選択されていることを意味します
   */
  selectedConditionIdAtom: WritableAtom<
    string | null,
    [typeof RESET | SetStateAction<string | null>],
    void
  >;
  /**
   * 条件が選択されていないかどうか（共通設定が選択されているか）を示すatom
   */
  isConditionIdUnselectedAtom: PrimitiveAtom<boolean>;
  /**
   * 現在選択されている条件の内容を管理するatom
   */
  selectedConditionAtom: PrimitiveAtom<T['conditions'][number]>;
  /**
   * 選択中の条件の特定プロパティにアクセスするためのatom生成関数
   * @param property アクセスしたいプロパティのキー
   * @returns 指定されたプロパティにフォーカスしたatom
   */
  getConditionPropertyAtom: <F extends keyof T['conditions'][number]>(
    property: F
  ) => PrimitiveAtom<T['conditions'][number][F]>;
  /**
   * 共通設定を管理するatom
   */
  commonConfigAtom: PrimitiveAtom<T['common']>;
  /**
   * 共通設定の特定プロパティにアクセスするためのatom生成関数
   * @param property アクセスしたいプロパティのキー
   * @returns 指定されたプロパティにフォーカスしたatom
   */
  getCommonPropertyAtom: <K extends keyof T['common']>(
    property: K
  ) => WritableAtom<T['common'][K], [newValue: SetStateAction<T['common'][K]>], void>;
};

/**
 * プラグインの状態を管理するatomのコレクションを提供します。
 * 共通設定(`common`プロパティ)を使用しない場合のオーバーロードです。
 *
 * @param pluginConfigAtom プラグイン設定のベースとなるatom
 * @param options 設定オプション
 * @returns プラグイン設定を操作するためのatomのコレクション
 */
export function usePluginAtoms<
  T extends { conditions: ({ id: string } & Record<string, unknown>)[] },
>(
  pluginConfigAtom: PrimitiveAtom<T>,
  options?: { enableCommonCondition?: false }
): {
  /**
   * プラグインの条件リストを管理するatom
   */
  pluginConditionsAtom: PrimitiveAtom<T['conditions']>;
  /**
   * 複数の条件が存在するかどうかを示すatom
   */
  hasMultipleConditionsAtom: PrimitiveAtom<boolean>;
  /**
   * 条件の数を提供するatom
   */
  conditionsLengthAtom: PrimitiveAtom<number>;
  /**
   * 現在選択されている条件のIDを管理するatom
   */
  selectedConditionIdAtom: WritableAtom<
    string | null,
    [typeof RESET | SetStateAction<string | null>],
    void
  >;
  /**
   * 条件が選択されていないかどうかを示すatom
   */
  isConditionIdUnselectedAtom: PrimitiveAtom<boolean>;
  /**
   * 現在選択されている条件の内容を管理するatom
   */
  selectedConditionAtom: PrimitiveAtom<T['conditions'][number]>;
  /**
   * 選択中の条件の特定プロパティにアクセスするためのatom生成関数
   * @param property アクセスしたいプロパティのキー
   * @returns 指定されたプロパティにフォーカスしたatom
   */
  getConditionPropertyAtom: <F extends keyof T['conditions'][number]>(
    property: F
  ) => PrimitiveAtom<T['conditions'][number][F]>;
};

/**
 * プラグインの状態を管理するatomのコレクションを提供します。
 * 共通設定の使用有無をオプションで指定できる実装です。
 *
 * @param pluginConfigAtom プラグイン設定のベースとなるatom
 * @param options 設定オプション。`enableCommonCondition`を指定すると共通設定が有効になります
 * @returns プラグイン設定を操作するためのatomのコレクション
 *
 * @example
 * // 共通設定を使用する場合
 * const { commonConfigAtom, selectedConditionAtom } = usePluginAtoms(configAtom, { enableCommonCondition: true });
 *
 * @example
 * // 共通設定を使用しない場合
 * const { selectedConditionAtom } = usePluginAtoms(configAtom);
 */
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
