# 10. 実装計画

## 0. 進捗(2026-10-23)

| Phase | 状態 |
| --- | --- |
| P-1 | **未実施**。実機での確認前に、利用者の判断でP0〜P2へ着手した。P-1は**リリース前の必須ゲート**として残す。結果で定数(`GATE_TIMEOUT_MS`など)と挙動を見直す |
| P0 | 完了(`plugin build`まで)。未了: 署名鍵の生成とzip化(リリース担当者)、**CDN配信先 `kintone-plugin-admin/assets-pages/public/ai-customize/` の用意**(本番配信に関わるため、リリース判断と合わせて行う) |
| P1 | 完了。起動ゲート・イベントブリッジ・`kintone`ファサード・権限の強制・静的検出(迂回パターン、JSの外部リソース読み込み)・CSS注入・セーフモード・ローカル無効化。単体 + 起動処理の結合テスト |
| P2 | 完了(手動テストS2・S4-2・S6は実機で未実施)。ランチャー・メニュー・パネル・JS / CSS一覧・有効スイッチ・ドラッグでの並べ替え・詳細(影響範囲の変更・権限スイッチ・外部通信の3択と通信先の編集・コード編集・複製・削除)・`permission.ts`(公開権限。管理者判定はADR-43)。CSSのプレビューはP4、「AIに相談」はP3 |
| P5の一部 | 設定画面のうち、管理アプリ・フィールド・選択肢の値の対応付けと検証、AI(プロバイダ・モデル・APIキー・レコード送信・往復の上限・出力の上限・temperature・追加指示)。`publishAllowed*` / `chatAllowed*` はスキーマと操作画面の判定まで(入力欄は未実装で、現状は常に「アプリ管理者のみ」。設定画面には内容だけを表示) |
| P3 | 完了(手動テストS7は実機で未実施)。AI SDK 7(`ai@7.0.148`)で、読み取りツール1〜8・送信前の承認・承認をまたぐstep管理・中断とタイムアウト・往復ごとの表示。設定画面にAI(プロバイダ・モデル・APIキーのproxy登録)を前倒しで追加 |
| P4 | 未着手 |

## 1. フェーズ

各フェーズの終わりで動くものができ、次のフェーズに進める状態にする。

| Phase | 目的 | 完了の定義 |
| --- | --- | --- |
| **P-1** | 実機スパイク | event bridge、プロキシ、CSP、管理アプリ権限を最小コードで検証し、結果を記録する |
| **P0** | 足場 | プラグインが空のまま `pnpm build` を通り、kintoneに入れられる |
| **P1** | アセットの実行 | 手でレコードを作れば、JS/CSSが対象アプリで動く。セーフモードが効く |
| **P2** | ランチャーと一覧 | 右下から一覧を開け、スイッチで有効・無効を切り替えられる |
| **P3** | チャット(読み取り) | AIと会話でき、読み取り系ツールが動く。コードは提案されるだけ |
| **P4** | チャット(書き込み) | 承認フロー付きで登録・更新・削除ができる |
| **P5** | 仕上げ | 設定画面の検証、i18n、エラー体験、ドキュメント |

**P1 と P2 だけでも単体で価値がある**(手書きのカスタマイズを管理する仕組みとして使える)。
AIが期待通りに動かなくてもここまでは出せる、という順序にしてある。

P-1が完了するまで本実装へ進まない。特に `new Function` の本番CSP、起動ゲート(showでPromiseを返したときの実機挙動と待ち時間)、
`kintone` ファサード、exact changeイベント、proxyの中断/timeout、publicレコードのACLは文書だけでは確定できない。

## 2. タスク分解

### P-1: 実機スパイク(実装ゲート)

- [ ] **起動ゲート**: PC版show系4イベントでPromiseを返し、保留中に取得したアセットの返却event(値の上書き・disabled)が
      初回表示で反映されることを確認する(2018年のフォーラム投稿にある「Thenable不可」エラーが出ないこと)
