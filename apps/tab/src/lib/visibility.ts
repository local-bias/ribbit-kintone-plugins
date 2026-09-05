import type { DisplayMode } from '@/schema/plugin-config';
import type { LayoutLabel } from './kintone';

/**
 * 表示方法と選択状況から、対象を表示すべきかどうかを判定します
 *
 * - `add`: 選択されている対象**だけ**を表示する
 * - `sub`: 選択されている対象を**非表示**にする
 *
 * @param displayMode 表示方法
 * @param isSelected 対象が設定情報で選択されているかどうか
 * @returns 対象を表示する場合は`true`、非表示にする場合は`false`
 */
export const shouldShow = (displayMode: DisplayMode, isSelected: boolean): boolean => {
  return displayMode === 'add' ? isSelected : !isSelected;
};

/**
 * 表示方法と選択された対象の一覧から、指定したキーを表示すべきかどうかを判定します
 *
 * @param params.displayMode 表示方法
 * @param params.selected 設定情報で選択されている対象の一覧
 * @param params.key 判定対象のキー(フィールドコード・要素ID・ラベル文言など)
 * @returns 対象を表示する場合は`true`、非表示にする場合は`false`
 */
export const shouldShowKey = (params: {
  displayMode: DisplayMode;
  selected: readonly string[];
  key: string;
}): boolean => {
  const { displayMode, selected, key } = params;
  return shouldShow(displayMode, selected.includes(key));
};

/**
 * ラベルフィールドを表示すべきかどうかを判定します
 *
 * 要素IDを持つラベルは要素IDで識別しますが、要素IDを設定する前に保存された設定情報を
 * そのまま活かせるよう、文言による指定も引き続き参照します。
 *
 * 要素IDも文言も持たないラベルは操作画面で特定できないため、
 * `add`では常に非表示・`sub`では常に表示となります。
 *
 * @param params.displayMode 表示方法
 * @param params.selected 設定情報で選択されている対象の一覧(要素ID・文言が混在します)
 * @param params.label 判定対象のラベル
 * @returns 表示する場合は`true`、非表示にする場合は`false`
 */
export const shouldShowLabel = (params: {
  displayMode: DisplayMode;
  selected: readonly string[];
  label: LayoutLabel;
}): boolean => {
  const { displayMode, selected, label } = params;
  const isSelected =
    (label.elementId !== '' && selected.includes(label.elementId)) ||
    (label.text !== '' && selected.includes(label.text));
  return shouldShow(displayMode, isSelected);
};
