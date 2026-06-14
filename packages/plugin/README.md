# @repo/plugin

各プラグイン(`apps/*`)で重複していた設定画面・初期化まわりのボイラープレートを集約した共通パッケージです。

公開ライブラリ `@konomi-app/kintone-utilities-react`(npm。バージョンは catalog で統一)は、
設定画面の標準UI部品(`PluginFooter` / `BundledSidebar` / `PluginConfigProvider` 等)を提供します。
`@repo/plugin` はそれらを repo の atom / i18n に配線し、設定画面のボイラープレートを一括提供します。

`notistack` を通知に使うプラグイン(リポジトリの大多数)を前提としています。
`sonner` を使うプラグイン(例: `gantt`)や、独自の保存処理を持つプラグインは、
各ファクトリの注入ポイントを利用するか、従来どおり個別実装してください。

## エクスポート

### `@repo/plugin` (フレームワーク非依存)

| API | 用途 | 置き換え対象 |
| --- | --- | --- |
| `createPluginEventManager({ pluginName, isProd })` | 共通設定の`KintoneEventManager`を生成 | `lib/event-manager.ts` |

### `@repo/plugin/react` (React/設定画面)

| API | 用途 | 置き換え対象 |
| --- | --- | --- |
| `renderConfigApp(app, { rootId?, errorMessage? })` | 設定画面のReactアプリをマウント | `config/main.tsx` |
| `<PluginThemeProvider>` | ブランドテーマ(MUI、ログインユーザー言語のロケール適用)を適用するProvider | `components/theme-provider.tsx` + `lib/i18n-mui.ts` |
| `createPluginConfigStore<Config, AnyConfig>({...})` | 設定情報の復元/保存/インポート/エクスポート用atom群を生成 | `config/states/plugin.ts` |
| `<ConfigFooter>` | 設定画面フッター(保存・戻る・入出力・リセット) | `config/components/model/footer.tsx` |
| `<ConfigSidebar>` | 設定画面サイドバー(条件の選択・追加・削除・コピペ) | `config/components/model/sidebar.tsx` |
| `createCurrentAppFieldsAtom({ guestSpaceId? })` | 現在アプリのフォームフィールド取得atom | `config/states/kintone.ts` |

> 設定画面の標準UI部品(`PluginFooter` / `BundledSidebar` / `PluginConfigProvider` / `Notification` 等)や
> jotai連携の入力部品は、公開ライブラリ `@konomi-app/kintone-utilities-react` /
> `@konomi-app/kintone-utilities-jotai` から直接 import します(いずれも npm 版を catalog で統一)。

## 移行手順

1. `apps/<plugin>/package.json` の `dependencies` に `"@repo/plugin": "workspace:*"` を追加し、
   `@konomi-app/kintone-utilities-react` / `@konomi-app/kintone-utilities-jotai` は `"catalog:"` を使用します
   (バージョンは `pnpm-workspace.yaml` の catalog で一元管理)。`pnpm install` を実行します。

2. **lib/i18n-mui.ts** を削除し、`components/theme-provider.tsx` も削除して、
   `config/app.tsx` のインポートを差し替えます。

   ```tsx
   import { PluginThemeProvider } from '@repo/plugin/react';
   // <ThemeProvider> ... </ThemeProvider> を <PluginThemeProvider> ... </PluginThemeProvider> に
   ```

3. **lib/event-manager.ts**

   ```ts
   import { createPluginEventManager } from '@repo/plugin';
   import { PLUGIN_NAME } from './constants';
   import { isProd } from './global';

   export const manager = createPluginEventManager({ pluginName: PLUGIN_NAME, isProd });
   ```

4. **config/main.tsx**

   ```tsx
   import { renderConfigApp } from '@repo/plugin/react';
   import { t } from '@/lib/i18n';
   import App from './app';

   renderConfigApp(<App />, { errorMessage: t('common.config.error.rootNotFound') });
   ```

5. **config/states/plugin.ts** (共通設定 `common` を使うプラグインの例)

   ```ts
   import { createPluginConfigStore } from '@repo/plugin/react';
   import { PLUGIN_NAME } from '@/lib/constants';
   import { t } from '@/lib/i18n';
   import { createConfig, migrateConfig, restorePluginConfig } from '@/lib/plugin';
   import type { AnyPluginConfig, PluginConfig } from '@/schema/plugin-config';

   export const {
     pluginConfigAtom,
     handlePluginConfigResetAtom,
     handlePluginConditionDeleteAtom,
     updatePluginConfig,
     importPluginConfigAtom,
     exportPluginConfigAtom,
     pluginConditionsAtom,
     hasMultipleConditionsAtom,
     conditionsLengthAtom,
     selectedConditionIdAtom,
     selectedConditionAtom,
     getConditionPropertyAtom,
     commonConfigAtom,
     isConditionIdUnselectedAtom,
     getCommonPropertyAtom,
   } = createPluginConfigStore<PluginConfig, AnyPluginConfig>({
     restorePluginConfig,
     createConfig,
     migrateConfig,
     t,
     pluginName: PLUGIN_NAME,
   });
   ```

   > `restorePluginConfig` が `{ config, error }` を返す新しい形式のプラグインや、
   > 保存時に独自の副作用(ビュー更新など)を持つプラグインは、このファクトリをそのまま使えません。
   > 個別実装を維持するか、ファクトリ側の拡張を検討してください。

6. **config/components/model/footer.tsx**

   ```tsx
   import { ConfigFooter } from '@repo/plugin/react';
   import {
     exportPluginConfigAtom,
     handlePluginConfigResetAtom,
     importPluginConfigAtom,
     updatePluginConfig,
   } from '@/config/states/plugin';
   import { t } from '@/lib/i18n';

   export default function Footer() {
     return (
       <ConfigFooter
         t={t}
         resetAtom={handlePluginConfigResetAtom}
         exportAtom={exportPluginConfigAtom}
         importAtom={importPluginConfigAtom}
         updateAtom={updatePluginConfig}
       />
     );
   }
   ```

7. **config/components/model/sidebar.tsx**

   ```tsx
   import { ConfigSidebar } from '@repo/plugin/react';
   import type { FC } from 'react';
   import { pluginConditionsAtom, selectedConditionIdAtom } from '@/config/states/plugin';
   import { t } from '@/lib/i18n';
   import { getNewCondition, isPluginConditionMet } from '@/lib/plugin';

   const Sidebar: FC = () => (
     <ConfigSidebar
       t={t}
       pluginConditionsAtom={pluginConditionsAtom}
       selectedConditionIdAtom={selectedConditionIdAtom}
       getNewCondition={getNewCondition}
       isPluginConditionMet={isPluginConditionMet}
     />
   );

   export default Sidebar;
   ```

   独自のラベルや共通設定タブの有無は `labelComponent` / `commonTab` propで上書きできます。

## 移行済みプラグイン (パイロット)

- `attachment-preview`
- `pdf-preview`
- `zip-preview`
