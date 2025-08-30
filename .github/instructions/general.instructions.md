---
applyTo: '**'
---

## 概要

サイボウズ株式会社が提供するクラウドサービス「kintone」上で動作するプラグインを、React と TypeScript を用いて開発します。

複数のプラグインを、TurboRepo を使用して monorepo で管理します。各プラグインは独立したエントリポイントを持ち、設定画面と動作画面で異なるスクリプトが読み込まれます。

## アーキテクチャ

### 技術スタック

- **フレームワーク**: React
- **UI ライブラリ**: material-ui
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS v4
- **状態管理**: Jotai
- **ビルドツール**: ESBuild
- **型定義**: zod
- **パッケージ管理**: pnpm
- **モノレポ管理**: TurboRepo

### アーキテクチャパターン

- **クライアントサイドレンダリング**: アプリケーションはすべてクライアント側で実行されます。
- **コンポーネントベース**: 機能別にコンポーネントを分離
- **状態の局所化**: 各コンポーネントで必要な状態のみを管理

## モノレポ構造

このプロジェクトは TurboRepo を使用してモノレポ構造で管理されます。以下のディレクトリ構造を持ちます：

```
├── apps/ (アプリケーション)
│   ├── plugin-a/ (プラグインA)
│   ├── plugin-b/ (プラグインB)
│   └── plugin-c/ (プラグインC)
├── packages/ (パッケージ)
│   ├── constants/ (定数)
│   ├── library-a/ (ライブラリA)
│   ├── library-b/ (ライブラリB)
│   └── jotai/ (プラグイン共通の Jotai ストア)
```

### プラグイン構造

この kintone プラグインは以下の 2 つの独立したエントリポイントを持ちます：

#### エントリポイント

- **設定画面**: `src/config/index.ts`
  - プラグインの設定画面で実行されるスクリプト
  - ビルド時に `config.js` として生成される
  - kintone のプラグイン設定画面から script タグで読み込まれる

- **動作画面**: `src/desktop/index.ts`
  - アプリの一覧画面・詳細画面で実行されるスクリプト
  - ビルド時に `desktop.js` として生成される
  - kintone のアプリ画面から script タグで読み込まれる

#### ビルド成果物

```
build/
├── config.js     # 設定画面用スクリプト
├── config.css    # 設定画面用スタイル
├── desktop.js    # 動作画面用スクリプト
├── desktop.css   # 動作画面用スタイル
└── manifest.json # プラグインマニフェスト
```

各スクリプトは独立してコンパイルされ、異なる kintone 画面で個別に読み込まれるため、相互依存はありません。

## 各プラグインディレクトリ構造と役割

### プラグインディレクトリ構造

```
src/
└── components/ (汎用コンポーネント)
    ├── jotai/ (Jotaiが組み込まれたコンポーネント)
    └── ui/ (UIコンポーネント)
└── config/ (設定画面)
    ├── components/ (設定画面用コンポーネント)
    ├── hooks/ (設定画面用フック)
    ├── states/ (設定画面用状態管理)
    ├── app.tsx (設定画面のエントリポイント)
    ├── index.ts (設定画面用jsファイルのエントリポイント)
    └── main.tsx (index.tsとapp.tsxを仲介するファイル)
├── contents/ (静的コンテンツ)
└── desktop/ (動作画面)
    ├── components/ (動作画面用コンポーネント)
    ├── hooks/ (動作画面用フック)
    ├── states/ (動作画面用状態管理)
    └── index.ts (動作画面用jsファイルのエントリポイント)
├── lib/ (ライブラリ)
├── schema/ (スキーマ)
    └── plugin-config.ts (プラグイン設定スキーマ)
├── styles/ (スタイル)
└── types/ (型定義)
```

### 各ディレクトリの役割

- `components/`: 設定画面、動作画面で共通して使用される汎用コンポーネントを格納します。
  - `jotai/`: Jotai が組み込まれたコンポーネントを格納します。
  - `ui/`: UI コンポーネントを格納します。
