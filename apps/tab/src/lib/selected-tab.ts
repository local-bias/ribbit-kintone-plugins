import type { PluginCondition } from '@/schema/plugin-config';

/** 選択するタブをURLで指定するためのクエリパラメータ名 */
export const TAB_QUERY_PARAM = 'tab';

/**
 * 最後に選択していたタブを保存するlocalStorageのキーを返します
 *
 * アプリごとに独立して保存します(ブラウザのlocalStorageはユーザーごとに分かれるため、
 * ユーザーの識別は不要です)。
 */
export const getSelectedTabStorageKey = (appId: string | number): string =>
  `ribbit-kintone-plugin-tab/${appId}/selected-tab`;

/**
 * URLのクエリパラメータから、選択すべきタブのインデックスを解決します
 *
 * タブ名との完全一致を優先し、一致しなければ1始まりの番号として解釈します。
 *
 * @returns 該当するタブのインデックス。指定が無い、または該当が無い場合は`null`
 */
const resolveIndexFromSearch = (conditions: PluginCondition[], search: string): number | null => {
  let value: string | null = null;
  try {
    value = new URLSearchParams(search).get(TAB_QUERY_PARAM);
  } catch {
    return null;
  }
  if (!value) {
    return null;
  }

  const byName = conditions.findIndex((condition) => condition.tabName === value);
  if (byName !== -1) {
    return byName;
  }

  const position = Number(value);
  if (!Number.isInteger(position)) {
    return null;
  }
  const byPosition = position - 1;
  return byPosition >= 0 && byPosition < conditions.length ? byPosition : null;
};

/**
 * 初期表示で選択するタブのインデックスを決定します
 *
 * 優先順位は URL指定 > 前回選択したタブ > 先頭のタブ です。
 *
 * @param params.conditions 表示対象のタブ
 * @param params.search `location.search`の値
 * @param params.storedId 前回選択していたタブのID(記憶しない設定の場合は`null`)
 * @returns 選択するタブのインデックス
 */
export const resolveInitialTabIndex = (params: {
  conditions: PluginCondition[];
  search: string;
  storedId: string | null;
}): number => {
  const { conditions, search, storedId } = params;
  if (conditions.length === 0) {
    return 0;
  }

  const fromSearch = resolveIndexFromSearch(conditions, search);
  if (fromSearch !== null) {
    return fromSearch;
  }

  if (storedId) {
    const stored = conditions.findIndex((condition) => condition.id === storedId);
    if (stored !== -1) {
      return stored;
    }
  }

  return 0;
};
