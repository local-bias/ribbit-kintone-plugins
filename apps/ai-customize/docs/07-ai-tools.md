# 07. AI対話仕様

## 1. 接続方式

**BYOK方式**(利用者が自分のAPIキーを用意する)で、複数のAIプロバイダに対応する。
プロバイダーごとの差分はAI SDKの公式プロバイダーパッケージに任せ、本プラグインは `ToolLoopAgent` と
型付きツールだけを扱う。独自の会話プロトコルやツール変換層は作らない。

→ 対応provider factory、AI SDK、プロキシ設定の注意は [07b-ai-providers.md](./07b-ai-providers.md) を参照。

- 各provider factoryへ、endpointを完全一致で制限した `createRestrictedProxyFetch` を渡す。
- `@konomi-app/ketch` が `kintone.plugin.app.proxy` をfetch互換へ変換する。
- APIキー自体は操作画面へ返らないが、アセットJSが認証済みendpointを利用することは防げない(→ 08)。
- モデルはプラグイン設定で指定。**ツール呼び出しに対応したモデルであることが前提**(設定画面の「接続を確認」で検証する)。

> ### ⚠ ストリーミングは使えない
> kintoneのプロキシAPIは**レスポンスボディを文字列で一度に返す**仕様のため、SSEによる逐次表示ができない。
> `stream: true` は使わず、1往復ずつ完全なレスポンスを受け取る。
> 体感速度は「ツール往復ごとの逐次表示」と「経過時間の表示」で補う(→ [07b](./07b-ai-providers.md) 3章、[06-ui.md](./06-ui.md))。

## 2. 対話ループ

```
ユーザー送信
  └→ messages に push
      └→ ① agent.generate({ messages, abortSignal, experimental_context })
          ├─ text → UIへ表示(1往復ぶんがまとめて出る)
          ├─ needsApproval でないツール → AI SDKが execute し、ループが自動で続く
          └─ needsApproval のツール → 実行されず tool-approval-request が返り、generate が終了する
                └→ 承認カードを表示。ユーザーが承認/却下(+ scope等の上書き)
                    └→ messages に前回の response.messages と
                       { role:'tool', content:[{ type:'tool-approval-response', approvalId, approved, reason }] }
                       を積み、上書き値を experimental_context に載せて ①へ戻る
      └→ **累積**stepが maxToolSteps に達したら中断し、
           「操作が長くなったため中断しました」と表示して続行ボタンを出す
```

- **ツールの実行はAI SDKに任せる。承認後にこちらで `execute` を呼んで結果メッセージを組み立てない。**
  仕組みと型は [07b-ai-providers.md](./07b-ai-providers.md) 4-2章に書いた。
- step上限は `generate` 1回ごとにリセットされるため、**ユーザー発言1件に対する累積step数**を数えて
  `stopWhen: stepCountIs(残り)` を渡す。承認のたびに上限が復活しないようにする。
- 中断・再開があるため、AI SDKの `response.messages` と承認partをjotai atom (`src/desktop/states/chat.ts`) に持つ。
- **AIへ送る**会話履歴はトークン上限を超えないよう、**古いツール結果から先に間引く**(テキストのやり取りは残す)。
- **レコードへ保存する**対話ログも128KiBに制限し、privateは古いturnから削減、publicは本文なしのaudit modeにする
  (→ [04-asset-app.md](./04-asset-app.md) 5-2)。
- ツール呼び出しは並行して複数返りうる。読み取り系だけなら並行実行してよい。書き込みが1件でも混ざるstepは
  自動実行せず、表示順に1件ずつ承認する。承認直前と実行直前の2回、権限とrevisionを確認する。

## 3. システムプロンプト

`src/lib/ai/prompt.ts` の純粋関数 `buildSystemPrompt(ctx): string` で組み立てる。テスト可能にするため文字列生成に副作用を持たせない。

### 構成要素

