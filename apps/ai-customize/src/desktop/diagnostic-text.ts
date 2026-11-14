import type { AssetLoadError } from '@/lib/asset-repository';
import { MAX_ASSETS_PER_APP } from '@/lib/constants';
import type { DiagnosticEntry } from '@/lib/diagnostics';
import { t } from '@/lib/i18n';
import type { PermissionDenial } from '@/lib/permission-error';

/**
 * 診断の記録を、利用者と管理者に見せる文言にします
 *
 * コンソール(`diagnostic-log.ts`)とパネルの両方で同じ文言を使う。
 * 例外の中身(stack)はコンソールにだけ出し、ここでは扱わない(docs/05-runtime.md 3章)
 */

const describeRequirement = (denial: PermissionDenial): string => {
  switch (denial.operation) {
    case 'kintone.api':
      return denial.required.filter((requirement) => requirement !== 'read').join(', ');
    case 'kintone.proxy':
      return t('desktop.denied.external');
    case 'kintone.getRequestToken':
      return t('desktop.denied.writePermission');
    case 'kintone.plugin.app.proxy':
      return t('desktop.denied.never');
  }
};

/** 止めた操作(`kintone.api PUT /k/v1/record`など)。クエリは含めない */
export const describeOperation = (denial: PermissionDenial): string =>
  [denial.operation, denial.method, denial.target]
    .filter((part) => part !== null && part !== '')
    .join(' ');

/** アセットへ返す拒否エラーのメッセージ */
export const describeDenial = (denial: PermissionDenial): string =>
  t('desktop.denied', denial.assetId, describeOperation(denial), describeRequirement(denial));

/** 取得の失敗を、利用者向けの文言にします */
export const describeLoadError = (error: AssetLoadError): string => {
  switch (error.reason) {
    case 'request-failed':
      return t('desktop.notice.loadFailed', error.message);
    case 'too-many':
      return t('desktop.notice.tooMany', String(MAX_ASSETS_PER_APP));
    case 'too-large':
      return t('desktop.notice.tooLarge');
  }
};

/** 診断の記録1件の文言。利用者へ見せるものが無ければ`null` */
export const describeDiagnostic = (entry: DiagnosticEntry): string | null => {
  switch (entry.kind) {
    case 'mapping-skipped':
      return t('desktop.log.skipped', entry.assetId, entry.reason);
    case 'load-failed':
      return describeLoadError(entry.error);
    case 'gate-timeout':
      return t('desktop.notice.timeout');
    case 'blocked':
      return t(
        entry.policy.reason === 'bypass'
          ? 'desktop.log.blocked.bypass'
          : 'desktop.log.blocked.external',
        entry.assetId
      );
    case 'evaluation-failed':
      return t('desktop.log.evaluationFailed', entry.assetId);
    case 'slow-evaluation':
      return t('desktop.log.slowEvaluation', entry.assetId, String(entry.ms));
    case 'handler-failed':
      return t('desktop.log.handlerFailed', entry.assetId, entry.eventType);
    case 'suspended':
      return t('desktop.log.suspended', entry.assetId);
    case 'permission-denied':
      return describeDenial(entry.denial);
    case 'rejected-event-type':
      return t('desktop.log.rejectedEvent', entry.assetId, String(entry.eventType));
    case 'ignored-thenable':
      return t('desktop.log.ignoredThenable', entry.assetId, entry.eventType);
  }
};