- `config/`: 設定画面に関連するコードを格納します。設定画面用のコンポーネント、フック、状態管理が含まれます。
- `contents/`: 静的なコンテンツ（画像やフォントなど）を格納します。読み取る必要はありません。
- `desktop/`: 動作画面に関連するコードを格納します。動作画面用のコンポーネント、フック、状態管理が含まれます。
- `lib/`: 設定画面、動作画面で共通して使用されるライブラリやユーティリティ関数を格納します。
- `schema/`: zod スキーマを定義するディレクトリです。
  - `plugin-config.ts`: プラグイン設定のスキーマを定義します。設定画面でここで定義されたスキーマを使用して、設定のバリデーションを行います。
- `styles/`: Tailwind CSS の設定やカスタムスタイルを格納します。

#### /schema/plugin-config.ts の役割

kintoneでは、各プラグインに対して、設定情報を保存するためのストレージが提供されています。このストレージに保存される設定情報の型を定義するのが `/schema/plugin-config.ts` です。

プラグイン設定情報の後方互換性を保つために、設定情報の型は以下のように定義されます：

```typescript
import { z } from 'zod';

export const PluginConfigV1Schema = z.object({
  version: z.literal(1), // バージョン番号
  settingA: z.string().default('defaultA'), // 設定A
  settingB: z.number().default(10), // 設定B
});

export const PluginConfigV2Schema = z.object({
  version: z.literal(2), // バージョン番号
  settingA: z.string().default('defaultA'), // 設定A
  settingB: z.number().default(10), // 設定B
  settingC: z.boolean().default(false), // 新しい設定C
});

export const AnyPluginConfigSchema = z.discriminatedUnion('version', [
  pluginConfigV1Schema,
  pluginConfigV2Schema,
]);
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

export const PluginConfigSchema = PluginConfigV2Schema; // 現在のバージョンを使用
export type PluginConfig = z.infer<typeof PluginConfigSchema>;
```

このように、`PluginConfigSchema` は現在のバージョンのスキーマを指し、将来のバージョンが追加された場合でも、後方互換性を保ちながら新しい設定項目を追加できます。

プラグインに新しい機能を追加する場合は、`PluginConfigSchema` を更新し、新しいバージョンのスキーマを定義します。これにより、古いバージョンの設定情報も引き続きサポートされます。

#### 設定情報のマイグレーション

プラグインの設定情報は、プラグインをインストールした各kintoneアプリに保存されているため、保存されている設定情報のバージョンを確認し、必要に応じてマイグレーションを行う必要があります。

このマイグレーション処理は、`src/lib/plugin.ts` 内の`migrateConfig`関数で行います。この関数は、現在の設定情報のバージョンを確認し、必要に応じて新しいバージョンのスキーマに変換します。

`migrateConfig`の型は以下のようになります：

```typescript
export type MigrateConfig = (config: AnyPluginConfig) => PluginConfig;
```

プラグインに新しい機能を追加した際は、`src/schema/plugin-config.ts` と同様に、`src/lib/plugin.ts` の `migrateConfig` 関数も更新する必要があります。これにより、古いバージョンの設定情報を新しいバージョンに変換し、プラグインの動作を保証します。

## プラグインの開発フロー

1. **プロジェクトのクローン**
   - リポジトリをクローンします。
   - `pnpm create k2@latest [new-plugin-name] --template plugin-turbo` を実行して、プロジェクトの初期設定を行います。
2. **依存関係のインストール**
   - `pnpm install` を実行して、必要な依存関係をインストールします。
3. **プラグインの開発**
   - `src/schema/plugin-config.ts` で設定情報のスキーマを定義します。
   - `src/config/` と `src/desktop/` ディレクトリに必要なコンポーネントやフックを実装します。
4. **ビルド**
   - `pnpm build` を実行して、プラグインをビルドします。
   - ビルド成果物は `build/` ディレクトリに出力されます。

## kintone API の使用

kintoneのデータ操作は、ユーティリティ関数を通じて行います。これらの関数は、`@konomi-app/kintone-utilities` パッケージに含まれています。以下の関数を使用して、kintoneのデータを操作します：

- `getAllRecords`: 指定したクエリに一致するすべてのレコードを取得します。
- `addAllRecords`: 複数のレコードを一括で追加します。
- `updateAllRecords`: 複数のレコードを一括で更新します
- `deleteAllRecords`: 指定したクエリに一致するすべてのレコードを削除します。
- `bulkRequest`: 複数のリクエストを一括で送信します。
- `getFormFields`: 指定したアプリのフィールド情報を取得します。