- [ ] ゲート保留中の画面の挙動(追加・編集画面で入力できるか、入力が返却eventで上書きされるか、他プラグインのshowが待つか)を記録する
- [ ] ゲート待ち時間 p50/p95 を 一覧・詳細・追加・編集 × Chrome / Firefox / Safari × 低速回線・低スペック端末で測る
- [ ] 詳細⇄編集のページ内遷移、ページ送りで、画面種別ごとのゲートと `<style>` の切り替えが正しく動く
- [ ] 同期登録のshow + 遅延登録のsubmit・exact changeのbridgeが、event / Promise / falseをkintoneへ返せる
- [ ] `kintone` ファサード(プロパティを写したオブジェクト)越しに `api` / `api.url` / `events.on` / `Promise` / `app.record.*` が本物と同じに動く
- [ ] 書き込み権限の無いアセットで、`fetch` 直接のPOST/PUT/DELETEがCSRFトークン不足で失敗することを確認する
- [ ] `kintone.proxy` がリダイレクト(3xx)をサーバー側で追従するかを確認する(外部通信の通信先制御が最初の送信先までに限られるかどうか)
- [ ] 本番ビルドの `new Function` が対応ブラウザーとkintone CSPで動く
- [ ] `setProxyConfig` の前方一致、保存済み認証headerによるsentinel上書き、3xx、**実測timeout**を確認する
      (Abortは実測不要。`ketch@0.4.0` が `signal` を読まないことはソースで確定済み)
- [ ] **`kintone.proxy` がプラグイン設定画面で使えるか**を確認する。使えないなら接続確認を操作画面へ移す
      (`kintone.plugin.app.proxy` が設定画面で使えないことは公式仕様で確定済み)
- [ ] `ketch`へRequestを直接渡さずURL + RequestInitへ展開したとき、method/header/bodyが各providerで保持されることを確認する
- [ ] 各providerの実endpointを記録し、`buildProxyEndpoint` のテーブルを確定する(Googleはmodel、Azureはdeploymentで変わる)
- [ ] `getRecordACLEvaluate` がフィールド単位の `editable` を返すこと、推奨ACL構成での値を実測する
- [ ] ゲストスペースの対象アプリから、別スペースの管理アプリを読めないことを確認する(管理アプリ分割の根拠)
- [ ] private/public別のレコードACL・フィールドACLをテンプレートで再現し、REST API直接更新も拒否される
- [ ] 通常/ゲストスペースの同一app ID fixtureで対象座標の分離を確認する
- [ ] 100件、1コード128KiB、有効コード合計2MiBの取得・構文検査・評価の所要時間を測り、上限値を確定する
- [ ] 結果を [12-preimplementation-review.md](./12-preimplementation-review.md) の検証表へ追記する

### P0: 足場

- [x] `apps/ai-customize/` を `apps/tab` を雛形に作成(`package.json` / `tsconfig.json` / `plugin.config.mjs`)
  - `plugin.config.mjs`: `key = 'ai-customize'`、`port: 6329`(既存27ポートと未衝突を確認済み)、`version: '1.0.0'`
  - manifest の `name` / `description` を8言語ぶん記述。v1ではmobile bundleを登録しない
  - **catalogへ新規登録しない。** catalog未登録の依存は `apps/ai-chat` / `apps/tab` と同じレンジを直書きする
    (`catalogMode: strict` のため、catalogへ入れると全アプリの書き換えが必要になる → [02](./02-architecture.md) 5章)
- [ ] **配信先の確保**: prod manifestは `https://kintone-plugin.konomi.app/ai-customize/{desktop,config}.{js,css}` を指す。
      この実体は別リポジトリ(`kintone-plugin-admin/assets-pages/public/`)にあり、**`ai-customize/` を先に作らないと
      本番プラグインは何も読み込めない**。P0のうちに空ディレクトリと配信経路を用意し、P5のリリース手順に組み込む
- [x] `src/lib/{global,constants,i18n}.ts`(`event-manager.ts` は不要だったため作らない。イベントは起動ゲートとブリッジが登録する)
- [x] `src/contents/{config.html,icon.png}`、`src/styles/{desktop,config}.css`
- [x] `src/schema/plugin-config.ts`(→ 03)、`src/lib/plugin.ts`(復元・移行・既定値)
- [x] 空の `src/desktop/index.ts` と `src/config/` で `pnpm build` / `pnpm check-types` を通す

### P1: アセットの実行

