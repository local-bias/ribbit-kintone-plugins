/**
 * CSVの日付・日時・時刻の値を、kintoneが受け付ける形式へ正規化するユーティリティ。
 *
 * kintoneの各フィールドが受け付ける形式:
 * - DATE: `yyyy-MM-dd`
 * - DATETIME: ISO 8601（UTC、例 `2024-01-02T06:30:00Z`）
 * - TIME: `HH:mm`
 *
 * ある程度の表記揺れ（区切り文字、全角、和暦表記、時刻有無など）を吸収します。
 * 解析できない場合は原文をそのまま返し、kintone側の検証に委ねます。
 */

const pad2 = (value: number): string => String(value).padStart(2, '0');
const pad4 = (value: number): string => String(value).padStart(4, '0');

/** 全角数字・全角記号を半角へ正規化し、前後の空白を除去します。 */
function normalize(input: string): string {
  return input
    .trim()
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/／/g, '/')
    .replace(/：/g, ':')
    .replace(/．/g, '.')
    .replace(/[－‐]/g, '-')
    .replace(/　/g, ' ');
}

interface DateParts {
  year: number;
  month: number;
  day: number;
}

interface TimeParts {
  hour: number;
  minute: number;
  second: number;
}

/** 文字列から日付部分を抽出します。実在しない日付（繰り上がり）は無効とみなします。 */
function parseDate(normalized: string): DateParts | null {
  let matched =
    normalized.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/) ??
    normalized.match(/(\d{4})年(\d{1,2})月(\d{1,2})日?/) ??
    normalized.match(/^(\d{4})(\d{2})(\d{2})(?:\D|$)/);

  if (!matched) {
    return null;
  }

  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);

  // 実在する日付かを検証する（例: 2024-13-45 や 2024-02-30 を弾く）
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return { year, month, day };
}

/** 文字列から時刻部分を抽出します。 */
function parseTime(normalized: string): TimeParts | null {
  const matched =
    normalized.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/) ??
    normalized.match(/(\d{1,2})時(\d{1,2})分(?:(\d{1,2})秒)?/);

  if (!matched) {
    return null;
  }

  const hour = Number(matched[1]);
  const minute = Number(matched[2]);
  const second = matched[3] ? Number(matched[3]) : 0;

  if (hour > 23 || minute > 59 || second > 59) {
    return null;
  }

  return { hour, minute, second };
}

/** Date を kintone の DATETIME 形式（UTC・ミリ秒なし）へ変換します。 */
function toKintoneUtc(date: Date): string {
  const year = pad4(date.getUTCFullYear());
  const month = pad2(date.getUTCMonth() + 1);
  const day = pad2(date.getUTCDate());
  const hour = pad2(date.getUTCHours());
  const minute = pad2(date.getUTCMinutes());
  const second = pad2(date.getUTCSeconds());
  return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
}

/** DATEフィールド向けに `yyyy-MM-dd` へ正規化します。 */
export function normalizeDateValue(cell: string): string {
  const raw = cell.trim();
  if (!raw) {
    return '';
  }

  const date = parseDate(normalize(cell));
  if (!date) {
    return raw;
  }
  return `${pad4(date.year)}-${pad2(date.month)}-${pad2(date.day)}`;
}

/** TIMEフィールド向けに `HH:mm` へ正規化します。 */
export function normalizeTimeValue(cell: string): string {
  const raw = cell.trim();
  if (!raw) {
    return '';
  }

  const time = parseTime(normalize(cell));
  if (!time) {
    return raw;
  }
  return `${pad2(time.hour)}:${pad2(time.minute)}`;
}

/** DATETIMEフィールド向けにISO 8601（UTC）へ正規化します。 */
export function normalizeDateTimeValue(cell: string): string {
  const raw = cell.trim();
  if (!raw) {
    return '';
  }

  const normalized = normalize(cell);

  // タイムゾーン付きのISO文字列（末尾が Z または ±hh:mm）はそのまま解釈する
  if (/[tT].*([zZ]|[+-]\d{2}:?\d{2})$/.test(normalized)) {
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return toKintoneUtc(parsed);
    }
  }

  const date = parseDate(normalized);
  if (!date) {
    return raw;
  }

  const time = parseTime(normalized) ?? { hour: 0, minute: 0, second: 0 };
  // タイムゾーン指定がない値は、ブラウザ（ユーザー）のローカルタイムとして解釈してUTCへ変換する
  const local = new Date(date.year, date.month - 1, date.day, time.hour, time.minute, time.second);
  if (Number.isNaN(local.getTime())) {
    return raw;
  }
  return toKintoneUtc(local);
}
