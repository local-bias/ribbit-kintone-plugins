/**
 * `get_record_sample`で送るレコード値を、指定したフィールドだけに絞って小さくします(純粋関数)
 *
 * 承認カードで示したフィールド以外の値を送らない。長い文字列は切り詰め、全体の大きさにも上限を設ける
 *
 * @see docs/07-ai-tools.md 4-6章、docs/08-security.md 6章
 */

export const MAX_SAMPLE_STRING = 300;
export const MAX_SAMPLE_BYTES = 8 * 1024;

type RecordLike = Record<string, { value?: unknown } | undefined>;

const shrink = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return value.length > MAX_SAMPLE_STRING ? `${value.slice(0, MAX_SAMPLE_STRING)}…` : value;
  }
  if (Array.isArray(value)) return value.map(shrink);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shrink(item)]));
  }
  return value;
};

const encoder = new TextEncoder();

export type RecordSampleResult = {
  records: Record<string, unknown>[];
  /** 指定されたが、レコードに無かったフィールドコード */
  missingFields: string[];
  /** 大きさの上限で、後ろのレコードを省いた */
  truncated: boolean;
};

export const pickRecordValues = (
  records: readonly RecordLike[],
  fields: readonly string[],
  limit = Number.POSITIVE_INFINITY
): RecordSampleResult => {
  const missing = new Set<string>();
  const picked: Record<string, unknown>[] = [];
  let truncated = false;
  // 承認カードで示した件数より多くは送らない
  for (const record of records.slice(0, limit)) {
    const values: Record<string, unknown> = {};
    for (const code of fields) {
      const field = Object.hasOwn(record, code) ? record[code] : undefined;
      if (field === undefined) {
        missing.add(code);
        continue;
      }
      values[code] = shrink(field.value);
    }
    if (encoder.encode(JSON.stringify([...picked, values])).length > MAX_SAMPLE_BYTES) {
      truncated = true;
      break;
    }
    picked.push(values);
  }
  return { records: picked, missingFields: [...missing], truncated };
};

/**
 * 一覧で表示中のクエリ(`kintone.app.getQuery()`)から、ページ送りの指定を除いて件数を付けます
 *
 * 利用者が見ている一覧と同じ絞り込み・並び順の先頭から取る
 */
export const toSampleQuery = (query: string, limit: number): string =>
  `${query.replace(/\s+limit\s+\d+(\s+offset\s+\d+)?\s*$/i, '').trim()} limit ${limit}`.trim();
