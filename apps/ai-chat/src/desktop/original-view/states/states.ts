import { pluginCommonConfigAtom, pluginConditionsAtom } from '@/desktop/public-state';
import { isDev } from '@/lib/global';
import { ChatHistory, ChatMessage, RegularChatMessage, URL_QUERY_CHAT_ID } from '@/lib/static';
import { PluginCondition } from '@/schema/plugin-config';
import { deleteAllRecordsByQuery, isGuestSpace, isMobile } from '@konomi-app/kintone-utilities';
import { produce } from 'immer';
import { atom } from 'jotai';
import { atomEffect } from 'jotai-effect';
import { atomWithReset, RESET } from 'jotai/utils';
import { enqueueSnackbar } from 'notistack';
import {
  extractFactCheckStateFromHistory,
  FactCheckState,
  transientFactCheckStateAtom,
} from './fact-check';

export const pendingRequestCountAtom = atom(0);

/**
 * AIの状態を管理するAtom
 *
 * "idle" - 待機中
 * "loading" - 処理中
 * "authorizing" - 認証中
 * "error" - エラー発生
 */
export const aiStateAtom = atom<'idle' | 'loading' | 'authorizing' | 'error'>('idle');

export const loadingAtom = atom(
  (get) => get(pendingRequestCountAtom) > 0 || ['loading', 'authorizing'].includes(get(aiStateAtom))
);

export const isHistoryFabShownAtom = atom((get) => {
  const common = get(pluginCommonConfigAtom);
  return !!common.outputAppId && !!common.outputKeyFieldCode && !!common.outputContentFieldCode;
});

export const isHistoryDrawerOpenAtom = atom(false);

/**
 * 最後のAIレスポンスから取得したQuick Replies
 * ユーザーがクリックできる選択肢ボタンを表示するために使用
 */
export type QuickReply = { label: string; action: string };
export const quickRepliesAtom = atom<QuickReply[] | null>(null);

export const inputTextAtom = atom<string>('');

export const inputFilesAtom = atom<File[]>([]);

export const isSendButtonDisabledAtom = atom((get) => {
  const input = get(inputTextAtom).trim();
  const files = get(inputFilesAtom);
  const loading = get(loadingAtom);
  return loading || (input === '' && files.length === 0);
});

export const allowWebSearchAtom = atom((get) => {
  const condition = get(selectedPluginConditionAtom);
  return condition.allowWebSearch ?? false;
});

export const allowImageGenerationAtom = atom((get) => {
  const condition = get(selectedPluginConditionAtom);
  return condition.allowImageGeneration ?? false;
});

export const enableFactCheckAtom = atom((get) => {
  const condition = get(selectedPluginConditionAtom);
  return condition.enableFactCheck ?? false;
});

export const selectedPluginConditionIdAtom = atom<string | null>(null);
export const selectedPluginConditionAtom = atom<PluginCondition>((get) => {
  const conditions = get(pluginConditionsAtom);
  const conditionId = get(selectedPluginConditionIdAtom);
  return conditions.find((condition) => condition.id === conditionId) ?? conditions[0];
});

const webSearchToggleStateAtom = atom<Record<string, boolean>>({});
export const webSearchEnabledAtom = atom(
  (get) => {
    const condition = get(selectedPluginConditionAtom);
    if (!condition.allowWebSearch) {
      return false;
    }
    const toggles = get(webSearchToggleStateAtom);
    return toggles[condition.id] ?? false;
  },
  (get, set, newValue: boolean | ((prev: boolean) => boolean)) => {
    const condition = get(selectedPluginConditionAtom);
    set(webSearchToggleStateAtom, (prev) => {
      const current = prev[condition.id] ?? false;
      const nextValue = typeof newValue === 'function' ? newValue(current) : newValue;
      return {
        ...prev,
        [condition.id]: nextValue,
      };
    });
  }
);

