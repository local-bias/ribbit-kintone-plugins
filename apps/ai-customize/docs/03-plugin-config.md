# 03. プラグイン設定

## 1. 方針

- 既存プラグインと同じく `{ version, common, conditions }` の形を採るが、**本プラグインに「条件」の概念はない**ため `conditions` は空配列固定とする。
  - `@repo/plugin/react` の `createPluginConfigStore` が `conditions: ({id: string} & ...)[]` を要求するため、型を満たすためだけに空配列を持つ。サイドバーは表示しない。
  - 将来「画面ごとに違う設定」が必要になったら `conditions` を使えるよう、形は崩さない。
- 設定情報は `restorePluginConfig()` で復元し、**必ず `migrateConfig()` を通してから使う**。保存済みJSONはスキーマ検証を通っていないため、値の型を信頼しない(`apps/tab/src/lib/plugin.ts` と同じ方針)。

## 2. 設定項目

### 2-1. アセット管理アプリ(必須)

| キー | 型 | 既定 | 説明 |
| --- | --- | --- | --- |
| `assetAppId` | string | `''` | アセットを保存するkintoneアプリのID |
| `assetAppSpaceId` | string \| undefined | `undefined` | ゲストスペースID(ゲストスペース上のアプリの場合) |

### 2-2. フィールドの対応付け(必須は ○)

| キー | 型 | 対応するkintoneフィールド型 | 必須 | 説明 |
| --- | --- | --- | --- | --- |
| `titleFieldCode` | string | 文字列(1行) | ○ | アセットのタイトル |
| `targetAppIdFieldCode` | string | 数値 | ○ | 適用先アプリID |
| `targetSpaceIdFieldCode` | string | 数値 | ○ | 適用先ゲストスペースID。通常スペースは `0` |
| `kindFieldCode` | string | ドロップダウン / ラジオ | ○ | JS / CSS の別 |
| `codeFieldCode` | string | 文字列(複数行) | ○ | コード本体 |
| `scopeFieldCode` | string | ドロップダウン / ラジオ | ○ | 影響範囲 |
| `statusFieldCode` | string | ドロップダウン / ラジオ | ○ | 有効・無効 |
| `ownerFieldCode` | string | 作成者(`CREATOR`) | ○ | 変更不能な所有者。`private` の判定に使う |
| `permissionsFieldCode` | string | チェックボックス | ○ | カスタマイズ単位の権限(追加・更新・削除・外部通信(指定先のみ / すべて)・制限なし)。未選択 = 読み取りのみ(→ [13](./13-launch-gate-and-permissions.md) 3章) |
| `externalUrlsFieldCode` | string | 文字列(複数行) | - | 外部通信を許可する通信先。1行1パターン(→ 13 の 3-3-2章)。未設定なら「指定先のみ」は常に空リスト扱い(全て拒否) |
| `orderFieldCode` | string | 数値 | - | 実行順(昇順)。未設定なら `$id` 昇順 |
| `screensFieldCode` | string | チェックボックス | - | 適用画面。未設定なら全画面 |
| `descriptionFieldCode` | string | 文字列(複数行) | - | 説明・メモ |
| `conversationFieldCode` | string | 文字列(複数行) | - | AIとの対話ログ(JSON)。privateは会話再開用、publicは本文なしの監査用 |
| `modelFieldCode` | string | 文字列(1行) | - | 生成に使ったAIモデル名(監査用) |

### 2-3. 選択肢の値マッピング

kintoneのドロップダウンは選択肢名がそのまま値になるため、日本語ラベルを許すためのマッピングを持つ。

| キー | 型 | 既定 |
| --- | --- | --- |
| `kindJsValue` | string | `'JavaScript'` |
| `kindCssValue` | string | `'CSS'` |
| `scopePrivateValue` | string | `'自分だけ'` |
| `scopePublicValue` | string | `'全員'` |
| `statusEnabledValue` | string | `'有効'` |
| `statusDisabledValue` | string | `'無効'` |
| `screenIndexValue` / `screenDetailValue` / `screenCreateValue` / `screenEditValue` | string | `'一覧'` / `'詳細'` / `'追加'` / `'編集'` |
| `permissionPostValue` / `permissionPutValue` / `permissionDeleteValue` | string | `'追加(POST)'` / `'更新(PUT)'` / `'削除(DELETE)'` |
| `permissionExternalListedValue` / `permissionExternalAllValue` | string | `'外部通信(指定先のみ)'` / `'外部通信(すべて)'` |
| `permissionUnrestrictedValue` | string | `'制限なし'` |