```
1. 役割
   あなたはkintoneアプリのカスタマイズを作るアシスタントです。
   ユーザーと対話しながらJavaScriptまたはCSSを作り、ツールを使って登録します。

2. 実行環境(最重要。ここを外すと動かないコードが出る)
   - コードは通常のkintone JavaScriptカスタマイズと同じように書いてください。
     イベントは kintone.events.on(type, handler) で登録します。画面表示イベントより前に評価されるので、
     show イベントで event を返せば値の上書きや disabled も反映されます。
   - コードは画面表示ごとではなく、ページ読み込みにつき1回だけ評価されます。
     ハンドラ登録はコードの最上位で同期的に行ってください(await の後で登録しない)。
   - 2つ目の引数 context に appId / guestSpaceId / screen / loginUser / asset / log があります。
   - import / export は使えません。外部スクリプトの読み込みも行わないでください。

   権限(カスタマイズごとに付与される。読み取りは常に可能)
   - レコードの取得など GET は自由に使えます。
   - 追加(POST)・更新(PUT)・削除(DELETE)は、write_asset の permissions で必要なものだけを宣言してください。
     宣言していない操作は実行時に拒否されます。
   - 外部通信(kintone.proxy、CSSの外部 url()/@import)は、write_asset の externalUrls に送信先を列挙してください。
     列挙していない送信先への通信は拒否されます。送信先はできるだけ狭く(APIのパスまで)書いてください。
     送信先のURLはコード中に文字列リテラルで書くと、承認画面で利用者が確認できます。
   - kintone REST API は必ず kintone.api(...) で呼び、メソッドは文字列リテラルで書いてください。
   - fetch / XMLHttpRequest / window.kintone / globalThis / eval / new Function / 動的 import /
     script・iframe 要素の生成は使わないでください。これらを含むコードは保存できません。
   - kintone.plugin.app.proxy は使えません。

3. 現在の状況
   - アプリID / アプリ名 / 画面種別 / レコードID / 言語 / ログインユーザー
   - 登録済みアセットの一覧(タイトル・種別・影響範囲・有効状態)

4. 作法
   - 変更前に必ず get_form_fields でフィールドを確認する。フィールドコードを推測しない。
   - まずkintoneの公開JavaScript APIで実現できるか確認する。非公開DOMへ依存するときだけ query_dom を使う。
   - 1つのアセットは1つの目的に絞る。200行を超えそうなら分割を提案する。
   - 既存アセットを直すときは read_asset で現在のコードを読んでから write_asset する。
   - コードには日本語のコメントで「何をしているか」を簡潔に書く。
   - 影響範囲は既定で private(自分だけ)。public にするのはユーザーが明示的に求めたときだけ。
   - 権限は最小限にする。一覧・詳細の表示だけならGETで足りる。書き込みが要るときは、どの操作が要るかを説明してから宣言する。
   - 破壊的な操作(レコード更新・削除・一括処理)を含むコードは、実行前に必ずユーザーへ確認する。

5. 禁止事項
   - externalUrls に列挙していない送信先へデータを送らない(Image のsrc、CSSの外部 url() 等を含む)。
   - document.write を含むコードを書かない。
   - localStorage / sessionStorage にレコードの内容を保存しない。
   - 認証情報やAPIトークンをコードに直接書かない。
   - ユーザーが求めていないレコードの更新・削除を行わない。

6. 追加指示(プラグイン設定の additionalSystemPrompt をそのまま追記)
```

### kintone固有の知識として与えるもの

コード生成の精度に直結するので、システムプロンプトに短くまとめて入れる。

| 項目 | 内容 |
| --- | --- |
| イベント名 | `app.record.index.show` / `detail.show` / `create.show` / `edit.show` / `create.submit` / `edit.submit` / `create.change.<フィールドコード>`。showとsubmitはPromiseを返せる。changeは返せない |
| REST APIと権限 | `kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', body)`。レコードの追加・更新・削除・ステータス変更・コメントは権限が要る。`bulkRequest` は中身の各操作の権限が要る |
| 値の操作 | `kintone.app.record.get()` / `set()`。レコードは `record[fieldCode].value` |
| 表示制御 | `kintone.app.record.setFieldShown(fieldCodeまたは要素ID, boolean)` |
| 描画先 | `kintone.app.record.getSpaceElement(id)` / `kintone.app.getHeaderMenuSpaceElement()` |
| 一覧フィールド | `kintone.app.getFieldElements(fieldCode)` を優先する |
| 注意 | `.xxx-gaia` など非公開DOMクラスを知識として固定しない。`query_dom` で実在を確認し、壊れやすい旨をコメントに残す |

> DOM構造に依存するCSSは壊れやすい。プロンプトで「セレクタの根拠をコメントに書く」よう指示しておくと、後から直しやすくなる。

## 4. ツール定義

