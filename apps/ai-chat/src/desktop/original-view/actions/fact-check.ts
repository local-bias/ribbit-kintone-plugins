import { pluginCommonConfigAtom, pluginConditionsAtom } from '@/desktop/public-state';
import { PLUGIN_NAME, type FactCheckMessage } from '@/lib/static';
import { store } from '@/lib/store';
import { PROMPT_FACT_CHECK_SYSTEM } from '@/prompts/ai';
import { FactCheckResultSchema, type FactCheckResult } from '@/schema/fact-check';
import { AiProviderType } from '@/schema/plugin-config';
import { upsertRecord } from '@konomi-app/kintone-utilities';
import { produce } from 'immer';
import { nanoid } from 'nanoid';
import { fetchAICompletion } from '../action';
import { transientFactCheckStateAtom } from '../states/fact-check';
import { outputAppGuestSpaceIdAtom } from '../states/kintone';
import { selectedHistoryAtom } from '../states/states';
import { logFactCheckResult } from './fact-check-log';

interface CheckFactParams {
  messageId: string;
  answer: string;
  context: string;
  model: string;
  providerType: AiProviderType;
  assistantId: string;
}

export const checkFact = async ({
  messageId,
  answer,
  context,
  model,
  providerType,
  assistantId,
}: CheckFactParams) => {
  // Set status to checking (transient state)
  store.set(transientFactCheckStateAtom, (prev) =>
    produce(prev, (draft) => {
      draft[messageId] = { status: 'checking' };
    })
  );

  try {
    // Structured Output で直接ファクトチェック結果を取得
    const response = await fetchAICompletion(
      {
        model,
        providerType,
        temperature: 1,
        maxTokens: 2000,
        reasoningEffort: 'model-default',
        messages: [
          {
            id: nanoid(),
            role: 'user',
            content: `ユーザーの質問
\`\`\`\`
${context}
\`\`\`\`

質問に対するAIの回答
\`\`\`\`
${answer}
\`\`\`\``,
          },
        ],
        systemPrompt: PROMPT_FACT_CHECK_SYSTEM,
        webSearchEnabled: true,
      },
      FactCheckResultSchema
    );

    // response.data は既にパース済みの FactCheckResult
    const result: FactCheckResult = response.data;

    // Create fact-check message and add to chat history
    // This will be picked up by the derived factCheckStateAtom
    const factCheckMessage: FactCheckMessage = {
      id: nanoid(),
      role: 'fact-check',
      targetMessageId: messageId,
      content: result,
    };

    const currentHistory = store.get(selectedHistoryAtom);
    if (currentHistory) {
      const updatedHistory = produce(currentHistory, (draft) => {
        draft.messages.push(factCheckMessage);
      });
      store.set(selectedHistoryAtom, updatedHistory);

      // Save to outputApp
      const common = store.get(pluginCommonConfigAtom);
      const { outputAppId, outputKeyFieldCode, outputContentFieldCode } = common;
      if (outputAppId && outputKeyFieldCode && outputContentFieldCode) {
        try {
          const guestSpaceId = await store.get(outputAppGuestSpaceIdAtom);
          await upsertRecord({
            app: outputAppId,
            updateKey: {
              field: outputKeyFieldCode,
              value: updatedHistory.id,
            },
            record: {
              [outputKeyFieldCode]: { value: updatedHistory.id },
              [outputContentFieldCode]: { value: JSON.stringify(updatedHistory) },
            },
            guestSpaceId: guestSpaceId ?? undefined,
            debug: process.env.NODE_ENV === 'development',
          });
        } catch (error) {
          console.error(`[${PLUGIN_NAME}] 出力アプリへの保存に失敗しました`, error);
        }
      }
    }

    // Clear transient state - the result is now in chat history
    store.set(transientFactCheckStateAtom, (prev) =>
      produce(prev, (draft) => {
        delete draft[messageId];
      })
    );

    // Log to log app if enabled
    const conditions = store.get(pluginConditionsAtom);
    const condition = conditions.find((c) => c.id === assistantId);
    if (condition?.enableFactCheckLog) {
      try {
        await logFactCheckResult({
          messageId,
          result,
          assistantId,
        });
      } catch (error) {
        console.error(`[${PLUGIN_NAME}] ログアプリへの保存に失敗しました`, error);
      }
    }
  } catch (error) {
    console.error(`[${PLUGIN_NAME}] Fact check failed:`, error);
    store.set(transientFactCheckStateAtom, (prev) =>
      produce(prev, (draft) => {
        draft[messageId] = { status: 'error', error: String(error) };
      })
    );
  }
};