> 設定画面では、選択したフィールドの選択肢を kintone から取得して**プルダウンで選ばせる**。手入力にすると必ずtypoで壊れる。

### 2-4. AIプロバイダ(BYOK)

利用者が自分のAPIキーを用意する **BYOK方式**。複数プロバイダに対応する。
プロバイダーごとの差分はAI SDKの公式provider packagesへ任せる(→ [07b-ai-providers.md](./07b-ai-providers.md))。

| キー | 型 | 既定 | 説明 |
| --- | --- | --- | --- |
| `providerType` | `'openai' \| 'anthropic' \| 'google' \| 'openrouter' \| 'azure-openai' \| 'custom'` | `'openai'` | 接続先 |
| `baseUrl` | string | `''` | `custom` のときのエンドポイント |
| `azureResourceName` | string | `''` | `azure-openai` のときのリソース名 |
| `azureDeploymentName` | string | `''` | 同上。デプロイ名 |
| `azureApiVersion` | string | `''` | 同上。APIバージョン |
| `model` | string | `''` | 使用モデル。**自由入力 + プロバイダごとの候補補完**。空なら未設定として扱う |
| `temperature` | number \| null | `null` | `null` はプロバイダー既定。詳細設定時だけ0〜2を送る |
| `maxOutputTokens` | number | `8000` | 1応答の出力上限 |
| `maxToolSteps` | number | `8` | 1メッセージあたりのAgent step上限 |
| `additionalSystemPrompt` | string | `''` | 組織独自のコーディング規約などを追記する枠 |
| `registeredProxyEndpoint` | string | `''` | 最後に秘密情報を登録したendpoint。秘密値は含めない |
| `registeredProxyMethod` | `'POST'` | `'POST'` | プロキシ設定の移行・消去に使う |

**APIキーはプラグイン設定(`config`)に保存しない。** `kintone.plugin.app.setProxyConfig`(= `@konomi-app/kintone-utilities` の `setPluginProxyConfig`)のヘッダに格納する。理由と手順は [08-security.md](./08-security.md) の「APIキーの保管」を参照。

**プロバイダーやモデルを変えるとendpointが変わる場合がある**(Google はモデル名、Azure はデプロイ名がURLに入る)。
endpointが変わったときは**APIキーの再入力を必須**にする。旧endpointの秘密を読み出して移し替える処理は実装しない
(→ 07b の5章。中途半端な状態を作る失敗経路を無くすため)。

> **ストリーミングは使わない。** kintoneのプロキシAPIはレスポンスを文字列で1回返す仕様のため、SSEによる逐次表示ができない。詳細と代替のUIは [07b-ai-providers.md](./07b-ai-providers.md) の3章。

### 2-5. 権限・挙動

| キー | 型 | 既定 | 説明 |
| --- | --- | --- | --- |
| `chatAllowedUsers` | string[] | `[]` | チャットを使えるユーザーのログイン名。全部空ならアプリ管理者のみ |
| `chatAllowedGroups` | string[] | `[]` | 同上(グループコード) |
| `chatAllowedOrganizations` | string[] | `[]` | 同上(組織コード) |
| `publishAllowedUsers` | string[] | `[]` | 「全員」スコープを作成・有効化できるユーザー。**全部空ならアプリ管理者のみ** |
| `publishAllowedGroups` | string[] | `[]` | 同上 |
| `publishAllowedOrganizations` | string[] | `[]` | 同上 |
| `displayOnIndex` / `displayOnDetail` / `displayOnCreate` / `displayOnEdit` | boolean | すべて `true` | ランチャーを出す画面 |
| `sendsRecordToAi` | boolean | `false` | レコード送信ツールを有効化する。既定オフ。有効でも呼び出しごとに承認(→ 08) |
| `savesConversation` | boolean | `false` | **AIとの対話ログをアセットのレコードへ保存する。既定オフ** |

`savesConversation` が `true` **かつ** `conversationFieldCode` が設定されているときだけ、対話ログを保存する。
どちらか一方でも欠けていれば保存しない(→ [04-asset-app.md](./04-asset-app.md) の対話ログ)。
privateの対話ログにはユーザーの入力とAIの応答が残るため、既定はオフにしている。publicでは本文を削除したaudit modeだけを保存する。

`publishAllowed*` と `chatAllowed*` は、どちらも全て空ならアプリ管理者のみ。チャットはAI事業者への
データ送信とAPI費用を伴うため、「未設定 = 全員可」にはしない。書き込みの自動承認設定はv1では提供しない。