`src/lib/ai/tools.ts` で `tool({ inputSchema, execute, needsApproval })` を定義する。
`inputSchema` はZodを正本とし、AI SDKにプロバイダー向けJSON Schema変換と実行前検証を任せる。
ハンドラーの引数型は `z.infer` から導出し、同じ型を二重定義しない。

| # | ツール名 | 種別 | 承認 | 概要 |
| --- | --- | --- | --- | --- |
| 1 | `get_app_context` | 読み取り | 不要 | アプリID・アプリ名・画面種別・レコードID・言語 |
| 2 | `get_form_fields` | 読み取り | 不要 | フィールド一覧(コード・ラベル・型・選択肢) |
| 3 | `get_form_layout` | 読み取り | 不要 | レイアウト(行・グループ・スペース要素ID・ラベル・罫線) |
| 4 | `get_views` | 読み取り | 不要 | 一覧ビューの定義 |
| 5 | `query_dom` | 読み取り | 不要 | セレクタに一致する要素の件数・構造・計算済みスタイル |
| 6 | `get_record_sample` | 外部送信を伴う読み取り | **要**※ | 表示中レコード/一覧の先頭数件。**設定で無効のときは呼べない** |
| 7 | `list_assets` | 読み取り | 不要 | 登録済みアセットの一覧(コード本文は含まない) |
| 8 | `read_asset` | 外部送信を伴う読み取り | **要** | 指定アセットのコード本文 |
| 9 | `preview_css` | 一時的副作用 | 不要 | CSSを保存せずに現在の画面へ一時適用する |
| 10 | `write_asset` | 書き込み | **要** | アセットの新規登録・更新 |
| 11 | `set_asset_state` | 書き込み | **要** | 有効/無効・影響範囲・実行順の変更 |
| 12 | `delete_asset` | 書き込み | **要** | アセットの削除 |

※ `get_record_sample` は `sendsRecordToAi` が `false` のときツール一覧に載せない(「使えないツール」を見せるとAIが混乱するため)。

### 全ツール共通の認可

ツール名やレコードIDをAIが選ぶため、一覧で見えていたことを認可の根拠にしない。IDを受け取る全ツールは、
レコード取得後に `authorizeAssetOperation` を通す。

| 操作 | 必須条件 |
| --- | --- |
| read | 対象座標が現在アプリと一致し、`public` または自分が作成した `private` |
| update / state | read条件 + kintoneレコード編集権限。`public` 化は `canPublish` も必要 |
| delete | read条件 + kintoneレコード削除権限 |
| create | target座標・作成者をサーバーコンテキストから固定。通常は `private` で作成 |

権限情報を取得できない、対象座標が欠落、scopeが未知、所有者が空の場合は拒否する。承認後に状態が変わりうるため、
実行直前に再取得して同じ検証とrevision確認を繰り返す。

### 4-1. `get_app_context`

```jsonc
{
  "name": "get_app_context",
  "description": "現在ユーザーが開いているkintoneアプリと画面の情報を取得します。最初に一度呼んでください。",
  "inputSchema": { "type": "object", "properties": {}, "additionalProperties": false }
}
```
返り値: `{ appId, appName, appDescription, screen, recordId, language, isGuestSpace, loginUser: { code, name } }`

### 4-2. `get_form_fields`

```jsonc
{
  "name": "get_form_fields",
  "description": "対象アプリのフィールド一覧を取得します。フィールドコードを使うコードを書く前に必ず呼んでください。",
  "inputSchema": {
    "type": "object",
    "properties": {
      "includeSubtable": { "type": "boolean", "description": "サブテーブル内のフィールドも含めるか。既定 true" }
    },
    "additionalProperties": false
  }
}
```
返り値: `[{ code, label, type, required, options?, unit?, subtableCode? }]`
実装は `getFormFields({ app, preview: false, guestSpaceId })`。**選択肢は先頭20件まで**に切り詰め、それ以上は件数だけ返す。

### 4-3. `get_form_layout`

レイアウト情報。スペースの要素ID、ラベル、罫線、グループを含む。
CSSやDOM挿入のコードを書くときに必要になる(`getSpaceElement(id)` の id はここからしか分からない)。
実装は `getFormLayout({ app, preview: false, guestSpaceId })`。

### 4-4. `get_views`

```jsonc
{
  "name": "get_views",
  "description": "対象アプリの一覧ビュー定義を取得します。一覧画面のカスタマイズを作るときに使います。",
  "inputSchema": { "type": "object", "properties": {}, "additionalProperties": false }
}
```
返り値: `[{ id, name, type, fields?, filterCond?, sort? }]`。実装は `getViews`。

