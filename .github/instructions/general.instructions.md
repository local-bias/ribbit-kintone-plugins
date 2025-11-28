---
applyTo: '**'
---

# 概要

kintone上で動作するプラグインをReact + TypeScriptで開発するTurboRepoモノレポプロジェクト。

## アーキテクチャ

### 技術スタック

- フレームワーク: React
- UIライブラリ: MUI (Material-UI)
- 言語: TypeScript
- スタイリング: TailwindCSS v4
- 状態管理: Jotai
- ビルドツール: @konomi-app/k2
- バリデーション: Zod v4
- パッケージ管理: pnpm
- モノレポ管理: TurboRepo

### アーキテクチャパターン

- クライアントサイドレンダリング
- コンポーネントベース設計
- 状態の局所化

## モノレポ構造

```
├── apps/           # 各kintoneプラグイン
├── packages/       # 共有パッケージ
│   ├── constants/  # URL定数等
│   ├── jotai/      # Jotaiストア/共通状態
│   ├── ui/         # 共通UIコンポーネント
│   └── utils/      # ユーティリティ関数
```

## プラグインエントリポイント

- **設定画面**: `src/config/index.ts` → `config.js`
- **動作画面**: `src/desktop/index.ts` → `desktop.js`

各エントリポイントは最初に`@/lib/global`をインポートしてグローバル変数を初期化する。

## プラグインディレクトリ構造

```
src/
├── components/       # 汎用コンポーネント
│   ├── error-boundary.tsx
│   └── theme-provider.tsx
├── config/           # 設定画面
│   ├── components/
│   ├── states/
│   ├── app.tsx
│   ├── index.ts      # エントリポイント
│   └── main.tsx
├── contents/         # 静的コンテンツ
├── desktop/          # 動作画面
│   ├── components/
│   ├── states/
│   ├── event.tsx     # kintoneイベントハンドラ
│   └── index.ts      # エントリポイント
├── lib/
│   ├── constants.ts
│   ├── global.ts
│   ├── i18n.ts
│   └── plugin.ts
├── schema/
│   └── plugin-config.ts
├── styles/
│   ├── config.css
│   └── desktop.css
└── types/
```

## プラグイン設定スキーマ（plugin-config.ts）

kintoneプラグインストレージに保存される設定の型定義。バージョン管理で後方互換性を維持。

```typescript
import { z } from 'zod';

export const PluginConditionV1Schema = z.object({
  id: z.string(),
  fieldCode: z.string(),
  // ...条件固有のプロパティ
});

export const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  conditions: z.array(PluginConditionV1Schema),
});

export const AnyPluginConfigSchema = z.discriminatedUnion('version', [PluginConfigV1Schema]);
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

export const LatestPluginConditionSchema = PluginConditionV1Schema;
export type PluginConfig = z.infer<typeof PluginConfigV1Schema>;
export type PluginCondition = PluginConfig['conditions'][number];
```

## 設定マイグレーション（lib/plugin.ts）

```typescript
export const migrateConfig = (anyConfig: AnyPluginConfig): PluginConfig => {
  const { version } = anyConfig;
  switch (version) {
    case undefined:
      return migrateConfig({ ...anyConfig, version: 1 });
    case 1:
    default:
      return anyConfig;
  }
};
```

## ビルド成果物

```
.plugin/
├── contents/     # 本番用
│   ├── config.js
│   ├── config.css
│   ├── desktop.js
│   └── desktop.css
├── dev/          # 開発用
└── *.zip         # プラグインパッケージ
```

## 開発フロー

1. `pnpm install`
2. `src/schema/plugin-config.ts`で設定スキーマ定義
3. `src/config/`と`src/desktop/`を実装
4. `pnpm build`でビルド

## kintone API

`@konomi-app/kintone-utilities`パッケージの関数を使用:

- `getAllRecords`: 全レコード取得
- `addAllRecords`: 一括追加
- `updateAllRecords`: 一括更新
- `deleteAllRecords`: 一括削除
- `bulkRequest`: 複数リクエスト一括送信
- `getFormFields`: フィールド情報取得
