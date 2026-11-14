# 05. 実行エンジン

アセットをいつ・どうやって画面に適用するか。本プラグインで最も難しい部分。
方式を選んだ経緯と比較は [13-launch-gate-and-permissions.md](./13-launch-gate-and-permissions.md) を参照。

## 1. 解くべき問題

kintoneのJSカスタマイズは `kintone.events.on('app.record.detail.show', handler)` の形で書く。
このハンドラは**イベント発火より前に登録されていなければ呼ばれない**。一方、アセットはアセット管理アプリから
REST APIで取ってくる = **非同期**。素直に `await getRecords()` してから評価すると、その頃には `show` は発火済みになる。

ただし、同期でなければならないのは**ハンドラの登録**であって、**コードの取得**ではない。
PC版の `app.record.{index,detail,create,edit}.show` はすべてPromise対応で、kintoneはPromiseの完了を待ってから
後続の処理と返却eventの反映へ進む([イベントオブジェクトで実行できる操作](https://cybozu.dev/ja/kintone/docs/js-api/events/event-object-actions/))。

そこで本プラグインは、**showハンドラを読み込み時に同期登録し、初回のshowでPromiseを返してアセットの取得完了まで保留する**。
これを「起動ゲート」と呼ぶ。アセットのハンドラはそのshowイベントの処理の内側で呼ばれるので、初回表示から
通常のJSカスタマイズと同じタイミングで動き、返却eventによる値の上書きやdisabledも反映される。

| # | 手段 | 効果 |
| --- | --- | --- |
| 1 | **起動ゲート**(2章) | 同期キャッシュなしで、初回から正しいタイミングで動く。毎回最新のアセットを使う |
| 2 | **イベントブリッジ**(3章) | アセットのハンドラを持ち主つきで管理し、直列実行・エラー隔離・遅延登録を担う |
| 3 | **`kintone` ファサード**(4章) | アセットは標準の `kintone.events.on` をそのまま書ける。権限の強制点にもなる(5章) |

## 2. 起動ゲート

### 起動シーケンス

```text
desktop.js 読み込み(すべて同期)
  ├─ 1. セーフモード判定(9章)。有効ならアセット関連を一切行わず、ランチャーだけを描画予約する
  ├─ 2. assetsPromise = repository.fetchEnabled()      … await しない。kintone本体の初期化と並行に走る
  ├─ 3. show系4イベントへ native handler を同期登録
  └─ 4. ランチャーの描画予約(アセットの結果に依存させない)

native show handler(type, event)
  ├─ この画面種別で初めてのshow → return gate(screen, event)   … Promise
  └─ 2回目以降                    → return bridge.dispatch(type, event)
```

```ts
const gate = async (screen: AssetScreen, event: KintoneEvent) => {
  const result = await withTimeout(assetsPromise, GATE_TIMEOUT_MS);
  if (result.status !== 'ok') {
    diagnostics.markUnapplied(result);   // ランチャーへ原因を表示
    return event;
  }
  injector.sync(result.assets, screen);  // この画面向けの <style> を有効化
  runner.evaluatePending(result.assets, screen); // 未評価のJSを order 順に評価
  return bridge.dispatch(`app.record.${screen}.show`, event);
};
```

### 規則

- **ゲートは画面種別ごと**に持つ。詳細画面と編集画面は同じページ内で行き来し(`detail.show` は編集の保存・キャンセル後にも発火する)、
  一覧・追加画面も含めて「そのページで最初に来たshow」が画面種別を決めるとは限らない。
  画面種別ごとの初回showで、その画面向けかつ未評価のアセットだけを評価する。
- 1アセットは1ページで最大1回しか評価しない(二重実行しない。ADR-3)。
- 取得はページ読み込みにつき1回。`assetsPromise` を全ゲートで共有する。
- ゲートで待つのは `max(0, 取得完了 − show発火)` だけである。取得はdesktop.jsの評価直後に始まり、kintone本体が
  フォームとレコードを読み込むのと重なる。待ち時間はP-1で実測し、診断へ記録する(→ 2-3)。
- ゲート内で例外が出ても、必ずeventを返す。ゲートの失敗で画面を止めない。

### 2-1. 失敗時とタイムアウト

| 状況 | 挙動 |
| --- | --- |
| 取得がタイムアウト(`GATE_TIMEOUT_MS`、暫定3000ms) | eventをそのまま返す。遅れて届いたら**CSSだけ**適用し、JSは評価しない。ランチャーに「カスタマイズの読み込みが間に合いませんでした。保存前チェックなどは動いていません」+ 再読み込みボタン |
| 取得失敗(ネットワーク / 403 / 404) | JSもCSSも適用しない。原因別のエラーをランチャーに出す |
| 上限超過(04 5章の100件 / 2MiB) | 同上。一部だけ実行しない |
| アセット0件 | 取得完了でゲートを抜ける |

一度タイムアウトしたページでは、その後に別の画面種別のゲート(詳細→編集など)を通っても、JSを評価しない。
同じページの中で「詳細画面では動かず、編集画面では動く」状態を作らないためである。

遅れて届いたJSを評価しないのは、「後から来たshowハンドラは動くが返却eventは反映されない」という中途半端な状態を作らないためである。
アセットは**全部正しく動くか、動いていないことが明示されるか**のどちらかにする。

### 2-2. 端末に保存しないもの

アセットのコード本文、タイトル、権限は**localStorageにもsessionStorageにも保存しない**。毎回アセット管理アプリから読む。
これにより次が構造的に成り立つ。

- 無効化・削除・権限の変更は、他の利用者にも**次の画面読み込みで必ず反映される**。
- 共有PCに前のユーザーのprivateコードが残らない。
- `localStorage` の容量(オリジン共有の5MB前後)を消費しない。

localStorageに置くのは、ローカル無効化のID一覧(8章)とセーフモードのフラグ(9章)だけである。

### 2-3. 計測

| 計測値 | 用途 |
| --- | --- |
| 取得開始〜完了、show発火時刻、ゲート待ち時間 | 診断表示。P-1でp50/p95を確定する |
| JS評価時間(アセットごと・合計) | 100msを超えたら `console.warn` と診断へ記録 |

ゲート待ち時間のp95がP-1の目安(150ms)を超えた場合の退避策は [13](./13-launch-gate-and-permissions.md) 2-7章に記載した。既定では実装しない。

## 3. イベントブリッジ

`src/lib/event-bridge.ts`。アセットのハンドラを**持ち主(アセットID)つきで**保持し、kintoneのnative handlerから配信する。

```ts
export type FixedShowEventType =
  | 'app.record.index.show'
  | 'app.record.detail.show'
  | 'app.record.create.show'
  | 'app.record.edit.show';

export type BridgeEventType =
  | FixedShowEventType
  | 'app.record.create.submit'
  | 'app.record.edit.submit'
  | `app.record.create.change.${string}`
  | `app.record.edit.change.${string}`
  // v1で許可するそれ以外のイベントは allowlist で列挙する(一覧のインライン編集、削除前 など)
  ;

export type BridgeHandler = (event: unknown) => unknown | Promise<unknown>;

export interface EventBridge {
  /** アセットのハンドラを登録する。show以外は、初めてのtypeならnative handlerを1回だけ登録する */
  on(assetId: string, type: BridgeEventType | BridgeEventType[], handler: BridgeHandler): void;
  off(assetId: string, type?: BridgeEventType | BridgeEventType[], handler?: BridgeHandler): boolean;
  /** native handler から呼ぶ。購読者を登録順に直列実行し、最終のeventを返す */
  dispatch(type: BridgeEventType, event: unknown): unknown | Promise<unknown>;
}
```

### native handlerの登録

- show系4イベントだけを読み込み時に同期登録する(2章)。
- それ以外(submit / change など)は、アセットが `kintone.events.on` で購読した時点で、そのexact typeのnative handlerが
  無ければ1回だけ登録する。この登録はゲートの内側、つまりそのイベントが発火しうるより前に行われる。
  show以外の遅延登録にはkintone側の制約がない([イベントハンドラー登録の適切なタイミング](https://cybozu.dev/ja/kintone/tips/development/customize/development-know-how/right-timing-of-kintone-event-handling/))。
- changeイベントにワイルドカードはない。`app.record.edit.change.Amount` のようなexact typeだけを受け付ける。
- 未知のイベント名、allowlist外、空のフィールドコードは登録前に拒否し、アセットの診断に記録する。
- native handlerは必ず `return bridge.dispatch(type, event)` とし、Promiseと返却eventをkintoneへ返す。
- **購読者が0件のとき、`dispatch` は `event` をそのまま同期で返し、Promiseにもしない。**
  本プラグインは全ユーザーの画面表示と保存に割り込む位置にいる。アセットが無い状態でブリッジのバグにより保存が壊れる、
  という事故の可能性を構造的に消しておく。submitのnative handlerは購読するアセットがあるときだけ登録されるので、
  submitを使うアセットが無いアプリでは保存処理へ一切割り込まない。

公式仕様でもchangeイベントはフィールドコードを含むexact typeであり、Promise対応イベントはPromiseをreturnする必要がある。
[kintone JavaScript APIのイベント一覧](https://cybozu.dev/ja/kintone/docs/js-api/)、
[イベント処理の記述方法](https://cybozu.dev/ja/kintone/docs/js-api/events/event-handling/)。

### 配信の規則

- 購読者を**登録順**(= アセットの `order` 順、同一アセット内は登録順)に直列実行する。
- 配信前にアセットの適用画面を判定する。`screens: ['detail']` のアセットが `edit.show` を購読していても配信しない。
- ハンドラがeventオブジェクトを返したら次のハンドラへその値を渡す。`undefined` なら直前のeventを維持する。
- `change` イベントはPromise非対応なので、ハンドラがthenableを返したら無視して直前のeventを使い、診断に記録する。
- **リプレイはしない。** 非同期処理の後で登録されたshowハンドラは、次のshowから呼ばれる。
  ゲートの内側で評価されたアセットが同期的に登録したハンドラは、そのshowを通常どおり受け取るので、リプレイは不要になった。

### submit のハンドリング

`submit` はハンドラが `false` を返すと保存を中断できる。

- いずれかが `false` を返したら、以降を実行せず `false` を返す
- 例外が出たら後続を実行せず、eventに一般向けエラーを設定して**保存を止める**。詳細はアセットIDと共に診断UIへ出す

保存前ロジックの失敗時に保存を通すと、入力検証を迂回して不正なデータを確定しうるため、v1はfail closedとする(ADR-23)。
業務を復旧する場合はセーフモードURLで全アセットを止め、問題のアセットを無効化する。例外オブジェクトやstackを
`event.error` に直接入れて、一般ユーザーへ内部情報を漏らさない。

## 4. JSアセットの実行

`src/lib/runner.ts`。

```ts
const factory = new Function(
  'kintone',
  'context',
  `"use strict";\n${asset.code}\n//# sourceURL=ai-customize/${asset.id}-${slug(asset.title)}.js`,
);
factory(createAssetKintone(asset, bridge, grants), context);
```

### `//# sourceURL` を必ず付ける

これがないとエラーが `<anonymous>` になり、**どのアセットが壊れているのか永久に分からない**。
DevToolsのSourcesにもファイル名として並ぶので、デバッグ体験が段違いになる。

### `kintone` ファサード

`src/lib/asset-kintone.ts`。アセットのコード内の識別子 `kintone` は第1引数を参照する。
ファサードは本物の `kintone` のプロパティを写した新しいオブジェクトで、次のメンバーだけを差し替える。
`plugin.app` や `proxy.upload` のような入れ子も、同じ方法で1段ずつ作る。

| メンバー | 差し替え後 |
| --- | --- |
| `events.on` / `events.off` | ブリッジの `on(asset.id, ...)` / `off(asset.id, ...)`。他のアセットやプラグインのハンドラには触れない |
| `api`(`url` / `urlForGet` / `getConcurrencyLimit` を同じ値で持たせる) | 権限を判定してから本物へ委譲(5章) |
| `proxy` / `proxy.upload` | 外部通信の設定と通信先リストでURLを判定してから委譲(5-2) |
| `plugin.app.proxy` / `plugin.app.proxy.upload` | 常に拒否。`plugin.app.getConfig` などは委譲 |
| `getRequestToken` | 書き込み系権限が1つも無ければ拒否 |
| 上記以外 | 本物をそのまま返す |

- アセットは普通のkintoneカスタマイズと同じく `kintone.events.on(...)` を書けばよい。独自の購読APIは持たない。
- `window.kintone` や `globalThis.kintone` はファサードを通らない。これらを含むコードは静的検出で実行対象から外す(5-3)。
- **本物をプロトタイプに持たせない。** 当初は `Object.create(kintone, {...})` としていたが、
  `Object.getPrototypeOf(kintone).api(...)` の1行で権限判定を素通りでき、静的検出にも掛からなかった(第3回レビューのC-1)。
  `events` / `plugin` / `plugin.app` の入れ子も同じく写し、プロトタイプをたどっても本物に届かないようにする。
- `Proxy` は使わない。本物の `kintone` のプロパティが変更・再定義不可(凍結)だった場合、Proxyのgetで別の値を返すと
  不変条件違反の `TypeError` になるためである。写す方式は凍結の影響を受けない。
- 差し替えない値は参照のまま写す(`bind`すると `kintone.Promise.all` のような静的メンバーが消える)。
  `this` を使う関数も、ファサードが同じメンバーを持つため動く。`kintone.app` などの入れ子オブジェクトは本物への参照のままなので、
  それらが本物のルート `kintone` を返さないことをP-1で確認する。

### context の中身

アセットに渡す第2引数。イベント購読はファサードへ移したので、読み取り専用の情報とログだけを持つ。

```ts
export type AssetContext = {
  /** 現在のアプリID(文字列) */
  appId: string;
  /** ゲストスペースID(なければ undefined) */
  guestSpaceId: string | undefined;
  /** 評価したときの画面種別 */
  screen: 'index' | 'detail' | 'create' | 'edit';
  /** ログインユーザー */
  loginUser: ReturnType<typeof kintone.getLoginUser>;
  /** このアセット自身のメタ情報 */
  asset: { id: string; title: string; kind: AssetKind; scope: AssetScope; permissions: AssetPermission[]; externalUrls: string[] };
  /** ログ。プレフィックス付きで console に出す */
  log: (...args: unknown[]) => void;
};
```

> **`onCleanup` はv1のcontextに入れない(ADR-31)。** v1にアセットをアンマウントする経路は存在せず、
> 一度も呼ばれないコールバックになる。実際に呼ぶ経路(ホットリロード)を実装する版で、同時に追加する。

### エラー隔離

```ts
for (const asset of pendingJsAssets) {
  const usage = detectCapabilityUsage(asset.code);
  if (usage.bypass.length > 0 && !asset.permissions.includes('unrestricted')) {
    report.blocked.push({ id: asset.id, reason: 'bypass', usage });
    continue;
  }
  try {
    evaluate(asset, context);
    report.success.push(asset.id);
  } catch (error) {
    report.failed.push({ id: asset.id, error });
    console.error(`[ai-customize] アセット「${asset.title}」(#${asset.id})の実行に失敗しました`, error);
  }
}
```

- 1件の失敗が他を止めない。
- 失敗したアセットはランチャーの一覧に **⚠ バッジ**を出し、行を開くとエラーメッセージとスタックを見せる。
- ブリッジ経由のハンドラ内で出た例外も同様に捕捉し、アセットIDに紐づけて記録する。
- **同一アセットが同一セッションで3回以上例外を出したら、そのタブでの実行を自動停止**し、「一時的に停止しました」と通知する(サーキットブレーカー)。レコードは変更しない。

`try/catch` とサーキットブレーカーで扱えるのは、例外として制御が戻る処理だけである。トップレベルの
無限ループ、同期的な長時間処理、メモリー枯渇は停止できない。ゲートの内側で固まった場合も同じで、
Web Workerへ移せない以上、実行前レビューとセーフモードURLが唯一の復旧策になる。承認UIではこの限界を隠さない。

## 5. 権限の強制

アセットごとの権限(読み取りは常時、追加・更新・削除・外部通信・制限なしは許可制)を実行時に強制する。
権限の種類、分類表、限界の説明は [13](./13-launch-gate-and-permissions.md) 3章。ここでは実装上の契約だけを書く。

### 5-1. `kintone.api` の判定

```ts
const guardedApi = (pathOrUrl, method, params, success?, failure?) => {
  const required = classifyKintoneRequest(pathOrUrl, method, params);  // 純粋関数
  if (!isGranted(required, grants.current(asset.id))) {
    const error = permissionDenied(asset, required, method, pathOrUrl);
    diagnostics.recordDenied(asset.id, error);
    if (success || failure) {
      queueMicrotask(() => failure?.(error));
      return;
    }
    return kintone.Promise.reject(error);
  }
  return kintone.api(pathOrUrl, method, params, success, failure);
};
```

- `classifyKintoneRequest` はURLを正規化し(絶対URL / 相対パス、`/k/guest/{id}/v1/` → `/k/v1/`、`.json` と query を除去)、
  `bulkRequest` は内側の各リクエストを同じ規則で分類した和集合を返す。解釈できないURLは「制限なし」を要求する。
- `grants.current(asset.id)` は呼び出しのたびに現在値を返す。パネルで権限を外すと、そのタブでも次の呼び出しから止まる。
- 拒否エラーは `{ code: 'AI_CUSTOMIZE_PERMISSION_DENIED', message, required, method, path }` の形の `Error`。
- submitハンドラ内で拒否された場合は例外として扱い、3章の規則で保存を止める。

### 5-2. 外部通信

- `kintone.proxy` / `kintone.proxy.upload` は、メソッドを問わず外部通信として判定する(GETでもクエリ文字列でデータを送れる)。
  - 外部通信が禁止 → 拒否
  - 「すべて」 → 許可
  - 「指定先のみ」 → `matchExternalTarget(url, asset.externalUrls)`(純粋関数)が一致したときだけ許可。
    絶対URLでない、ユーザー情報を含む、オリジンが完全一致しない、パスがセグメント境界で前方一致しない場合は拒否する
    (規則は [13](./13-launch-gate-and-permissions.md) 3-3-2章)
  - 通信先リストも呼び出しのたびに現在値を参照する。パネルで通信先を消すと、そのタブでも次の呼び出しから止まる
  - 拒否エラーと診断には、要求URLのオリジンとパスだけを載せる(クエリに業務データが載りうるため)
- `kintone.plugin.app.proxy` は常に拒否する。本プラグインのAI用endpointへ認証付きでアクセスできてしまう経路(08 T11)を、
  正規の書き方では塞ぐ。
- CSSアセットは、外部オリジンへの `url(...)` / `@import` / `image-set(...)` / `@font-face` の `src` を静的に抜き出し、
  全て許可されている場合だけ適用する。1つでも許可されていなければ適用せず、一覧に該当URLを出す。

### 5-3. 迂回パターン

`detectCapabilityUsage(code)`(`src/lib/capability-detector.ts`、純粋関数)は、文字列とコメントを区別するトークナイザーで
コードを走査し、`kintone.api` の呼び出し(メソッドがリテラルなら値と行番号)、外部通信、迂回パターンを返す。
正規表現を生のコードへ当てない(コメント中の `fetch(` で誤検知し、文字列連結で見逃すため)。

- 迂回パターンを含むJSアセットは、「制限なし」が付与されていない限り**実行しない**(4章のループ)。
- 迂回パターンの一覧は [13](./13-launch-gate-and-permissions.md) 3-4章。承認時(07)と実行時で同じ関数を使う。
- 検出は1アセットにつき評価前に1回だけ行い、結果を診断と一覧表示に使う。

## 6. CSSアセットの適用

`src/lib/injector.ts`。

```html
<style data-ai-customize-id="12" data-ai-customize-hash="1f3a..." data-ai-customize-scope="public">
  /* code */
</style>
```

- 挿入先は `document.head` の**末尾**。kintone標準スタイルより後に来るので詳細度の勝負を有利にする。
- 順序はアセットの `order` 昇順 → `$id` 昇順。同一 `order` 内の順序が実質的に効くのはCSSだけなので、テストで並びを固定する。
- 各showで、適用画面に合わせて `<style>` の `disabled` を切り替える(詳細⇄編集のページ内遷移で詳細用CSSを残さない)。
- 無効化・削除は該当 `<style>` の `remove()`。**副作用が残らない**のがCSSの利点で、スイッチ操作が即時に反映できる。
- プレビュー時は `data-ai-customize-preview="1"` を付けた別の `<style>` を使い、保存済みのものより後ろに置く。
- 表示のちらつき(FOUC)は、ゲートで待った時間ぶんだけ起こりうる。P-1で問題になった場合の退避策は 13 の 2-7章。

## 7. 適用判定

`src/lib/asset-filter.ts`(純粋関数)。

```ts
export const shouldApply = (asset: Asset, ctx: ApplyContext): boolean => {
  if (ctx.safeMode) return false;                                  // セーフモード
  if (!asset.enabled) return false;                                // レコード側で無効
  if (ctx.mutedIds.has(asset.id)) return false;                    // ローカル無効化
  if (asset.code.trim() === '') return false;                      // 空
  if (asset.scope === 'private' && asset.ownerCode !== ctx.loginUserCode) return false;
  if (asset.screens.length > 0 && !asset.screens.includes(ctx.screen)) return false;
  return true;
};
```

**この関数は必ず単体テストする。** 影響範囲の判定を間違えると「他人のカスタマイズが自分の画面で動く」という事故になる。
権限に関する判定(迂回パターンと「制限なし」、CSSの外部参照と外部通信の設定)は `shouldApply` に混ぜず、
`checkCapabilityPolicy(asset, usage)` として分け、どちらで止まったかを一覧に区別して出す。

## 8. ローカル無効化(Local Mute)

レコードを変更する権限がなくても、自分の画面でだけカスタマイズを止められる仕組み。

```text
localStorage["🐸-ai-customize:v3:muted:{targetSpaceId}:{targetAppId}:{loginUserCode}"] = ["12", "34"]
```

- UI上は一覧のスイッチに「ローカル無効」の表示を出し、レコードを止めたのか自分だけ止めたのかを区別できるようにする。
- レコードの編集権限がある場合、スイッチはレコードの `status` を更新する。権限がない場合はローカル無効化にフォールバックする(→ 06, 08)。
- 値はアセットIDの配列だけで、コードや業務データを含まない。起動時にログインユーザーが異なる本プラグインのキーは削除する。
- `localStorage` が使えない環境では、ローカル無効化を「このタブだけ」に落とし、その旨を表示する。

## 9. セーフモード

壊れたJSからの復旧手段。**これがないと運用に出せない。**

### 入り方

| 手段 | 用途 |
| --- | --- |
| URLクエリ `?ai-customize=off` | その場で1回だけ止める。最も確実 |
| 対象座標・ユーザー別のlocalStorageキー | そのアプリだけ恒久的に止める。コンソールから設定できる |
| ランチャーメニューの「セーフモードで再読み込み」 | UIが生きている場合の正規ルート |

判定は `src/lib/safe-mode.ts` の純粋関数とし、URL queryと、対象座標・ユーザーから組み立てたstorage keyを入力する。
storage keyの生成も純粋関数としてテストする。

### セーフモード中の挙動

- **アセットは一切適用しない**(CSSもJSも)。起動ゲートも作らず、showハンドラは同期でeventを返す。
- **ランチャーは表示する**。これが目的なので、ランチャーの描画パスはアセットの実行結果に一切依存させない。
- 画面上部に「セーフモードで表示しています(カスタマイズは無効です)」のバーを出し、解除リンクを添える。
- 一覧は通常どおり表示・操作できる。原因のアセットをオフにしてから解除する、が正しい復旧手順。

### 起動順序の鉄則

```text
1. セーフモード判定
2. ランチャーの描画予約         ← アセットより先
3. アセットの取得開始とshowハンドラの登録
4. (show発火時)アセットの適用
```

アセットの評価が例外を投げても `try/catch` の外に出さない。ランチャーの描画は必ず到達させる。

## 10. 再取得のタイミング

| きっかけ | 挙動 |
| --- | --- |
| ページ読み込み | 有効なアセットを取得(2章)。評価と適用はゲートで行う |
| ランチャーのパネルを開いた | 全件(無効なものも含む)と権限情報を取得。JSは再評価しない |
| スイッチ操作・保存 | 該当レコードのみ再取得し、一覧を更新。CSSは即時反映、JSは「再読み込みで反映」 |
| 「再読み込み」ボタン | ページを再読み込みする(JSを同じページで再評価しない) |

`assetsPromise` はページ読み込みにつき1つで、全ゲートが共有する。

## 11. モバイル

v1のmanifestには `mobile.js` を登録しない。実行しないコードを配布して初期化分岐に依存する必要はない。
v2でモバイル用の実行契約、イベント(モバイルのshowイベントのPromise対応を含む)、復旧UIを別途設計する。
