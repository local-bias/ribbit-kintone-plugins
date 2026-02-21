# kintone タグ付けプラグイン 仕様書

## 概要

kintoneアプリに任意の文字列をタグとして複数登録可能なカスタムフィールドを追加するプラグイン。タグの区切り文字を統一し、UI上でタグの追加・削除・表示・検索を実現。

## アーキテクチャ

### エントリーポイント

- **Desktop**: `src/desktop/index.ts` - 5つのモジュールを読み込み
  - `custom-fields-embedding`: カスタムフィールド埋め込み
  - `target-field-setting`: ターゲットフィールド設定
  - `config-field-hiding`: 設定フィールド非表示化
  - `detail-displaying`: 詳細表示
  - `word-cloud`: ワードクラウド表示
- **Config**: `src/config/index.ts` → `main.tsx` → `app.tsx`

### 技術スタック

- React 18.3.1
- Jotai 2.16.0 (状態管理)
- Emotion 11.13.0 (CSS-in-JS)
- Material-UI 5.16.7 (UIコンポーネント)
- amCharts5 (ワードクラウド可視化)
- Immer 10.1.1 (不変データ更新)
- TypeScript 5.5.4

## 型定義 (`src/types/plugin.d.ts`)

### Plugin.Config (プラグイン設定)

```typescript
type ConfigV1 = {
  version: 1;
  conditions: Condition[];
};
```

### Plugin.Condition (設定条件)

```typescript
{
  targetViewId: string; // 対象ビューID
  targetField: string; // タグ表示フィールドコード
  configField: string; // タグデータ保存フィールドコード
  hideConfigField: boolean; // 設定フィールドを非表示にするか
  wordCloudViewId: string; // ワードクラウド表示ビューID
}
```

### Plugin.TagData (タグデータ)

```typescript
type TagDataV1 = {
  version: 1;
  tags: { value: string }[];
};
```

## 状態管理

### Config側状態 (`src/config/states/plugin.ts`)

- `pluginConfigAtom: atom<Plugin.Config>` - プラグイン設定全体
- `loadingAtom: atom<boolean>` - ローディング状態
- `tabIndexAtom: atom<number>` - 現在のタブインデックス
- `pluginConditionsAtom: atom<Plugin.Condition[]>` - 条件配列
- `getConditionPropertyAtom(property)` - 個別条件プロパティ取得ヘルパー (usePluginAtoms)

### Desktop側状態 (`src/desktop/custom-fields-embedding/states/plugin.tsx`)

- `pluginConditionAtom: atom<Plugin.Condition | null>` - 現在の条件
- `tagDataAtom: atom<Plugin.TagData>` - タグデータ

## データフロー

### 1. 初期化フロー

```
レコード表示イベント
  ↓
restorePluginConfig() - プラグイン設定復元
  ↓
validConditions抽出 (targetField && configField が存在)
  ↓
各条件ごとにReactアプリをマウント
  ↓
record[configField].value から JSON.parse でタグデータ取得
  ↓
Jotai Store作成・初期化 (pluginConditionAtom, tagDataAtom)
```

### 2. タグ追加フロー

```
Input コンポーネント
  ↓
ユーザー入力 (input state)
  ↓
Enter押下 or ボタンクリック
  ↓
tagDataAtom更新 (Immer produce で tags.push)
  ↓
Observer コンポーネントでtagDataAtom監視
  ↓
getCurrentRecord() で現在レコード取得
  ↓
record[configField].value = JSON.stringify(tagData)
  ↓
setCurrentRecord() でレコード更新
```

### 3. タグ削除フロー

```
Tag コンポーネント
  ↓
Chip onDelete イベント
  ↓
tagDataAtom更新 (Immer produce で tags.splice)
  ↓
Observer が変更検知
  ↓
record[configField].value更新
```

### 4. 詳細表示フロー

```
レコード詳細表示イベント
  ↓
record[configField].value から TagData取得
  ↓
各タグを MUI Chip として表示
  ↓
クリック時: クエリ文字列生成 (f{fieldId} like "tag")
  ↓
一覧ページへ遷移 (検索条件付き)
```

### 5. ワードクラウド表示フロー

```
一覧表示イベント (viewId一致確認)
  ↓
getAllRecords() で全レコード取得
  ↓
targetField値をパース (カンマ区切り split)
  ↓
タグ出現回数集計 (weights object)
  ↓
amCharts WordCloud 初期化
  ↓
上位100タグを可視化
```

