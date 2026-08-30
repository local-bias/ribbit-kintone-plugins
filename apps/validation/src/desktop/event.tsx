import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { manager } from '@/lib/event-manager';
import { t } from '@/lib/i18n';
import { restorePluginConfig } from '@/lib/plugin';
import type { TargetEvent } from '@/schema/plugin-config';
import { applyFieldErrors, buildRecordErrorMessage, buildWatchedFieldMap } from './field-errors';
import { getFieldLabel, loadFieldLabels } from './field-labels';

type RecordData = kintoneAPI.RecordData;

const pluginConfig = restorePluginConfig();

// 有効な条件をフィルタリング
const validConditions = pluginConfig.conditions.filter(
  (condition) => condition.fieldCode && condition.rules.length > 0
);

const CHANGE_EVENT_TYPES: TargetEvent[] = ['create', 'edit'];

// 保存エラーの見出し。共通設定が未入力の場合は、閲覧者の言語に応じた既定の文言を使用する。
const recordErrorHeading =
  pluginConfig.common.recordErrorHeading || t('desktop.error.recordHeading');

// レコード表示時に、エラー通知で使用するフィールド名を取得しておく。
// 取得を待つとレコード画面の表示が遅れるため、完了は待たない。
// 保存時までに取得できていない場合は、フィールドコードで代替される。
if (validConditions.length > 0) {
  manager.add(['app.record.create.show', 'app.record.edit.show'], (event) => {
    void loadFieldLabels();
    return event;
  });
}

// フィールド変更時のイベント
for (const eventType of CHANGE_EVENT_TYPES) {
  // 変更時にエラーを表示する条件のうち、この画面が対象のもの
  const changeConditions = validConditions.filter(
    (condition) => condition.showErrorOnChange && condition.targetEvents.includes(eventType)
  );

  for (const [watchedFieldCode, targetFieldCodes] of buildWatchedFieldMap(changeConditions)) {
    const changeEvent =
      `app.record.${eventType}.change.${watchedFieldCode}` as kintoneAPI.js.EventType;
    manager.addChangeEvents([changeEvent], (event) => {
      applyFieldErrors(event.record as RecordData, targetFieldCodes, changeConditions);
      return event;
    });
  }
}

// レコード保存前のイベント
manager.add(['app.record.create.submit', 'app.record.edit.submit'], (event) => {
  const eventType: TargetEvent = event.type.includes('create') ? 'create' : 'edit';

  // 対象イベントの条件のみを検証する
  const conditions = validConditions.filter((condition) =>
    condition.targetEvents.includes(eventType)
  );
  const targetFieldCodes = new Set(conditions.map((condition) => condition.fieldCode));

  const errorFieldCodes = applyFieldErrors(
    event.record as RecordData,
    targetFieldCodes,
    conditions
  );

  if (errorFieldCodes.length > 0) {
    event.error = buildRecordErrorMessage(errorFieldCodes.map(getFieldLabel), recordErrorHeading);
  }

  return event;
});
