---
applyTo: '**'
---

# プロジェクト構造仕様書

## プロジェクト概要

このプロジェクトは、TurboRepo を使用したモノレポ構成により複数の kintone プラグインを効率的に管理・開発するプロジェクトです。各プラグインは独立して動作し、共通のパッケージやライブラリを活用して開発効率を向上させています。

## ルートディレクトリ構造

```
ribbit-kintone-plugins/
├── apps/              # 各kintoneプラグイン（アプリケーション）
├── packages/          # 共有パッケージとライブラリ
├── public/            # ビルド成果物の配布場所
├── scripts/           # ビルド・デプロイ関連スクリプト
├── utils/             # ユーティリティ（現在空）
├── package.json       # プロジェクト全体の設定
├── turbo.json         # TurboRepo設定
├── pnpm-workspace.yaml # pnpmワークスペース設定
└── pnpm-lock.yaml     # 依存関係ロックファイル
```

## 主要ディレクトリの詳細

### /apps - プラグインアプリケーション

各プラグインの実装が格納されているディレクトリです。各プラグインは独立したワークスペースとして動作します。

#### 現在のプラグイン一覧

- **calendar/** - カレンダープラグイン
- **concatenation/** - 文字列結合プラグイン
- **date/** - 日付処理プラグイン
- **editable/** - 編集可能テーブルプラグイン
- **image-converter/** - 画像変換プラグイン
- **kanban/** - カンバンボードプラグイン
- **my-theme/** - マイテーマプラグイン
- **pdf-preview/** - PDFプレビュープラグイン
- **theme/** - テーマプラグイン
- **tooltip/** - ツールチッププラグイン
- **zip-preview/** - ZIPプレビュープラグイン

#### 各プラグインの標準構造

```
apps/[plugin-name]/
├── src/
│   ├── components/       # 汎用コンポーネント
│   ├── config/          # 設定画面関連
│   │   ├── components/  # 設定画面専用コンポーネント
│   │   ├── hooks/       # 設定画面専用フック
│   │   ├── states/      # 設定画面専用状態管理
│   │   ├── app.tsx      # 設定画面エントリポイント
│   │   ├── index.ts     # 設定画面JSエントリポイント
│   │   └── main.tsx     # 設定画面仲介ファイル
│   ├── contents/        # 静的コンテンツ（画像、フォントなど）
│   ├── desktop/         # 動作画面関連
│   │   ├── components/  # 動作画面専用コンポーネント
│   │   ├── hooks/       # 動作画面専用フック
│   │   ├── states/      # 動作画面専用状態管理
│   │   └── index.ts     # 動作画面JSエントリポイント
│   ├── lib/             # プラグイン固有ライブラリ
│   ├── schema/          # zodスキーマ定義
│   │   └── plugin-config.ts # プラグイン設定スキーマ
│   ├── styles/          # スタイル定義
│   │   ├── config.css   # 設定画面用CSS
│   │   └── desktop.css  # 動作画面用CSS
│   └── types/           # 型定義
├── .plugin/             # ビルド成果物（Git管理外）
├── eslint.config.mjs    # ESLint設定
├── package.json         # プラグイン固有の依存関係
├── plugin.config.mjs    # プラグインビルド設定
├── README.md            # プラグイン説明
└── tsconfig.json        # TypeScript設定
```

#### プラグインのエントリポイント

各kintoneプラグインは2つの独立したエントリポイントを持ちます：

1. **設定画面** (`src/config/index.ts`)
   - プラグイン設定画面で実行
   - `config.js` としてビルド
   - kintoneのプラグイン設定画面から読み込み

2. **動作画面** (`src/desktop/index.ts`)
   - アプリの一覧・詳細画面で実行
   - `desktop.js` としてビルド
   - kintoneのアプリ画面から読み込み

### /packages - 共有パッケージ

プラグイン間で共有されるライブラリとパッケージが格納されています。

#### パッケージ一覧

- **constants/** (`@repo/constants`)
  - プロジェクト共通の定数定義
  - 全プラグインで使用される固定値

- **eslint-config/** (`@repo/eslint-config`)
  - ESLint設定の共有
  - `base.js`, `kintone.js`, `react-internal.js`

- **jotai/** (`@repo/jotai`)
  - Jotai状態管理の共通設定
  - プラグイン間で統一された状態管理パターン

- **k2/** (`@repo/k2`)
  - kintoneプラグインビルドツールのラッパー
  - `@konomi-app/k2`のデフォルト設定を提供

- **tailwind-config/** (`@repo/tailwind-config`)
  - TailwindCSS設定の共有
  - 統一されたスタイルガイドライン

- **tailwindcss/** (`@repo/tailwindcss`)
  - TailwindCSSカスタム設定
  - プロジェクト固有のユーティリティクラス

- **typescript-config/** (`@repo/typescript-config`)
  - TypeScript設定の共有
  - `base.json`, `kintone.json`, `react-library.json`

- **ui/** (`@repo/ui`)
  - 共通UIコンポーネントライブラリ
  - Material-UI、Radix UIベースのコンポーネント
  - プラグイン間で再利用可能なUI要素

- **utils/** (`@repo/utils`)
  - 共通ユーティリティ関数
  - プラグイン間で使用される汎用的な関数

### /public - ビルド成果物配布

各プラグインのビルド成果物が配置される配布用ディレクトリです。

```
public/
├── [plugin-name]/
│   ├── config.css           # 設定画面用CSS
│   ├── config.js            # 設定画面用JavaScript
│   ├── desktop.css          # 動作画面用CSS
│   ├── desktop.js           # 動作画面用JavaScript
│   └── kintone-plugin-[name].zip # 配布用ZIPファイル
```

このディレクトリの内容は `scripts/merge-outputs.mjs` により自動生成されます。

### /scripts - ビルド・デプロイスクリプト

- **merge-outputs.mjs**
  - 各プラグインの `.plugin/` ディレクトリから成果物を収集
  - `/public` ディレクトリに統合して配置
  - プラグインZIPファイルのリネーム処理

## ビルドプロセス

### 1. 個別プラグインビルド

各プラグインで以下が実行されます：

1. **CSS ビルド**: TailwindCSS CLI使用
   - `src/styles/config.css` → `.plugin/contents/config.css`
   - `src/styles/desktop.css` → `.plugin/contents/desktop.css`

2. **JS ビルド**: K2ツール使用
   - TypeScript → JavaScript変換
   - バンドリング処理

3. **ZIP作成**: プラグインパッケージ化

### 2. 統合ビルド

ルートで `pnpm build` 実行時：

1. `turbo run build` - 全プラグインのビルド
2. `node scripts/merge-outputs.mjs` - 成果物を `/public` に統合

## 開発ワークフロー

### 開発環境起動

```bash
# 全プラグインの開発モード
pnpm dev

# 特定プラグインの開発モード
cd apps/[plugin-name]
pnpm dev
```

### ビルド

```bash
# 全プラグインビルド
pnpm build

# 特定プラグインビルド
cd apps/[plugin-name]
pnpm build
```

### 品質管理

```bash
# リント実行
pnpm lint

# 型チェック
pnpm check-types

# コード整形
pnpm format
```

## パッケージ管理

- **パッケージマネージャー**: pnpm v10.11.0
- **ワークスペース**: `pnpm-workspace.yaml`で定義
- **依存関係統一**: ルート`package.json`の`pnpm.overrides`で管理
- **内部パッケージ参照**: `workspace:*`形式

## TurboRepo設定

- **並列実行**: 依存関係に基づく効率的なタスク実行
- **キャッシュ最適化**: ビルド成果物のキャッシュ機能
- **永続タスク**: 開発モード（`dev`）はキャッシュ無効

## 注意事項

1. **Git管理対象外**
   - `/apps/*/​.plugin/` - ビルド成果物
   - `/public/` - 配布用ファイル

2. **依存関係**
   - 共有パッケージは `@repo/` プレフィックス
   - 外部依存関係はルートレベルで統一管理

3. **プラグイン追加時**
   - `/apps/` 下に新ディレクトリ作成
   - 標準構造に従った実装
   - `pnpm-workspace.yaml` は自動認識

4. **ビルド成果物の場所**
   - 開発時: `.plugin/dev/`
   - 本番用: `.plugin/contents/`
   - 配布用: `/public/`
