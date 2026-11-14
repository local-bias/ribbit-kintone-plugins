# 12. 実装前レビュー結果

調査日: 2026-09-09(第1回) / 2026-09-09(第2回・実コード照合) / 2026-09-25(第3回・起動方式と権限。詳細は [13](./13-launch-gate-and-permissions.md))

## 1. 結論

当初案の価値は維持できるが、そのまま実装するとイベント契約、AIツールの認可、guest space境界、
DOM送信、公開後の編集権限、プロキシ秘密の扱いで重大な穴があった。本レビューで設計へ反映し、
実機でしか確定できない項目をP-1の実装ゲートへ移した。

## 2. 解消した重要事項

| 重要度 | 問題 | 改善 |
| --- | --- | --- |
| Critical | レコードID指定ツールが別アプリ/他人のprivateを操作できる | 全read/update/deleteで対象座標・所有者・ACL・revisionを再認可 |
| Critical | app IDだけではguest space間で衝突する | `(guestSpaceId, appId)` を永続化・query・cache・認可の主キーにする |
| Critical | public化後も作成者がcodeを差し替えられるACL案 | `private AND creator` だけ一般編集可。publicは管理者だけ編集可 |
| High | changeイベントをワイルドカード登録できる前提 | 固定show/submit + `context.on` 時のexact change遅延登録 |
| High | show replayでevent変更も反映できるように見える | replayはDOM副作用だけと明記。event反映が必要なら再読み込み |
| High | submit handler例外時に保存を通す | 入力検証迂回を防ぐため保存を止め、safe modeを復旧経路にする |
| High | DOMの `outerHTML` が設定オフでも実データを含む | 生HTML廃止。allowlist属性の構造 + 文字種/長さへ変換 |
| High | 設定オンだけでAIがレコード値・既存コードを無確認送信 | `get_record_sample` / `read_asset` は対象を示して毎回承認。DOM本文はv1で送らない |
| High | 保存容量を理由にツール生出力を永続保存 | 生のDOM/record/codeを保存せず、要約・hash・承認判断だけ保存 |
| High | publicレコードへ会話本文を保存すると閲覧範囲が拡大 | publicは本文なしのaudit mode。private→public時にも不可逆削減 |
| High | proxy headerは取得不能という前提 | 設定画面では公式に取得可能。アプリ管理者を秘密の信頼境界へ含める |
| High | endpointを1本登録すれば悪用を防げるという前提 | proxyはURL前方一致。完全endpoint登録 + fetch完全一致検証 + AI側予算制限 |
| High | AI SDKはAPIキーを要求する一方、操作画面は秘密を取得しない | 非秘密sentinelを渡し、同名の保存済み認証headerで上書き。providerごとに実機検証 |
| High | `ketch`へ`Request`を渡せばfetch互換になるという前提 | URL + RequestInitへ明示展開し、method/header/body/abortの契約テストを追加 |
| High | 自動承認とJSプレビュー | v1から削除。JSは無効で保存・レビュー・有効化・再読み込み |
| Medium | stale cacheを無期限実行 | 24時間hard expiry、403/404即時破棄、設定fingerprint |
| Medium | 3種類のAIプロトコルを自前実装 | AI SDK 6 `ToolLoopAgent` と公式provider packagesへ置換 |
| Medium | 透明hot zoneがhover検知とクリック透過を両立しない | 常時見える最小button + 位置設定 + reduced motion |
| Medium | UIテストを全て省略 | 承認、権限、未保存、focus trapは統合テスト対象 |
| Medium | レコード数・コード量が無制限 | 100件 / 1コード128KiB / 有効コード合計2MiBでfail closed |

## 3. 一次資料から確定したこと

