import { getSpaceElement, setFieldShown } from '@konomi-app/kintone-utilities';
import { store } from '@repo/jotai';
import { RECORD_ROOT_SELECTOR } from '@/lib/constants';
import { isDev } from '@/lib/global';
import type { LayoutHr, LayoutLabel } from '@/lib/kintone';
import { shouldShowKey, shouldShowLabel } from '@/lib/visibility';
import type { PluginCondition } from '@/schema/plugin-config';
import {
  currentAppFieldsAtom,
  currentAppGroupCodesAtom,
  currentAppHrsAtom,
  currentAppLabelsAtom,
  currentAppSpacerElementIdsAtom,
  pluginCommonConfigAtom,
  selectedConditionAtom,
} from './public-state';

/** ラベルフィールドの表示要素を取得します */
const getLabelElements = (): HTMLElement[] => [
  ...document.querySelectorAll<HTMLElement>('.control-label-field-gaia'),
  ...document.querySelectorAll<HTMLElement>('.control-value-label-gaia'),
];

/** 罫線の表示要素を、レコード画面のレイアウト順に取得します */
const getHrElements = (): HTMLElement[] => [
  ...document.querySelectorAll<HTMLElement>(`${RECORD_ROOT_SELECTOR} .hr-cybozu`),
];

/** レイアウト要素の表示・非表示を切り替えます */
const setElementShown = (element: HTMLElement | null | undefined, shown: boolean) => {
  if (!element) {
    return;
  }
  element.style.display = shown ? '' : 'none';
};

/**
 * 現在選択されているタブの設定に従って、レコード画面の表示・非表示を更新します
 *
 * フィールド・グループ・スペース・ラベル・罫線のそれぞれについて、
 * 「指定したものだけ表示」「指定したものを非表示」を適用します
 */
export const refresh = async () => {
  const condition = await store.get(selectedConditionAtom);
  if (!condition) {
    isDev && console.warn('[plugin] 表示対象のタブが存在しないため、更新をスキップしました');
    return;
  }

  const [fields, groupCodes, spacerElementIds, labels, hrs] = await Promise.all([
    store.get(currentAppFieldsAtom),
    store.get(currentAppGroupCodesAtom),
    store.get(currentAppSpacerElementIdsAtom),
    store.get(currentAppLabelsAtom),
    store.get(currentAppHrsAtom),
  ]);

  applyFieldVisibility(
    condition,
    fields.map((field) => field.code)
  );
  applyGroupVisibility(condition, groupCodes);
  applySpaceVisibility(condition, spacerElementIds);
  applyLabelVisibility(condition, labels);
  applyHorizontalRuleVisibility(condition, hrs);

  if (store.get(pluginCommonConfigAtom).collapsesEmptyRows) {
    collapseEmptyRows();
  }

  isDev && console.log('✨ refreshed', condition.tabName);
};

const applyFieldVisibility = (condition: PluginCondition, fieldCodes: string[]) => {
  for (const code of fieldCodes) {
    setFieldShown(
      code,
      shouldShowKey({
        displayMode: condition.fieldDisplayMode,
        selected: condition.fields,
        key: code,
      })
    );
  }
};

const applyGroupVisibility = (condition: PluginCondition, groupCodes: string[]) => {
  for (const code of groupCodes) {
    setFieldShown(
      code,
      shouldShowKey({
        displayMode: condition.groupDisplayMode,
        selected: condition.groups,
        key: code,
      })
    );
  }
};

/**
 * スペースフィールドの表示・非表示を切り替えます
 *
 * 要素IDを指定した`setFieldShown`はスペースの枠ごと非表示にできますが、
 * この挙動はkintoneの2026年2月8日のアップデートで追加されたものです。
 * 反映されていない環境でも従来どおり動作するよう、DOMの操作も併せて行います
 * (どちらも同じ判定結果を適用するため、二重に実行しても矛盾しません)。
 */
