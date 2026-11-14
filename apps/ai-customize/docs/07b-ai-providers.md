# 07b. AIプロバイダ統合

> [07-ai-tools.md](./07-ai-tools.md) の付属文書。BYOKで複数プロバイダへ接続するが、プロトコル変換は自前実装しない。

## 1. 結論: AI SDK 7を使う

AI呼び出しは `ai@7` の `ToolLoopAgent` と公式プロバイダーパッケージ `@ai-sdk/*`(openai / anthropic / google / azure は4系、openai-compatible は3系。いずれも `@ai-sdk/provider-utils@5`) で実装する(ADR-40)。
OpenAI / Anthropic / Geminiごとの会話形式、ツール呼び出し、終了理由、使用量、JSON Schema方言を
本プラグイン独自のアダプターへ再実装しない。

採用理由:

- `ToolLoopAgent` はツールループ、ステップ上限、`onStepEnd`、`AbortSignal`を提供する。
- `tool({ inputSchema, contextSchema, execute })` で入力と実行時コンテキストをZodで型付けし、
  人間の承認は `ToolLoopAgent` の `toolApproval` でツールごとに宣言できる。
- 各公式プロバイダーがAPI差分を吸収するため、プロバイダーの仕様変更を追う場所が減る。
- `ai/test` の `MockLanguageModelV3` で、実APIを使わず承認・複数ステップ・異常応答をテストできる。
- 各プロバイダーはcustom `fetch`を受け取れるため、`@konomi-app/ketch` を経由する要件と両立する。

