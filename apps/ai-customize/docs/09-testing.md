# 09. テスト方針

## 1. 方針

- テストフレームワークは **vitest**(リポジトリ共通)。`pnpm test` = `vitest run`。
- `src/lib/` の純粋関数を主戦場にする。**判定を間違えると事故になる関数から順に書く**。
- 描画だけのUIはスナップショットテストしない。ただし承認、権限、未保存警告、dialogのfocus管理は
  セキュリティと操作結果に影響するため、Testing Libraryで統合テストする。
- カバレッジ率をリリース判定の代わりにしない。`src/lib/` 80%以上を目安としつつ、下記の境界ケースを必須にする。

## 2. 必ずテストする関数

優先度順。上3つは**事故に直結するため、実装より先にテストを書く**(TDD)。

### 最優先

| 対象 | ファイル | 観点 |
| --- | --- | --- |
| `shouldApply` | `lib/asset-filter.test.ts` | 影響範囲・所有者・画面・有効/無効・ミュート・セーフモードの全組み合わせ |
| `canPublish` / `canChat` | `lib/permission.test.ts` | 未設定時は双方とも管理者のみ、所属取得失敗時 |
| `authorizeAssetOperation` | `lib/asset-authorization.test.ts` | 別app/space、他人のprivate、public化、ACL取得失敗、承認後の権限変更 |
| `buildAssetQuery` | `lib/asset-query.test.ts` | app + guest space、選択肢値のエスケープ、`LOGINUSER()`、limit |
| `classifyKintoneRequest` | `lib/kintone-request-classifier.test.ts` | 13 の 3-3章の表を全行テストにする。絶対URL/相対パス/ゲストスペース形式/`.json`有無/query付き、カーソルのPOST・DELETEは読み取り、`bulkRequest` は中身の和集合(削除を含めば削除)、`file.json` は追加または更新、アプリ設定・未知パス・解釈不能URLは制限なし |
| `isGranted` | 同上 | 読み取りは常に可、`file.json` の「追加または更新」、制限なしは全て可、未知の権限値は無視 |
| `normalizeExternalPattern` | `lib/external-target.test.ts` | ホスト小文字化、punycode、既定ポート除去、`..` 解決、コメント・空行、クエリ/フラグメント/ユーザー情報/ワイルドカード/未対応スキームを無効にして理由を返す、`http:` は有効だが警告、50行・2KiB上限 |
| `matchExternalTarget` | 同上 | オリジン完全一致、ポート違い・スキーム違いは不一致、`api.example.com.evil.example` を通さない、`/v1` が `/v1/x` に一致し `/v10` に一致しない、`/v1/../admin` を正規化後に判定、相対URL・ユーザー情報付きURLは拒否、クエリは判定に使わない |
| 外部通信の設定の解釈 | `lib/asset-mapper.test.ts` | 指定先のみ + すべての両方選択は指定先のみへ倒す、通信先フィールド未対応付けは空リスト、制限なしは全て許可 |

`shouldApply` のテストは表駆動で全パターンを列挙する。

```ts
describe('shouldApply', () => {
  test.each([
    // scope,      owner,   loginUser, enabled, muted, safeMode, screen,   assetScreens,      expected
    ['private',   'sato',  'sato',    true,    false, false,    'detail', [],                true ],
    ['private',   'sato',  'tanaka',  true,    false, false,    'detail', [],                false], // 他人のprivate
    ['public',    'sato',  'tanaka',  true,    false, false,    'detail', [],                true ],
    ['public',    'sato',  'tanaka',  false,   false, false,    'detail', [],                false], // 無効
    ['public',    'sato',  'tanaka',  true,    true,  false,    'detail', [],                false], // ローカル無効
    ['public',    'sato',  'tanaka',  true,    false, true,     'detail', [],                false], // セーフモード
    ['public',    'sato',  'tanaka',  true,    false, false,    'index',  ['detail'],        false], // 画面外
    ['public',    'sato',  'tanaka',  true,    false, false,    'index',  ['index','detail'],true ],
  ])(/* ... */);
});
```

### 高