## 主要ファイル詳細

### `src/lib/plugin.ts` - プラグインユーティリティ

- `getNewCondition()` - デフォルト条件生成
- `createConfig()` - デフォルト設定生成
- `migrateConfig(anyConfig)` - バージョン変換 (現在v1のみ)
- `restorePluginConfig()` - kintone.plugin.app.getConfig からの復元
- `getUpdatedStorage(storage, {conditionIndex, key, value})` - Immer経由で条件更新
- `getConditionField(storage, {conditionIndex, key, defaultValue})` - 条件フィールド取得

### `src/desktop/action.ts` - デスクトップアクション

- `getInitialTagData()` - 初期タグデータ `{version: 1, tags: []}`
- `migrateTagData(anyTagData)` - タグデータバージョン変換
- `decodeTagData(target)` - JSON文字列からTagData復元 + URIデコード

### `src/desktop/custom-fields-embedding/index.tsx` - フィールド埋め込み

イベント: `app.record.create.show`, `app.record.edit.show`
処理:

1. `getMetaFieldId_UNSTABLE(targetField)` でフィールドID取得
2. `.value-{fieldId}` セレクタでDOM要素取得
3. フィールド幅調整 (デスクトップ: +120px)
4. React Root作成、Appコンポーネントレンダリング

### `src/desktop/custom-fields-embedding/components/observer.tsx`

役割: tagDataAtom変更を監視し、kintoneレコードフィールドへ反映
useEffect依存: `[condition, tagData]`
処理: `getCurrentRecord()` → field更新 → `setCurrentRecord()`

### `src/desktop/custom-fields-embedding/components/input.tsx`

UI: KintoneInput + Button (AddIcon)
機能:

- input state管理
- Enterキー or ボタンクリックでタグ追加
- useSetAtom でtagDataAtom更新
- 追加後input初期化

### `src/desktop/custom-fields-embedding/components/tag.tsx`

UI: MUI Chip配列 (color='primary', variant='outlined')
機能:

- tagData.tags.map でChip生成
- onDelete で該当インデックスの tags.splice
- useSetAtom でtagDataAtom更新

### `src/desktop/detail-displaying/index.tsx`

イベント: `app.record.detail.show`
処理:

1. `.value-{fieldId}` 内の既存要素削除
2. record[configField].value からTagDataパース
3. Reactルート作成、各タグをリンク付きChipで表示

### `src/desktop/config-field-hiding.ts`

イベント: `app.record.create.show`, `app.record.edit.show`, `app.record.detail.show`
処理: `hideConfigField` が true の条件について `.field-{metaFieldId}` に CSS display:none 適用

### `src/desktop/target-field-setting.tsx`

イベント: `app.record.create.submit`, `app.record.edit.submit`
処理:

1. tagDataAtom から targetField への値設定
2. tags配列を map して value取得
3. カンマ区切りで結合
4. record[targetField].value へ代入

### `src/desktop/word-cloud/index.ts`

イベント: `app.record.index.show`
条件: `condition.wordCloudViewId === event.viewId`
処理:

1. getAllRecords でアプリ全レコード取得
2. targetFieldをカンマ区切りでsplit
3. タグ出現頻度を weights object に集計
4. amCharts WordCloud初期化
5. 上位100タグ表示 (重み調整: 1位=100, 2位=99...)
6. ヒートマップカラー: #ffd4c2 → #ff621f

### `src/config/app.tsx` - 設定画面

構造:

```
Provider (Jotai)
  PluginErrorBoundary
    PluginConfigProvider
      Notification
        SnackbarProvider
          PluginLayout
            Sidebar (条件選択タブ)
            PluginContent
              Form (条件設定フォーム)
            PluginBanner
            Footer (保存・リセット・エクスポート・インポート)
          iframe (プロモーション)
```

### `src/config/components/model/form/*.tsx` - フォーム要素

- `form-target-view-id.tsx` - 対象ビューID選択
- `form-target-field.tsx` - タグ表示フィールド選択
- `form-config-field.tsx` - タグデータ保存フィールド選択
- `form-config-shown.tsx` - 設定フィールド表示/非表示切替
- `form-word-cloud.tsx` - ワードクラウドビューID選択
- `condition-delete-button.tsx` - 条件削除ボタン

各フォーム要素は `getConditionPropertyAtom(property)` で対応するJotai atomを取得し、useAtom で読み書き

