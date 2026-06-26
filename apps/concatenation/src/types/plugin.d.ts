declare namespace Plugin {
  /** 🔌 プラグインがアプリ単位で保存する設定情報 */
  type Config = ConfigV2;

  /** 🔌 プラグインの詳細設定 */
  type Condition = Config['conditions'][number];

  /** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
  type AnyConfig = ConfigV1 | ConfigV2; // | ...;

  namespace ConcatenationItem {
    type String = {
      type: 'string';
      value: string;
      isOmittedIfPreviousEmpty: boolean;
      isOmittedIfNextEmpty: boolean;
    };
    /** 数値フィールド(数値・計算)向けの表示フォーマット */
    type NumberFormat = {
      /** 3桁ごとの桁区切りを付与するか */
      useGrouping?: boolean;
      /** 固定する小数桁数。未指定(null/undefined)の場合は元の値のまま */
      decimalDigits?: number | null;
      /** 接頭辞(例: ¥) */
      prefix?: string;
      /** 接尾辞(例: 円) */
      suffix?: string;
    };
    type Field = {
      type: 'field';
      value: string;
      format: string;
      numberFormat?: NumberFormat;
    };
    /** サブテーブルの1列を区切り文字で連結する項目 */
    type Subtable = {
      type: 'subtable';
      /** サブテーブル(SUBTABLE)フィールドのコード */
      value: string;
      /** 連結対象となるテーブル内の列フィールドコード */
      columnField: string;
      /** 各行の値を連結する区切り文字 */
      separator: string;
      /** 日時系列の列に対する表示フォーマット */
      format: string;
    };
  }

  type ConcatenationType = Condition['concatenationItems'][number]['type'];

  type ConfigV2 = {
    version: 2;
    conditions: {
      id: string;
      targetField: string;
      concatenationItems: (
        | ConcatenationItem.String
        | ConcatenationItem.Field
        | ConcatenationItem.Subtable
        | { type: 'appId' }
        | { type: 'appName' }
      )[];
    }[];
  };

  type ConfigV1 = {
    version: 1;
    conditions: {
      targetField: string;
      concatenationItems: (
        | ConcatenationItem.String
        | ConcatenationItem.Field
        | ConcatenationItem.Subtable
        | { type: 'appId' }
        | { type: 'appName' }
      )[];
    }[];
  };
}
