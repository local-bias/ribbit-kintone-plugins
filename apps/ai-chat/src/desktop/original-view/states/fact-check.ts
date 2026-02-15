import { atom } from 'jotai';
import type { FactCheckResult, FactCheckStatus } from '@/schema/fact-check';
import type { ChatHistory } from '@/lib/static';

export type { FactCheckResult, FactCheckStatus, FactCheckDetail } from '@/schema/fact-check';

/**
 * トランジェント状態（checking, error）のみを保持
 * 完了した結果はチャット履歴から取得
 */
export type TransientFactCheckState = {
  [messageId: string]: {
    status: 'checking' | 'error';
    error?: string;
  };
};

/**
 * 表示用のファクトチェック状態（完了結果 + トランジェント状態）
 */
export type FactCheckState = {
  [messageId: string]: {
    status: FactCheckStatus;
    result?: FactCheckResult;
    error?: string;
  };
};

/**
 * トランジェント状態（checking, error）のみを管理
 */
export const transientFactCheckStateAtom = atom<TransientFactCheckState>({});

/**
 * チャット履歴からファクトチェック状態を抽出するヘルパー関数
 */
export const extractFactCheckStateFromHistory = (history: ChatHistory | null): FactCheckState => {
  if (!history) return {};

  const state: FactCheckState = {};
  for (const message of history.messages) {
    if (message.role === 'fact-check') {
      state[message.targetMessageId] = {
        status: message.content.level,
        result: message.content,
      };
    }
  }
  return state;
};

/**
 * selectedHistoryAtomを受け取り、ファクトチェック状態を返す派生Atomを作成
 * 使用するコンポーネントで selectedHistoryAtom と組み合わせて使用
 */
export const createFactCheckStateAtom = (
  selectedHistoryAtom: ReturnType<typeof atom<ChatHistory | null>>
) =>
  atom<FactCheckState>((get) => {
    const transient = get(transientFactCheckStateAtom);
    const history = get(selectedHistoryAtom);
    const fromHistory = extractFactCheckStateFromHistory(history);

    // トランジェント状態を優先（checking中は履歴より優先）
    return { ...fromHistory, ...transient };
  });
