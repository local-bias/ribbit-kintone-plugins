/**
 * kintoneレコードのフィールド値から、カレンダーイベントの表示に使う値を取り出す純粋関数群
 *
 * kintoneのグローバル変数に依存しないようにしておき、単体テストできるようにしている
 */
import { getSortedOptions } from '@/lib/utils';
import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import type { PluginCalendarEvent } from './states/calendar';

type FieldLike = { type: string; value: unknown } | undefined;

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

const richTextToPlainText = (html: string): string =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => HTML_ENTITIES[entity] ?? entity)
    .replace(/\s+/g, ' ')
    .trim();

/**
 * フィールドの値を、カレンダー上に表示するための1行の文字列に変換します
 *
 * 値が空の場合は`undefined`を返します
 */
export const fieldValueToText = (field: FieldLike): string | undefined => {
  if (!field) {
    return undefined;
  }
  const { type, value } = field;
  if (Array.isArray(value)) {
    const joined = value
      .map((item) => (typeof item === 'string' ? item : String(item?.name ?? '')))
      .filter(Boolean)
      .join(', ');
    return joined || undefined;
  }
  if (typeof value !== 'string' || value === '') {
    return undefined;
  }
  return type === 'RICH_TEXT' ? richTextToPlainText(value) || undefined : value;
};

/**
 * カレンダーに表示するタイトルを、表示用タイトルのフィールドから取得します
 *
 * - 表示用タイトルのフィールドが未設定・削除済みの場合は`undefined`(入力用のタイトルを表示する)
 * - REST APIは閲覧権限のないフィールドをレスポンスに含めないため、フィールドが存在しない場合は
 *   権限がない旨のラベルを返す
 */
export const getDisplayTitle = (params: {
  record: kintoneAPI.RecordData;
  fieldCode: string;
  /** フィールドがアプリに存在するか(削除済みのフィールドを権限なしと誤認しないため) */
  fieldExists: boolean;
  noPermissionLabel: string;
}): string | undefined => {
  const { record, fieldCode, fieldExists, noPermissionLabel } = params;
  if (!fieldCode || !fieldExists) {
    return undefined;
  }
  if (!(fieldCode in record)) {
    return noPermissionLabel;
  }
  return fieldValueToText(record[fieldCode] as FieldLike);
};

/** 計算フィールドのうち、数値として比較できる表示形式のもの */
const NUMERIC_CALC_FORMATS = ['NUMBER', 'NUMBER_DIGIT'];

const isNumericCalc = (property: kintoneAPI.FieldProperty | undefined): boolean =>
  property?.type === 'CALC' && NUMERIC_CALC_FORMATS.includes(property.format);

/**
 * 同じ時刻の予定を並べるための比較値を返します
 *
 * - 数値フィールドと、数値を返す計算フィールドは数値として比較する
 * - ドロップダウン・ラジオボタンは、選択肢の並び順で比較する
 * - それ以外は文字列として比較する
 * - 値が空の場合は`null`(`compareSortValues`で常に末尾に並べる)
 */
export const getSortValue = (params: {
  record: kintoneAPI.RecordData;
  fieldCode: string;
  property: kintoneAPI.FieldProperty | undefined;
}): string | number | null => {
  const { record, fieldCode, property } = params;
  if (!fieldCode) {
    return null;
  }
  const field = record[fieldCode] as FieldLike;
  const value = field?.value;
  if (typeof value !== 'string' || value === '') {
    return null;
  }

  if (property?.type === 'DROP_DOWN' || property?.type === 'RADIO_BUTTON') {
    const options = getSortedOptions(property.options) as { label: string }[];
    const index = options.findIndex((option) => option.label === value);
    return index === -1 ? null : index;
  }
  if (field?.type === 'NUMBER' || isNumericCalc(property)) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : value;
  }
  return value;
};

/**
 * 背景イベントの設定が、現在のアプリのフィールド構成で有効に使えるかどうかを判定します
 *
 * 設定後にフィールドや選択肢が変更・削除された場合に、存在しない選択肢をkintoneへ
 * 書き込もうとして保存に失敗しないようにするため
 */
export const isBackgroundEventAvailable = (params: {
  enablesBackgroundEvent: boolean;
  backgroundEventOption: string;
  property: kintoneAPI.FieldProperty | undefined;
}): boolean => {
  const { enablesBackgroundEvent, backgroundEventOption, property } = params;
  return (
    enablesBackgroundEvent &&
    !!backgroundEventOption &&
    property?.type === 'CHECK_BOX' &&
    backgroundEventOption in property.options
  );
};

/** レコードが背景イベントとして表示する対象かどうかを判定します */
export const isBackgroundRecord = (params: {
  record: kintoneAPI.RecordData;
  fieldCode: string;
  option: string;
}): boolean => {
  const { record, fieldCode, option } = params;
  if (!fieldCode || !option) {
    return false;
  }
  const value = (record[fieldCode] as FieldLike)?.value;
  return Array.isArray(value) && value.includes(option);
};

/**
 * 既存の予定を複製した、kintone未登録の新しいイベントを返します
 *
 * - 繰り返し予定(シリーズ)の複製では、元のシリーズで分離・削除済みの回の情報は引き継がない
 * - 「この回のみ」として分離された予定の複製は、元のシリーズとは無関係な単発の予定にする
 * - 担当者は引き継がない(保存後に再取得する)
 */
export const buildCopiedEvent = (
  event: PluginCalendarEvent,
  titleSuffix: string
): PluginCalendarEvent => {
  // 担当者は作成者などkintoneが新しいレコードに対して決める値の場合があるため、引き継がずに
  // 未取得(undefined)とし、保存後の再取得で確定させる
  const { extendedProps, assignees: _assignees, ...rest } = event;
  const recurrence = extendedProps?.recurrence;
  const { recurrence: _, ...otherExtendedProps } = extendedProps ?? {};

  const copiedExtendedProps =
    recurrence?.kind === 'master'
      ? { ...otherExtendedProps, recurrence: { ...recurrence, exceptions: [] } }
      : otherExtendedProps;

  return {
    ...rest,
    id: undefined,
    title: `${event.title ?? ''}${titleSuffix}`,
    ...(Object.keys(copiedExtendedProps).length > 0 ? { extendedProps: copiedExtendedProps } : {}),
  };
};