### 4-5. `query_dom`

CSSの精度を上げるための、いちばん効くツール。

```jsonc
{
  "name": "query_dom",
  "description": "現在の画面から、CSSセレクタに一致する要素を調べます。CSSを書く前にセレクタが実在するか確認してください。",
  "inputSchema": {
    "type": "object",
    "properties": {
      "selector": { "type": "string", "description": "CSSセレクタ" },
      "limit":    { "type": "integer", "description": "調べる要素数の上限。既定3、最大10" },
      "includeComputedStyle": { "type": "boolean", "description": "計算済みスタイルの主要プロパティを含めるか" }
    },
    "required": ["selector"],
    "additionalProperties": false
  }
}
```

返り値:
```jsonc
{
  "count": 25,
  "samples": [
    {
      "tagName": "TR",
      "id": "",
      "classList": ["recordlist-row-gaia"],
      "structure": "TR.recordlist-row-gaia > TD.recordlist-cell-gaia × 6",
      "textShape": "全角12文字 / 数字3文字 / 空白2",
      "ancestors": ["BODY", "DIV.container-gaia", "TABLE.recordlist-gaia"],
      "computedStyle": { "display": "table-row", "color": "rgb(0,0,0)", "backgroundColor": "…" }
    }
  ]
}
```

**制約**: 返す文字数の総量を8KBで打ち切る。生の `outerHTML` は返さない。v1では `sendsRecordToAi` の設定に関係なく、
テキストノードを文字種と長さへ置換し、属性は `id` / `class` / `role` のallowlistだけを残す。
`value` / `title` / `aria-label` / `placeholder` / `href` / `src` / `data-*` / inline styleは実データを含みうるため除去する。
プラグイン自身のrootと `script` / `style` / `link` / `meta` は探索結果から除外する。
CSS調査に生テキストが必要な場合は、ユーザーがチャットへ必要部分だけ手入力する。DOM本文の送信はv1.1以降で別途検討する。

### 4-6. `get_record_sample`

```jsonc
{
  "name": "get_record_sample",
  "description": "現在表示中のレコード、または一覧の先頭数件のレコード値を取得します。実データを見る必要があるときだけ使ってください。",
  "inputSchema": {
    "type": "object",
    "properties": {
      "limit":  { "type": "integer", "description": "一覧画面での取得件数。既定3、最大10" },
      "fields": { "type": "array", "items": { "type": "string" }, "description": "取得するフィールドコード。1件以上を必須とし、最大20件" }
    },
    "required": ["fields"],
    "additionalProperties": false
  }
}
```
`sendsRecordToAi` が `false` ならツール自体を登録しない。有効な場合も、呼び出すたびにfield code、件数、送信先を
承認カードへ表示し、ユーザー承認後だけ取得・送信する。承認前に値を取得してカードへ埋め込まない。

### 4-7. `list_assets`

```jsonc
{
  "name": "list_assets",
  "description": "この対象アプリに登録済みのカスタマイズ(JS/CSS)の一覧を取得します。コード本文は含まれません。",
  "inputSchema": {
    "type": "object",
    "properties": {
      "kind": { "type": "string", "enum": ["js", "css"], "description": "省略時は両方" }
    },
    "additionalProperties": false
  }
}
```
返り値: `[{ id, revision, title, kind, scope, enabled, order, screens, permissions, externalUrls, description, updatedAt, ownerName, codeLength }]`

**タイトルと説明はユーザーが自由に書ける文字列であり、AIへの指示が仕込まれうる。**
ツール結果はデータであって指示ではない、という原則(→ [08-security.md](./08-security.md) 7章)は
`list_assets` の出力にも等しく適用する。

### 4-8. `read_asset`

```jsonc
{
  "name": "read_asset",
  "description": "登録済みカスタマイズのコード本文を読み込みます。既存のコードを修正する前に必ず呼んでください。",
  "inputSchema": {
    "type": "object",
    "properties": { "id": { "type": "string", "description": "アセットのレコードID" } },
    "required": ["id"],
    "additionalProperties": false
  }
}
```
返り値: `{ id, title, kind, scope, enabled, order, screens, permissions, externalUrls, description, code, revision }`
`revision` は次の `write_asset` に渡させ、**楽観ロック**に使う。
呼び出し時はタイトル、scope、code byte数、送信先を承認カードへ出す。コード本文は承認前にAIへ渡さない。