const imageGenerationToggleStateAtom = atom<Record<string, boolean>>({});
export const imageGenerationEnabledAtom = atom(
  (get) => {
    const condition = get(selectedPluginConditionAtom);
    if (!condition.allowImageGeneration) {
      return false;
    }
    const toggles = get(imageGenerationToggleStateAtom);
    return toggles[condition.id] ?? false;
  },
  (get, set, newValue: boolean | ((prev: boolean) => boolean)) => {
    const condition = get(selectedPluginConditionAtom);
    set(imageGenerationToggleStateAtom, (prev) => {
      const current = prev[condition.id] ?? false;
      const nextValue = typeof newValue === 'function' ? newValue(current) : newValue;
      return {
        ...prev,
        [condition.id]: nextValue,
      };
    });
  }
);

/**
 * HTML出力が有効かどうか（プラグイン設定から取得）
 * OpenRouterの場合は強制的にfalseを返す
 */
export const htmlOutputEnabledAtom = atom((get) => {
  const condition = get(selectedPluginConditionAtom);
  const commonConfig = get(pluginCommonConfigAtom);
  // OpenRouterはStructured Outputをサポートしていないので無効化
  if (commonConfig.providerType === 'openrouter') {
    return false;
  }
  return condition.allowHtmlOutput ?? false;
});

/**
 * HTMLプレビューが手動で非表示にされているかどうか
 * チャット履歴のIDごとに管理
 */
const htmlPreviewHiddenStateAtom = atom<Record<string, boolean>>({});
export const htmlPreviewHiddenAtom = atom(
  (get) => {
    const selectedHistoryId = get(selectedHistoryIdAtom);
    if (!selectedHistoryId) return false;
    const state = get(htmlPreviewHiddenStateAtom);
    return state[selectedHistoryId] ?? false;
  },
  (get, set, hidden: boolean) => {
    const selectedHistoryId = get(selectedHistoryIdAtom);
    if (!selectedHistoryId) return;
    set(htmlPreviewHiddenStateAtom, (prev) => ({
      ...prev,
      [selectedHistoryId]: hidden,
    }));
  }
);

export const chatHistoriesAtom = atom<ChatHistory[]>([]);

const chatMessagesAtom = atom<ChatMessage[]>((get) => {
  const chatHistory = get(chatHistoriesAtom);
  const selectedHistoryId = get(selectedHistoryIdAtom);
  if (!selectedHistoryId) {
    return [];
  }

  const selectedHistory = chatHistory.find((history) => history.id === selectedHistoryId);
  if (!selectedHistory) {
    return [];
  }

  return selectedHistory.messages;
});
export const displayingChatMessagesAtom = atom<RegularChatMessage[]>((get) => {
  const chatMessages = get(chatMessagesAtom);
  return chatMessages.filter(
    (message): message is RegularChatMessage =>
      message.role === 'user' || message.role === 'assistant'
  );
});

const chatHistoriesPaginationChunkSizeAtom = atom(30);
export const chatHistoriesPaginationMaxAtom = atom((get) => {
  const chatHistories = get(chatHistoriesAtom);
  const chunkSize = get(chatHistoriesPaginationChunkSizeAtom);
  return Math.ceil(chatHistories.length / chunkSize);
});

export const chatHistoriesPaginationIndexAtom = atom(1);

export const displayChatHistoriesAtom = atom<ChatHistory[]>((get) => {
  const chatHistories = get(chatHistoriesAtom);
  const paginationIndex = get(chatHistoriesPaginationIndexAtom);
  const chunkSize = get(chatHistoriesPaginationChunkSizeAtom);

  return chatHistories.slice((paginationIndex - 1) * chunkSize, paginationIndex * chunkSize);
});

export const historiesFetchedAtom = atom(false);

export const selectedHistoryIdAtom = atom<string | null>(null);
export const urlSearchParamsEffect = atomEffect((get) => {
  const selectedHistoryId = get(selectedHistoryIdAtom);
  isDev && console.log(`✨ selected history id changed: ${selectedHistoryId}`);
  const url = new URL(location.href);
  if (!selectedHistoryId) {
    url.searchParams.delete(URL_QUERY_CHAT_ID);
  }
  if (selectedHistoryId) {
    url.searchParams.set(URL_QUERY_CHAT_ID, selectedHistoryId);
  }
  history.replaceState(null, '', url.toString());
});

