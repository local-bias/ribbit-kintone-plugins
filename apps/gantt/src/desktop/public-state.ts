import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';
import { isUsagePluginConditionMet, restorePluginConfig } from '@/lib/plugin';
import type { GanttScale, PluginCondition, PluginConfig } from '@/schema/plugin-config';
import type { CategoryPathEntry } from './hooks/use-gantt-layout';

const { config: initialConfig, error: configError } = restorePluginConfig();

export const pluginConfigAtom = atom<PluginConfig>({
  ...initialConfig,
  conditions: initialConfig.conditions.map((condition) => ({
    ...condition,
    categories: condition.categories.slice(0, 1),
    tooltipFieldCodes: condition.tooltipFieldCodes.slice(0, 1),
  })),
});

/**
 * プラグイン設定の読み込み時に発生したエラーを保持するatom
 * エラーがない場合はnull
 */
export const configErrorAtom = atom<Error | null>(configError ?? null);

export const pluginConditionsAtom = atom((get) => get(pluginConfigAtom).conditions);
export const validPluginConditionsAtom = atom((get) =>
  get(pluginConditionsAtom).filter(isUsagePluginConditionMet)
);

/** 現在表示対象の条件 */
export const currentConditionAtom = atom<PluginCondition | null>(null);

/** 取得済みレコード */
export const ganttRecordsAtom = atom<kintoneAPI.RecordData[]>([]);

/** 現在のスケール */
export const ganttScaleAtom = atom<GanttScale>('day');

/** グループ化軸 */
export const ganttGroupByAtom = atom<'category' | 'assignee'>('category');

/** 表示基準日 */
export const ganttViewDateAtom = atom<Date>(new Date());

/** レコード読み込み中フラグ */
export const ganttLoadingAtom = atom<boolean>(false);

/** 現在のアプリID */
export const ganttAppIdAtom = atom<number>(0);

/** 新規タスクダイアログの開閉状態 */
export const addTaskDialogOpenAtom = atom<boolean>(false);

/**
 * カテゴリーヘッダーの「＋」ボタンから開く場合にセットするカテゴリーパス。
 * null の場合はカテゴリー初期値なし（ツールバーの「新規タスク」ボタンから開いた場合）。
 */
export const addTaskInitialCategoryPathAtom = atom<CategoryPathEntry[] | null>(null);

/** 折りたたまれているグループのキーセット */
export const collapsedGroupsAtom = atom<Set<string>>(new Set<string>());

/** 現在表示中の全グループキー（ツールバーの全展開/折りたたみ用） */
export const allGroupKeysAtom = atom<string[]>([]);

/** サイドバーの幅 */
export const sidebarWidthAtom = atom<number>(240);

/** アプリのフォームフィールド（ツールチップ追加フィールドのラベル解決用） */
export const ganttFormFieldsAtom = atom<kintoneAPI.FieldProperty[]>([]);

export const ganttFormFieldTypeMapAtom = atom((get) => {
  const formFields = get(ganttFormFieldsAtom);
  const map = new Map<string, string>();
  for (const field of formFields) {
    if (field.code) {
      map.set(field.code, field.type);
    }
  }
  return map;
});

/** タイムラインの現在の横スクロール位置（px） */
export const ganttScrollXAtom = atom<number>(0);

/** タイムラインのスクロール可能最大値（totalWidth - clientWidth）（px）*/
export const ganttScrollMaxAtom = atom<number>(0);

/** レコード編集ダイアログの状態（null = 閉じている） */
export const editRecordDialogAtom = atom<{ taskId: string; taskTitle: string } | null>(null);
