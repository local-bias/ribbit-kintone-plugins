import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { mergeValidationResults, validateCondition } from '@/lib/validation';
import type { PluginCondition } from '@/schema/plugin-config';

type RecordData = kintoneAPI.RecordData;

/**
 * フィールドにエラーを設定する
 */
export function setFieldError(
  record: RecordData,
  fieldCode: string,
  errorMessage: string | null
): void {
  const field = record[fieldCode];
  if (field) {
    // @ts-expect-error - kintone API では field.error が存在するがTypeScript型には含まれていない
    field.error = errorMessage;
  }
}

/**
 * 対象フィールドごとに、そのフィールドを対象とするすべての条件を検証し、
 * エラーメッセージをまとめて設定します。
 *
 * 同じフィールドに複数の条件・複数のルールが設定されている場合でも、
 * 通過できなかったすべてのエラーメッセージが表示されます。
 *
 * レコードに存在しないフィールド（設定後に削除された、フィールドのアクセス権で
 * 参照できないなど）は、エラーを表示しても利用者が修正できないため検証しません。
 *
 * @returns エラーとなったフィールドコードの一覧（`targetFieldCodes`の順）
 */
export function applyFieldErrors(
  record: RecordData,
  targetFieldCodes: Iterable<string>,
  conditions: PluginCondition[]
): string[] {
  const errorFieldCodes: string[] = [];
  for (const fieldCode of targetFieldCodes) {
    if (!record[fieldCode]) {
      continue;
    }
    const results = conditions
      .filter((condition) => condition.fieldCode === fieldCode)
      .map((condition) => validateCondition(condition, record));
    const merged = mergeValidationResults(results);
    setFieldError(record, fieldCode, merged.isValid ? null : merged.errorMessage);
    if (!merged.isValid) {
      errorFieldCodes.push(fieldCode);
    }
  }
  return errorFieldCodes;
}

/**
 * 画面上部に表示する、レコード全体のエラーメッセージを生成します。
 *
 * kintone標準の保存時エラーに倣い、見出しの下にエラーとなったフィールド名を箇条書きで並べます。
 * エラーが1件もない場合は、表示するメッセージがないため空文字列を返します。
 *
 * @param fieldNames エラーとなったフィールドの表示名
 * @param heading 画面上部へ表示する見出し（プラグインの共通設定で変更可能）
 */
export function buildRecordErrorMessage(fieldNames: string[], heading: string): string {
  if (fieldNames.length === 0) {
    return '';
  }
  const list = fieldNames.map((fieldName) => `・${fieldName}`).join('\n');
  return `${heading}\n\n${list}`;
}

/**
 * 条件の検証結果に影響するフィールドコードの一覧を返します。
 *
 * 対象フィールドに加え、適用条件で参照しているフィールドも監視対象とします。
 * これにより、条件フィールドが変わって適用条件を満たさなくなった際にエラーが解除されます。
 */
export function getWatchedFieldCodes(condition: PluginCondition): string[] {
  const conditionFieldCodes = (condition.applyConditions ?? [])
    .map((c) => c.fieldCode)
    .filter((code): code is string => !!code);
  return Array.from(new Set([condition.fieldCode, ...conditionFieldCodes]));
}

/**
 * 「変更を監視するフィールド」から「そのフィールドの変更時に再検証すべき対象フィールド」への
 * 対応表を作成します。
 *
 * 1つのフィールドの変更が複数の条件に影響しうるため、対象フィールドは集合で保持します。
 */
export function buildWatchedFieldMap(conditions: PluginCondition[]): Map<string, Set<string>> {
  const watchedFieldMap = new Map<string, Set<string>>();
  for (const condition of conditions) {
    for (const watchedFieldCode of getWatchedFieldCodes(condition)) {
      const targets = watchedFieldMap.get(watchedFieldCode) ?? new Set<string>();
      targets.add(condition.fieldCode);
      watchedFieldMap.set(watchedFieldCode, targets);
    }
  }
  return watchedFieldMap;
}
