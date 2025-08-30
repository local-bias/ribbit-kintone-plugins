---
applyTo: '**'
---

# 技術指示書

## プロジェクト概要

このプロジェクトは、TurboRepo を使用したモノレポ構成の kintone プラグイン開発プロジェクトです。

## パッケージマネージャー

- **パッケージマネージャー**: pnpm v10.11.0
- **Node.js 要件**: >=18

## モノレポ管理

- **ツール**: TurboRepo v2.5.5
- **構成ファイル**: `turbo.json`
- **ワークスペース設定**: `pnpm-workspace.yaml`

## 主要な実行コマンド

### ルートレベルコマンド

- `pnpm build`: 全プラグインのビルド実行 + 成果物のマージ
- `pnpm dev`: 全プラグインの開発モード起動
- `pnpm lint`: 全プラグインのリント実行
- `pnpm format`: Prettierによるコード整形（.ts, .tsx, .md ファイル）
- `pnpm check-types`: TypeScript型チェック

### プラグイン個別コマンド

各プラグインで利用可能な標準コマンド：

- `pnpm build`: プラグインのビルド（CSS + JS のビルドとZIPファイル作成）
- `pnpm dev`: 開発モード（JS と CSS の監視ビルド）
- `pnpm standalone`: スタンドアロン版のビルド
- `pnpm init`: プラグイン初期化とキー生成

#### ビルドプロセス詳細

1. **CSS ビルド**: TailwindCSS CLI を使用
   - 設定画面用: `src/styles/config.css` → `.plugin/contents/config.css`
   - 動作画面用: `src/styles/desktop.css` → `.plugin/contents/desktop.css`

2. **JS ビルド**: K2 ツール（@konomi-app/k2）を使用
   - TypeScript → JavaScript へのトランスパイル
   - バンドリング

3. **成果物**: `.plugin/` ディレクトリに出力
   - `config.js`, `config.css`: 設定画面用
   - `desktop.js`, `desktop.css`: 動作画面用
   - `manifest.json`: プラグインマニフェスト

## 技術スタック

### フロントエンド

- **フレームワーク**: React v19.1.0
- **言語**: TypeScript v5.8.3
- **状態管理**: Jotai v2.12.5
- **UIライブラリ**:
  - Material-UI (MUI) v7.2.0
  - Radix UI コンポーネント群
  - Lucide React（アイコン）

### スタイリング

- **CSS フレームワーク**: TailwindCSS v4.1.11
- **CSS-in-JS**: Emotion v11.14.0
- **ユーティリティ**:
  - class-variance-authority（条件付きスタイリング）
  - clsx（クラス名結合）

### 開発ツール

- **ビルドツール**: @konomi-app/k2（カスタムビルドツール）
- **リンター**: ESLint
- **フォーマッター**: Prettier v3.6.2
- **型生成**: @kintone/dts-gen（kintone型定義生成）

### kintone関連ライブラリ

- **@konomi-app/kintone-utilities**: v5.12.1 - kintone API ユーティリティ
- **@konomi-app/kintone-utilities-jotai**: v1.3.0 - Jotai統合ユーティリティ
- **@konomi-app/kintone-utilities-react**: v2.1.0 - React統合ユーティリティ

### データ処理・ユーティリティ

- **バリデーション**: Zod v3.24.2
- **イミュータブル**: Immer v10.1.1
- **関数型ユーティリティ**: Remeda v2.21.3
- **日時処理**: Luxon v3.5.0
- **ID生成**: nanoid v5.1.3

### UI拡張ライブラリ

- **ドラッグ&ドロップ**: @dnd-kit（core, sortable, modifiers）
- **通知**: notistack v3.0.2
- **エラーハンドリング**: react-error-boundary v5.0.0
- **リサイザブルパネル**: react-resizable-panels v3.0.1

## 共有パッケージ

プロジェクト内で共有される内部パッケージ：

- **@repo/constants**: 定数定義
- **@repo/jotai**: Jotai関連の共通設定
- **@repo/ui**: 共通UIコンポーネント
- **@repo/utils**: ユーティリティ関数
- **@repo/tailwind-config**: TailwindCSS設定
- **@repo/tailwindcss**: TailwindCSSカスタム設定
- **@repo/typescript-config**: TypeScript設定
- **@repo/eslint-config**: ESLint設定

## 開発環境設定

### 環境変数

- `NODE_ENV`: 実行環境（development/production）
- `.env*` ファイルがビルドに影響

## TurboRepoタスク設定

- **dev**: キャッシュなし、永続実行
- **build**: 依存関係に基づく実行、`.plugin/**`に出力
- **lint/check-types**: 依存関係に基づく段階的実行

## コード品質

- **Prettier設定**: @konomi-app/prettier-config
- **型安全性**: 厳密なTypeScript設定
- **リント**: ESLintによる静的解析

## 注意事項

1. **pnpm overrides**: 特定のパッケージバージョンを強制指定
2. **ワークスペース参照**: `workspace:*` による内部パッケージ参照
3. **ビルド成果物**: `.plugin/` ディレクトリは Git 管理対象外
4. **開発時の並行実行**: concurrently を使用してCSS/JSを同時監視
