import type { Asset, AssetKind, AssetPermission, AssetScope, AssetScreen } from '@/schema/asset';
import { type CapabilityPolicyResult, isScreenTarget } from './asset-filter';
import { EVALUATION_WARNING_MS, SOURCE_URL_PREFIX } from './constants';
import type { DiagnosticEntry } from './diagnostics';

/**
 * JSアセットの評価
 *
 * `new Function('kintone', 'context', code)`で評価し、第1引数にファサードを渡す。
 * 1アセットは1ページで最大1回しか評価しない(二重実行しない。ADR-3)。
 *
 * @see docs/05-runtime.md 4章
 */

/** アセットに渡す第2引数。読み取り専用の情報とログだけを持つ */
export type AssetContext = Readonly<{
  appId: string;
  guestSpaceId: string | undefined;
  /** 評価したときの画面種別 */
  screen: AssetScreen;
  loginUser: Readonly<{ code: string; name: string }>;
  asset: Readonly<{
    id: string;
    title: string;
    kind: AssetKind;
    scope: AssetScope;
    permissions: readonly AssetPermission[];
    externalUrls: readonly string[];
  }>;
  log: (...args: unknown[]) => void;
}>;

/** `sourceURL`に使える形へタイトルを整えます。英数字以外は除く */
const slugify = (title: string): string =>
  title
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

/**
 * 評価するソースを組み立てます
 *
 * `//# sourceURL`が無いとエラーが`<anonymous>`になり、どのアセットが壊れているのか分からない
 */
export const buildAssetSource = (asset: Pick<Asset, 'id' | 'title' | 'code'>): string => {
  const slug = slugify(asset.title);
  const name = slug === '' ? asset.id : `${asset.id}-${slug}`;
  return `"use strict";\n${asset.code}\n//# sourceURL=${SOURCE_URL_PREFIX}/${name}.js`;
};

export type RunnerOptions = {
  createFacade: (asset: Asset) => unknown;
  createContext: (asset: Asset, screen: AssetScreen) => AssetContext;
  checkPolicy: (asset: Asset) => CapabilityPolicyResult;
  record: (entry: DiagnosticEntry) => void;
  now: () => number;
  /** テスト用。既定は`new Function` */
  compile?: (source: string) => (kintone: unknown, context: AssetContext) => unknown;
};

export type Runner = {
  /** 指定した画面向けで、まだ評価していないJSアセットを実行順に評価します */
  evaluatePending: (assets: readonly Asset[], screen: AssetScreen) => void;
  /** このページで評価できたJSアセット(止めたもの・例外を投げたものは含めない) */
  evaluatedIds: () => ReadonlySet<string>;
};

const defaultCompile = (source: string) =>
  // biome-ignore lint/security/noGlobalEval: アセットの評価は本プラグインの目的そのもの(ADR-4)
  new Function('kintone', 'context', source) as (
    kintone: unknown,
    context: AssetContext
  ) => unknown;

export const createRunner = (options: RunnerOptions): Runner => {
  const evaluated = new Set<string>();
  const succeeded = new Set<string>();
  const compile = options.compile ?? defaultCompile;

  const evaluate = (asset: Asset, screen: AssetScreen) => {
    const policy = options.checkPolicy(asset);
    if (!policy.allowed) {
      options.record({ kind: 'blocked', assetId: asset.id, policy });
      return;
    }
    const startedAt = options.now();
    try {
      compile(buildAssetSource(asset))(
        options.createFacade(asset),
        options.createContext(asset, screen)
      );
    } catch (error) {
      options.record({ kind: 'evaluation-failed', assetId: asset.id, error });
      return;
    }
    succeeded.add(asset.id);
    const ms = options.now() - startedAt;
    if (ms > EVALUATION_WARNING_MS) {
      options.record({ kind: 'slow-evaluation', assetId: asset.id, ms });
    }
  };

  const evaluatePending: Runner['evaluatePending'] = (assets, screen) => {
    for (const asset of assets) {
      if (asset.kind !== 'js' || evaluated.has(asset.id) || !isScreenTarget(asset, screen)) {
        continue;
      }
      // 例外で止まっても二度と評価しないよう、評価前に印を付ける
      evaluated.add(asset.id);
      evaluate(asset, screen);
    }
  };

  return { evaluatePending, evaluatedIds: () => new Set(succeeded) };
};
