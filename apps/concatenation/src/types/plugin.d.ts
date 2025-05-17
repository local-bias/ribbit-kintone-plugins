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
    type Field = { type: 'field'; value: string; format: string };
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
        | { type: 'appId' }
        | { type: 'appName' }
      )[];
    }[];
  };
}
