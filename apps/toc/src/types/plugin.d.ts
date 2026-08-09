declare namespace Plugin {
  type Config = ConfigV1;

  type AnyConfig = ConfigV1; // | ConfigV2 | ...

  type Heading = Config['headings'][number];

  /** プラグインがアプリ単位で保存する設定情報🔌 */
  type ConfigV1 = {
    version: 1;
    tocTitle?: string;
    maxWidth?: number;
    headings: { spaceId: string; label: string; color?: string }[];
  };
}