- [x] `src/schema/asset.ts`
- [x] `src/lib/asset-mapper.ts` + テスト
- [x] `src/lib/asset-query.ts` + テスト
- [x] `src/lib/asset-filter.ts` + テスト ← **最初にテストを書く**
- [x] セーフモードの判定 + テスト(`src/lib/browser-storage.ts` の `isSafeMode` / `buildSafeModeUrl`)
- [x] ローカル無効化 + テスト(`src/lib/browser-storage.ts` の `readMutedIds` / `writeMutedIds`)
- [x] ~~`src/lib/hash.ts`~~ 同期キャッシュの廃止(ADR-33)で差分判定が不要になったため作らない
- [x] `src/lib/kintone-request-classifier.ts`(`classifyKintoneRequest`) + テスト ← **最初にテストを書く**
- [x] `src/lib/capability-detector.ts`(`detectCapabilityUsage`) + テスト
- [x] `src/lib/external-target.ts`(`normalizeExternalPattern` / `matchExternalTarget`) + テスト ← **最初にテストを書く**
- [x] `src/lib/event-bridge.ts` + テスト(持ち主つき登録、show以外の遅延native登録、適用画面での配信フィルタ、返却event/Promiseの合成)
- [x] `src/lib/asset-kintone.ts`(ファサード: events / api / proxy / plugin.app.proxy / getRequestToken) + テスト
- [x] `src/lib/launch-gate.ts`(画面種別ごとのゲート、タイムアウト、遅延到着時の扱い) + テスト
- [x] `src/lib/injector.ts`(CSS注入)
- [x] `src/lib/runner.ts`(JS評価・sourceURL・迂回パターンの実行規則・エラー隔離・サーキットブレーカー)
- [x] `src/lib/asset-repository.ts`(取得のみ)
- [x] 100件、1コード128KiB、有効コード合計2MiBのfail-closed上限とエラー表示
- [x] `src/desktop/bootstrap.ts`(取得開始・showの同期登録)、`src/desktop/runtime.ts`、`src/desktop/index.ts`(`event.tsx` は不要)
- [ ] 手動テスト S1(設定なしで壊れないこと)、S4、S5、S12

### P2: ランチャーと一覧

- [x] `src/desktop/launcher/mount.tsx`(`apps/tab` の `render.ts` に準拠。`ComponentManager` は使わない = バンドル肥大回避)。描画は `bootstrap()` の戻り値で `index.ts` が行い、起動ゲートをUIに依存させない
- [x] 判定の純粋関数 + テスト: `asset-access.ts`(フィールド単位の編集可否)、`asset-toggle.ts`(スイッチの操作)、`asset-panel.ts`(一覧の行)、`asset-usage.ts`(詳細の使用箇所)、`launcher-status.ts`(起動ボタンのバッジ)、`relative-time.ts`
- [x] `src/desktop/launcher/services.ts`(一覧の取得・状態の更新・アクセス権・ローカル無効化・sessionStorageの窓口)
- [x] `src/desktop/states/launcher.ts`(パネル・一覧・切り替えの状態を1つにまとめた) + テスト
- [x] `src/lib/permission.ts` + テスト(`canPublish`。`canChat`はP3で同じ`isAllowedViewer`を使う)
- [x] `components/{launcher,launcher-button,launcher-menu,panel,status-banner}.tsx`(ホットゾーンは採用しない。06の2章)
- [x] `components/{asset-list,asset-row,asset-detail,code-view}.tsx`(詳細は読み取り専用。編集は管理アプリのレコードから)
- [x] `asset-repository` に `status` の更新を追加(revisionの楽観ロック、競合時は一覧を取り直す)
- [x] `asset-repository` に任意項目の更新(`updateAssetFields`)・実行順の一括更新・削除・追加を追加(いずれもrevisionつき)
- [x] `getRecordACLEvaluate` による編集可否判定とキャッシュ
- [x] 有効スイッチ(レコード更新 / ローカル無効化のフォールバック)
- [x] 権限チップ、詳細での使用箇所の表示、拒否の記録(同じ内容をまとめて件数表示)
- [x] 権限スイッチ(付与時の確認)、外部通信の3択と通信先の一覧編集(→ [06](./06-ui.md))。変更はこのタブのファサードへ即時反映
- [x] 影響範囲の変更(`canPublish`)、詳細でのコード編集・複製・削除
- [x] `src/lib/asset-order.ts`(並べ替え後の採番) + テスト
- [x] 実行順のドラッグ並べ替え(`@dnd-kit`。`updateAllRecords` で一括更新、楽観的更新、権限による無効化)
- [x] JS有効化時の「再読み込みが必要」導線
- [ ] 手動テスト S2の1〜6(手書きCSSで)、S4-2、S6