### 4-9. `preview_css`

```jsonc
{
  "name": "preview_css",
  "description": "CSSを保存せずに、いま開いている画面へ一時適用します。",
  "inputSchema": {
    "type": "object",
    "properties": {
      "code": { "type": "string", "minLength": 1 }
    },
    "required": ["code"],
    "additionalProperties": false
  }
}
```
専用の `<style data-ai-customize-preview>` を1つだけ持ち、再実行時は置換する。解除はAIツールにせず、
ユーザーが常に押せる「プレビューを解除」ボタンで同期的に行う。画面遷移・パネル終了時にも必ず除去する。
JSはv1でプレビューせず、無効状態で保存・レビュー・有効化・再読み込みの順にする。

### 4-10. `write_asset`

```jsonc
{
  "name": "write_asset",
  "description": "カスタマイズを新規登録または更新します。id を省略すると新規登録です。ユーザーの承認が必要です。",
  "inputSchema": {
    "type": "object",
    "properties": {
      "id":          { "type": "string", "description": "更新する場合のレコードID。省略時は新規" },
      "revision":    { "type": "string", "description": "更新時、read_asset で取得した revision" },
      "kind":        { "type": "string", "enum": ["js", "css"] },
      "title":       { "type": "string", "description": "何をするカスタマイズか一目で分かる名前" },
      "code":        { "type": "string" },
      "description": { "type": "string", "description": "目的・仕組み・注意点を2〜3文で" },
      "scope":       { "type": "string", "enum": ["private", "public"], "description": "既定 private" },
      "screens":     { "type": "array", "items": { "type": "string", "enum": ["index","detail","create","edit"] } },
      "order":       { "type": "integer", "description": "実行順。省略時100" },
      "permissions": { "type": "array", "items": { "type": "string", "enum": ["post","put","delete"] },
                       "description": "このコードが必要とする書き込み権限。読み取り(GET)は常に許可されるので含めない。不要なら空配列" },
      "externalUrls": { "type": "array", "items": { "type": "string" }, "maxItems": 50,
                        "description": "外部通信の送信先。例: https://api.example.com/v1/ 。1件以上指定すると『外部通信(指定先のみ)』になる。不要なら空配列" }
    },
    "required": ["kind", "title", "code", "permissions", "externalUrls"],
    "additionalProperties": false
  }
}
```

**ハンドラ側の検証(AIの出力を信用しない)**

1. `code-validator.ts` で構文チェック
   - JS: `new Function(code)` を try/catch。失敗ならエラー内容をツール結果として返し、AIに直させる。
   - CSS: `CSSStyleSheet.replaceSync()` は `@import` などの拒否確認に使うが、ブラウザーCSS parserは未知・不正な宣言を
     黙って捨てるため完全な構文検証とは扱わない。プレビュー結果と挿入後のCSSOMを警告材料にする。
2. 危険パターンの検出 → 検出したらツール結果に警告を載せ、承認ダイアログにも赤字で出す(**ブロックはしない。判断はユーザー**)
   - 一括処理: 複数レコードの更新・削除(`records.json` へのPUT/DELETE、`bulkRequest`)。権限があっても影響件数に注意を促す
   - 認証情報らしき文字列: `Authorization` / `X-Cybozu-API-Token` / 長いランダム文字列
   - `document.write`
   - ネットワークの直接利用・動的評価は、権限の迂回パターンとして3で**拒否**する(警告ではない)
3. `detectCapabilityUsage` で権限の使用状況を検査する(→ [13](./13-launch-gate-and-permissions.md) 3-4)
   - 迂回パターン(`fetch` / `window.kintone` / `eval` など)を含む → **保存を拒否**し、該当行と `kintone.api` を使う書き方をツール結果で返す
   - 使っているのに宣言していない権限がある → **拒否**し、足りない権限と行番号を返す
   - 宣言しているのに使っていない権限がある → 保存はするが、承認カードで「不要な権限」として表示し、外すことを勧める
   - メソッドを判定できない `kintone.api` 呼び出し → 承認カードで「実行時に判定」と表示する
   - `externalUrls` は13 の 3-3-2章の規則で正規化・検証する。無効なパターンがあれば**拒否**し、理由を返す
   - `kintone.proxy` の第1引数やCSSの外部URLがリテラルで、`externalUrls` のどれにも一致しない → **拒否**し、足りない送信先と行番号を返す
   - `externalUrls` にあるがコードで使っていない送信先 → 保存はするが、承認カードで「使われていない送信先」として外すことを勧める
   - `unrestricted`(制限なし)と `external-all`(外部通信すべて)はAIから要求できない。人が詳細画面で付与する
