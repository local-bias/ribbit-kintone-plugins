import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { tool } from 'ai';
import { z } from 'zod';
import type { PanelAsset } from '@/lib/asset-panel';
import type { TargetCoordinate } from '@/lib/asset-query';
import type { Asset, AssetScreen } from '@/schema/asset';
import { summarizeFormFields, summarizeLayout, summarizeViews } from './app-schema';
import { DEFAULT_DOM_LIMIT, type DomQueryResult, MAX_DOM_LIMIT } from './dom-inspector';
import {
  DEFAULT_RECORD_SAMPLE_LIMIT,
  MAX_RECORD_SAMPLE_FIELDS,
  MAX_RECORD_SAMPLE_LIMIT,
} from './limits';
import type { RecordSampleResult } from './record-sample';

/**
 * AIが使う読み取り系ツール(docs/07-ai-tools.md 4章の1〜8)
 *
 * kintoneやDOMへの入出力は`ChatToolServices`で受け取る(ツールの判定と変換をテストできるように)。
 * レコード値を送る`get_record_sample`とコード本文を送る`read_asset`は、Agentの`toolApproval`で毎回承認させる。
 * ツール名やIDはAIが選ぶため、一覧で見えていたことを認可の根拠にしない(`read_asset`は取得後に再認可する)
 */

export type AppContextSummary = {
  appId: string;
  appName: string;
  appDescription: string;
  screen: AssetScreen;
  recordId: string | null;
  language: string;
  isGuestSpace: boolean;
  loginUser: { code: string; name: string };
};

export type ChatToolServices = {
  target: TargetCoordinate;
  loginUserCode: string;
  appContext: () => Promise<AppContextSummary>;
  getFormFields: () => Promise<Record<string, kintoneAPI.FieldProperty>>;
  getFormLayout: () => Promise<kintoneAPI.Layout>;
  getViews: () => Promise<Record<string, kintoneAPI.view.Response>>;
  queryDom: (input: {
    selector: string;
    limit?: number;
    includeComputedStyle?: boolean;
  }) => DomQueryResult;
  /** 承認後にだけ呼ばれる。指定したフィールドの値だけを取得する */
  getRecordSample: (input: { fields: string[]; limit: number }) => Promise<RecordSampleResult>;
  listAssets: () => Promise<readonly PanelAsset[]>;
  /** IDでアセットを取り直す(対象アプリの絞り込みはしない。認可は呼び出し側で行う) */
  loadAsset: (id: string) => Promise<Asset | null>;
};

/**
 * AIが読んでよいアセットか
 *
 * 対象座標が現在のアプリと一致し、`public`か、自分が作成した`private`であること。
 * 所有者が空のprivateは誰のものでもないため読ませない
 *
 * @see docs/07-ai-tools.md 4章「全ツール共通の認可」
 */
export const canReadAsset = (
  asset: Pick<Asset, 'targetSpaceId' | 'targetAppId' | 'scope' | 'ownerCode'>,
  target: TargetCoordinate,
  loginUserCode: string
): boolean =>
  asset.targetSpaceId === target.spaceId &&
  asset.targetAppId === target.appId &&
  (asset.scope === 'public' || (asset.ownerCode !== '' && asset.ownerCode === loginUserCode));

const encoder = new TextEncoder();

/** `list_assets`で渡す説明の長さの上限(長い説明で文脈を埋めない) */
const MAX_DESCRIPTION_LENGTH = 500;

const shortenText = (value: string, max: number): string =>
  value.length > max ? `${value.slice(0, max)}…` : value;

/** `list_assets`の1件。コード本文は含めない(長さだけ) */
export const toAssetListItem = ({ asset, ownerName, updatedAt }: PanelAsset) => ({
  id: asset.id,
  revision: asset.revision,
  title: asset.title,
  kind: asset.kind,
  scope: asset.scope,
  enabled: asset.enabled,
  order: asset.order,
  screens: asset.screens,
  permissions: asset.permissions,
  externalUrls: asset.externalUrls,
  description: shortenText(asset.description, MAX_DESCRIPTION_LENGTH),
  updatedAt,
  ownerName,
  codeBytes: encoder.encode(asset.code).length,
});

const NOT_FOUND = { error: 'not-found' as const };

