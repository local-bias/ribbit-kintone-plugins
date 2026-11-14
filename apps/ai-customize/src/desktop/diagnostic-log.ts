import type { DiagnosticEntry } from '@/lib/diagnostics';
import { describeDiagnostic } from './diagnostic-text';

/**
 * 診断の記録を、開発者ツールのコンソールへ出します
 *
 * エラーの詳細(stack)は一般利用者の画面には出さず、ここにだけ出す(docs/05-runtime.md 3章)
 */

const PREFIX = '[ai-customize]';

/** 文言に添えて出す詳細(例外・検出箇所・拒否の内容) */
const detailOf = (entry: DiagnosticEntry): unknown[] => {
  switch (entry.kind) {
    case 'load-failed':
      return [entry.error];
    case 'blocked':
      return [entry.policy.details];
    case 'evaluation-failed':
    case 'handler-failed':
      return [entry.error];
    case 'permission-denied':
      return [entry.denial];
    default:
      return [];
  }
};

const isError = (entry: DiagnosticEntry): boolean =>
  entry.kind === 'load-failed' ||
  entry.kind === 'evaluation-failed' ||
  entry.kind === 'handler-failed';

export const logDiagnostic = (entry: DiagnosticEntry): void => {
  // タイムアウトは起動ゲートが待ち時間つきで出す
  if (entry.kind === 'gate-timeout') {
    return;
  }
  const message = describeDiagnostic(entry);
  const log = isError(entry) ? console.error : console.warn;
  log(PREFIX, message, ...detailOf(entry));
};