4. UTF-8で128KiBを超えるコードは保存を拒否する。上限内でも大きい場合は分割を勧める
   (→ [04-asset-app.md](./04-asset-app.md) 5章)
5. `scope: 'public'` を要求されたが公開権限がない → **拒否**し、「権限がないため『全員』では保存できません」をツール結果として返す
6. `revision` 不一致 → 「他の人が更新しました。read_asset で読み直してください」を返す
7. 更新・状態変更・削除は、IDで取得後に `(targetSpaceId, targetAppId)`、scope、作成者、レコードACLを再検証する
8. 新規作成の対象座標と所有者はツール引数にせず、現在のコンテキストから強制設定する
9. `permissions` はレコードの「権限」フィールドへ**常に明示的に書き込む**(フィールドの初期値に頼らない)。
   `externalUrls` が空でなければ `外部通信(指定先のみ)` を付け、「通信先」フィールドへ1行1件で書き込む。
   更新で既存の `unrestricted` または `external-all` が付いているレコードは、AIからの更新を拒否し、人が詳細画面で直すよう返す
   (AIの更新で、人が付けた広い権限を黙って狭めたり、そのまま引き継いだりしないため)
10. 更新時は既存の有効/無効状態を維持する。新規JSは必ず無効で保存する。新規CSSは承認カード上の
   「保存後すぐ有効にする」をユーザーが明示的に選んだ場合だけ有効にし、既定は無効にする

返り値: `{ id, revision, url }`(レコードのURL。ユーザーが確認しに行ける)

### 4-11. `set_asset_state`

```jsonc
{
  "name": "set_asset_state",
  "description": "登録済みカスタマイズの有効/無効、影響範囲、実行順を変更します。ユーザーの承認が必要です。",
  "inputSchema": {
    "type": "object",
    "properties": {
      "id":       { "type": "string" },
      "revision": { "type": "string", "description": "list_assets / read_asset で取得した revision。省略不可" },
      "enabled":  { "type": "boolean" },
      "scope":    { "type": "string", "enum": ["private", "public"] },
      "order":    { "type": "integer" },
      "permissions": { "type": "array", "items": { "type": "string", "enum": ["post","put","delete"] },
                       "description": "書き込み権限を変更するときだけ指定。指定した配列で置き換える" },
      "externalUrls": { "type": "array", "items": { "type": "string" }, "maxItems": 50,
                        "description": "送信先を変更するときだけ指定。指定した配列で置き換える。空配列で外部通信を禁止" }
    },
    "required": ["id", "revision"],
    "additionalProperties": false
  }
}
```

`write_asset` と同じく **`revision` を必須にする**。有効化・公開・実行順は、コード本文の変更と同じかそれ以上に
影響が大きい操作である(「レビュー中の危険なコードが、別の誰かの手で有効化された直後に自分が公開へ上げる」が起こりうる)。
`list_assets` の返り値に `revision` を含め、AIがそのまま渡せるようにする。

`permissions` / `externalUrls` を増やす変更は、承認カードに `write_asset` と同じ使用箇所の表示を出す。
使っていない権限・送信先を増やす要求は拒否する(最小権限。コードを変えずに権限だけ広げる経路をAIに持たせない)。
ただし `kintone.proxy` のURLを実行時に組み立てるコードでは、送信先をリテラルから判定できない。この場合は追加を拒否せず、
承認カードに「このコードは送信先を実行時に決めます。追加する送信先が正しいか確認してください」と表示する。

### 4-12. `delete_asset`

```jsonc
{
  "name": "delete_asset",
  "description": "登録済みカスタマイズを削除します。取り消せません。ユーザーの承認が必要です。",
  "inputSchema": {
    "type": "object",
    "properties": {
      "id":     { "type": "string" },
      "reason": { "type": "string", "description": "削除する理由。承認ダイアログに表示されます" }
    },
    "required": ["id", "reason"],
    "additionalProperties": false
  }
}
```
承認ダイアログでは**無効化(`set_asset_state`)を代案として併記**する。削除より無効化のほうがほぼ常に良い。

## 5. 承認フロー