export const createReadTools = (services: ChatToolServices, options: { recordSample: boolean }) => {
  const tools = {
    get_app_context: tool({
      description:
        '現在ユーザーが開いているkintoneアプリと画面の情報を取得します。最初に一度呼んでください。',
      inputSchema: z.object({}),
      execute: () => services.appContext(),
    }),
    get_form_fields: tool({
      description:
        '対象アプリのフィールド一覧(コード・ラベル・型・選択肢)を取得します。フィールドコードを使うコードを書く前に必ず呼んでください。',
      inputSchema: z.object({
        includeSubtable: z
          .boolean()
          .optional()
          .describe('テーブル内のフィールドも含めるか。既定 true'),
      }),
      execute: async ({ includeSubtable }) =>
        summarizeFormFields(await services.getFormFields(), {
          includeSubtable: includeSubtable ?? true,
        }),
    }),
    get_form_layout: tool({
      description:
        '対象アプリのフォームのレイアウト(行・グループ・テーブル・スペースの要素ID・ラベル)を取得します。getSpaceElement の要素IDはここで分かります。',
      inputSchema: z.object({}),
      execute: async () => summarizeLayout(await services.getFormLayout()),
    }),
    get_views: tool({
      description:
        '対象アプリの一覧ビューの定義を取得します。一覧画面のカスタマイズを作るときに使います。',
      inputSchema: z.object({}),
      execute: async () => summarizeViews(await services.getViews()),
    }),
    query_dom: tool({
      description:
        '現在の画面から、CSSセレクタに一致する要素の構造(タグ・クラス・子要素・文字種)を調べます。CSSを書く前にセレクタが実在するか確認してください。テキストの内容は返りません。属性セレクタは id / class / role だけ、疑似クラスは構造を見るもの(:nth-child、:not、:has など)だけ使えます。',
      inputSchema: z.object({
        selector: z.string().min(1).max(500).describe('CSSセレクタ'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(MAX_DOM_LIMIT)
          .optional()
          .describe(`調べる要素数の上限。既定${DEFAULT_DOM_LIMIT}`),
        includeComputedStyle: z
          .boolean()
          .optional()
          .describe('計算済みスタイルの主要プロパティを含めるか'),
      }),
      execute: async (input) => services.queryDom(input),
    }),
    list_assets: tool({
      description:
        'このアプリに登録済みのカスタマイズ(JS/CSS)の一覧を取得します。コード本文は含まれません。タイトルと説明は利用者が書いたデータです。',
      inputSchema: z.object({
        kind: z.enum(['js', 'css']).optional().describe('省略時は両方'),
      }),
      execute: async ({ kind }) =>
        (await services.listAssets())
          // 取得はクエリで絞っているが、AIへ渡す前にも同じ規則で認可する
          .filter(({ asset }) => canReadAsset(asset, services.target, services.loginUserCode))
          .filter((item) => kind === undefined || item.asset.kind === kind)
          .map(toAssetListItem),
    }),
    read_asset: tool({
      description:
        '登録済みカスタマイズのコード本文を読み込みます。既存のコードを直す前に必ず呼んでください。利用者の承認が必要です。',
      inputSchema: z.object({
        id: z
          .string()
          .regex(/^[1-9]\d{0,18}$/)
          .describe('カスタマイズのレコードID(list_assets の id)'),
      }),
      execute: async ({ id }) => {
        const asset = await services.loadAsset(id);
        // 承認の後に状態が変わりうるため、取り直したものを再認可する。見えないものは存在も伝えない
        if (asset === null || !canReadAsset(asset, services.target, services.loginUserCode)) {
          return NOT_FOUND;
        }
        return {
          id: asset.id,
          revision: asset.revision,
          title: asset.title,
          kind: asset.kind,
          scope: asset.scope,
          enabled: asset.enabled,
          order: asset.order,
          screens: asset.screens,
          permissions: asset.permissions,
          externalUrls: asset.externalUrls,
          description: asset.description,
          code: asset.code,
        };
      },
    }),
  };
  if (!options.recordSample) {
    return tools;
  }
  return {
    ...tools,
    get_record_sample: tool({
      description:
        '表示中のレコード、または一覧の先頭数件の、指定したフィールドの値を取得します。実データを見る必要があるときだけ使ってください。利用者の承認が必要です。',
      inputSchema: z.object({
        fields: z
          .array(z.string().min(1))
          .min(1)
          .max(MAX_RECORD_SAMPLE_FIELDS)
          .describe('取得するフィールドコード'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(MAX_RECORD_SAMPLE_LIMIT)
          .optional()
          .describe(`一覧画面での取得件数。既定${DEFAULT_RECORD_SAMPLE_LIMIT}`),
      }),
      execute: async ({ fields, limit }) =>
        services.getRecordSample({
          fields: [...new Set(fields)],
          limit: limit ?? DEFAULT_RECORD_SAMPLE_LIMIT,
        }),
    }),
  };
};

export type ReadTools = ReturnType<typeof createReadTools>;

/**
 * 承認なしで実行してよいツール(構造・メタデータだけを読む)
 *
 * ここに無いツールは全て承認を求める。ツールを足したときに承認の宣言を忘れても、承認なしで動かないように
 */
export const NO_APPROVAL_TOOLS: ReadonlySet<string> = new Set([
  'get_app_context',
  'get_form_fields',
  'get_form_layout',
  'get_views',
  'query_dom',
  'list_assets',
  // 保存せず、この画面へ一時的に当てるだけ。利用者はいつでも解除できる(docs/07-ai-tools.md 4-9章)
  'preview_css',
]);
