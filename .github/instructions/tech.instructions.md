---
applyTo: '**'
---

# 技術指示書

TurboRepoモノレポ構成のkintoneプラグイン開発プロジェクト。

## パッケージ管理

- pnpm v10.23.0
- Node.js >=18
- TurboRepo v2.6.1

## ルートコマンド

- `pnpm build`: 全プラグインビルド + 成果物マージ（postbuild）
- `pnpm dev`: 全プラグイン開発モード
- `pnpm lint`: リント実行
- `pnpm format`: Prettier整形
- `pnpm check-types`: 型チェック

## プラグインコマンド

- `pnpm init`: プラグイン初期化＋キー生成
- `pnpm build`: CSS/JSビルド＋ZIP作成（concurrently実行）
- `pnpm dev`: CSS/JS監視ビルド（concurrently実行）
- `pnpm standalone`: スタンドアロン版ビルド

## ビルドプロセス

1. CSS: TailwindCSS CLI（`@tailwindcss/cli`）
   - `src/styles/config.css` → `.plugin/contents/config.css`
   - `src/styles/desktop.css` → `.plugin/contents/desktop.css`
2. JS: K2ツール（`@konomi-app/k2`）でバンドリング
3. ZIP: `plugin zip`コマンド

## 技術スタック

### コア

- React 19.2.0
- TypeScript 5.9.3
- Jotai 2.15.1

### UI

- MUI v7.3.x
- Radix UIコンポーネント群
- Lucide React（アイコン）

### スタイリング

- Emotion（CSS-in-JS）- **推奨**
- TailwindCSS v4.1.x（レガシー、新規使用非推奨）
- class-variance-authority / clsx

#### Reactコンポーネントのスタイリング方針

Reactコンポーネントのスタイリングは基本的に`@emotion/styled`を使用する。

**⚠️ TailwindCSSは使用しないこと**: kintoneの既存スタイルとの競合が発生しやすいため、TailwindCSSの使用は極力避ける。既存コードでTailwindCSSを使用している箇所があっても、新規開発では`@emotion/styled`を使用すること。

```typescript
import styled from '@emotion/styled';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 8px 16px;
  border-radius: 4px;
  background-color: ${({ variant }) => (variant === 'primary' ? '#1976d2' : '#f5f5f5')};
  color: ${({ variant }) => (variant === 'primary' ? '#fff' : '#333')};
`;
```

- 動的なスタイルにはpropsを活用
- MUIコンポーネントのカスタマイズにも`styled`を使用可能

### kintone関連

- @konomi-app/kintone-utilities: ^5.17.0
- @konomi-app/kintone-utilities-jotai: ^1.4.x
- @konomi-app/kintone-utilities-react: ^2.2.0

### ユーティリティ

- Zod v4.x（バリデーション）
- Immer v11.x（イミュータブル）
- Remeda v2.x（関数型）
- nanoid v5.x（ID生成）
- tiny-invariant（アサーション）

### 開発ツール

- Biome（リント/フォーマット）
- Prettier
- @kintone/dts-gen（型生成）
- concurrently（並行実行）

## 共有パッケージ（@repo/\*）

- constants: 定数（URL等）
- jotai: Jotaiストア/共通状態管理
- ui: UIコンポーネント
- utils: ユーティリティ関数
- tailwind-config: Tailwind設定（v3用）
- tailwindcss: Tailwind v4用CSS/postcss設定
- typescript-config: tsconfig（base.json, kintone.json, react-library.json）
- eslint-config: ESLint設定（base.js, kintone.js, react-internal.js）
- k2: @konomi-app/k2のラッパー

## pnpm overrides

ルートpackage.jsonで依存関係バージョンを統一:

- @konomi-app/kintone-utilities-jotai
- @mui/material
- jotai
- @konomi-app/k2
- @types/react / @types/react-dom