- kintoneのproxy設定は同一app/plugin/methodかつURL**前方一致**で付与される。
  [setProxyConfig](https://cybozu.dev/ja/kintone/docs/js-api/plugins/set-config-for-proxy/)
- plugin proxyの実行時headerと保存済みheaderでキーが重複すると、保存済み設定が優先される。
  [kintone.plugin.app.proxy](https://cybozu.dev/ja/kintone/docs/js-api/plugins/kintone-plug-in-proxy/)
- `getProxyConfig` はプラグイン設定画面で保存済みheaders/dataを返す。
  [getProxyConfig](https://cybozu.dev/ja/kintone/docs/js-api/plugins/get-config-for-proxy/)
- plugin proxyのレスポンス本文は文字列、上限10MB。公式ページにtimeout値は記載されていない。
  [kintone.plugin.app.proxy](https://cybozu.dev/ja/kintone/docs/js-api/plugins/kintone-plug-in-proxy/)
- changeイベントはフィールドコードを含むexact event type。Promise対応イベントはPromiseをreturnして待たせる。
  [イベント一覧](https://cybozu.dev/ja/kintone/docs/js-api/)、
  [イベント処理](https://cybozu.dev/ja/kintone/docs/js-api/events/event-handling/)
- 保存前イベントは `false` または `event.error` でキャンセルできる。
  [編集画面の保存前イベント](https://cybozu.dev/ja/kintone/docs/js-api/events/edit/edit-submit-event/)
- AI SDK 6は `ToolLoopAgent`、Zod入力、承認、step制御、custom fetch、mock modelを提供する。
  [Building Agents](https://ai-sdk.dev/docs/agents/building-agents)、
  [Tool Calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)、
  [Testing](https://ai-sdk.dev/docs/ai-sdk-core/testing)

## 4. P-1で未確認の項目

次は文書調査だけで「動く」と断定しない。結果とkintone環境、ブラウザー、確認日をこの表へ追記する。

| 状態 | 確認事項 | 合格条件 |
| --- | --- | --- |
| 未実施 | 本番CSPでの `new Function` | 対応全ブラウザーでproduction bundleが実行できる |
| 未実施 | event bridge | show/submit/change、event変更、Promise、false、複数handlerが仕様どおり |
| 未実施 | proxy timeout / Abort / 3xx | UI文言・上限・retry方針を決められる測定結果がある |
| 未実施 | provider認証 | sentinelが保存済みheaderで上書きされ、各providerへ正しいendpoint/bodyで届く |
| 未実施 | 条件付きレコード/フィールドACL | plugin UIと直接REST APIの双方で迂回できない |
| 未実施 | guest space分離 | 同一app IDでも相互取得・適用・更新がない |
| 未実施 | provider契約 | 対応6種で最小ツール呼び出しと承認再開が成功する |
| 未実施 | コード量上限 | 100件 / 128KiB / 2MiBで取得・検査・評価が許容時間内に終わり、超過時はfail closed |
| 未実施 | 起動ゲート | PC版show系4イベントでPromiseを返し、初回表示で返却eventが反映される。待ち時間p95が150ms以下。保留中の入力・他プラグインへの影響を記録 |
| 未実施 | kintoneファサード | ファサード(プロパティを写したオブジェクト)越しの `api` / `api.url` / `events.on` / `Promise` が本物と同じに動く |
| 未実施 | 権限の強制 | 権限の無いアセットの `kintone.api` 書き込み・`bulkRequest`・`proxy` が拒否され、`fetch` 直接の書き込みがCSRFトークン不足で失敗する |
| 未実施 | 外部通信のリダイレクト | `kintone.proxy` が3xxを追従するかを記録し、通信先制御の説明文を確定する |

## 4-2. 第2回レビュー(2026-09-09): 実装コードとの照合で見つかった穴

1回目は設計文書どうしの整合を見た。2回目は**リポジトリの実コードと、依存パッケージに実際に入っている実装**、
および一次資料の「対象画面」記述まで降りて確認した。文書だけでは見えなかった前提の誤りが出た。

| 重要度 | 問題 | 根拠 | 改善 |
| --- | --- | --- | --- |
| Critical | 設定画面の「接続を確認」が `kintone.plugin.app.proxy` を使う前提だった。**この関数は公式仕様の対象画面にプラグイン設定画面を含まない** | [公式](https://cybozu.dev/ja/kintone/docs/js-api/plugins/kintone-plug-in-proxy/) | 入力中のキー + `kintone.proxy` で確認。使えない場合は操作画面の「AI接続診断」へ移す(ADR-26) |
| Critical | 「移行 → 接続確認 → 旧endpoint削除」の手順が、設定画面で接続確認できないと成立しない | 上記 | 旧秘密の移行を実装せず、endpoint変更時はキー再入力(ADR-27) |
| High | 承認後にこちらでツールを実行し `tool` メッセージを組み立てる設計だった。AI SDK 6の承認は `tool-approval-request` / `tool-approval-response` という一級の仕組み | `ai@6.0.277` / `@ai-sdk/provider-utils@4.0.50` の型定義 | SDKの仕組みに乗せる。二重実装をやめる(ADR-25) |
| High | 承認カードで `scope` を上書きする設計だが、承認レスポンスは approve / deny の二値しか運べない | 同上 | 上書きは `experimental_context` で `execute` へ渡し、適用結果をツール結果でAIへ返す |
| High | `maxToolSteps` が承認のたびにリセットされ、上限として機能しない | `stopWhen` は `generate` 単位 | ユーザー発言単位で累積step数を数える |
| High | 「`ketch` がAbortSignalを伝播するかP-1で実測する」としていたが、**実装が `signal` を読まないことはソースで確定** | `@konomi-app/ketch@0.4.0` の実装 | wrapper側でraceして待機を止める。課金は止まらないと明示。timeoutも自前(既定90秒) |
| High | ゲストスペースでも1つの管理アプリを共有できる前提だった | ゲストユーザーは所属スペース外のアプリへアクセスできない | ゲストスペースごとに管理アプリを持つ(ADR-32) |
| High | 起動の同期処理に上限が無く、2MiBを同期でparse・compileしうる設計だった | — | 同期予算256KiB / 30件を新設し、実測で確定する(ADR-28) |
| High | `localStorage` のquota超過時の挙動が未定義。オリジンを他プラグインと共有している | — | 合計2MiB・対象座標10件のLRU eviction。起動時に別ユーザーのキーを削除(ADR-29) |
| High | 対話ログを `write_asset` 成功時に保存する設計。AIの締めの発言が入らない | — | Agentループ完了時に保存。失敗してもアセット登録は成功のまま |
| Medium | `set_asset_state` に `revision` が無く、有効化・公開・実行順の変更だけ楽観ロックが外れていた | — | `revision` を必須にし、`list_assets` の返り値へ含める |
| Medium | 有効スイッチ等の可否をレコード単位のACLだけで判定していた。推奨ACL構成では**フィールド単位**で禁止する | `evaluate.json` はフィールド単位の `editable` も返す | UI要素ごとに見るフィールドを定義(→ 06の表) |
| Medium | 並べ替えの `updateAllRecords` に `revision` を渡す指定が無かった | — | 各レコードにrevisionを付け、競合時は再取得 |
| Medium | 「外部依存はcatalogへ登録して `catalog:` を使う」としていたが、**リポジトリの実態と逆** | `pnpm-workspace.yaml`(`catalogMode: strict`)、`apps/ai-chat` / `apps/tab` の `package.json` | catalogへ追加しない。未登録の依存は既存アプリと同じレンジを直書き(ADR-30) |
| Medium | prod manifestが指すCDNパスの実体(別リポジトリ)を用意する作業が計画に無かった | `plugin.config.mjs` と `kintone-plugin-admin/assets-pages/public/` | P0に「配信先の確保」を追加 |
| Medium | `context.onCleanup` が呼ばれる経路がv1に無い | — | v1のcontextから外す(ADR-31) |
| Medium | ブリッジが購読者0件でも全ユーザーのsubmitへ割り込む | — | 購読者0件なら同期でeventをそのまま返し、submitは購読者がいるときだけnative登録する |
| Medium | プラグイン設定は「アプリ管理者だけが読める」と書いていた | `getConfig` は操作画面で全ユーザーが呼べる | 「このアプリを開ける全員に見える」前提へ修正 |
| Low | 承認要求のHMAC署名(`experimental_toolApprovalSecret`)を防壁と誤解しうる | クライアント完結のため秘密がバンドルに載る | 境界として数えないと明記 |
| Low | `ketch` の `new Response(body, {status})` が204や範囲外statusで例外を投げる | `ketch@0.4.0` の実装 | wrapperで捕捉してUI用エラーへ変換 |

### 一次資料から追加で確定したこと

- `kintone.plugin.app.proxy` の対象画面に**プラグイン設定画面は含まれない**。レスポンスヘッダーは100行・1行8,180バイト、
  本文は10MB・文字列のみ。実行時ヘッダーと保存済みヘッダーが重複した場合は保存済みが優先。
  [プラグインから外部APIを実行する](https://cybozu.dev/ja/kintone/docs/js-api/plugins/kintone-plug-in-proxy/)
- `records/acl/evaluate.json` は**レコードID100件まで**。必要権限はレコード閲覧または追加。APIトークン不可。
  レスポンスは `record` の viewable/editable/deletable に加え、**フィールド単位の viewable/editable** を返す。
  メンテナンスモード中は全て false。ゲストスペース対応。
  [APIを実行したユーザーのレコードのアクセス権の設定を取得する](https://cybozu.dev/ja/kintone/docs/rest-api/records/evaluate-record-permissions/)
- `ai@6.0.277` に `ToolLoopAgent`、`tool({ needsApproval })`、`tool-approval-request` / `tool-approval-response`、
  `MockLanguageModelV3`、`experimental_context`、`experimental_toolApprovalSecret` が実在する(型定義で確認)。
- `@konomi-app/kintone-utilities@6.3.0` に `getRecordACLEvaluate` / `updateAllRecords` / `getFormFields` /
  `getFormLayout` / `getViews` / `detectGuestSpaceId` / `restorePluginConfig` / `setPluginProxyConfig` が実在する。
  `getProxyConfig` のラッパーは無いため、`kintone.plugin.app.getProxyConfig(url, method)` を直接呼ぶ。

## 4-3. 第3回レビュー(2026-09-25): 起動方式の前提と、カスタマイズ単位の権限

第2回までは「同期キャッシュを前提に、その代償をどう抑えるか」を詰めていた。第3回は前提そのものを一次資料で見直した。

| 重要度 | 問題 | 根拠 | 改善 |
| --- | --- | --- | --- |
| High | 「同期でしか間に合わない」前提で、コード本文をlocalStorageへキャッシュしていた。同期が必要なのはハンドラの**登録**だけだった | PC版show系4イベントはすべてPromise対応([公式](https://cybozu.dev/ja/kintone/docs/js-api/events/event-object-actions/)) | 起動ゲートへ置換(ADR-33)。初回から正しいタイミングで動き、T7・T12が構造的に解消。同期予算・eviction・TTL・リプレイを削除 |
| High | 無効化・権限剥奪がキャッシュのTTL〜24時間まで反映されない | 旧05 2章 | 毎回最新を読むため、次の画面読み込みで必ず反映 |
| High | showリプレイは「DOM副作用は動くが返却eventは反映されない」という説明しにくい意味論だった | 旧05 3章 | ゲートの内側で評価するため不要。タイムアウト時はJSを動かさず明示する(ADR-35) |
| Medium | AIに独自API `context.on` を使わせるため、プロンプトで念押しが必要だった | — | アセットへ渡す `kintone` をファサードにし、標準の `kintone.events.on` で書けるようにした(ADR-34) |
| High | アセットが利用者の権限で何でもできる。AIの誤りによる書き込み・外部送信を止める手段が無い | — | カスタマイズ単位の権限(ADR-36)。GETは常時、POST/PUT/DELETE/外部通信は許可制 |
| High | 権限をHTTPメソッドだけで判定すると、`bulkRequest`(POST)経由の削除を通し、カーソル作成(POST)を止めてしまう | kintone REST APIの仕様 | パスとbodyで分類する(13 の 3-3章) |
| Medium | 権限を付けても `window.kintone` や `fetch` で迂回できるなら、表示が誤った安心を与える | — | 迂回パターンを静的検出し、「制限なし」が無いと実行しない(ADR-37)。セッション認証の書き込みに必要なCSRFトークンもファサードで渡さない |
| Medium | アセットJSから本プラグインのAI用proxyを呼べる(T11) | — | ファサードで `kintone.plugin.app.proxy` を常に拒否 |
| Medium | 外部通信が「全部許可か禁止か」の二択で、送信先が決まっている用途でも任意の送信先を許してしまう | — | 「指定先のみ」(URLパターンの列挙)と「すべて」を選べるようにした(ADR-39) |

却下した代替案(JSカスタマイズへの書き出し、プラグイン設定への格納)と理由は ADR-38。

## 5. 実装開始条件

- P-1の全項目(4章の表 + 4-2で追加した実測項目)が合格、または非対応としてscopeから明示的に外れている
- 接続確認の置き場所(ADR-26のどちらに倒すか)が実測で決まっている
- 起動ゲートの待ち時間とタイムアウト値(ADR-33)が実測で確定している
- CDN配信先(`kintone-plugin-admin/assets-pages/public/ai-customize/`)が用意されている
- 管理アプリテンプレートにprivate/publicのACLが含まれる
- `authorizeAssetOperation` と `classifyKintoneRequest` のテストを先に作成できる
- proxy用の専用APIキー、予算上限、利用監査の運用責任者が決まっている
- セーフモードURLとpublicアセットの承認/復旧手順を運用担当者が確認している

上記を満たさない状態ではP0以降へ進まない。
