import type { AnyPluginConfig, PluginCondition, PluginConfig } from '@/schema/plugin-config';

declare global {
  namespace Plugin {
    /** 🔌 プラグインがアプリ単位で保存する設定情報 */
    type Config = PluginConfig;

    /** 🔌 プラグインの詳細設定 */
    type Condition = PluginCondition;

    /** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
    type AnyConfig = AnyPluginConfig;

    type TagData = TagDataV1;

    type AnyTagData = TagDataV1; // | TagDataV2 | ...;

    type TagDataV1 = {
      version: 1;
      tags: { value: string }[];
    };
  }
}
