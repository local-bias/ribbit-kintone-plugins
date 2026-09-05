import { getAppId } from '@konomi-app/kintone-utilities';
import { atom } from '@repo/jotai';
import { isDev } from '@/lib/global';
import { getSelectedTabStorageKey, resolveInitialTabIndex } from '@/lib/selected-tab';
import { refresh } from '../actions';
import {
  pluginCommonConfigAtom,
  selectedTabIndexAtom,
  visiblePluginConditionsAtom,
} from '../public-state';

/**
 * localStorageは、プライベートウィンドウやブラウザの設定によって参照・書き込みが
 * 例外になる場合があるため、失敗しても機能に影響しないよう握りつぶします
 */
const readStoredConditionId = (): string | null => {
  const app = getAppId();
  if (!app) {
    return null;
  }
  try {
    return localStorage.getItem(getSelectedTabStorageKey(app));
  } catch (error) {
    isDev && console.warn('[plugin] 選択中のタブを読み込めませんでした', error);
    return null;
  }
};

const writeStoredConditionId = (conditionId: string) => {
  const app = getAppId();
  if (!app) {
    return;
  }
  try {
    localStorage.setItem(getSelectedTabStorageKey(app), conditionId);
  } catch (error) {
    isDev && console.warn('[plugin] 選択中のタブを保存できませんでした', error);
  }
};

/**
 * URLの指定と前回の選択状態から、初期表示するタブを決定します
 */
export const handleInitialTabResolveAtom = atom(null, async (get, set) => {
  const conditions = await get(visiblePluginConditionsAtom);
  const { remembersSelectedTab } = get(pluginCommonConfigAtom);
  const index = resolveInitialTabIndex({
    conditions,
    search: globalThis.location?.search ?? '',
    storedId: remembersSelectedTab ? readStoredConditionId() : null,
  });
  set(selectedTabIndexAtom, index);
});

/**
 * 表示条件の再評価によってタブの一覧が変わったあと、選択状態を整合させて再描画します
 *
 * 選択中のタブが表示対象から外れた場合は、先頭のタブへ寄せます
 */
export const handleVisibleConditionsChangeAtom = atom(null, async (get, set) => {
  const conditions = await get(visiblePluginConditionsAtom);
  if (get(selectedTabIndexAtom) >= conditions.length) {
    set(selectedTabIndexAtom, 0);
  }
  await refresh();
});

/**
 * タブの選択を切り替え、レコード画面の表示状態を更新します
 */
export const handleTabChangeAtom = atom(null, async (get, set, index: number) => {
  set(selectedTabIndexAtom, index);

  if (get(pluginCommonConfigAtom).remembersSelectedTab) {
    const conditions = await get(visiblePluginConditionsAtom);
    const condition = conditions[index];
    if (condition) {
      writeStoredConditionId(condition.id);
    }
  }

  await refresh();
});
