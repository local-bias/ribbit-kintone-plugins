---
applyTo: '**'
---

# コーディング規約

## ファイル

- エンコーディング: UTF-8
- 構造: インポート → 実装（セクション間に 1 空行）
- 拡張子: `.ts`（TypeScript）、`.tsx`（React）
- 命名: lower-kebab-case（例: `my-component.tsx`）

## モジュール

- ES6 構文（`import`/`export`）必須
- `namespace`、`require`禁止
- デフォルトエクスポート禁止（名前付きエクスポートを使用）
- `export let`禁止
- 型のみは`import type`/`export type`を使用

## 変数・データ構造

- `const`/`let`必須、`var`禁止
- `Array()`、`Object()`コンストラクタ禁止（リテラル使用）
- `for...in`非推奨（`Object.keys`等+`for...of`を使用）

## 関数

- 名前付き関数には`function`宣言推奨
- コールバックにはアロー関数推奨
- `arguments`禁止（rest パラメータを使用）

## 型

- `any`禁止（`unknown`や具体的な型を使用）
- `{}`型禁止（`object`、`unknown`、`Record<string, T>`を使用）
- 型アサーション/非 null アサーション原則禁止
- 優先度
  1. Zodスキーマから推論される型エイリアス (最も推奨)
  2. interface (推奨)
  3. typeエイリアス (非推奨。typeでないと定義できない場合のみ)
- 配列は`T[]`形式を推奨

## 構文

- シングルクォート（`'`）使用
- セミコロン必須（ASI 依存禁止）
- 波括弧常に使用（`if`/`for`/`while`）
- 厳密等価演算子（`===`/`!==`）使用
- 数値パースは`Number()`+`NaN`チェック
- 文字列パースは`String()`使用

## 命名規則

- コンポーネント/クラス: UpperCamelCase
- 変数/関数: lowerCamelCase
- 定数: CONSTANT_CASE
- アンダースコアプレフィックス禁止

## React

- JSX は`.tsx`拡張子
- 関数コンポーネントには`function`宣言推奨
- ファイル名は lower-kebab-case

## コメント

- JSDoc: 利用者向けドキュメント
- 行コメント: 実装詳細
- 不要な JSDoc タグ（型情報の重複）禁止

## 禁止事項

- `@ts-ignore`、`@ts-expect-error`、`@ts-nocheck`
- `const enum`
- プリミティブ型ラッパー（`new String()`等）
- プライベートフィールド（`#ident`）→ `private`修飾子を使用