| 対象 | ファイル | 観点 |
| --- | --- | --- |
| `toAsset` | `lib/asset-mapper.test.ts` | 欠損フィールド、未知の選択肢値(private/無効へ倒れるか)、型不一致、`order` 既定値、128KiB超過 |
| `toRecordValue` | 同上 | 往復変換で情報が落ちないこと |
| `isSafeMode` | `lib/safe-mode.test.ts` | クエリ / localStorage / 両方 / localStorage が例外を投げる場合 |
| `EventBridge` | `lib/event-bridge.test.ts` | 持ち主つき登録、show以外のnative遅延登録(1typeにつき1回)、適用画面外のアセットへ配信しない、eventの直列引継ぎ、`false`、Promise、changeでthenableを無視、submit例外時のfail closed、購読者0件で同期返却 |
| 起動ゲート | `lib/launch-gate.test.ts` | 画面種別ごとに1回だけゲート、2回目以降は同期配信、取得完了前のshowで待つ・完了後のshowで待たない、タイムアウトでeventを返しJSを評価しない・遅れて届いたCSSだけ適用、取得失敗、セーフモードでゲートを作らない、ゲート内例外でもeventを返す、1アセットは1回だけ評価 |
| `kintone` ファサード | `lib/asset-kintone.test.ts` | `events.on` がブリッジへ持ち主つきで入る、`api` が拒否時に本物を呼ばない(Promise形式/コールバック形式)、`api.url` 等が残る、`proxy` は外部通信の設定と通信先で判定(禁止 / 指定先のみ / すべて)、通信先を消した直後の呼び出しから拒否、`plugin.app.proxy` は常に拒否、`getRequestToken` は書き込み権限が無ければ拒否、権限を外した直後の呼び出しから拒否 |
| `detectCapabilityUsage` | `lib/capability-detector.test.ts` | リテラルのメソッドと行番号、変数メソッドは unknown、コメント・文字列内の `fetch(` を誤検知しない、`window.kintone` / `globalThis` / `window[...]` / `eval` / 動的import / `createElement('script')` を検出、CSSの外部 `url()` / `@import` / `image-set()` / `@font-face src` の全URL抽出、JS内の外部URLリテラルの列挙 |
| `migrateConfig` | `lib/plugin.test.ts` | 欠損項目の補完、未知バージョン、型が壊れた値 |
| `isUsableConfig` | 同上 | 必須項目ごとの欠損 |

### 中

| 対象 | ファイル | 観点 |
| --- | --- | --- |
| `detectDangerousPatterns` | `lib/code-validator.test.ts` | 各カテゴリの検出、kintoneドメインへのfetchは検出しない、コメント内の誤検知 |
| `local-mute` | `lib/local-mute.test.ts` | 追加・削除・重複、space/app/userごとの鍵分離、別ユーザーのキーの削除、他プラグインのキーに触らない |
| `buildSystemPrompt` | `lib/ai/prompt.test.ts` | 設定の反映、`sendsRecordToAi` オフ時に該当ツールの説明が入らない |
| `hash` | `lib/hash.test.ts` | 同一入力で同一出力、1文字違いで別出力 |
| ツール定義 | `lib/ai/tools.test.ts` | Zod入力検証、write/sample/read_assetは `needsApproval`、設定オフ時にsample toolがない |
| restricted fetch | `lib/ai/proxy-fetch.test.ts` | Request/文字列入力、method/header/body保持、origin/path/query/method完全一致、prefix攻撃、userinfo、redirect拒否 |
| Agent | `lib/ai/agent.test.ts` | `MockLanguageModelV3` で複数step、承認/却下、上限、abort、書き込み後の再試行なし |
| `provider-factory` | `lib/ai/provider-factory.test.ts` | 設定 → 正しいAI SDK modelとendpoint。Azure/GeminiのURL組み立て |
| `conversation` | `lib/ai/conversation.test.ts` | 128KiB compaction、生出力除去、public audit mode、private→public削減、再開時の再取得 |
| DOM sanitizer | `lib/ai/dom-sanitizer.test.ts` | text/value/title/aria/data属性/URL/プラグインrootを除去、文字数上限、循環しない |
| 並び替えの採番 | `lib/asset-order.test.ts` | 並べ替え後に 100,200,300… へ振り直す、変わったレコードだけを更新対象に含める、revisionを付ける |
| `buildProxyEndpoint` | `lib/ai/proxy-endpoint.test.ts` | provider別のURL組み立て、Googleはmodel・Azureはdeploymentで変化、再入力要否の判定 |
| 承認の再開 | `lib/ai/agent.test.ts` | `tool-approval-response` で実行される / 却下で実行されない / 未判断を残して再開しない / 累積stepが上限を超えない |
| 承認の上書き | `lib/ai/tools.test.ts` | `experimental_context` の `scope` 上書きが効き、結果に `appliedScope` が載る。`code` / `id` は上書きできない |
| フィールドACLの解釈 | `lib/permission.test.ts` | record editable かつ field editable のときだけ操作可、メンテナンスモード(全false)の表示分岐 |
| 権限の宣言と検出の照合 | `lib/ai/tools.test.ts` | 使っているのに未宣言なら拒否、迂回パターンで拒否、未使用の宣言は警告、`unrestricted` / `external-all` を要求できない、承認で権限・送信先を減らせるが増やせない、リテラルの送信先が `externalUrls` に無ければ拒否、無効な送信先パターンで拒否 |

