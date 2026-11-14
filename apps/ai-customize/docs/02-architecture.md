# 02. アーキテクチャ

## 1. 全体像

```
┌─────────────────────────── kintone アプリ画面 (対象アプリ) ───────────────────────────┐
│                                                                                      │
│  ①  desktop.js (プラグイン)                                                          │
│      ├─ 同期: アセット管理アプリからの取得を開始(awaitしない)                      │
│      ├─ 同期: show系4イベントを kintone.events.on に登録(起動ゲート)                 │
│      ├─ show発火: 取得完了まで保留 → アセットを評価 → そのshowをアセットへ配信         │
│      └─ React: ランチャーボタンとパネルをマウント                                    │
│                                                                                      │
│  ②  適用されたアセット                                                               │
│      ├─ CSS → <style data-ai-customize-id="..."> を head に追加                       │
│      └─ JS  → new Function で評価。kintone ファサード(イベント・権限)と context を注入 │
│                                                                                      │
│  ③  ランチャー UI (React + MUI + emotion)                                            │
│      ├─ JS 一覧 / CSS 一覧 … タイトル・影響範囲・有効スイッチ                         │
│      └─ チャットパネル … AI 対話 + ツール実行 + 承認ダイアログ                       │
│                                                                                      │
└──────────────────┬───────────────────────────────────────┬───────────────────────────┘
                   │ kintone REST API                      │ kintone.plugin.app.proxy
                   │ (@konomi-app/kintone-utilities)        │ (@konomi-app/ketch)
                   ▼                                       ▼
      ┌─────────────────────────────┐        ┌──────────────────────────────┐
      │  アセット管理アプリ          │        │  AI SDK 6 + プロバイダ (BYOK) │
      │  (kintone アプリ)            │        │  OpenAI / Anthropic / Gemini  │
      │  1レコード = 1アセット       │        │  / OpenRouter / Azure / 互換  │
      └─────────────────────────────┘        └──────────────────────────────┘
```

## 2. レイヤ構成

| レイヤ | 置き場所 | 責務 | 依存してよいもの |
| --- | --- | --- | --- |
| **schema** | `src/schema/` | zodスキーマと型定義のみ。副作用なし | zod |
| **lib(純粋)** | `src/lib/*.ts` | 変換・判定・整形。DOMもネットワークも触らない。**単体テスト必須** | schema |
| **lib(I/O)** | `src/lib/*-repository.ts` ほか | kintone REST / DOM / localStorage / AI API | schema, lib(純粋) |
| **states** | `src/desktop/states/`, `src/desktop/public-state.ts` | jotai atom。UIとI/Oの接続点 | lib 全般 |
| **components** | `src/desktop/components/` | 描画のみ。ロジックはatomかlibへ | states |
| **config** | `src/config/` | 設定画面。`@repo/plugin/react` の共通ストアに準拠 | schema, lib(純粋) |

判断基準: **「テストを書きたくなったコードは `lib` の純粋関数に置く」**。既存プラグイン(`apps/tab`)と同じ方針。

## 3. ディレクトリ構成(実装時)