### P3: チャット(読み取り)

- [x] `src/lib/ai/proxy-fetch.ts`(endpoint完全一致・中断・タイムアウト・ketchの異常応答・sentinelヘッダーの除去) + テスト(実ketchを通す契約テストを含む)
- [x] `ai@7` の `ToolLoopAgent` と公式provider packages `@ai-sdk/*` を追加(`minimumReleaseAge` を満たす版を下限にする)
- [x] 最初に `MockLanguageModelV4` で承認要求 → `tool-approval-response` による再開 → `prepareCall` 経由の `toolsContext` の上書き、の契約テスト(`sdk-contract.test.ts`)
- [x] `provider-factory.ts` + `endpoint.ts`(送信先の算出・正規化・認証ヘッダー)。実際の送信先と算出結果の一致を全providerでテスト。providerは動的import。`model-presets.ts`(候補補完)は未実装
- [x] AI SDKエラーから表示用判別共用体への変換 + テスト
- [x] `src/lib/ai/prompt.ts` + テスト
- [x] `src/lib/ai/tools.ts`(読み取り系1〜8。`tool-handlers.ts`には分けず、入出力は`ChatToolServices`で受ける) + テスト
- [x] `get_record_sample` / `read_asset` の送信前承認(承認前は値を取得しない)。承認カード(`components/chat/approval-card.tsx`)
- [x] `tool-approval-response` による再開と、承認をまたいだ累積step管理。承認の応答は再開が成功してから履歴へ(ADR-44)
- [x] `src/lib/ai/agent.ts`(`ToolLoopAgent` + step上限 + 承認は許可リスト以外全て。ADR-45)。**ストリーミングは使わない**
- [x] `src/lib/ai/chat-session.ts`(状態遷移の純粋関数) + `src/desktop/states/chat.ts`
- [x] `components/chat/{chat-panel,chat-message,tool-call-card,approval-card}.tsx`
- [x] 生成中の経過時間表示と、往復ごとのツールカード(`onStepEnd`。表示だけ)
- [x] `ai`とプロバイダーの評価をチャットの開始まで遅らせる(配布は1ファイル。ADR-47)
- [x] コンテキスト表示(対象アプリ・画面・レコード送信の有無・送信先)と「AIに送信される情報」
- [x] 設定画面のAI(前倒し。APIキーはproxy設定へ。保存済みの送信先を基準に再入力を求め、別ホストへの登録は確認。インポートで登録を消す)
- [ ] 手動テスト S7

### P4: チャット(書き込み)

- [ ] `src/lib/code-validator.ts` + テスト
- [ ] `tool-handlers.ts` の書き込み系(9〜12)と検証(構文・危険パターン・迂回パターン・宣言した権限と使用状況の一致・文字数・権限・revision)
- [ ] `components/approval-dialog.tsx` に書き込み用の差分表示・影響範囲の最終決定・プレビューを追加
- [ ] 再開時の `options` → `prepareCall` → `toolsContext` による承認上書き(`scope` / `enableAfterSave` / `order` / `screens`)と、
      適用結果をツール結果へ載せる処理
- [ ] `preview_css`(CSSのみ。解除UIと画面遷移時の自動破棄を含む。JSは無効で保存してレビュー)
- [ ] `src/lib/ai/conversation.ts`(保存用/送信用の整形) + テスト
- [ ] `conversation` フィールドへの対話ログ保存と復元。**`savesConversation` が有効なときだけ**
- [ ] 手動テスト S8
- [ ] 全書き込みの承認と、承認後の権限/revision再検証
- [ ] 手動テスト S2 全体、S3

### P5: 仕上げ

