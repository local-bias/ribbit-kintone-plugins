import type { AssetLoadError } from './asset-repository';
import type { AssetProblem, DiagnosticEntry } from './diagnostics';

/**
 * ランチャー(起動ボタン)に出す状態を決めます(純粋関数)
 *
 * @see docs/06-ui.md 2章「アイコン」
 */

export type RuntimePhase = 'loading' | 'ready' | 'timed-out' | 'failed' | 'safe-mode';

/** 起動ゲートの状態から、画面に出す段階を返します */
export const toRuntimePhase = (
  safeMode: boolean,
  status: { loaded: boolean; loadError: AssetLoadError | null; timedOut: boolean }
): RuntimePhase => {
  if (safeMode) return 'safe-mode';
  if (status.loadError !== null) return 'failed';
  if (status.timedOut) return 'timed-out';
  return status.loaded ? 'ready' : 'loading';
};

export type LauncherSummary = {
  /** 適用中の件数(バッジの数字) */
  appliedCount: number;
  /** 実行時エラー・権限外の操作を止めた・迂回パターンで未実行など(⚠) */
  hasProblems: boolean;
  /** 起動ゲートのタイムアウト・取得失敗(⏱) */
  notLoaded: boolean;
  /** セーフモード(グレースケール) */
  safeMode: boolean;
};

export const summarizeLauncher = (params: {
  phase: RuntimePhase;
  appliedIds: ReadonlySet<string>;
  problemAssetIds: ReadonlySet<string>;
}): LauncherSummary => {
  const { phase, appliedIds, problemAssetIds } = params;
  if (phase === 'safe-mode') {
    return { appliedCount: 0, hasProblems: false, notLoaded: false, safeMode: true };
  }
  return {
    appliedCount: appliedIds.size,
    hasProblems: problemAssetIds.size > 0,
    notLoaded: phase === 'timed-out' || phase === 'failed',
    safeMode: false,
  };
};

/** 実行基盤の状態(起動ゲート・適用中のアセット・診断)。ランチャーとパネルに出す */
export type RuntimeView = {
  phase: RuntimePhase;
  loadError: AssetLoadError | null;
  /** このページで適用しているアセット(評価できたJS・`<style>`を付けたCSS) */
  applied: { js: ReadonlySet<string>; css: ReadonlySet<string> };
  diagnostics: readonly DiagnosticEntry[];
  problems: ReadonlyMap<string, readonly AssetProblem[]>;
};
