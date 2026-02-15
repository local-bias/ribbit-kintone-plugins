import { fetchAICompletion } from '@/desktop/original-view/action';
import {
  aiStateAtom,
  apiErrorMessageAtom,
  htmlOutputEnabledAtom,
  imageGenerationEnabledAtom,
  pendingRequestCountAtom,
  quickRepliesAtom,
  selectedHistoryAtom,
  selectedPluginConditionAtom,
  webSearchEnabledAtom,
} from '@/desktop/original-view/states/states';
import { pluginCommonConfigAtom } from '@/desktop/public-state';
import { buildChatMessage } from '@/lib/chat-message-utils';
import { InteractiveAIResponseSchema } from '@/schema/ai';
import { atom } from 'jotai';
import { checkFact } from '../actions/fact-check';
import { handlePushAssistantMessageAtom, handleUpdateHtmlAtom } from './chat-history';
import { handleUpdateLogAppAtom, handleUpdateOutputAppAtom } from './kintone';
import { enableFactCheckAtom } from './states';
import { isDev } from '@/lib/global';

const handleFetchChatCompletionsAtom = atom(null, async (get, set) => {
  try {
    set(apiErrorMessageAtom, null);
    set(aiStateAtom, 'loading');

    const chatHistory = get(selectedHistoryAtom);
    if (!chatHistory) {
      throw new Error('チャットが選択されていません');
    }
    const selectedCondition = get(selectedPluginConditionAtom);
    const webSearchEnabled = get(webSearchEnabledAtom);
    const imageGenerationEnabled = get(imageGenerationEnabledAtom);
    const htmlOutputEnabled = get(htmlOutputEnabledAtom);

    const commonConfig = get(pluginCommonConfigAtom);

    // 有効な出力形式に基づいてスキーマを構築
    const omitFields: { html?: true; quickReplies?: true } = {};
    if (!selectedCondition.allowHtmlOutput) {
      omitFields.html = true;
    }
    if (!selectedCondition.allowQuickReplies) {
      omitFields.quickReplies = true;
    }
    const schema =
      Object.keys(omitFields).length > 0
        ? InteractiveAIResponseSchema.omit(omitFields)
        : InteractiveAIResponseSchema;

    // Structured Output でAI APIを呼び出し
    const response = await fetchAICompletion(
      {
        model: selectedCondition.aiModel,
        temperature: selectedCondition.temperature,
        maxTokens: selectedCondition.maxTokens,
        messages: chatHistory.messages,
        systemPrompt: selectedCondition.systemPrompt,
        providerType: commonConfig.providerType,
        verbosity: selectedCondition.verbosity,
        reasoningEffort: selectedCondition.reasoningEffort,
        webSearchEnabled,
        promptId: selectedCondition.promptId,
        imageGenerationEnabled,
        htmlOutputEnabled,
        currentHtml: chatHistory.html,
      },
      schema
    );

    // レスポンスからChatMessageを構築
    const assistantMessage = buildChatMessage(response);
    await set(handlePushAssistantMessageAtom, {
      content: assistantMessage.content,
      id: assistantMessage.id,
    });

    // HTMLが返された場合、履歴を更新
    if ('html' in response.data && typeof response.data.html === 'string') {
      set(handleUpdateHtmlAtom, response.data.html);
    }

    // Quick Repliesを更新（存在する場合はボタンとして表示）
    if ('quickReplies' in response.data && Array.isArray(response.data.quickReplies)) {
      set(quickRepliesAtom, response.data.quickReplies);
    } else {
      set(quickRepliesAtom, null);
    }

    // ファクトチェック
    const enableFactCheck = get(enableFactCheckAtom);
    if (enableFactCheck && typeof assistantMessage.content === 'string') {
      // use last user message as context
      const lastUserMessage = chatHistory.messages.findLast((m) => m.role === 'user');
      let context = '';
      if (lastUserMessage) {
        if (typeof lastUserMessage.content === 'string') {
          context = lastUserMessage.content;
        } else if (Array.isArray(lastUserMessage.content)) {
          context = lastUserMessage.content
            .filter((c) => c.type === 'text')
            .map((c) => c.text)
            .join('');
        }
      }

      console.log('context', context);

      checkFact({
        messageId: assistantMessage.id,
        answer: assistantMessage.content,
        context,
        model: selectedCondition.aiModel,
        providerType: commonConfig.providerType,
        assistantId: selectedCondition.id,
      });
    }
  } catch (error: unknown) {
    const defaultErrorMessage =
      '不明なエラーが発生しました。再度試していただくか、AIモデルを変更してください。';
    if (typeof error === 'string') {
      try {
        const errorObject = JSON.parse(error);

        if (errorObject?.code === 'GAIA_PR03') {
          set(
            apiErrorMessageAtom,
            'タイムアウトしました。再度試していただくか、AIモデルを変更してください。'
          );
        } else {
          set(apiErrorMessageAtom, errorObject?.message ?? defaultErrorMessage);
        }
      } catch {
        set(apiErrorMessageAtom, defaultErrorMessage);
      }
    } else if (error instanceof Error) {
      set(apiErrorMessageAtom, error.message);
    } else {
      set(apiErrorMessageAtom, defaultErrorMessage);
    }
  } finally {
    set(aiStateAtom, 'idle');
  }
});

export const handleSendMessageAtom = atom(null, async (_, set) => {
  try {
    set(pendingRequestCountAtom, (count) => count + 1);
    // ユーザーメッセージのログ保存（V2用）
    await set(handleUpdateLogAppAtom);
    await Promise.allSettled([set(handleFetchChatCompletionsAtom), set(handleUpdateOutputAppAtom)]);
    Promise.allSettled([
      // 履歴保存
      set(handleUpdateOutputAppAtom),
      // ログ保存（V1/V2共通）
      set(handleUpdateLogAppAtom),
    ]);
  } finally {
    set(pendingRequestCountAtom, (count) => count - 1);
  }
});