## 3. zodスキーマ(実装の下書き)

```ts
// src/schema/plugin-config.ts
import { z } from 'zod';

export const ProviderTypeSchema = z.enum([
  'openai',
  'anthropic',
  'google',
  'openrouter',
  'azure-openai',
  'custom',
]);

/** 🔌 v1: 初版 */
const PluginCommonConfigV1Schema = z.object({
  // アセット管理アプリ
  assetAppId: z.string(),
  assetAppSpaceId: z.string().optional(),

  // フィールドの対応付け
  titleFieldCode: z.string(),
  targetAppIdFieldCode: z.string(),
  targetSpaceIdFieldCode: z.string(),
  kindFieldCode: z.string(),
  codeFieldCode: z.string(),
  scopeFieldCode: z.string(),
  statusFieldCode: z.string(),
  ownerFieldCode: z.string(),
  permissionsFieldCode: z.string(),
  externalUrlsFieldCode: z.string(),
  orderFieldCode: z.string(),
  screensFieldCode: z.string(),
  descriptionFieldCode: z.string(),
  conversationFieldCode: z.string(),
  modelFieldCode: z.string(),

  // 選択肢の値
  kindJsValue: z.string(),
  kindCssValue: z.string(),
  scopePrivateValue: z.string(),
  scopePublicValue: z.string(),
  statusEnabledValue: z.string(),
  statusDisabledValue: z.string(),
  screenIndexValue: z.string(),
  screenDetailValue: z.string(),
  screenCreateValue: z.string(),
  screenEditValue: z.string(),
  permissionPostValue: z.string(),
  permissionPutValue: z.string(),
  permissionDeleteValue: z.string(),
  permissionExternalListedValue: z.string(),
  permissionExternalAllValue: z.string(),
  permissionUnrestrictedValue: z.string(),

  // AI (BYOK)
  providerType: ProviderTypeSchema,
  baseUrl: z.string(),
  azureResourceName: z.string(),
  azureDeploymentName: z.string(),
  azureApiVersion: z.string(),
  model: z.string(),
  temperature: z.number().min(0).max(2).nullable(),
  maxOutputTokens: z.number().int().min(256).max(65_536),
  maxToolSteps: z.number().int().min(1).max(20),
  additionalSystemPrompt: z.string(),
  registeredProxyEndpoint: z.string(),
  registeredProxyMethod: z.literal('POST'),

  // 権限・挙動
  chatAllowedUsers: z.array(z.string()),
  chatAllowedGroups: z.array(z.string()),
  chatAllowedOrganizations: z.array(z.string()),
  publishAllowedUsers: z.array(z.string()),
  publishAllowedGroups: z.array(z.string()),
  publishAllowedOrganizations: z.array(z.string()),
  displayOnIndex: z.boolean(),
  displayOnDetail: z.boolean(),
  displayOnCreate: z.boolean(),
  displayOnEdit: z.boolean(),
  sendsRecordToAi: z.boolean(),
  savesConversation: z.boolean(),
});

const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  common: PluginCommonConfigV1Schema,
  // 本プラグインでは未使用。将来の拡張余地として形だけ持つ
  conditions: z.array(z.object({ id: z.string() })),
});

export const AnyPluginConfigSchema = z.discriminatedUnion('version', [PluginConfigV1Schema]);

export type PluginConfig = z.infer<typeof PluginConfigV1Schema>;
export type PluginCommonConfig = PluginConfig['common'];
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;
export type ProviderType = z.infer<typeof ProviderTypeSchema>;
```

## 4. 利用条件の判定

`src/lib/plugin.ts` に置く純粋関数。**操作画面はこれを通してからでないと何も表示しない**。

```ts
/** 操作画面でプラグインを動かせる最小要件を満たしているか */
export const isUsableConfig = (common: PluginCommonConfig): boolean =>
  common.assetAppId !== '' &&
  common.titleFieldCode !== '' &&
  common.targetAppIdFieldCode !== '' &&
  common.targetSpaceIdFieldCode !== '' &&
  common.kindFieldCode !== '' &&
  common.codeFieldCode !== '' &&
  common.scopeFieldCode !== '' &&
  common.statusFieldCode !== '' &&
  common.ownerFieldCode !== '' &&
  common.permissionsFieldCode !== '';
```

AI関連が未設定(`model` が空など)でも、**一覧の閲覧とスイッチ操作は動く**ようにする。チャットだけを無効化する。

## 5. 設定画面の構成

