import { pluginCommonConfigAtom } from '@/desktop/public-state';
import { isDev } from '@/lib/global';
import { store } from '@/lib/store';
import type { FactCheckResult } from '@/schema/fact-check';
import { addRecord } from '@konomi-app/kintone-utilities';
import { logAppGuestSpaceIdAtom } from '../states/kintone';
import { selectedHistoryAtom } from '../states/states';

interface LogFactCheckParams {
  messageId: string;
  result: FactCheckResult;
  assistantId: string;
}

/**
 * ファクトチェック結果をログアプリに保存する
 * V2形式のログアプリのみ対応
 * roleフィールドに'fact-check'として記録
 */
export const logFactCheckResult = async ({
  messageId,
  result,
  assistantId,
}: LogFactCheckParams) => {
  const common = store.get(pluginCommonConfigAtom);
  const selectedHistory = store.get(selectedHistoryAtom);

  if (!selectedHistory) {
    isDev && console.warn('No chat history selected for fact-check log');
    return;
  }

  const {
    logAppId,
    logAppVersion,
    logAppV2SessionIdFieldCode,
    logAppV2AssistantIdFieldCode,
    logAppV2RoleFieldCode,
    logAppV2ContentFieldCode,
  } = common;

  // V2形式のみ対応
  if (logAppVersion !== 'v2') {
    isDev && console.log('Fact-check log only supports V2 format');
    return;
  }

  if (
    !logAppId ||
    !logAppV2SessionIdFieldCode ||
    !logAppV2RoleFieldCode ||
    !logAppV2ContentFieldCode
  ) {
    isDev && console.warn('Log app V2 is not properly configured for fact-check');
    return;
  }

  const record: Record<string, { value: string }> = {
    [logAppV2SessionIdFieldCode]: { value: selectedHistory.id },
    [logAppV2RoleFieldCode]: { value: 'fact-check' },
    [logAppV2ContentFieldCode]: { value: JSON.stringify(result) },
  };

  if (logAppV2AssistantIdFieldCode) {
    record[logAppV2AssistantIdFieldCode] = { value: assistantId };
  }

  try {
    const guestSpaceId = await store.get(logAppGuestSpaceIdAtom);
    addRecord({
      app: logAppId,
      record,
      guestSpaceId: guestSpaceId ?? undefined,
      debug: isDev,
    });
    isDev && console.log('Fact-check result logged successfully', { messageId, result });
  } catch (error) {
    console.error('[${PLUGIN_NAME}] Failed to log fact-check result:', error);
  }
};