## 3. モック方針

- `kintone` グローバルは `vitest.setup.ts` で最小のスタブを定義する(`getLoginUser` / `events.on` / `app.getId` / `api`(`url` 付き) / `proxy` / `getRequestToken` / `Promise`)。
  ファサードのテストは、本物の `kintone.api` が**呼ばれなかったこと**を必ず確認する。
- `localStorage` は `vitest` の `jsdom` 環境のものを使い、例外系だけスタブで差し替える(ミュートとセーフモードだけが使う)。
- kintone REST API を呼ぶ関数(`asset-repository.ts`)は、`@konomi-app/kintone-utilities` を `vi.mock` する。
  ただし**リポジトリ層に判定ロジックを置かない**設計にしておけば、ここのテストは薄くて済む。

## 4. 手動テストシナリオ

自動化しない代わりに、リリース前に必ず通す。

### S1: 初回導入
1. アセット管理アプリを作り、プラグインを設定する
2. 対象アプリを開く → 設定した位置に低コントラストの起動ボタンが常時見える
3. JS / CSS 一覧が空状態で表示される

### S2: CSS作成(自分だけ)
1. チャットで「一覧の1行目を赤くして」
2. AIが `query_dom` を呼ぶ → ツールカードが出る
3. 承認カードでプレビュー → 画面が変わる
4. 「自分だけ」「保存後すぐ有効にする」を明示して登録 → 一覧に出る
5. 再読み込み → 適用されたまま
6. **別ユーザーでログイン** → 適用されない

### S3: JS作成(全員)
1. 公開権限のあるユーザーで「保存時に確認ダイアログを出して」
2. 承認 → 「全員」で無効状態として登録
3. コードをレビューして有効化を承認し、再読み込み → 保存操作でダイアログが出る
4. **公開権限のないユーザー**でチャットを開き、「全員」が選べないことを確認

### S4: 事故と復旧
1. 手動編集で `throw new Error('boom')` だけのJSアセットを登録
2. 再読み込み → 一覧に ⚠ が出るが、**ランチャーは動く**
3. スイッチでオフ → 再読み込み → エラーが消える
4. 別のアセットで `while(true){}` を登録 → 画面が固まる
5. `?ai-customize=off` を付けて再読み込み → **セーフモードで開ける**
6. スイッチでオフ → 通常モードに戻す

### S4-2: 実行順の並び替え
1. CSSアセットを3件作り、同じプロパティを別の値で指定する
2. 一覧でドラッグして順序を入れ替える → **見た目が即座に変わる**
3. 再読み込みしても順序が保たれている
4. 編集権限のないレコードを含む状態でドラッグできないことを確認

### S5: 起動タイミング

1. `kintone.events.on('app.record.create.show', ...)` でフィールドに初期値を入れて `disabled` にし、eventを返すJSを登録する
2. ブラウザのキャッシュとストレージを消して**初回**読み込み → 初期値とdisabledが反映されている
3. 詳細画面から編集→キャンセル→ページ送り → 詳細・編集それぞれのshowでハンドラが呼ばれ、**JSは二重評価されない**
4. 詳細用だけのCSSが、編集画面へ切り替えたときに外れる
5. 開発者ツールで管理アプリへの通信を3秒以上遅らせる → 画面は開き、ランチャーに「読み込みが間に合いませんでした」が出る。JSは動かず、CSSだけ後から当たる
6. 別タブでアセットを無効化 → 元のタブを再読み込み → **その回から**適用されない
7. localStorage / sessionStorage にコード本文が保存されていない

### S6: 権限とローカル無効化
1. 他人が作った `public` アセットを、編集権限のないユーザーがオフにする
2. 「このブラウザでのみ無効にしました」が出る
3. レコードの `status` が変わっていないことを確認
4. 別ブラウザでは適用されたままであることを確認

### S7: プロバイダ切り替え(BYOK)
1. OpenAIで設定 → チャットでCSSを1つ作れる
2. Anthropicへ切り替え、キーを入れ直す → 同じことができる
3. Geminiへ切り替え、モデルを変更 → **endpointが変わるためAPIキーの再入力が求められ、再入力後に動く**
3-2. 設定画面で「接続を確認」→ `kintone.proxy` 経由で成功する(使えない環境なら操作画面の「AI接続診断」で成功する)
3-3. 保存後にプラグイン一覧へ遷移すること、遷移前にproxy設定が保存済みであることを確認する
4. 誤ったキーを入れる → 「認証に失敗しました」が出る
5. ツール非対応モデルを指定 → 「接続を確認」で弾かれる

