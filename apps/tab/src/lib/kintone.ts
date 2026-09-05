import type { kintoneAPI } from '@konomi-app/kintone-utilities';

/**
 * フィールドとしての表示・非表示を設定しないフィールドタイプ
 *
 * グループフィールドは専用の設定項目を持つため、フィールドの一覧からは除外します
 */
const EXCLUDED_FIELD_TYPES = new Set<kintoneAPI.FieldPropertyType>(['GROUP']);

/** フィールドの表示・非表示の対象となるフィールドのみを抽出します */
export const filterTargetFields = (
  fields: kintoneAPI.FieldProperty[]
): kintoneAPI.FieldProperty[] => fields.filter((field) => !EXCLUDED_FIELD_TYPES.has(field.type));

/**
 * 要素IDを持ちうるレイアウト要素
 *
 * kintoneは2026年2月8日のアップデートで、ラベル・罫線にも要素IDを設定できるようになりましたが、
 * `@konomi-app/kintone-utilities`の型定義にはまだ反映されていないため、ここで補います。
 */
type WithElementId<T> = T & { elementId?: string };

/** レイアウト上のラベルフィールド */
export type LayoutLabel = {
  /** 要素ID。設定されていない場合は空文字 */
  elementId: string;
  /** 操作画面に表示される文言(HTMLタグを除去したもの)。空の場合もあります */
  text: string;
};

/** レイアウト上の罫線 */
export type LayoutHr = {
  /** 要素ID。設定されていない場合は空文字 */
  elementId: string;
};

/** レイアウト要素の要素IDを、未設定なら空文字として取り出します */
const getElementId = (field: WithElementId<{ type: string }>): string => field.elementId ?? '';

/**
 * フォームレイアウトを平坦化し、フィールドの配列に変換します
 *
 * グループ内のフィールドも再帰的に展開します
 */
export const flatLayout = (layout: kintoneAPI.Layout): kintoneAPI.LayoutField[] => {
  return layout.flatMap((item: kintoneAPI.Layout[number]) => {
    switch (item.type) {
      case 'GROUP':
        return flatLayout(item.layout);
      case 'ROW':
      case 'SUBTABLE':
        return item.fields;
      default:
        return [];
    }
  });
};

/** フォームレイアウトから、グループフィールドの一覧を取得します */
export const getLayoutGroups = (layout: kintoneAPI.Layout): kintoneAPI.layout.Group[] => {
  return layout.filter(
    (item: kintoneAPI.Layout[number]): item is kintoneAPI.layout.Group => item.type === 'GROUP'
  );
};

/**
 * フォームレイアウトから、要素IDを持つスペースフィールドの一覧を取得します
 *
 * 要素IDを持たないスペースはDOMから特定できないため、対象外とします
 */
export const getLayoutSpacers = (layout: kintoneAPI.Layout): kintoneAPI.layout.Spacer[] => {
  return flatLayout(layout).filter(
    (field: kintoneAPI.LayoutField): field is kintoneAPI.layout.Spacer =>
      field.type === 'SPACER' && !!field.elementId
  );
};

/**
 * ラベルフィールドの設定値から、表示される文言を取得します
 *
 * ラベルはHTMLを含み得るため、操作画面での判定(`textContent`)と揃うよう
 * テキストのみを抽出します
 */
export const getLabelText = (label: string): string => {
  const parser = new DOMParser();
  return parser.parseFromString(label, 'text/html').body.textContent?.trim() ?? '';
};

/**
 * フォームレイアウトから、ラベルフィールドの一覧をレイアウト順に取得します
 *
 * ラベルはHTMLを含み得るため、文言はテキストのみを抽出して返却します
 */
export const getLayoutLabels = (
  layout: kintoneAPI.Layout,
  parseLabelText: (label: string) => string = getLabelText
): LayoutLabel[] => {
  return flatLayout(layout)
    .filter(
      (field: kintoneAPI.LayoutField): field is kintoneAPI.layout.Label => field.type === 'LABEL'
    )
    .map((field) => ({ elementId: getElementId(field), text: parseLabelText(field.label) }));
};

/**
 * ラベルを設定情報へ保存するときのキーを返します
 *
 * 要素IDを持つラベルは要素IDで識別します。要素IDが未設定のラベルは、
 * 従来どおり文言で識別するしかないため、文言をそのままキーとして使用します。
 * (文言が空のラベルは操作画面で特定できないため、キーを持ちません)
 */
export const getLabelKey = (label: LayoutLabel): string => label.elementId || label.text;

/**
 * フォームレイアウトから、ラベルフィールドの選択肢となるキーの一覧を取得します
 *
 * キーを持たないラベル(要素IDも文言も無いもの)は選択できないため除外します
 */
export const getLayoutLabelKeys = (
  layout: kintoneAPI.Layout,
  parseLabelText: (label: string) => string = getLabelText
): string[] => {
  const keys = getLayoutLabels(layout, parseLabelText).map(getLabelKey);
  return [...new Set(keys.filter((key) => key !== ''))];
};

/**
 * フォームレイアウトから、罫線の一覧をレイアウト順に取得します
 *
 * 要素IDを持たない罫線もDOM上の並び順で特定するため、全ての罫線を返却します
 */
export const getLayoutHrs = (layout: kintoneAPI.Layout): LayoutHr[] => {
  return flatLayout(layout)
    .filter((field: kintoneAPI.LayoutField): field is kintoneAPI.layout.HR => field.type === 'HR')
    .map((field) => ({ elementId: getElementId(field) }));
};

/** フォームレイアウトから、要素IDを持つ罫線の要素ID一覧を取得します */
export const getLayoutHrElementIds = (layout: kintoneAPI.Layout): string[] =>
  getLayoutHrs(layout)
    .map((hr) => hr.elementId)
    .filter((elementId) => elementId !== '');