const applySpaceVisibility = (condition: PluginCondition, elementIds: string[]) => {
  for (const elementId of elementIds) {
    const shown = shouldShowKey({
      displayMode: condition.spaceDisplayMode,
      selected: condition.spaceIds,
      key: elementId,
    });
    setFieldShown(elementId, shown);
    // スペース自体ではなく、レイアウト上の枠を含む親要素を操作する
    setElementShown(getSpaceElement(elementId)?.parentElement, shown);
  }
};

/**
 * ラベルフィールドの表示・非表示を切り替えます
 *
 * 要素IDを持つラベルは`setFieldShown`で確実に切り替えられますが、
 * 要素IDが未設定のラベルはDOM上で文言によって特定するしかありません。
 * そのため、要素IDを持つラベルの文言と一致する要素はDOMの操作対象から外し、
 * 要素IDによる設定が文言一致で上書きされないようにしています。
 */
const applyLabelVisibility = (condition: PluginCondition, labels: LayoutLabel[]) => {
  const isShown = (label: LayoutLabel) =>
    shouldShowLabel({
      displayMode: condition.labelDisplayMode,
      selected: condition.labels,
      label,
    });

  const textsControlledByElementId = new Set(
    labels.filter((label) => label.elementId !== '').map((label) => label.text)
  );

  for (const label of labels) {
    if (label.elementId === '') {
      continue;
    }
    setFieldShown(label.elementId, isShown(label));
  }

  for (const element of getLabelElements()) {
    const text = element.textContent?.trim() ?? '';
    if (textsControlledByElementId.has(text)) {
      continue;
    }
    setElementShown(element, isShown({ elementId: '', text }));
  }
};

/**
 * 罫線の表示・非表示を切り替えます
 *
 * 罫線は文言を持たないため、レイアウト上の並び順とDOM上の並び順を対応させて特定します。
 * 数が一致しない場合は誤った罫線を操作しないよう、要素IDを持たない罫線と同じ扱い
 * (`add`なら全て非表示・`sub`なら全て表示)に倒します。
 */
const applyHorizontalRuleVisibility = (condition: PluginCondition, hrs: LayoutHr[]) => {
  const elements = getHrElements();
  const isMatched = elements.length === hrs.length;

  elements.forEach((element, index) => {
    const elementId = isMatched ? (hrs[index]?.elementId ?? '') : '';
    const shown = shouldShowKey({
      displayMode: condition.hrDisplayMode,
      selected: condition.hrs,
      key: elementId,
    });
    setElementShown(element, shown);
    if (elementId !== '') {
      setFieldShown(elementId, shown);
    }
  });
};

/** 要素が画面上に表示されているかどうかを判定します */
const isElementVisible = (element: Element): boolean =>
  element instanceof HTMLElement &&
  element.offsetParent !== null &&
  (element.offsetWidth > 0 || element.offsetHeight > 0);

/**
 * 表示できる要素が1つも無くなった行を、行ごと畳みます
 *
 * kintoneは行内の要素を全て非表示にしても行そのものを残すため、
 * 何も表示されていない行の分だけ余白が残ることがあります。
 *
 * 判定の前に必ず行の表示状態を戻してから測るため、タブを切り替えると
 * 表示できる要素が増えた行は元に戻ります。
 */
const collapseEmptyRows = () => {
  const rows = [
    ...document.querySelectorAll<HTMLElement>(`${RECORD_ROOT_SELECTOR} .row-gaia`),
    // テーブル(サブテーブル)の内側は行の意味が異なるため対象外とする
  ].filter((row) => !row.closest('table'));

  // 表示状態の判定はレイアウトの再計算を伴うため、
  // 「全て戻す」「全て測る」「畳む」の順にまとめて処理する
  for (const row of rows) {
    row.style.display = '';
  }
  const isEmpty = rows.map((row) => ![...row.children].some(isElementVisible));
  rows.forEach((row, index) => {
    if (isEmpty[index]) {
      row.style.display = 'none';
    }
  });
};