```
apps/ai-customize/
├── docs/                              # 本ドキュメント
├── plugin.config.mjs                  # manifest / dev server port: 6329
├── package.json
├── tsconfig.json
└── src/
    ├── schema/
    │   ├── plugin-config.ts           # プラグイン設定(バージョン付き)
    │   ├── asset.ts                   # Asset / AssetKind / AssetScope
    │   └── ai.ts                      # 表示・永続化するチャット型
    ├── lib/
    │   ├── global.ts                  # PLUGIN_ID / GUEST_SPACE_ID / LOGIN_USER / isProd
    │   ├── constants.ts               # ID・キー・上限値
    │   ├── i18n.ts                    # 翻訳
    │   ├── event-manager.ts           # createPluginEventManager (@repo/plugin)
    │   ├── plugin.ts                  # 設定の復元・移行・既定値・検証
    │   ├── browser.ts                 # ketch(プロキシfetch)
    │   ├── asset-mapper.ts            # ★純粋: レコード <-> Asset 相互変換
    │   ├── asset-query.ts             # ★純粋: kintoneクエリ文字列の組み立て
    │   ├── asset-filter.ts            # ★純粋: 適用対象の絞り込み・並び替え
    │   ├── asset-repository.ts        # I/O: 取得・作成・更新・削除
    │   ├── local-mute.ts              # ★純粋+localStorage: ローカル無効化
    │   ├── safe-mode.ts               # ★純粋: セーフモード判定
    │   ├── permission.ts              # ★純粋: 公開可否・編集可否の判定
    │   ├── injector.ts                # I/O: <style> の適用・解除
    │   ├── runner.ts                  # I/O: JSの評価とエラー隔離
    │   ├── event-bridge.ts            # 持ち主つきイベントバス(show以外は遅延native登録)
    │   ├── launch-gate.ts             # 起動ゲート(画面種別ごとの初回showで保留)
    │   ├── asset-kintone.ts           # アセットへ渡す kintone ファサード
    │   ├── kintone-request-classifier.ts # ★純粋: REST呼び出し → 必要な権限
    │   ├── capability-detector.ts     # ★純粋: 権限の使用箇所・迂回パターンの静的検出
    │   ├── code-validator.ts          # ★純粋: 構文チェック・危険パターン(警告)検出
    │   ├── hash.ts                    # ★純粋: コードのハッシュ(差分判定用)
    │   └── ai/
    │       ├── agent.ts               # ToolLoopAgent の生成
    │       ├── proxy-fetch.ts         # ketch + endpoint完全一致検証
    │       ├── provider-factory.ts    # 設定 → AI SDK LanguageModel
    │       ├── model-presets.ts       # プロバイダごとのモデル候補
    │       ├── prompt.ts              # ★純粋: システムプロンプト組み立て
    │       ├── tools.ts               # Zod inputSchema + 型付きexecute/承認
    │       ├── tool-handlers.ts       # I/O: ツールの実処理
    │       └── conversation.ts        # 表示用/保存用メッセージへの変換
    ├── desktop/
    │   ├── index.ts                   # エントリ。global を読み、bootstrap を呼ぶ
    │   ├── bootstrap.ts               # 同期の起動処理(取得開始・showの登録・ランチャー予約)
    │   ├── event.tsx                  # kintoneイベント購読・React マウント
    │   ├── render.ts                  # ルート要素の生成(apps/tab の render.ts に準拠)
    │   ├── public-state.ts            # 外部公開する atom
    │   ├── states/
    │   │   ├── launcher.ts            # 開閉・選択中メニュー
    │   │   ├── assets.ts              # アセット一覧・更新・スイッチ
    │   │   └── chat.ts                # メッセージ・ツール実行・承認待ち
    │   └── components/
    │       ├── index.tsx              # App
    │       ├── error-boundary.tsx
    │       ├── launcher-button.tsx
    │       ├── launcher-menu.tsx
    │       ├── asset-list.tsx
    │       ├── asset-row.tsx
    │       ├── asset-detail.tsx       # コード閲覧・手動編集
    │       ├── chat-panel.tsx
    │       ├── chat-message.tsx
    │       ├── tool-call-card.tsx     # ツール実行の可視化
    │       └── approval-dialog.tsx    # 書き込み承認 + 差分表示
    ├── config/
    │   ├── index.ts / main.tsx / app.tsx
    │   ├── states/{plugin,kintone}.ts
    │   └── components/model/{sidebar,footer,form/*}.tsx
    ├── contents/{config.html,icon.png}
    └── styles/{desktop.css,config.css}
```

★ = 単体テスト対象。`*.test.ts` を同階層に置く(既存プラグインと同じ)。

## 4. 起動シーケンス

```text
desktop.js 読み込み(同期)
  │
  ├─ 1. global.ts 評価 … PLUGIN_ID / LOGIN_USER / GUEST_SPACE_ID
  │
  ├─ 2. bootstrap.ts (すべて同期)
  │      ├─ セーフモード判定 → 有効なら 2-b / 2-c をスキップ
  │      ├─ 2-a. ランチャーの描画予約(アセットの結果に依存させない)
  │      ├─ 2-b. asset-repository で有効なアセットの取得を開始(await しない)
  │      └─ 2-c. launch-gate が show系4イベントへ native handler を登録
  │
  ├─ 3. kintone が app.record.<screen>.show を発火
  │      ├─ その画面種別で初回 → Promise を返して取得完了を待つ(上限あり)
  │      │    ├─ CSS を <style> で適用(画面に合わせて有効/無効を切り替え)
  │      │    ├─ JS を評価(kintone ファサードと context を注入)
  │      │    │    └─ アセットの kintone.events.on は event-bridge へ。
  │      │    │       submit / change などはここで exact type の native handler を遅延登録
  │      │    └─ ブリッジで現在の show をアセットへ配信し、最終の event を返す
  │      └─ 2回目以降 → ブリッジへ配信するだけ(購読者0件なら同期で event を返す)
  │
  └─ 4. パネルを開いたとき: 無効なものを含む全件と権限情報を取得(JSは再評価しない)
```

方式の詳細は [05-runtime.md](./05-runtime.md)、同期キャッシュから切り替えた経緯は
[13-launch-gate-and-permissions.md](./13-launch-gate-and-permissions.md) を参照。

## 5. 依存パッケージ

`apps/tab` / `apps/ai-chat` の構成に合わせる。**catalogへ新しい依存を追加しない。**
`pnpm-workspace.yaml` は `catalogMode: strict` で運用しており、catalogへ登録した依存は
全アプリが `catalog:` で参照しなければならない。`ai` / `@mui/*` / `zod` / `@dnd-kit/*` / `nanoid` /
`notistack` / `@emotion/*` はcatalogに無く、`apps/ai-chat` と `apps/tab` が各自レンジで宣言している。
ここへ新規登録すると既存アプリ全ての `package.json` を書き換える必要が生じる。