### S7-2: 承認と中断

1. 「全員」を指定させたうえで、承認カードで「自分だけ」へ落として承認する
   → 保存されたレコードが `private` で、AIの次の発言も「自分だけで登録した」と述べている
2. 生成中に「停止」を押す → 待機が即座に終わる。**課金は止まらない旨の説明が出ている**
3. 承認を何度かはさんだ長い会話で、累積stepが `maxToolSteps` に達したら中断され、続行ボタンが出る
4. 承認カードを開いたままにしても、AIへのリクエストが発生しないことを確認する

### S8: 対話ログ
1. `savesConversation` オフで登録 → `conversation` フィールドが空のまま
2. オン + privateで登録 → 削減済み会話がJSONで保存される。DOM・レコード値・コード本文の生出力が無い
3. public化 → ユーザー/AI本文が削除され、監査メタデータとhashだけになる
4. `conversationFieldCode` 未設定 + オン → 保存されず、エラーにもならない
5. AIの締めの発言まで含めてログに入っている(`write_asset` 実行時点で打ち切られていない)
6. ログの保存に失敗させても、アセットの登録は成功のまま残る

### S9: モバイル
1. モバイル画面で対象アプリを開く
2. ランチャーが出ず、アセットも適用されず、エラーも出ないこと

### S10: 境界と失効

1. 通常スペースと2つのゲストスペースで同じアプリIDのfixtureを用意し、相互に適用されない
2. 他アプリと他人のprivateアセットIDを `read_asset` / `write_asset` / `delete_asset` へ直接渡して全て拒否される
3. public化後に作成者が管理アプリからcode/status/orderを直接変更できない
4. 403/404になった管理アプリのアセットが実行されず、原因が表示される

### S10-2: 共有PC

1. ユーザーAでprivateアセットを作り、いくつかミュートする
2. 同じブラウザでユーザーBへログインし直す
3. ユーザーAのprivateアセットが適用されず、端末にもコードが残っていない。ユーザーAのミュートのキーが**削除されている**

### S12: カスタマイズ単位の権限

1. 権限なしで `kintone.api(..., 'PUT', ...)` を呼ぶJSを登録 → 実行時に拒否され、一覧に「更新を止めました」が出る。レコードは変わらない
2. 詳細画面で「更新」を付与 → 使用箇所の行番号が確認ダイアログに出る → 再読み込み後に更新できる
3. 同じタブで「更新」を外す → **再読み込みせずに**次の呼び出しから拒否される
4. `bulkRequest` で削除を含むJSに「追加」「更新」だけを付与 → 拒否される
5. `records/cursor.json` のPOSTを使う大量取得は、権限なしで動く
6. `window.kintone.api` や `fetch` を含むJSを管理アプリから直接登録 → 実行されず、理由と行番号が出る。「制限なし」を付けると動く
7. 権限なしのアセットから `fetch` で直接PUTを送る → CSRFトークンを取得できず失敗する
8. `kintone.plugin.app.proxy` を呼ぶJSは、権限に関係なく拒否される
9. 一般ユーザーは、他人のpublicアセットの権限スイッチを操作できない(読み取り専用表示)
10. 外部通信を「指定先のみ」+ `https://api.example.com/v1/` にする → `/v1/zip` への `kintone.proxy` は通り、`/v10/`・`https://api.example.com.evil.example/v1/`・`http://api.example.com/v1/` は拒否される
11. 通信先を1行消す → 同じタブで次の呼び出しから拒否される
12. Google FontsをCSSで読むアセットで、`fonts.gstatic.com` だけ通信先から外す → そのCSSは適用されず、一覧に該当URLが出る
13. 「すべて」へ切り替える → 確認ダイアログが出て、一覧のチップが警告色の `外部: すべて` になる
14. AIに「保存時に別アプリのレコードを更新して」と頼む → `write_asset` に `put` が宣言され、承認カードに使用箇所が出る。承認カードで外すと `appliedPermissions` がAIへ返る

### S11: プロキシと情報最小化

1. 許可endpointのprefix、別path、query追加、redirectをrestricted fetchが拒否する
2. 各providerのsentinel認証ヘッダーがproxy保存値で上書きされ、sentinelが外部へ送られない
3. `query_dom` から設定に関係なくテキスト、value、title、aria-label、data属性、URLが除去される
4. アセットJSから認証済みendpointを呼べる残余リスクを確認し、AI側の予算・監査アラートが働く
5. 設定変更中に接続確認を失敗させ、旧endpointと通常設定が維持される

## 5. CI

`turbo run check-types` と `turbo run test` をCIで回す。
`biome lint` はリポジトリの既知の問題(OOM)があるため、バイナリを直接実行する形に合わせる。
