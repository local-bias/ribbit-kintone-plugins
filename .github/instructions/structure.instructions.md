---
applyTo: '**'
---

# プロジェクト構造仕様書

TurboRepoモノレポ構成のkintoneプラグイン開発プロジェクト。

## ルートディレクトリ

```
ribbit-kintone-plugins/
├── apps/           # 各kintoneプラグイン
├── packages/       # 共有パッケージ
├── public/         # ビルド成果物配布場所
├── scripts/        # ビルド/デプロイスクリプト
├── package.json
├── turbo.json
├── pnpm-workspace.yaml
└── biome.json
```

## 共有パッケージ（packages/）

- constants: URL定数等
- eslint-config: ESLint設定
- jotai: Jotaiストア/共通状態
- k2: @konomi-app/k2ラッパー
- tailwind-config: Tailwind v3設定
- tailwindcss: Tailwind v4 CSS/postcss設定
- typescript-config: tsconfig
- ui: 共通UIコンポーネント
- utils: ユーティリティ関数

## プラグイン標準構造

```
apps/[plugin-name]/
├── src/
│   ├── components/    # 汎用コンポーネント
│   │   ├── error-boundary.tsx
│   │   └── theme-provider.tsx
│   ├── config/        # 設定画面
│   │   ├── components/
│   │   ├── states/
│   │   ├── app.tsx
│   │   ├── index.ts   # エントリポイント
│   │   └── main.tsx
│   ├── contents/      # 静的コンテンツ
│   ├── desktop/       # 動作画面
│   │   ├── components/
│   │   ├── states/
│   │   ├── event.tsx  # kintoneイベントハンドラ
│   │   ├── index.ts   # エントリポイント
│   │   └── public-state.ts
│   ├── lib/           # ライブラリ
│   │   ├── constants.ts
│   │   ├── global.ts
│   │   ├── i18n.ts
│   │   └── plugin.ts
│   ├── schema/
│   │   └── plugin-config.ts
│   ├── styles/
│   │   ├── config.css
│   │   └── desktop.css
│   └── types/
├── .plugin/           # ビルド成果物（Git管理外）
├── package.json
├── plugin.config.mjs
└── tsconfig.json
```

## エントリポイント

1. 設定画面: `src/config/index.ts` → `config.js`
2. 動作画面: `src/desktop/index.ts` → `desktop.js`

各エントリポイントは`@/lib/global`をインポートしてグローバル変数を初期化。

## 主要ファイルの役割

### plugin.config.mjs

K2ビルドツール設定。プラグインID、マニフェスト（多言語対応）、サーバーポート等を定義。

### src/lib/global.ts

グローバル変数定義:

- ENV / isProd / isDev
- PLUGIN_ID
- GUEST_SPACE_ID
- LANGUAGE

### src/lib/plugin.ts

- `createConfig()`: 初期設定生成
- `migrateConfig()`: 設定マイグレーション
- `restorePluginConfig()`: 設定復元
- `isPluginConditionMet()`: 設定検証

### src/lib/i18n.ts

`@repo/utils`の`useTranslations`を使用した多言語対応。

### src/schema/plugin-config.ts

Zodによるプラグイン設定スキーマ定義。バージョン管理による後方互換性維持。

### src/config/states/plugin.ts

Jotaiによる設定画面の状態管理。`@repo/jotai`の`usePluginAtoms`を使用。

## ビルド成果物

```
.plugin/
├── contents/   # 本番用
│   ├── config.js
│   ├── config.css
│   ├── desktop.js
│   └── desktop.css
├── dev/        # 開発用
└── *.zip       # プラグインパッケージ

public/[plugin-name]/  # 配布用（scripts/merge-outputs.mjsで生成）
```

## TailwindCSS v4 スタイル構造

設定画面（config.css）:

- フルpreflight適用
- `@import '@repo/tailwindcss/config.css'`

動作画面（desktop.css）:

- preflight無効（kintone既存スタイルとの競合防止）
- `rad`プレフィックス使用（例: `rad:w-4`）
- `@import '@repo/tailwindcss/desktop.css'`