根拠: [AI SDK 7 Migration Guide](https://ai-sdk.dev/docs/migration-guides/migration-guide-7-0)、
[AI SDK: Building Agents](https://ai-sdk.dev/docs/agents/building-agents)、
[Tools and Tool Calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)、
[Testing](https://ai-sdk.dev/docs/ai-sdk-core/testing)。

### AI SDK 6からの主な変更(2026-06-25 リリースの7.0)

`ai@7.0.118` と `@ai-sdk/provider-utils@5.0.49` の型定義で確認した(2026-09-28)。実装は `ai@7.0.148` で、契約テスト(`src/lib/ai/sdk-contract.test.ts`)で挙動を固定している(2026-10-23)。

| 6 | 7 | 本プラグインへの影響 |
| --- | --- | --- |
| `tool({ needsApproval })` | `ToolLoopAgent` / `generateText` の `toolApproval`(`needsApproval` はdeprecated) | 承認の要否をツール定義ではなくAgentで宣言する(4章) |
| `experimental_context`(全ツール共通の1つの値) | `runtimeContext`(生成全体)と `toolsContext`(ツール名ごと。ツールは `contextSchema` で型を持つ) | 承認の上書き値を `toolsContext` で渡す(4-2) |
| `system` | `instructions` | — |
| `stepCountIs(n)` | `isStepCount(n)`(旧名は別名として残る) | 4章 |
| `onFinish` / `experimental_onStepStart` など | `onEnd` / `onStepStart` など | — |
| CommonJS | ESMのみ。Node.js 22以上 | ビルド時の要件。ブラウザーのバンドルには影響しない |

`tool-approval-request` / `tool-approval-response` のmessage part、`MockLanguageModelV3`(`ai/test`)、
`experimental_toolApprovalSecret`、各プロバイダーの `fetch` オプションは7でも同じ名前で残っている。

`apps/ai-chat` は `ai@^6` のまま。本プラグインは `ai` / `@ai-sdk/*` をcatalogへ入れず(ADR-30)、
レンジを直書きするので、既存アプリと版が分かれても `catalogMode: strict` には抵触しない。

## 2. 対応プロバイダー

| ID | パッケージ / factory | 備考 |
| --- | --- | --- |
| `openai` | `@ai-sdk/openai` / `createOpenAI` | OpenAI Responses APIを使う。Chat Completionsに固定しない |
| `anthropic` | `@ai-sdk/anthropic` / `createAnthropic` | Messages API |
| `google` | `@ai-sdk/google` / `createGoogleGenerativeAI` | Generative Language API |
| `openrouter` | `@ai-sdk/openai-compatible` / `createOpenAICompatible` | OpenAI互換Chat API |
| `azure-openai` | `@ai-sdk/azure` / `createAzure` | Azureのデプロイ名とAPIバージョンを設定に持つ |
| `custom` | `@ai-sdk/openai-compatible` / `createOpenAICompatible` | 管理者が指定したHTTPSのOpenAI互換API |

各パッケージは `fetch` オプションを提供する。
[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)、
[Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)、
[Google Generative AI](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai)、
[OpenAI Compatible](https://ai-sdk.dev/providers/openai-compatible-providers) の公式ドキュメントを実装時の基準にする。

`ai` とプロバイダーは `desktop.js` に含めて1ファイルで配布する(ADR-47)。`webpackMode: "eager"` の動的 `import()` で、
評価だけをチャットで最初に送信したときまで遅らせ、選択中の1パッケージだけを初期化する。

## 3. kintoneプロキシ用fetch

`createRestrictedProxyFetch` は通常の `fetch` と同じ `Promise<Response>` を返し、内部で `ketch` を呼ぶ。
AI SDKから渡される `RequestInfo | URL` を正規化し、設定時に確定した次の条件と一致しなければ通信前に拒否する。

- `https:` である
- 許可したoriginと完全一致する
- 許可したpathnameと完全一致する
- HTTPメソッドが `POST`
- ユーザー情報を含むURL、予期しないquery/hashを含まない
- リダイレクトを追わない。最終URLを検証できないプロキシ仕様の場合、3xxをエラーにする

```ts
export type ProxyEndpoint = Readonly<{
  origin: string;
  pathname: string;
  search: string;
  method: 'POST';
}>;

export const createRestrictedProxyFetch = (
  endpoint: ProxyEndpoint,
  proxyFetch: typeof fetch
): typeof fetch => {
  return async (input, init) => {
    const request = new Request(input, init);
    assertAllowedProxyRequest(request, endpoint);
    const body = request.body === null ? undefined : await request.clone().text();

    // ketch 0.4.0はRequest本体ではなく第2引数からmethod/headers/bodyを読むため、
    // 必ずURLとRequestInitへ展開して渡す。
    return proxyFetch(request.url, {
      method: request.method,
      headers: request.headers,
      body,
      signal: request.signal,
    });
  };
};
```

### `ketch` が `AbortSignal` を捨てることは確定している(要実測ではない)

`@konomi-app/ketch@0.4.0` の実装は `init` から `method` / `headers` / `body` だけを読み、`signal` を参照しない。
`kintone.plugin.app.proxy` 自体にも中断の手段がない。したがって**中断は必ずwrapper側で実装する**。

```ts
// 送信済みリクエストは止まらない。止まるのは「待つのをやめる」ことだけ。
const raced = await Promise.race([
  proxyFetch(request.url, { method: request.method, headers: request.headers, body }),
  abortPromise(request.signal), // signal.reason で reject する
]);
```

- UIの待機とAgentループは即座に止まる。
- 外部リクエストは完走し、**トークンは課金される**。停止ボタンのツールチップにこの旨を書く。
- 中断後に到着したレスポンスは破棄する。破棄したレスポンスの内容をUI・ログ・対話ログへ出さない。

### `ketch` のResponse組み立てで踏みうる穴

`ketch` は `new Response(bodyString, { status, headers })` を返す。次はwrapper側で吸収する。

| 事象 | 対処 |
| --- | --- |
| `status` が204/304などnull body statusのとき `new Response` がTypeErrorを投げる | wrapperでtry/catchし、「AIから空応答が返りました」へ変換する |
| `status` が0や範囲外のとき `new Response` がRangeErrorを投げる | 同上。ネットワーク層の失敗として扱う |
| レスポンス本文は常に文字列(10MB上限) | バイナリ・SSEを前提にしない。10MB超はkintone側でエラーになる |

`Request`入力、文字列入力、body、header、abort、上の異常statusを契約テストに含める。

この検証は本プラグイン自身の誤実装を止めるためのもの。アセットJSは同じページ上の
`kintone.plugin.app.proxy` を直接呼べるため、認証済みエンドポイントの**利用そのもの**は阻止できない。
この残余リスクは [08-security.md](./08-security.md) で運用判断の対象にする。

## 4. Agentとツール

```ts
import { isStepCount, ToolLoopAgent } from 'ai';

export const createCustomizeAgent = (ctx: AgentContext) =>
  new ToolLoopAgent({
    model: ctx.model,
    instructions: buildSystemPrompt(ctx),
    tools: createTools(ctx),
    // 承認の要否はAgentで宣言する。ここに無いツールは即時 execute する
    toolApproval: {
      get_record_sample: 'user-approval',
      read_asset: 'user-approval',
      write_asset: 'user-approval',
      set_asset_state: 'user-approval',
      delete_asset: 'user-approval',
    },
    callOptionsSchema: ApprovalOverridesSchema, // 4-2
    prepareCall: ({ options, ...rest }) => ({
      ...rest,
      toolsContext: buildToolsContext(ctx, options),
    }),
    stopWhen: isStepCount(ctx.maxToolSteps),
  });
```

- ツールはZodの `inputSchema` を唯一の入力型とし、`z.infer` でハンドラーまで型を通す。
  実行時コンテキスト(対象座標・画面・ログインユーザー・承認の上書き)は `contextSchema` で型を持ち、`execute(input, { context })` で受け取る。
- 構造・メタデータだけの読み取りツールは即時 `execute` する。レコード値を送る `get_record_sample`、コード本文を送る
  `read_asset`、全書き込みツールは `toolApproval` で `'user-approval'` とする。
  `'approved'`(自動承認)は使わない。`needsApproval` はdeprecatedのため使わない。
- `scope: public`、削除、JS実行を含む操作は設定に関係なく常に承認する。
- v1では自動承認設定を提供しない。
- UIへはAI SDKのmessage/content partをそのまま渡さず、表示用の判別共用体へ変換する。
- `onStepEnd` でツールカード、使用量、警告をUIへ追加する。
- 履歴は **`result.responseMessages`**(承認したツールの実行結果 + 全step)で積む。`result.response.messages` は**最後のstepだけ**で、
  これで積むと承認したツールの結果が欠け、次の生成が `MissingToolResultsError` になる(契約テストで確認)。
- 永続化(P4)には `responseMessages` を基礎にするが、ツール出力は [04-asset-app.md](./04-asset-app.md) の規則で削減する。

## 4-2. 承認の再開はAI SDKの仕組みに乗る(自前でtool結果をpushしない)

AI SDKの承認は一級の機能であり、当初案の「承認したらこちらでツールを実行して `tool` メッセージを作る」は**採らない**。
自前で組むとツール結果partの形・IDの対応・`invalid` 入力の扱いをSDKと二重に持つことになる。

```ts
// 1) 生成。toolApproval で 'user-approval' のツールは実行されず、承認要求として返る
const first = await agent.generate({ messages, abortSignal });

// assistant メッセージの content に
//   { type: 'tool-approval-request', approvalId, toolCallId, signature? }
// が入る。generate結果の content part 側は
//   { type: 'tool-approval-request', approvalId, toolCall }
// で、toolCall.input から承認カードの表示内容を作る。

// 2) ユーザーの判断を tool メッセージとして積み、同じ会話で再度generateする
const resumed = await agent.generate({
  messages: [
    ...messages,
    ...first.responseMessages, // response.messages は最後のstepだけ
    {
      role: 'tool',
      content: [
        { type: 'tool-approval-response', approvalId, approved: true },
        // 却下は approved: false。reason は任意入力をそのまま渡す
      ],
    },
  ],
  abortSignal,
});
// 承認されたツールは SDK が execute を呼び、そのままループが続く
```

- 承認要求は**1stepに複数返りうる**。UIは表示順に1件ずつ承認させるが、`generate` へ渡すのは
  「その時点で判断が確定した `tool-approval-response` の集合」であり、未判断のものを残したまま再開しない。
- `InvalidToolApprovalError` / `InvalidToolApprovalSignatureError` / `ToolCallNotFoundForApprovalError` は
  こちら側のメッセージ組み立てバグを示す。ユーザー向けには汎用文言を出し、開発時は握りつぶさない。
- `experimental_toolApprovalSecret` はapprovalIdとtoolCallの結び付きにHMAC署名を付ける機能だが、
  **本プラグインは全てブラウザで動くため、これはセキュリティ境界にならない**(秘密がバンドルに載る)。
  設定しても「改ざん防止」と説明しない。実際の防壁はツール `execute` 内の再認可(→ [07-ai-tools.md](./07-ai-tools.md) 4章)である。

### ユーザーがツール入力を上書きする経路

承認カードでは影響範囲(`scope`)や「保存後すぐ有効にする」をユーザーが最終決定する(→ [06-ui.md](./06-ui.md))。
一方 `tool-approval-response` は **approve / deny の二値しか運べない**。入力の書き換えには使えない。

したがって上書きは再開時の呼び出しオプション(`callOptionsSchema`)で受け、`prepareCall` で
該当ツールの `toolsContext` へ写し、`execute` 側で適用する。

```ts
// agent.ts: 呼び出しごとの上書き値を、ツールごとのcontextへ写す
const ApprovalOverridesSchema = z.object({
  approvalOverrides: z.record(z.string(), ApprovalOverrideSchema), // key は toolCallId
});

const resumed = await agent.generate({
  messages: [...],
  options: {
    approvalOverrides: { [toolCallId]: { scope: 'private', enableAfterSave: false } },
  },
  abortSignal,
});

// tools.ts: contextSchema で型を持ち、execute で受け取る
const writeAsset = tool({
  inputSchema: WriteAssetInputSchema,
  contextSchema: WriteAssetContextSchema, // 対象座標・ログインユーザー・approvalOverrides
  execute: async (input, { context, toolCallId }) => {
    const override = context.approvalOverrides[toolCallId];
    const effective = { ...input, scope: override?.scope ?? input.scope ?? 'private' };
    // ... 認可 → 実行
    return { ...result, appliedScope: effective.scope, overriddenByUser: override != null };
  },
});
```

- 上書きした事実は**ツール結果に含めてモデルへ返す**。返さないとAIは自分の指定が通ったと誤認し、
  次の発言で「全員に公開しました」と嘘をつく。
- 上書きできるのは `scope` / `enableAfterSave` と、減らす方向の `permissions` / `externalUrls` に限る(07 5章)。`code` と `id` は上書きさせない
  (別物を保存したのに承認画面と一致しない状態を作らないため)。
- `toolsContext` はツール名ごとに分かれているため、上書き値は該当するツール(`write_asset` / `set_asset_state`)の
  contextにだけ載せる。読み取り系ツールへ渡さない。
- `prepareCall` と `contextSchema` の組み合わせで再開時に上書きが効くことを、P3で `MockLanguageModelV3` の契約テストにする。

### 承認の応答は、再開が成功してから履歴に入れる

`tool-approval-response` を履歴に積んだまま再開が止まる・失敗すると、末尾が承認の応答のまま残る。
その後に利用者が新しい発言を送ると、SDKは末尾が `tool` のときしか承認を処理しないため、ツール結果の欠けた履歴になり
`MissingToolResultsError` で会話が二度と進まなくなる(SDKで再現済み)。

- 承認の応答は `ChatState.resume` に持ち、生成には `[...messages, resume]` を渡す。成功したときだけ `resume` と結果をまとめて履歴へ入れる
- 再開を止めたら承認待ちへ戻して判断し直させる。失敗したら再試行で同じ再開をやり直す(承認済みのツールは再試行で1回だけ再実行される)
- `resume` が残っている間は新しい発言を送らせない

stepの途中経過(`onStepEnd`)は**表示だけ**に使い、履歴には全体が成功してから入れる(途中で確定すると、承認したツールの結果が
入らない状態ができる)。止めた・失敗した生成の途中経過は捨てる。

### step上限はユーザー発言単位で累積する

`stopWhen: isStepCount(n)` は `generate` 1回ごとにリセットされる。承認で中断・再開するたびに
上限が復活すると `maxToolSteps` が意味を失う。**1回のユーザー発言に対する累積step数**を
`chat.ts` のatomで数え、再開時は `isStepCount(残り)` を渡す。残り0なら再開せず「続行」ボタンを出す
(承認要求が上限ちょうどのstepで出た場合も、承認を判断した時点で「続行」にする。`isStepCount(0)` では呼ばない)。

## 5. プロキシ設定の登録と接続確認

### 前提: プラグイン設定画面から `kintone.plugin.app.proxy` は呼べない

公式仕様の「対象画面」に**プラグイン設定画面が含まれていない**。
[プラグインから外部APIを実行する](https://cybozu.dev/ja/kintone/docs/js-api/plugins/kintone-plug-in-proxy/)

これは当初案の「設定画面の『接続を確認』ボタンで、保存済み秘密を使って1往復投げる」を直接否定する。
設定画面での接続確認は、**保存済み秘密ではなく、管理者がいま入力したキーをメモリー上だけで使って**行う。

| 経路 | 使うAPI | 秘密の出どころ | 使える画面 |
| --- | --- | --- | --- |
| 設定画面の「接続を確認」 | `kintone.proxy` | 入力欄の値(メモリーのみ。保存しない) | 設定画面(P-1で要確認) |
| 操作画面のチャット | `kintone.plugin.app.proxy`(= `ketch`) | proxy設定の保存済みヘッダー | 一覧・詳細・追加・編集 |
| 操作画面の「AI接続診断」 | 同上 | 同上 | 同上 |

`kintone.proxy` の公式ページも対象画面を「PC / モバイル」としか書いておらず、設定画面での可否は明記がない。
**P-1で実測し、次のいずれかへ倒す。**

- **使える場合**: 設定画面で接続確認を行い、成功したときだけ保存する(当初案どおりの体験)。
- **使えない場合**: 設定画面は形式検証(必須項目・URL形式・モデル名の空判定)だけを行い、
  保存後に**操作画面のランチャーへ「AI接続診断」**を出す。診断が通るまでチャットタブに
  「未検証」バッジを出し、失敗内容(認証/ツール非対応/到達不可)を設定画面への導線付きで表示する。

どちらに倒れても「設定したのに動かない理由が分からない」状態は作らない。これが接続確認の目的である。

### APIキーはendpointが変わったら再入力させる(旧秘密の移行を実装しない)

当初案は `getProxyConfig` で旧endpointの秘密を読み、新endpointへ移し替える手順だった。これは採らない。

- 移行の唯一の利点は「管理者がキーを打ち直さずに済む」ことで、失敗時の中途半端な状態(旧endpoint削除済み・
  新endpoint未検証)を作りうる代償に見合わない。
- 秘密をメモリーへ載せる箇所を1つ減らせる。
- 設定画面で接続確認ができない可能性(上記)がある以上、「移行して検証してから旧を消す」手順自体が成立しない。

したがって次のようにする。

1. providerType / baseUrl / azure各項目 / model のいずれかを変えた結果、**生成endpointが変わる**なら、
   設定画面が「APIキーの再入力が必要です」を表示し、入力があるまで保存ボタンを無効にする。
   endpointが変わるかどうかは純粋関数 `buildProxyEndpoint(common)` の結果比較で判定する(テスト対象)。
2. 保存時の順序を守る。**`setConfig` は画面遷移を起こすため必ず最後**。
   1. 新endpointへ `setPluginProxyConfig`(認証ヘッダー)
   2. 旧endpoint(`registeredProxyEndpoint`)が新と異なるなら、空ヘッダー・空ボディで上書きして無効化
   3. `setConfig` に通常設定と新しい `registeredProxyEndpoint` / `registeredProxyMethod` を保存
3. `getProxyConfig(url, method)` は**秘密を読むためではなく、「現在のendpointにキーが登録済みか」を判定する用途にだけ**使う。
   返り値の中身をatom・ログ・例外・エクスポートJSONへ入れない。設定画面は「設定済み / 未設定」しか表示しない。

`setProxyConfig` の設定は、同一アプリ・同一プラグイン・同一メソッドで、URLが**前方一致**すると付与される。
したがって「ドメインを1つ登録すれば安全」ではない。生成リクエストのendpointを、queryを除いた**最長のpathまで**登録し、
wrapper側でorigin/path/query/methodの完全一致を検証する。
公式仕様: [外部APIの実行に必要な情報をプラグインへ保存する](https://cybozu.dev/ja/kintone/docs/js-api/plugins/set-config-for-proxy/)。

プラグイン設定には秘密値ではなく、最後に登録した `registeredProxyEndpoint` と `registeredProxyMethod` だけを保存する。
`getProxyConfig` はプラグイン設定画面で保存済みヘッダーを返すことが公式仕様に明記されているため、
「アプリ管理者からAPIキーを隠せる」とは扱わない。
[外部APIの実行に必要な情報を取得する](https://cybozu.dev/ja/kintone/docs/js-api/plugins/get-config-for-proxy/)。

> **エクスポート/インポートの注意**: `@repo/plugin/react` の設定エクスポートは通常設定のJSONだけを出す。
> proxy設定は含まれないため、インポートした環境では必ずAPIキーの再入力が必要になる。設定画面で明示する。

### モデル変更がendpointを変えるプロバイダーがある

| provider | endpointの形 | modelで変わるか |
| --- | --- | --- |
| OpenAI | `https://api.openai.com/v1/responses` | 変わらない |
| Anthropic | `https://api.anthropic.com/v1/messages` | 変わらない |
| Google | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` | **変わる** |
| Azure OpenAI | `https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions?api-version=...` | **デプロイ名で変わる**(queryは前方一致の対象外) |
| OpenRouter / custom | `{baseUrl}/chat/completions` | 変わらない |

Google と Azure はモデル/デプロイ名を変えるだけでproxy設定の再登録が必要になる。
`buildProxyEndpoint` はこの差をテーブルで持ち、単体テストする。

### AI SDKの認証ヘッダーとの接続

操作画面はAPIキーを取得しないため、provider factoryへは秘密ではない固定sentinel
`__KINTONE_PROXY_MANAGED__` を `apiKey` として渡す。AI SDKが作る認証ヘッダーと同じ名前で、本物の値を
proxy設定へ保存する。

| provider | proxy設定へ保存する認証ヘッダー |
| --- | --- |
| OpenAI / OpenRouter / custom | `Authorization: Bearer <key>` |
| Anthropic | `x-api-key: <key>` |
| Google | `x-goog-api-key: <key>` |
| Azure OpenAI | `api-key: <key>` |

kintone公式仕様では、実行時ヘッダーと保存済みヘッダーのキーが重複した場合は**保存済み設定が優先**される。
ただし `ketch` はヘッダー名を小文字にして渡すため、大文字小文字の扱いに頼らないよう、**sentinelを値に持つヘッダーは
restricted proxy fetchで取り除いてから**proxyへ渡す。保存するヘッダー名も小文字に揃える(`authorization` など)。ただしこれは統合の根幹なので、P-1で各providerの
実リクエストについてheader名、上書き、endpoint、bodyを確認する。provider更新で認証方式が変わった場合は接続確認を失敗させる。
[プラグインから外部APIを実行する](https://cybozu.dev/ja/kintone/docs/js-api/plugins/kintone-plug-in-proxy/)。

## 6. モデルと生成設定

- モデルIDは自由入力 + 候補補完。ドキュメントやコードに「最新モデル」の固定値を書かない。
- 候補はリリースごとに各社公式のモデル一覧から更新し、取得日をコードコメントへ残す。
- 接続確認は認証だけでなく、型付きツールを実際に1回呼べることまで検証する。
- `temperature` は既定で未指定。モデルによって未対応・推奨値が異なるため、詳細設定を開いた場合だけ送る。
- `maxOutputTokens` と `maxToolSteps` を上限として持つ。AI SDKの警告は捨てず、設定画面の診断結果へ表示する。
- プロバイダー固有機能はv1で使わない。共通ツール呼び出しだけを利用する。

## 7. 非ストリーミング

`kintone.plugin.app.proxy` はレスポンス本文を文字列として完了時に返すため、v1は `agent.generate()` を使う。
SSEの逐次受信を前提にしない。公式仕様にはレスポンス本文10MB、文字列のみという制限はあるが、
タイムアウト値は明記されていないため、設定画面の接続確認と実機試験で測る。
[プラグインから外部APIを実行する](https://cybozu.dev/ja/kintone/docs/js-api/plugins/kintone-plug-in-proxy/)。

停止操作は `AbortSignal` を渡すが、`ketch` も `kintone.plugin.app.proxy` も中断を伝えない(3章)。
止まるのはクライアント側の待機だけで、**生成と課金は継続する**。UIでもそう書く。

タイムアウトも自前で持つ。proxyのtimeout値は公式に記載がないため、wrapperで上限(既定90秒、P-1の実測で調整)を
設定し、超過したら中断と同じ扱いにする。「いつまでも回り続けるスピナー」を作らない。

## 8. エラーと再試行

- AI SDKの `APICallError`、`InvalidToolInputError`、`NoSuchToolError` などをUI用エラーへ分類する。
- 429 / 5xx / ネットワークエラーだけを再試行候補とし、書き込みツール実行後は自動再試行しない。
- AI SDK側の既定再試行回数は明示的に `0` とし、UIからユーザーが再試行する。二重課金と重複ツール実行を避けるため。
- 生レスポンスや認証ヘッダーをログへ出さない。開発モードでも同じ。

## 9. テスト

| 対象 | 必須ケース |
| --- | --- |
| provider factory | 設定から正しいfactory/modelが選ばれる、未対応設定を拒否する |
| restricted proxy fetch | Request/文字列入力を同じ送信内容へ変換し、origin/path/query/methodの完全一致、prefix攻撃、userinfo、3xxを拒否する |
| ToolLoopAgent | 読み取りの複数step、承認で停止、承認/却下後の再開、step上限、abort |
| tools | Zod入力検証、対象アプリ境界、レコードACL、revision競合 |
| proxy移行 | 新設定の確認成功後だけ旧設定を消す。途中失敗では旧設定を維持する |
| proxy認証 | providerごとのsentinelヘッダーが保存済み秘密で上書きされ、sentinel自体は送信されない |
| provider smoke | 各プロバイダーにつき、接続確認用fixtureまたは契約テストを1本持つ |
| 承認の再開 | `tool-approval-response` で再開し承認ツールが実行される / 却下で実行されない / 未判断を残して再開しない |
| 承認の上書き | 再開時の `options.approvalOverrides` が `prepareCall` 経由で `write_asset` の `toolsContext` に載り、`scope` 上書きが `execute` に効き、結果に `appliedScope` が載る。読み取り系ツールのcontextには載らない |
| step累積 | 承認をまたいで累積stepが `maxToolSteps` を超えない |
| abort / timeout | signalでwrapperがrejectする、90秒でtimeoutする、中断後に届いた応答を捨てる |
| ketch異常応答 | status 204 / 0 / 範囲外でRangeError・TypeErrorを投げずUI用エラーになる |
| endpoint算出 | `buildProxyEndpoint` がprovider・model・deploymentの変更を正しく反映し、再入力要否を判定する |

AI SDK自体のプロトコル変換を固定JSONで再テストしない。本プラグインが責任を持つ境界
（設定、URL制限、権限、承認、永続化）を重点的にテストする。
