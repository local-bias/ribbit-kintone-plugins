import { isUsagePluginConditionMet, restorePluginConfig } from '@/lib/plugin';
import { GanttScale, PluginCondition } from '@/schema/plugin-config';
import { kintoneAPI } from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';

export const pluginConfigAtom = atom(restorePluginConfig());
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

/** 折りたたまれているグループのキーセット */
export const collapsedGroupsAtom = atom<Set<string>>(new Set<string>());