`@repo/plugin/react` の `createPluginConfigStore` を使い、`apps/my-theme` の構成に倣う(サイドバーなし・共通設定のみ)。

```
[ヘッダ] 保存 / リセット / インポート / エクスポート   ← @repo/plugin/react のフッター部品
[本体] アコーディオン形式
  1. アセット管理アプリ        … JotaiAppSelect + 「接続を確認」ボタン
  2. フィールドの対応付け      … JotaiFieldSelect。選択肢の値は自動プルダウン
  3. AIの設定                  … プロバイダ / (Azure・custom用の項目) / モデル / 温度 / トークン上限 / 追加プロンプト
  4. APIキー                   … 入力欄。保存時に setPluginProxyConfig へ。値は再表示しない
  5. 権限                      … チャット許可 / 公開許可(ユーザー・グループ・組織のマルチセレクト)
  6. 表示と挙動                … 表示画面 / レコード送信 / 対話ログ保存
```

### 設定画面で必ず出す検証

| 検証 | タイミング | 失敗時の表示 |
| --- | --- | --- |
| アセット管理アプリにアクセスできるか | アプリ選択時 | 「このアプリのフォーム情報を取得できません。アクセス権を確認してください」 |
| 指定フィールドの型が期待通りか | フィールド選択時 | 期待する型を明示して警告(例: コードは「文字列(複数行)」が必要) |
| 選択肢の値がフィールドに存在するか | 値マッピング設定時 | 存在しない値を赤字。保存はブロックしない(後からフィールド側が変わる可能性があるため) |
| 「通信先」が未設定のまま「外部通信(指定先のみ)」の選択肢がある | フィールド選択時 | 「通信先フィールドを対応付けないと、指定先のみの外部通信は全て拒否されます」と警告 |
| 「権限」フィールドの初期値 | フィールド選択時 | 初期値で何か選択されていたら警告。**初期値は全て未選択(= 読み取りのみ)にする**。初期値で書き込み権限が付くと、新規アセットが最初から書き込める |
| `publishAllowed*` が全て空 | 常時 | 「『全員』スコープはアプリ管理者のみが作成できます」と情報表示 |
| `savesConversation` を有効化 | チェック時 | 「privateでは会話本文を保存し、publicでは本文なしの監査情報だけを保存します」と警告。`conversationFieldCode` 未設定なら保存されない旨も表示 |
| プロバイダー・モデルの変更 | 変更時 | endpointが変わるなら「APIキーの再入力が必要です」を表示し、入力があるまで保存を無効化(→ 07b) |
| 管理アプリのゲストスペース | アプリ選択時 | 対象アプリと管理アプリのゲストスペースが違うとき「ゲストスペースのアプリからは、同じゲストスペース内の管理アプリしか参照できません」 |
| 管理アプリが自分自身 | アプリ選択時 | `assetAppId === 現在のアプリID` なら警告(自分のコードで自分の管理画面を壊せる) |

## 6. 「接続を確認」ボタン

設定ミスは運用での最大の躓きどころなので、設定画面から実際に一度APIを叩いて確認できるようにする。

1. アセット管理アプリから1件だけレコードを取得(`limit 1`)し、指定フィールドがすべて存在するか検査
2. AIプロバイダーに**ツールを1つ渡した**最小のリクエストを1回投げ、認証が通るか・ツール呼び出しに対応したモデルかを検査
3. 結果を ✓ / ✗ で表示。✗ には原因と対処を1文で書く

接続確認は無料とは限らないこと、送信先、使用モデルを実行前に表示する。

> ### ⚠ 設定画面から `kintone.plugin.app.proxy` は呼べない
> 公式仕様の対象画面にプラグイン設定画面が含まれていない
> ([プラグインから外部APIを実行する](https://cybozu.dev/ja/kintone/docs/js-api/plugins/kintone-plug-in-proxy/))。
> そのため2の検査は、**保存済みの秘密ではなく入力欄のキーを使い、`kintone.proxy` で**行う。
> キーはメモリー上だけで扱い、`kintone.proxy` の呼び出し以外へ渡さない。
> `kintone.proxy` が設定画面で使えるかもP-1で実測する。使えない場合は接続確認を操作画面側の
> 「AI接続診断」へ移し、設定画面は形式検証だけを行う(→ [07b-ai-providers.md](./07b-ai-providers.md) 5章)。

保存の順序は **`setProxyConfig` → 旧endpointの無効化 → `setConfig`** とする。
`setConfig` はプラグイン一覧へ遷移するため、必ず最後に呼ぶ。