/**
 * チャット履歴が更新されたときに、選択中のhistoryIdに対応するアシスタントを自動設定する
 */
export const autoSelectAssistantEffect = atomEffect((get, set) => {
  const chatHistories = get(chatHistoriesAtom);
  const selectedHistoryId = get(selectedHistoryIdAtom);

  if (!selectedHistoryId || chatHistories.length === 0) {
    return;
  }

  const selectedHistory = chatHistories.find((history) => history.id === selectedHistoryId);
  if (selectedHistory?.assistantId) {
    const currentConditionId = get(selectedPluginConditionIdAtom);
    // アシスタントが変更されている場合のみ更新
    if (currentConditionId !== selectedHistory.assistantId) {
      isDev && console.log(`🤖 auto-switching assistant to: ${selectedHistory.assistantId}`);
      set(selectedPluginConditionIdAtom, selectedHistory.assistantId);
    }
  }
});

export const apiErrorMessageAtom = atomWithReset<string | null>(null);

export const handleHistoryIdSelectAtom = atom(null, (get, set, historyId: string) => {
  set(selectedHistoryIdAtom, historyId);
  set(apiErrorMessageAtom, RESET);
  set(quickRepliesAtom, null);

  // アシスタント切り替えはautoSelectAssistantEffectで自動的に行われる

  if (isMobile()) {
    set(isHistoryDrawerOpenAtom, false);
  }
});

export const handleChatHistoryDeleteAtom = atom(null, async (get, set) => {
  try {
    set(pendingRequestCountAtom, (count) => count + 1);
    const id = get(selectedHistoryIdAtom);
    if (!id) {
      return;
    }
    const common = get(pluginCommonConfigAtom);
    const { outputAppId, outputKeyFieldCode, outputAppSpaceId } = common;

    const isGuest = await isGuestSpace(outputAppId);

    const query = `${outputKeyFieldCode} = "${id}"`;

    await deleteAllRecordsByQuery({
      app: outputAppId,
      query,
      debug: process.env.NODE_ENV === 'development',
      guestSpaceId: isGuest ? outputAppSpaceId : undefined,
    });

    set(chatHistoriesAtom, (_histories) =>
      produce(_histories, (draft) => {
        const index = draft.findIndex((history) => history.id === id);
        draft.splice(index, 1);
      })
    );

    set(selectedHistoryIdAtom, null);
    enqueueSnackbar('履歴を削除しました', { variant: 'success' });
  } finally {
    set(pendingRequestCountAtom, (count) => count - 1);
  }
});

export const selectedHistoryAtom = atom<ChatHistory | null, ChatHistory[], void>(
  (get) => {
    const chatHistory = get(chatHistoriesAtom);
    const selectedHistoryId = get(selectedHistoryIdAtom);
    if (!selectedHistoryId) {
      return null;
    }
    const selectedHistory = chatHistory.find((history) => history.id === selectedHistoryId);
    return selectedHistory ?? null;
  },
  (get, set, newValue) => {
    if (!newValue) {
      return;
    }
    set(chatHistoriesAtom, (prev) => {
      const index = prev.findIndex((history) => history.id === newValue.id);
      if (index === -1) {
        return [newValue, ...prev];
      }
      return prev.map((history, i) => (i === index ? newValue : history));
    });
  }
);

export const isChatHistorySelectedAtom = atom<boolean>((get) => {
  const selectedHistoryId = get(selectedHistoryIdAtom);
  return selectedHistoryId !== null;
});

/**
 * ファクトチェック状態（トランジェント状態 + 履歴からの派生状態）
 */
export const factCheckStateAtom = atom<FactCheckState>((get) => {
  const transient = get(transientFactCheckStateAtom);
  const history = get(selectedHistoryAtom);
  const fromHistory = extractFactCheckStateFromHistory(history);

  // トランジェント状態を優先（checking中は履歴より優先）
  return { ...fromHistory, ...transient };
});
