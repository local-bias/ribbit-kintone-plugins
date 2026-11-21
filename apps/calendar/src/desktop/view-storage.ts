import { LOCAL_STORAGE_KEY } from '@/lib/static';

/**
 * 表示形式は、同じブラウザタブの中でのみ前回の状態を復元するため`sessionStorage`に保存する
 *
 * プライベートブラウズ等でストレージが使用できない場合でも、カレンダーの表示は継続する
 */
const getKey = (conditionId: string) => `${LOCAL_STORAGE_KEY}.view.${conditionId}`;

export const readStoredViewType = (conditionId: string): string | null => {
  try {
    return sessionStorage.getItem(getKey(conditionId));
  } catch {
    return null;
  }
};

export const storeViewType = (conditionId: string, viewType: string): void => {
  try {
    sessionStorage.setItem(getKey(conditionId), viewType);
  } catch {
    // 保存できなくても、次回の表示が設定上の初期表示形式になるだけのため無視する
  }
};
