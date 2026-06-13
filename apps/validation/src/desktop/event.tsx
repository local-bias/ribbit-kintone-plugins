import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { manager } from '@/lib/event-manager';
import { restorePluginConfig } from '@/lib/plugin';
import { validateCondition } from '@/lib/validation';
import type { TargetEvent } from '@/schema/plugin-config';

type RecordData = kintoneAPI.RecordData;

/**
 * フィールドにエラーを設定する
 */
function setFieldError(record: RecordData, fieldCode: string, errorMessage: string | null): void {
  const field = record[fieldCode];
  if (field) {
    // @ts-expect-error - kintone API では field.error が存在するがTypeScript型には含まれていない
    field.error = errorMessage;
  }
}

/**
 * フィールド変更イベントを生成
 */
function getChangeEvents(
  fields: string[],
  events: ('create' | 'edit')[]
): kintoneAPI.js.EventType[] {
  return events.reduce<kintoneAPI.js.EventType[]>(
    (acc, event) =>
      [
        ...acc,
        ...fields.map((field) => `app.record.${event}.change.${field}`),
      ] as kintoneAPI.js.EventType[],
    []
  );
}

const pluginConfig = restorePluginConfig();

// 有効な条件をフィルタリング
const validConditions = pluginConfig.conditions.filter(
  (condition) => condition.fieldCode && condition.rules.length > 0
);

// フィールド変更時のイベント
for (const condition of validConditions) {
  const { fieldCode, showErrorOnChange, targetEvents } = condition;

  if (!showErrorOnChange) {
    continue;
  }

  const changeEventTypes: ('create' | 'edit')[] = [];
  if (targetEvents.includes('create')) {
    changeEventTypes.push('create');
  }
  if (targetEvents.includes('edit')) {
    changeEventTypes.push('edit');
  }

  if (changeEventTypes.length > 0) {
    // 対象フィールドに加え、適用条件で参照しているフィールドの変更も監視する。
    // これにより、条件フィールドが変わって適用条件を満たさなくなった際にエラーが解除される。
    const conditionFieldCodes = (condition.applyConditions ?? [])
      .map((c) => c.fieldCode)
      .filter((code): code is string => !!code);
    const watchedFieldCodes = Array.from(new Set([fieldCode, ...conditionFieldCodes]));
    const changeEvents = getChangeEvents(watchedFieldCodes, changeEventTypes);
    manager.addChangeEvents(changeEvents, (event) => {
      const result = validateCondition(condition, event.record as RecordData);
      setFieldError(
        event.record as RecordData,
        fieldCode,
        result.isValid ? null : result.errorMessage
      );
      return event;
    });
  }
}

// レコード保存前のイベント
manager.add(['app.record.create.submit', 'app.record.edit.submit'], (event) => {
  const eventType: TargetEvent = event.type.includes('create') ? 'create' : 'edit';

  let hasError = false;

  for (const condition of validConditions) {
    // 対象イベントかどうかをチェック
    if (!condition.targetEvents.includes(eventType)) {
      continue;
    }

    const result = validateCondition(condition, event.record as RecordData);
    setFieldError(
      event.record as RecordData,
      condition.fieldCode,
      result.isValid ? null : result.errorMessage
    );
    if (!result.isValid) {
      hasError = true;
    }
  }

  if (hasError) {
    event.error = '入力内容にエラーがあります。修正してください。';
  }

  return event;
});
