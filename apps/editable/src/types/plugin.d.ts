declare namespace kintone {
  namespace plugin {
    /** プラグインがアプリ単位で保存する設定情報 */
    type Storage = {
      conditions: Condition[];
    };

    /** プラグインの設定情報 */
    type Condition = {
      targetField: string;
      rules: {
        type:
          | 'always'
          | 'empty'
          | 'full'
          | 'greater'
          | 'less'
          | 'equal'
          | 'notEqual'
          | 'includes'
          | 'notIncludes';
        field: string;
        value: string;
        editable: boolean;
        connector: 'and' | 'or';
      }[];
    };
  }
}
