---
applyTo: '**'
---

# kintone API リファレンス

## 概要

このドキュメントは、kintone プラグイン開発における kintone API の使用方法とリファレンスを提供します。
kintone API を利用することで、kintone アプリケーションのデータ操作やカスタマイズが可能になります。

### インポート

```typescript
import {
  // レコード操作
  getRecord,
  getRecords,
  getAllRecords,
  addRecord,
  addRecords,
  addAllRecords,
  updateRecord,
  updateAllRecords,
  deleteAllRecords,

  // アプリ操作
  getApp,
  getAllApps,
  getViews,
  getFormFields,

  // その他
  uploadFile,
  downloadFile,
  getRecordComments,
  addRecordComment,
} from '@konomi-app/kintone-utilities';
```

### 共通パラメータ

多くの関数で以下の共通パラメータが使用できます：

- `debug?: boolean` - デバッグログを出力
- `guestSpaceId?: number | string` - ゲストスペース ID

## レコード操作

### 単一レコード取得

```typescript
// 基本的な取得
const record = await getRecord({
  app: 1,
  id: 100,
});

// 型安全な取得
interface MyRecord {
  title: { value: string };
  status: { value: string };
}

const typedRecord = await getRecord<MyRecord>({
  app: 1,
  id: 100,
  debug: true,
});
```

### 複数レコード取得

```typescript
// 基本的な取得
const response = await getRecords({
  app: 1,
  query: 'status = "進行中"',
  fields: ['title', 'status', 'assignee'],
});

// 全件取得（自動的にページネーション処理）
const allRecords = await getAllRecords({
  app: 1,
  query: 'status in ("進行中", "完了")',
  fields: ['title', 'status'],
});

// 段階的な取得（進捗コールバック付き）
const records = await getAllRecords({
  app: 1,
  query: 'created_time > "2024-01-01T00:00:00Z"',
  onStep: ({ records, incremental }) => {
    console.log(`取得済み: ${records.length}件, 新規: ${incremental.length}件`);
  },
});
```

### レコード追加

```typescript
// 単一レコード追加
const result = await addRecord({
  app: 1,
  record: {
    title: { value: '新しいタスク' },
    status: { value: '未着手' },
  },
});

// 複数レコード追加（100件まで）
const results = await addRecords({
  app: 1,
  records: [{ title: { value: 'タスク1' } }, { title: { value: 'タスク2' } }],
});

// 大量レコード追加（自動的にバッチ処理）
const bulkResults = await addAllRecords({
  app: 1,
  records: largeRecordArray,
  onProgress: ({ total, done }) => {
    console.log(`進捗: ${done}/${total}`);
  },
});
```

### レコード更新

```typescript
// IDによる更新
const updateResult = await updateRecord({
  app: 1,
  id: 100,
  record: {
    status: { value: '完了' },
  },
  revision: 5, // 楽観ロック
});

// 更新キーによる更新
const updateByKeyResult = await updateRecord({
  app: 1,
  updateKey: {
    field: 'code',
    value: 'TASK001',
  },
  record: {
    status: { value: '進行中' },
  },
});

// 大量更新
const bulkUpdateResults = await updateAllRecords({
  app: 1,
  records: [
    {
      id: 100,
      record: { status: { value: '完了' } },
    },
    {
      id: 101,
      record: { status: { value: '完了' } },
    },
  ],
});
```

### アップサート（存在しない場合は追加、存在する場合は更新）

```typescript
const upsertResult = await upsertRecord({
  app: 1,
  updateKey: {
    field: 'code',
    value: 'TASK001',
  },
  record: {
    title: { value: 'タスク1' },
    status: { value: '進行中' },
  },
});
```

### レコード削除

```typescript
// IDによる削除
await deleteAllRecords({
  app: 1,
  ids: [100, 101, 102],
});

// クエリによる削除
await deleteAllRecordsByQuery({
  app: 1,
  query: 'status = "削除対象"',
});
```

### プロセス管理

```typescript
// 担当者更新
await updateRecordAssignees({
  app: 1,
  id: 100,
  assignees: ['user1', 'user2'],
});

// ステータス更新
await updateRecordStatus({
  app: 1,
  id: 100,
  action: '承認する',
  assignee: 'user1',
});

// 複数レコードのステータス一括更新
await updateAllRecordStatuses({
  app: 1,
  records: [
    {
      id: 100,
      action: '承認する',
    },
    {
      id: 101,
      action: '却下する',
    },
  ],
});
```

## アプリ操作

### アプリ情報取得

```typescript
// 単一アプリ情報
const app = await getApp({
  id: 1,
});

// 全アプリ情報
const allApps = await getAllApps({
  debug: true,
});
```

### ビュー設定

```typescript
// ビュー取得
const { views } = await getViews({
  app: 1,
  lang: 'ja',
});

// ビュー更新
await updateViews({
  app: 1,
  views: {
    カスタムビュー: {
      type: 'LIST',
      name: 'カスタムビュー',
      fields: ['title', 'status'],
      filterCond: 'status = "進行中"',
      sort: 'created_time desc',
    },
  },
});
```

### フォーム設定

```typescript
// フィールド情報取得
const { properties } = await getFormFields({
  app: 1,
  preview: false,
});

// レイアウト情報取得
const { layout } = await getFormLayout({
  app: 1,
});

// アプリ設定取得
const settings = await getAppSettings({
  app: 1,
});
```

## ファイル操作