- [ ] 設定画面のフォーム一式(→ 03 の6ブロック)
- [ ] 設定画面の検証と「接続を確認」ボタン
- [ ] APIキーのプロキシ設定への保存
- [ ] i18n(ja / en)の網羅。文言の直書きが残っていないか確認
- [ ] エラー体験の総点検(設定不備・権限なし・AI失敗・アセット失敗)
- [ ] `docs/templates/asset-app.json`(管理アプリのフィールド定義)。**自動作成機能は作らない**(方針決定済み)
- [ ] アイコン(`icon.png`)
- [ ] 手動テスト全シナリオ
- [ ] `code-reviewer` / `security-reviewer` によるレビュー
- [ ] [08-security.md](./08-security.md) の導入前チェックリストを埋める

## 3. 見積もりの目安

| Phase | 規模感 |
| --- | --- |
| P-1 | 中(実機検証。後戻り防止のため省略不可) |
| P0 | 小 |
| P1 | **大**(このプラグインの核。起動ゲート・イベントブリッジ・ファサードが難所) |
| P2 | 中 |
| P3 | 中〜大(AI SDK統合、プロキシ境界、型付きツール) |
| P4 | 中〜大(承認UIと検証) |
| P5 | 中 |

## 4. 実装時の注意

### リポジトリ規約

- **依存のバージョンは `catalog:` を使う**。catalog登録済みの依存にレンジを直書きすると更新時に落ちる。
- `jotai` は `@repo/jotai` 経由でimportする。`apps/*` から `jotai` を直接importしない。
- Tailwind は desktop 側で `rad:` プレフィックス + preflight なし。ただし**kintoneのDOMへ差し込むUIには効かない**ため、ランチャーとパネルは emotion で書く(→ 02)。
- `node_modules` 経由の `@repo/*` のクラスを使う場合は `@source` の明示が必要。
- `ComponentManager`(`@konomi-app/kintone-utilities-react`)は操作画面で使わない。約760KB増える。`apps/tab/src/desktop/render.ts` の自前実装を写す。

### 設計上、手を抜いてはいけない点

1. **`shouldApply` のテスト**。ここが漏れると情報漏洩になる。
2. **セーフモードがアセットの実行結果に依存しないこと**。起動順序を守る。
3. **JSの再実行をしないこと**。差分検知は通知にとどめる。
4. **公開権限の既定値**。未設定 = 管理者のみ。
5. **対象を `(guestSpaceId, appId)` で照合し、ID入力ツールを毎回認可すること**。
6. **APIキーを通常設定に書かず、proxy endpointを完全一致で制限すること**。
7. **書き込みを常に承認し、承認後に権限とrevisionを再検証すること**。
8. **対話ログへDOM・レコード・コードの生ツール出力を保存しないこと**。
9. **起動ゲートは必ずeventを返し、タイムアウトを持つこと**。ここは全ユーザーの全画面のクリティカルパスである。
10. **承認の再開をAI SDKの `tool-approval-response` に任せ、承認画面と実際に保存される内容を一致させること**。
11. **権限の判定をパスとbodyで行うこと**。メソッドだけで判定すると `bulkRequest` 経由の削除を通す。

### 参考にする既存実装

| やりたいこと | 参照先 |
| --- | --- |
| プラグイン設定の復元・移行 | `apps/tab/src/lib/plugin.ts` |
| バージョン付きスキーマ | `apps/tab/src/schema/plugin-config.ts` |
| 軽量な描画先管理 | `apps/tab/src/desktop/render.ts` |
| 右下フローティングボタン | `apps/ai-butler/src/desktop/components/floating-button.tsx` |
| AIクライアント + ketch | `apps/ai-chat/src/lib/ai.ts`, `apps/ai-butler/src/lib/ai.ts` |
| AI SDK + custom fetch | `apps/ai-chat/package.json`, `apps/ai-chat/src/lib/ai.ts`, `apps/ai-chat/src/lib/browser.ts` |
| `@dnd-kit` による並べ替え | `apps/if`, `apps/bridge`, `apps/my-theme` などの設定画面 |
| 設定画面の共通ストア | `packages/plugin/src/react/store.ts` |
| アプリ・フィールド選択UI | `apps/reference-table/src/config/components/model/form/index.tsx` |
| 所属情報の解決 | `apps/tab/src/desktop/public-state.ts` の `viewerAtom` |
| i18n | `apps/tab/src/lib/i18n.ts` |
