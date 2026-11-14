import type { kintoneAPI } from '@konomi-app/kintone-utilities';

/**
 * アプリの定義(フィールド・レイアウト・ビュー)を、AIへ渡す小さな形へ変換します(純粋関数)
 *
 * トークンを抑えるため、コードを書くのに要る項目だけを残す。選択肢は先頭20件まで
 *
 * @see docs/07-ai-tools.md 4-2〜4-4章、6章
 */

export const MAX_FIELD_OPTIONS = 20;
/** ラベルフィールドの本文(HTML)を渡す上限 */
const MAX_LABEL_TEXT = 80;

export type FieldSummary = {
  code: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  /** 選択肢が上限を超えたときの全件数 */
  optionCount?: number;
  unit?: string;
  /** テーブル内のフィールドなら、テーブルのフィールドコード */
  subtableCode?: string;
};

type LooseField = {
  type?: unknown;
  code?: unknown;
  label?: unknown;
  required?: unknown;
  options?: unknown;
  unit?: unknown;
  fields?: unknown;
};

const readOptions = (options: unknown): Pick<FieldSummary, 'options' | 'optionCount'> => {
  if (options === null || typeof options !== 'object') return {};
  const labels = Object.values(options as Record<string, { label?: unknown; index?: unknown }>)
    .sort((a, b) => Number(a.index ?? 0) - Number(b.index ?? 0))
    .map((option) => String(option.label ?? ''));
  return labels.length > MAX_FIELD_OPTIONS
    ? { options: labels.slice(0, MAX_FIELD_OPTIONS), optionCount: labels.length }
    : { options: labels };
};

const summarizeField = (field: LooseField, subtableCode?: string): FieldSummary => ({
  code: String(field.code ?? ''),
  label: String(field.label ?? ''),
  type: String(field.type ?? ''),
  ...(field.required === true ? { required: true } : {}),
  ...readOptions(field.options),
  ...(typeof field.unit === 'string' && field.unit !== '' ? { unit: field.unit } : {}),
  ...(subtableCode === undefined ? {} : { subtableCode }),
});

export const summarizeFormFields = (
  properties: Record<string, kintoneAPI.FieldProperty>,
  options: { includeSubtable: boolean }
): FieldSummary[] =>
  Object.values(properties as Record<string, LooseField>).flatMap((field) => {
    const summary = summarizeField(field);
    if (field.type !== 'SUBTABLE' || !options.includeSubtable) return [summary];
    const inner = Object.values((field.fields ?? {}) as Record<string, LooseField>).map((child) =>
      summarizeField(child, summary.code)
    );
    return [summary, ...inner];
  });

export type LayoutItem = { type: string; code?: string; elementId?: string; label?: string };
export type LayoutRowSummary =
  | { type: 'ROW'; fields: LayoutItem[] }
  | { type: 'SUBTABLE'; code: string; fields: LayoutItem[] }
  | { type: 'GROUP'; code: string; rows: LayoutRowSummary[] };

/** ラベルの本文はHTMLのため、タグを除いて短くする */
const toLabelText = (html: unknown): string => {
  const text = String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > MAX_LABEL_TEXT ? `${text.slice(0, MAX_LABEL_TEXT)}…` : text;
};

const summarizeLayoutField = (field: Record<string, unknown>): LayoutItem => ({
  type: String(field.type ?? ''),
  ...(typeof field.code === 'string' && field.code !== '' ? { code: field.code } : {}),
  ...(typeof field.elementId === 'string' && field.elementId !== ''
    ? { elementId: field.elementId }
    : {}),
  ...(field.type === 'LABEL' ? { label: toLabelText(field.label) } : {}),
});

const summarizeRow = (row: Record<string, unknown>): LayoutRowSummary => {
  const fields = ((row.fields ?? []) as Record<string, unknown>[]).map(summarizeLayoutField);
  if (row.type === 'GROUP') {
    return {
      type: 'GROUP',
      code: String(row.code ?? ''),
      rows: ((row.layout ?? []) as Record<string, unknown>[]).map(summarizeRow),
    };
  }
  if (row.type === 'SUBTABLE') {
    return { type: 'SUBTABLE', code: String(row.code ?? ''), fields };
  }
  return { type: 'ROW', fields };
};

export const summarizeLayout = (layout: kintoneAPI.Layout): LayoutRowSummary[] =>
  (layout as unknown as Record<string, unknown>[]).map(summarizeRow);

export type ViewSummary = {
  id: string;
  name: string;
  type: string;
  fields?: string[];
  filterCond: string;
  sort: string;
};

/** カスタマイズビューのHTMLは渡さない(長く、コードを書くのに要らない) */
export const summarizeViews = (views: Record<string, kintoneAPI.view.Response>): ViewSummary[] =>
  Object.values(views)
    .sort((a, b) => Number(a.index) - Number(b.index))
    .map((view) => ({
      id: view.id,
      name: view.name,
      type: view.type,
      ...(view.type === 'LIST' ? { fields: view.fields } : {}),
      filterCond: view.filterCond,
      sort: view.sort,
    }));
