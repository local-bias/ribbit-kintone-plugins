# 🐸 Ribbit kintone plugins

## 概要

turborepoを使用して、複数のkintoneプラグインを管理するためのリポジトリです。

## 🍳 インストール

```bash
pnpm install
```

## 🔧 開発

```bash
pnpm dev
```

### 特定のプラグインを開発する場合

```bash
pnpx turbo dev --filter=tooltip
```

## 📦 ビルド

```bash
pnpm build
```

各プラグインがビルドされ、`public` ディレクトリに出力されます。

## 📝 メモ

- 開発用のプラグインはローカルサーバーのリソースを参照するため、一度でもご利用のkintoneにプラグインファイルをアップロードしていれば、`.env`ファイルの設定は必須ではありません。
  - k2からアラートが出ますが、無視しても問題ありません。
