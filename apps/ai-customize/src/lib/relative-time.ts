/**
 * 日時を「3日前」のような相対表記にします(純粋関数)
 */

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
  ['second', 1],
];

/**
 * @param value ISO 8601の日時
 * @param locale 表示言語(`ja` / `en`など)
 * @returns 解釈できない値は空文字
 */
export const formatRelativeTime = (value: string, now: Date, locale: string): string => {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) {
    return '';
  }
  const seconds = Math.round((time - now.getTime()) / 1000);
  const [unit, size] = UNITS.find(([, unitSeconds]) => Math.abs(seconds) >= unitSeconds) ??
    UNITS[UNITS.length - 1] ?? ['second', 1];
  return new Intl.RelativeTimeFormat(locale, { numeric: 'always' }).format(
    Math.round(seconds / size),
    unit
  );
};