### `src/config/components/model/footer/*.tsx` - フッターボタン

- `index.tsx` - ボタン群コンテナ
- `export-button.tsx` - 設定JSON出力 (Blob → ダウンロード)
- `import-button.tsx` - 設定JSON読み込み (File API)
- `reset-button.tsx` - 設定初期化 (createConfig)

保存処理: `pluginConfigAtom` を `kintone.plugin.app.setConfig` へ保存後リロード

## イベントマネージャー (`src/lib/event-manager.ts`)

用途: kintoneイベントハンドラを一元管理
パターン: `manager.add([events], handler)` で登録
登録されたイベントは kintone.events.on で自動的にバインド

## スタイリング戦略

1. Tailwind CSS (global.css経由でビルド)
2. Emotion styled/css (動的スタイル、カプセル化)
3. MUI テーマ (Chip, Button等)
4. クラス名 `🐸` - プラグイン固有要素のマーカー

## ビルド設定 (`plugin.config.mjs`)

```javascript
{
  id: 'ribbit-kintone-plugin-tag',
  manifest: {
    version: '1.7.0',
    type: 'APP',
    name: { ja: 'タグ付けプラグイン', en: 'Tagging Plugin', ... },
    desktop: { js: [CDN/desktop.js], css: [CDN/desktop.css] },
    config: { js: [CDN/config.js], css: [CDN/config.css] }
  }
}
```

deployモード:

- **prod**: CDN (`https://kintone-plugin.konomi.app/tag/*`)
- **standalone**: ローカルファイル (`desktop.js`, `config.js`)

## データ永続化

1. **プラグイン設定**: `kintone.plugin.app.setConfig()` - JSON文字列化してkintone DB保存
2. **タグデータ**: レコードフィールド (configField) - JSON文字列として保存
3. **ターゲットフィールド**: レコードフィールド (targetField) - カンマ区切り文字列

## エラーハンドリング

- PluginErrorBoundary (react-error-boundary 4.0.13) - 設定画面
- Observer内 try-catch - レコード更新失敗時のコンソールエラー
- 条件バリデーション - targetField && configField 存在確認

## 国際化 (`src/lib/i18n.ts`)

サポート言語: ja, en, es, zh
構造: `ui[language][key]` object
関数: `useTranslations(lang)` → `t(key)` 関数返却
現在言語: `LANGUAGE` グローバル変数から取得

## パフォーマンス最適化

### パフォーマンス最適化

1. Jotai Provider分離 - 各埋め込みフィールドで独立したstate tree
2. Immer使用 - 最小変更パス生成
3. useSetAtom/useAtomCallback - 不要な再レンダリング防止
4. Suspense境界 - 段階的レンダリング
5. amCharts lazy initialization - ワードクラウドビューのみ

## 開発環境

- ポート: 5821
- 証明書ディレクトリ: `/home/dev/config/cert`
- ホットリロード: `plugin dev` コマンド
- ビルド: `plugin build && plugin zip`

## デバッグポイント

- `process.env.NODE_ENV === 'development'` でconsole.log有効化
- word-cloud: weights/seriesData オブジェクトログ出力
- getAllRecords: debug オプション有効化

## 制約事項

1. configFieldは文字列型フィールド必須 (JSON保存用)
2. targetFieldは一行テキストまたは複数行テキスト
3. タグ値にカンマ含む場合の挙動未定義 (split区切り文字)
4. ワードクラウドは最大100タグ表示
5. モバイル対応は限定的 (isMobile分岐あり)

## 依存関係

- `@konomi-app/kintone-utilities`: kintone API抽象化
- `@konomi-app/kintone-utilities-react`: React統合コンポーネント
- `@kintone/rest-api-client`: REST APIクライアント
- `@kintone/dts-gen`: 型定義生成

## セキュリティ考慮

1. URIエンコード/デコード処理 (decodeTagData)
2. JSON.parse try-catch推奨 (実装では一部省略)
3. XSS対策: React自動エスケープ
4. ゲストスペース対応: GUEST_SPACE_ID グローバル変数

## 拡張ポイント

1. バージョンマイグレーション: migrateConfig/migrateTagData
2. 新条件追加: Plugin.Condition型拡張 + フォーム追加
3. タグメタデータ: tags配列要素に color/icon等追加可能
4. カスタムビジュアライゼーション: word-cloud代替実装
