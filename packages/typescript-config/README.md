# `@repo/typescript-config`

モノレポ全体で共有する tsconfig のプリセット。

| ファイル | 用途 |
| --- | --- |
| `base.json` | Node 向けの共通ベース (`module: NodeNext`) |
| `kintone.json` | kintone プラグイン (アプリ / ブラウザ向けパッケージ) 用 |
| `react-library.json` | React コンポーネントを含むライブラリ用 |
| `cybozu.d.ts` | `cybozu` グローバル名前空間のアンビエント型定義 |

## `kintone.json` の設計方針

- **`rootDir` / `outDir` は絶対に置かない。**
  この 2 つは「その値を宣言した tsconfig ファイルからの相対パス」で解決される。
  共有コンフィグ側に `"rootDir": "./src"` と書くと、`extends` した各アプリでは
  `packages/typescript-config/src` を指してしまい、アプリの全ソースが
  `rootDir` の外だと判定されて TS6059 で型チェックが停止する。
- **バンドルは rsbuild (`@konomi-app/k2` の `plugin build`) が行うため、`tsc` は型チェック専用**。
  したがって `noEmit: true` / `declaration: false` とする。
- **`types: ["node"]` を明示する。**
  TypeScript 6.0 で `types` 未指定時に `node_modules/@types/*` を自動で読み込む挙動が廃止され、
  既定値が `[]` になった (以前と同じ挙動に戻すには `"types": ["*"]`)。
  各プラグインは rsbuild が注入する `process.env.NODE_ENV` を参照するため `node` が必要。
- **TypeScript 6.0 で非推奨になったオプションは使わない**
  (`baseUrl` / `moduleResolution: node`(=`node10`) / `classic` / `target: ES5` /
  `module: none|amd|umd|system` / `outFile` / `downlevelIteration` /
  `esModuleInterop: false` / `allowSyntheticDefaultImports: false` / `alwaysStrict: false`)。
  `paths` は `baseUrl` なしで tsconfig の位置からの相対解決になるため、`baseUrl` は不要。

## アプリ側 `tsconfig.json` のテンプレート

```jsonc
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@repo/typescript-config/kintone.json",
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  },
  "files": [
    "./node_modules/@kintone/dts-gen/kintone.d.ts",
    "./node_modules/@konomi-app/k2/types.d.ts"
  ],
  "include": ["src/**/*.ts", "src/**/*.tsx", "plugin.config.mjs"],
  "exclude": ["node_modules", "dist", ".plugin"]
}
```

`typeRoots` は指定しない (既定の探索を壊すだけで利点がない)。
`cybozu` グローバルを参照するアプリのみ、`files` に
`"./node_modules/@repo/typescript-config/cybozu.d.ts"` を追加する。

型チェックは各パッケージの `check-types` スクリプト (`tsc --noEmit`) で行い、
リポジトリルートから `pnpm check-types` (= `turbo run check-types`) で一括実行する。
