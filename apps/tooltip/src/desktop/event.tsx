import { css } from '@emotion/css';
import {
  getMetaSubtable_UNSTABLE,
  getMetaTable_UNSTABLE,
} from '@konomi-app/kintone-utilities';
import { createRoot } from 'react-dom/client';
import { manager } from '@/lib/event-manager';
import { isProd } from '@/lib/global';
import { restorePluginConfig } from '@/lib/plugin';
import { PLUGIN_NAME } from '@/lib/static';
import TooltipContainer from './components';

let rendered = false;

type ResolvedMetaField = {
  /** kintoneが内部的に使用する一意なフィールドID */
  id: string;
  /** サブテーブル内のフィールドかどうか */
  isInSubtable: boolean;
};

/**
 * フィールドコードから、対応するフィールドのメタ情報を取得します
 *
 * サブテーブル直下のフィールドにも対応しています
 *
 * @param fieldCode フィールドコード
 * @returns フィールドのメタ情報、見つからない場合は`null`
 */
const findMetaFieldByCode = (fieldCode: string): ResolvedMetaField | null => {
  const tableFields = getMetaTable_UNSTABLE() ?? [];
  const tableField = tableFields.find((field) => field && field.var === fieldCode);
  if (tableField) {
    return { id: tableField.id, isInSubtable: false };
  }

  const subtables = getMetaSubtable_UNSTABLE() ?? [];
  for (const subtable of subtables) {
    if (!subtable) {
      continue;
    }
    const subtableField = Object.values(subtable.fieldList).find(
      (field) => field && field.var === fieldCode
    );
    if (subtableField) {
      return { id: subtableField.id, isInSubtable: true };
    }
  }

  return null;
};

/**
 * メタ情報から、ツールチップアイコンを挿入するラベル要素を取得します
 *
 * サブテーブル内のフィールドは列ヘッダーのラベルを対象とします
 */
const findLabelElement = (metaField: ResolvedMetaField): Element | null => {
  if (metaField.isInSubtable) {
    const subtableLabelSelector = `.label-${metaField.id}.subtable-label-gaia`;
    return (
      document.querySelector(`${subtableLabelSelector} .subtable-label-inner-gaia`) ||
      document.querySelector(subtableLabelSelector)
    );
  }

  const commonSelector = `.label-${metaField.id}:not(.subtable-label-gaia)`;
  /** レコード一覧画面のラベルの最小セレクター */
  const indexLabelSelector = `${commonSelector} .recordlist-header-label-gaia`;
  /** レコード詳細画面のラベルの最小セレクター */
  const detailLabelSelector = `${commonSelector} .control-label-text-gaia`;
  /** モバイル版のレコード一覧画面のラベルの最小セレクター */
  const mobileIndexLabelSelector = `${commonSelector} .gaia-mobile-v2-app-index-recordlist-table-headercell-label`;

  return (
    document.querySelector(indexLabelSelector) ||
    document.querySelector(detailLabelSelector) ||
    document.querySelector(mobileIndexLabelSelector) ||
    document.querySelector(`${commonSelector} > div`) ||
    document.querySelector(`${commonSelector}`)
  );
};

manager.add(
  [
    'app.record.create.show',
    'app.record.edit.show',
    'app.record.detail.show',
    'app.record.index.show',
  ],
  (event) => {
    if (rendered && event.type.includes('index')) {
      return event;
    }

    const config = restorePluginConfig();
    rendered = true;

    const metaTable = getMetaTable_UNSTABLE();
    const metaSubtable = getMetaSubtable_UNSTABLE();

    !isProd && console.log({ metaTable, metaSubtable });

    if (!metaTable && !metaSubtable) {
      event.error = `kintoneのアップデートにより、${PLUGIN_NAME}は動作しなくなりました。詳細はホームページをご確認ください`;
      return event;
    }

    for (const condition of config.conditions) {
      const { fieldCode, targetEvents } = condition;
      if (targetEvents.every((targetEvent) => !event.type.includes(targetEvent))) {
        continue;
      }

      const metaField = findMetaFieldByCode(fieldCode);
      if (!metaField) {
        !isProd &&
          console.error(
            `[${PLUGIN_NAME}] 設定したフィールドが見つからなかったため、処理を中断しました`
          );
        continue;
      }

      const target = findLabelElement(metaField);
      if (!target) {
        !isProd &&
          console.error(
            `[${PLUGIN_NAME}] 設定したフィールドが見つからなかったため、処理を中断しました`
          );
        continue;
      }

      target.classList.add(css`
        padding-right: 36px !important;
        position: relative !important;
      `);

      const root = document.createElement('span');
      target.append(root);
      createRoot(root).render(<TooltipContainer condition={condition} />);
    }

    return event;
  }
);