| 依存の種類 | 書き方 |
| --- | --- |
| catalog登録済み(`react` / `jotai` / `@konomi-app/*` / `typescript` ほか) | **必ず `catalog:`**。レンジ直書きは更新時に `VERSION_MISMATCH` で落ちる |
| catalog未登録の外部依存 | `apps/ai-chat` / `apps/tab` と**同じレンジを直書き**する。catalogへ追加しない |
| workspace内パッケージ | `workspace:*` |

| 依存 | 用途 |
| --- | --- |
| `@konomi-app/kintone-utilities` (catalog) | REST API、`restorePluginConfig`、`detectGuestSpaceId`、`getRecordACLEvaluate` ほか |
| `@konomi-app/kintone-utilities-react` (catalog) | 設定画面のフォーム部品(`JotaiAppSelect` / `JotaiFieldSelect`) |
| `@konomi-app/kintone-utilities-jotai` (catalog) | kintoneメタ情報のatom |
| `@konomi-app/ketch` (catalog) | `kintone.plugin.app.proxy` 経由のfetch |
| `ai` (`^6.0.70` / ai-chatと同じ) | `ToolLoopAgent`、型付きツール、承認、ループ制御、テスト用モデル |
| `@ai-sdk/openai` ほか(`^3.0.x`。ai-chatは `@ai-sdk/openai@^3.0.25` を使用) | プロバイダー固有プロトコル。選択したものだけ動的import |
| `@repo/plugin` / `@repo/plugin/react` | イベントマネージャ、設定画面の共通ストア・サイドバー・フッター |
| `@repo/jotai` | 共有store、kintoneのatom |
| `@repo/ui` / `@repo/utils` / `@repo/constants` | UI部品・翻訳基盤・URL定数 |
| `@dnd-kit/core` / `sortable` / `modifiers` / `utilities` (ai-chatと同じレンジ) | 実行順のドラッグ並べ替え |
| `jotai` / `jotai-optics` / `immer` (catalog) | 状態管理 |
| `@mui/material` / `@mui/icons-material` / `@emotion/*` (`^7.3.x` / `^11.14.x`) | 操作画面UI |
| `zod` (`^4.3.6`) | スキーマ検証 |
| `nanoid` (`^5.1.7`) | ID採番 |
| JSトークナイザー(候補: `acorn` の tokenizer。P1で選定) | 権限の使用箇所・迂回パターンの静的検出(`capability-detector.ts`)。起動時にも使うため初期チャンクに入る。サイズを実測して決める |

AI呼び出しは **AI SDK 6 + 公式プロバイダーパッケージ**を使い、custom `fetch` として `ketch` を渡す。
ストリーミングを使わなくても、ツール入力検証、承認、会話形式、終了理由、使用量、プロバイダー差分を
自前実装しない価値が大きい。プロバイダーは動的importし、初期チャンクの肥大を避ける
(→ [07b-ai-providers.md](./07b-ai-providers.md))。

チャットパネル、AI SDK、選択中プロバイダーは **動的import** し、チャットを開くまで読み込まない。

## 6. 境界の不変条件

実装を分割しても、次の検証は各I/O関数の入口で必ず行う。UIで非表示にするだけでは代替できない。

- 対象アプリは `(guestSpaceId, appId)` の組で識別する。アプリIDだけで判定しない。
- `read/update/delete` は取得したレコードの対象座標、所有者、scope、レコードACLを再検証する。
- create時の対象座標と所有者はAIの引数から受け取らず、実行コンテキストから強制設定する。
- アセットのコード本文を端末(localStorage / sessionStorage)へ保存しない。ミュートとセーフモードのキーには対象座標とログインユーザーを含める。
- アセットの `kintone.api` / `kintone.proxy` は、ファサードでアセットの権限を判定してから本物へ渡す。判定は呼び出しごとに現在の権限で行う。
- DOMをAIへ送る前に、テキストノードと値を持ちうる属性を除去する。
- 書き込みは常に承認を要求し、承認後にもrevisionと権限を再検証する。

## 7. スタイリング方針

リポジトリの規約(`rad:` プレフィックス + preflightなし)に従う。ただし**kintoneのDOM内へ差し込むUIでは Tailwind の `rad:` プレフィックスが効かない**ため、ランチャー・パネルは以下で組む。

- ルート要素に `id={PLUGIN_ROOT_ID}` と `class="🐸"` を付け、そこを起点に詳細度を確保する(`apps/tab/src/desktop/render.ts` と同じ)。
- コンポーネントのスタイルは emotion(`@emotion/styled`)で書く。`apps/ai-butler` の `floating-button.tsx` が参考になる。
- z-indexは `src/lib/constants.ts` に定数化し、実機でkintoneのdialogや固定UIとの重なりを確認する。最大値付近を安易に使わない。