```
AIが承認対象ツールを要求
  → ループ中断、承認カードを表示
      ├─ sensitive read: 送る対象・件数・byte数・送信先
      ├─ 新規write: コード全文 + 影響範囲セレクタ + 要求された権限・送信先と使用箇所
      └─ 更新write: 既存コードとの行単位diff
  → ユーザー操作
      ├─ [プレビュー] … 承認カード内でCSSを一時適用(ツールを介さない同期処理)
      ├─ [登録する]  … approved: true + 上書き値 → AI SDKがツールを実行 → ループ再開
      └─ [却下]      … approved: false + reason(任意入力) → ループ再開
```

- 承認カードのプレビューは**ツール呼び出しにしない**。`preview_css` はAIが自分の判断で画面を変えるためのツールで、
  承認カードのプレビューは「いま承認しようとしているコードを見る」ための同期操作である。混ぜると、
  承認カードを開いただけでstepを消費し、AIの応答を待つことになる。

- 承認カードの影響範囲セレクタは、**ユーザーが最終決定権を持つ**。AIが `public` を指定していてもユーザーが `private` に落とせる。
  承認レスポンス自体は approve / deny の二値しか運べないため、上書き値は `experimental_context` で `execute` へ渡し、
  適用結果(`appliedScope`)をツール結果に載せてAIへ返す(→ [07b](./07b-ai-providers.md) 4-2章)。
  返さないとAIは自分の指定が通ったと誤認し、「全員に公開しました」と事実と違う説明をする。
- 上書きできるのは `scope` / `enableAfterSave` / `order` / `screens` / `permissions` / `externalUrls`(後の2つは**減らす方向だけ**)に限る。
  `code` と `id` は上書きさせない。権限を減らした結果、コードが使う操作が許可されなくなる場合は、承認カードで
  「この操作は実行時に拒否されます」と表示し、適用結果(`appliedPermissions` / `appliedExternalUrls`)をツール結果でAIへ返す。
  承認画面で見せたコードと、実際に保存されるコードは常に同一でなければならない。
- v1の書き込みは全て承認を要求する。自動承認設定は提供しない。
- `get_record_sample` と `read_asset` も外部送信前に毎回承認する。「この会話中は常に許可」はv1で提供しない。
- 承認したツール実行は、実行内容をチャット履歴に残す(あとから「誰が何を承認したか」を追える)。
- **Agentループが完全に終わった時点**で、**プラグイン設定 `savesConversation` が有効なら**privateは削減済み会話、publicは
  本文なしのaudit modeを `conversation` へ保存する(→ [04-asset-app.md](./04-asset-app.md) 5-2)。無効なら保存しない。
  `write_asset` の `execute` 内では保存しない。その時点ではAIの締めの発言がまだ無く、末尾の欠けたログが残るため。

## 6. トークンとコストの制御

| 対策 | 内容 |
| --- | --- |
| ツール結果の切り詰め | `query_dom` 8KB / `get_form_fields` は選択肢を20件まで / `list_assets` はコード本文を含めない |
| 履歴の間引き | 生のツール結果は永続化しない。送信時も古い結果を要約へ置換し、必要なら最新値を再取得する |
| 往復上限 | `maxToolSteps`(既定8)。到達したら中断して続行ボタン |
| 使用量の表示 | 各応答の下に、その応答で消費したトークン数を小さく表示する |

## 7. 失敗時の挙動

| 失敗 | 表示 |
| --- | --- |
| 401 / 403 | 「AIの認証に失敗しました。プラグイン設定のAPIキーを確認してください」 |
| 429 | 「AIの利用制限に達しました。しばらく待って再試行してください」+ 再試行ボタン |
| タイムアウト / ネットワーク | 「AIに接続できませんでした」+ 再試行ボタン |
| ツール実行の例外 | 例外メッセージを**ツール結果としてAIへ返す**。AIに自己修復させる |
| モデルがtools非対応 | 「このモデルはツール呼び出しに対応していません」+ 設定画面への導線 |
| ツール入力がスキーマ不一致 | AI SDKの `InvalidToolInputError` を表示用エラーへ変換し、ツールは実行しない |

エラーはAI SDKの型ガードを使って表示用の判別共用体へ変換する(→ [07b](./07b-ai-providers.md) 8章)。

ツール実行の失敗をAIに返す設計にしておくと、「フィールドコードが違った → 取り直して直す」が自動で回る。
