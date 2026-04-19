import { pluginCommonConfigAtom } from '@/desktop/public-state';
import { isDev } from '@/lib/global';
import { store } from '@/lib/store';
import type { FactCheckResult } from '@/schema/fact-check';
import { addChatLog } from '../action';
import { logAppGuestSpaceIdAtom } from '../states/kintone';
import { selectedHistoryAtom } from '../states/states';

interface LogFactCheckParams {
  messageId: string;
  result: FactCheckResult;
  assistantId: string;
}

/**
 * ファクトチェック結果をログアプリに保存する
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
    logAppSessionIdFieldCode,
    logAppAssistantIdFieldCode,
    logAppRoleFieldCode,
    logAppContentFieldCode,
  } = common;

  try {
    const guestSpaceId = await store.get(logAppGuestSpaceIdAtom);
    addChatLog({
      appId: logAppId,
      sessionId: selectedHistory.id,
      assistantId,
      role: 'fact-check',
      content: JSON.stringify(result),
      sessionIdFieldCode: logAppSessionIdFieldCode,
      assistantIdFieldCode: logAppAssistantIdFieldCode,
      roleFieldCode: logAppRoleFieldCode,
      contentFieldCode: logAppContentFieldCode,
      guestSpaceId,
    });
    isDev && console.log('Fact-check result logged successfully', { messageId, result });
  } catch (error) {
    console.error('[${PLUGIN_NAME}] Failed to log fact-check result:', error);
  }
};
