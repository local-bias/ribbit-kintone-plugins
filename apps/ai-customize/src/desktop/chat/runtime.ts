import { createKetch } from '@konomi-app/ketch';
import {
  getApp,
  getFormFields,
  getFormLayout,
  getRecord,
  getRecords,
  getViews,
} from '@konomi-app/kintone-utilities';
import { createCustomizeAgent } from '@/lib/ai/agent';
import type { GenerateOutcome } from '@/lib/ai/chat-session';
import { inspectDom } from '@/lib/ai/dom-inspector';
import type { ProxyEndpoint } from '@/lib/ai/endpoint';
import { type AiError, classifyAiError } from '@/lib/ai/errors';
import { buildSystemPrompt } from '@/lib/ai/prompt';
import { createLanguageModel } from '@/lib/ai/provider-factory';
import { createRestrictedProxyFetch } from '@/lib/ai/proxy-fetch';
import { pickRecordValues, toSampleQuery } from '@/lib/ai/record-sample';
import { runAgent } from '@/lib/ai/run';
import { type ChatToolServices, canReadAsset, createReadTools } from '@/lib/ai/tools';
import { type AssetRecord, toAsset } from '@/lib/asset-mapper';
import { LAUNCHER_ROOT_ID, NOTICE_ROOT_ID } from '@/lib/constants';
import { GUEST_SPACE_ID, isDev, LANGUAGE, LOGIN_USER, PLUGIN_ID } from '@/lib/global';
import type { AssetScreen } from '@/schema/asset';
import type { LauncherServices } from '../launcher/services';

/**
 * チャットの実行部分(AI SDK・プロバイダー・ツールの実装)
 *
 * `desktop.js`に含めるが(1ファイルで配布する。ADR-47)、評価はチャットで最初に送信したときまで遅らせる。
 * 画面の部品とチャットの状態(`states/chat.ts`)からは型だけを参照する
 *
 * @see docs/07b-ai-providers.md 2章
 */

export type ChatRuntime = {
  run: (params: Omit<Parameters<typeof runAgent>[0], 'agent'>) => Promise<GenerateOutcome>;
  classifyError: (error: unknown) => AiError;
};

/**
 * `query_dom`の探索から外す、本プラグインのUI
 *
 * MUIのメニュー・ツールチップ・ダイアログ・通知はbody直下へ描かれるため、それらも外す
 */
const excludedRootSelector = [
  `#${LAUNCHER_ROOT_ID}`,
  `#${NOTICE_ROOT_ID}`,
  '.MuiPopover-root',
  '.MuiPopper-root',
  '.MuiDialog-root',
  '.MuiModal-root',
  '.notistack-SnackbarContainer',
].join(', ');

/** `get_app_context`で渡すアプリの説明の上限(HTMLのタグを除いた文字数) */
const MAX_APP_DESCRIPTION = 500;

const toPlainText = (html: string, max: number): string => {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

const createToolServices = (params: {
  services: LauncherServices;
  screen: AssetScreen;
  recordId: string | null;
  appName: string;
  appDescription: string;
}): ChatToolServices => {
  const { services, screen, recordId } = params;
  const { common, target } = services;
  const app = target.appId;
  const guestSpaceId = GUEST_SPACE_ID;

  return {
    target,
    loginUserCode: services.loginUserCode,
    appContext: async () => ({
      appId: app,
      appName: params.appName,
      appDescription: toPlainText(params.appDescription, MAX_APP_DESCRIPTION),
      screen,
      recordId,
      language: LANGUAGE ?? 'ja',
      isGuestSpace: guestSpaceId !== undefined,
      loginUser: { code: LOGIN_USER.code, name: LOGIN_USER.name },
    }),
    getFormFields: async () =>
      (await getFormFields({ app, guestSpaceId, preview: false, debug: isDev })).properties,
    getFormLayout: async () =>
      (await getFormLayout({ app, guestSpaceId, preview: false, debug: isDev })).layout,
    getViews: async () =>
      (await getViews({ app, guestSpaceId, preview: false, debug: isDev })).views,
    queryDom: (input) =>
      inspectDom({
        root: document as unknown as Parameters<typeof inspectDom>[0]['root'],
        excludedRootSelector,
        getComputedStyle: (element) => window.getComputedStyle(element as unknown as Element),
        ...input,
      }),
    getRecordSample: async ({ fields, limit }) => {
      // 表示中・入力中のレコードは画面から読む(保存前の値を含む)。一覧は表示中の絞り込み条件で先頭から
      if (screen !== 'index') {
        const current = kintone.app.record.get();
        return pickRecordValues(current === null ? [] : [current.record], fields, 1);
      }
      // 利用者が見ている一覧と同じ絞り込み・並び順で、先頭から
      const { records } = await getRecords({
        app,
        guestSpaceId,
        fields,
        query: toSampleQuery(kintone.app.getQuery() ?? '', limit),
        debug: isDev,
      });
      return pickRecordValues(records as Parameters<typeof pickRecordValues>[0], fields, limit);
    },
    listAssets: async () => (await services.loadPanel()).assets,
    loadAsset: async (id) => {
      try {
        const record = await getRecord({
          app: common.assetAppId,
          id,
          guestSpaceId: common.assetAppSpaceId || undefined,
          debug: isDev,
        });
        const result = toAsset(record as unknown as AssetRecord, common);
        return result.ok ? result.asset : null;
      } catch {
        return null;
      }
    },
  };
};

export const createChatRuntime = async (params: {
  services: LauncherServices;
  endpoint: ProxyEndpoint;
  screen: AssetScreen;
  recordId: string | null;
}): Promise<ChatRuntime> => {
  const { services, endpoint, screen, recordId } = params;
  const { common, target } = services;

  // 認証ヘッダーを含むため、ketchのデバッグ出力は開発時も使わない
  const proxyFetch = createKetch({ pluginId: PLUGIN_ID, debug: false });
  const fetch = createRestrictedProxyFetch({ endpoint, proxyFetch });
  const model = await createLanguageModel(common, fetch);

  const [appInfo, panel] = await Promise.all([
    getApp({ id: target.appId, guestSpaceId: GUEST_SPACE_ID, debug: isDev }).catch(() => null),
    services.loadPanel().catch(() => null),
  ]);
  const toolServices = createToolServices({
    services,
    screen,
    recordId,
    appName: appInfo?.name ?? '',
    appDescription: appInfo?.description ?? '',
  });
  const agent = createCustomizeAgent({
    model,
    instructions: buildSystemPrompt({
      app: { id: target.appId, name: appInfo?.name ?? '', guestSpaceId: GUEST_SPACE_ID ?? null },
      screen,
      recordId,
      language: LANGUAGE ?? 'ja',
      loginUser: { code: LOGIN_USER.code, name: LOGIN_USER.name },
      assets: (panel?.assets ?? [])
        .filter(({ asset }) => canReadAsset(asset, target, services.loginUserCode))
        .map(({ asset }) => ({
          id: asset.id,
          title: asset.title,
          kind: asset.kind,
          scope: asset.scope,
          enabled: asset.enabled,
        })),
      tools: { recordSample: common.sendsRecordToAi, write: false },
      additionalInstructions: common.additionalSystemPrompt,
    }),
    tools: createReadTools(toolServices, { recordSample: common.sendsRecordToAi }),
    maxOutputTokens: common.maxOutputTokens,
    temperature: common.temperature,
  });

  return {
    run: (runParams) => runAgent({ agent, ...runParams }),
    classifyError: classifyAiError,
  };
};
