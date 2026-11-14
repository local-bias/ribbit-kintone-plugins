import type { DiagnosticEntry } from '@/lib/diagnostics';
import { t } from '@/lib/i18n';

/**
 * 診断の記録を、開発者ツールのコンソールへ出します
 *
 * エラーの詳細(stack)は一般利用者の画面には出さず、ここにだけ出す(docs/05-runtime.md 3章)
 */

const PREFIX = '[ai-customize]';

export const logDiagnostic = (entry: DiagnosticEntry): void => {
  switch (entry.kind) {
    case 'mapping-skipped':
      console.warn(PREFIX, t('desktop.log.skipped', entry.assetId, entry.reason));
      return;
    case 'load-failed':
      console.error(PREFIX, entry.error);
      return;
    case 'gate-timeout':
      return;
    case 'blocked':
      console.warn(
        PREFIX,
        t(
          entry.policy.reason === 'bypass'
            ? 'desktop.log.blocked.bypass'
            : 'desktop.log.blocked.external',
          entry.assetId
        ),
        entry.policy.details
      );
      return;
    case 'evaluation-failed':
      console.error(PREFIX, t('desktop.log.evaluationFailed', entry.assetId), entry.error);
      return;
    case 'slow-evaluation':
      console.warn(PREFIX, t('desktop.log.slowEvaluation', entry.assetId, String(entry.ms)));
      return;
    case 'handler-failed':
      console.error(
        PREFIX,
        t('desktop.log.handlerFailed', entry.assetId, entry.eventType),
        entry.error
      );
      return;
    case 'suspended':
      console.warn(PREFIX, t('desktop.log.suspended', entry.assetId));
      return;
    case 'permission-denied':
      // 拒否エラー自体がアセットへ返り、メッセージはそこに入っている。ここでは経緯だけを残す
      console.warn(PREFIX, entry.denial);
      return;
    case 'rejected-event-type':
      console.warn(PREFIX, t('desktop.log.rejectedEvent', entry.assetId, String(entry.eventType)));
      return;
    case 'ignored-thenable':
      console.warn(PREFIX, t('desktop.log.ignoredThenable', entry.assetId, entry.eventType));
      return;
  }
};