```typescript
// ファイルアップロード
const uploadResult = await uploadFile({
  file: {
    name: 'document.pdf',
    data: fileBlob,
  },
});

// ファイルダウンロード
const fileBlob = await downloadFile({
  fileKey: uploadResult.fileKey,
});
```

## コメント操作

```typescript
// コメント取得（全件自動取得）
const comments = await getRecordComments({
  app: 1,
  record: 100,
  order: 'desc',
});

// コメント追加
await addRecordComment({
  app: 1,
  record: 100,
  comment: {
    text: 'コメントです',
    mentions: [
      {
        code: 'user1',
        type: 'USER',
      },
    ],
  },
});

// コメント削除
await deleteRecordComment({
  app: 1,
  record: 100,
  comment: 5,
});
```

## スペース操作

```typescript
// スペース情報取得
const space = await getSpace({
  id: 1,
});

// スペース作成
const newSpace = await createSpace({
  id: 'SPACE001',
  name: '新しいスペース',
  members: [
    {
      entity: { type: 'USER', code: 'user1' },
      isAdmin: true,
    },
  ],
  isPrivate: false,
});

// スペース削除
await deleteSpace({
  id: 1,
});

// スレッド更新
await updateThread({
  id: 1,
  name: '更新されたスレッド名',
  body: 'スレッドの本文',
});
```

## レポート操作

```typescript
// アプリのグラフ取得
const charts = await getAppCharts({
  app: 1,
  lang: 'ja',
});
```

## ユーティリティ関数

### フィールド情報フィルタリング

```typescript
import { filterFieldProperties } from '@kintone-utilities/core';

// 文字列フィールドのみ抽出
const textFields = filterFieldProperties(properties, (field) => field.type === 'SINGLE_LINE_TEXT');
```

### クエリビルダー

```typescript
import { useQuery, useSorting } from '@kintone-utilities/core';

// 型安全なクエリ構築
interface MyRecord {
  title: { value: string };
  status: { value: string };
  priority: { value: string };
}

const query = useQuery<MyRecord>(
  [
    {
      field: 'status',
      operator: 'in',
      value: '("進行中", "レビュー中")',
    },
    {
      field: 'priority',
      operator: '=',
      value: '高',
      truth: 'and',
    },
  ],
  {
    debug: true,
    sort: { field: 'title', orderBy: 'asc' },
  }
);

// 結果: status in ("進行中", "レビュー中") and priority = "高" order by title asc
```

### 配列分割

```typescript
import { chunk } from '@kintone-utilities/core';

const largeArray = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const chunks = chunk(largeArray, 3);
// 結果: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
```

### ゲストスペース判定

```typescript
import { isGuestSpace, withSpaceIdFallback } from '@kintone-utilities/core';

// アプリがゲストスペースにあるかチェック
const isGuest = await isGuestSpace('1');

// スペースIDが不明な場合の自動フォールバック
const records = await withSpaceIdFallback({
  spaceId: '123',
  func: getRecords,
  funcParams: { app: 1, query: 'status = "進行中"' },
});
```

## Cybozu ユーザー管理

```typescript
// ユーザー一覧取得
const users = await getCybozuUsers({
  codes: ['user1', 'user2'],
  debug: true,
});

// 利用サービス取得
const services = await getUsedCybozuServices({
  codes: ['user1'],
});

// 利用サービス更新
await updateUsedCybozuServices({
  users: [
    {
      code: 'user1',
      services: ['kintone', 'garoon'],
    },
  ],
});
```

## 実験的機能

### API クライアント（カリー化）

```typescript
import { useApi } from '@kintone-utilities/core';

// アプリ固有のAPIクライアント作成
const api = useApi({
  app: 1,
  guestsSpaceId: '123',
  debug: true,
});

// レコード追加（自動的に最適化）
const result = await api.records.$post({
  records: [{ title: { value: 'タスク1' } }, { title: { value: 'タスク2' } }],
});
```

## エラーハンドリング

```typescript
try {
  const record = await getRecord({ app: 1, id: 100 });
} catch (error) {
  if (error.code === 'GAIA_RE01') {
    console.log('レコードが見つかりません');
  } else if (error.code === 'GAIA_IL23') {
    console.log('ゲストスペースのアプリです');
  }
}
```

## パフォーマンス最適化

### バルクリクエスト

大量のデータを扱う場合は、自動的にバルクリクエスト API が使用されます：

```typescript
// 自動的に100件ずつに分割してバルクリクエスト
await addAllRecords({
  app: 1,
  records: largeRecordArray, // 1000件のレコード
  onProgress: ({ total, done }) => {
    console.log(`${Math.round((done / total) * 100)}% 完了`);
  },
});
```

### カーソル API

order by を含むクエリでは自動的にカーソル API が使用されます：

```typescript
// 自動的にカーソルAPIを使用
const records = await getAllRecords({
  app: 1,
  query: 'created_time > "2024-01-01T00:00:00Z" order by created_time asc',
});
```

## 注意事項

1. **ブラウザ環境専用**: これらの関数は kintone のブラウザ環境でのみ動作します
2. **API 制限**: kintone の API 制限に従って自動的にリクエストが分割されます
3. **型安全性**: TypeScript の型定義を活用して型安全な開発が可能です
4. **デバッグ**: `debug: true`を指定することで詳細なログが出力されます

## サポートされている API 制限

- レコード取得: 500 件/リクエスト
- レコード追加: 100 件/リクエスト
- レコード更新: 100 件/リクエスト
- レコード削除: 100 件/リクエスト
- バルクリクエスト: 20 リクエスト/バッチ

これらの制限は自動的に処理されるため、開発者が意識する必要はありません。
