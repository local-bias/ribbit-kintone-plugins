import type { ModelMessage } from 'ai';
import type { AiError } from './errors';

/**
 * チャットの進行(送信 → 生成 → 承認 → 再開)を表す状態と、その遷移(純粋関数)
 *
 * - 会話履歴はAI SDKの`ModelMessage`を正本にする。各生成の`responseMessages`(承認したツールの実行結果と全step)を積む
 *   (`response.messages`は最後のstepだけなので使わない)
 * - 承認待ちは表示順に1件ずつ判断させ、全て判断してから再開する(未判断を残して再開しない)
 * - 承認の応答(`tool-approval-response`)は、再開が成功するまで履歴に入れず`resume`に持つ。
 *   止めたり失敗したりした再開の応答が履歴に残ると、次の発言でツール結果の欠けた履歴になり会話が進まなくなる
 * - step上限は利用者の発言1件に対して累積する。承認で再開するたびに上限を戻さない
 *
 * @see docs/07-ai-tools.md 2章、docs/07b-ai-providers.md 4-2章
 */

export type ChatStatus = 'idle' | 'generating' | 'awaiting-approval' | 'step-limit' | 'error';

export type PendingApproval = {
  approvalId: string;
  toolCallId: string;
  toolName: string;
  input: unknown;
};

export type ApprovalDecision = { approved: boolean; reason?: string };

export type TokenUsage = { inputTokens: number; outputTokens: number };

/**
 * 生成は終わったが、利用者に知らせることがある
 *
 * - `length`: 出力の上限で途中で切れた(コードが欠けている可能性がある)
 * - `content-filter`: プロバイダーのフィルターで止まった
 * - `empty`: 本文もツール呼び出しも無い応答だった
 */
export type ChatNotice = 'length' | 'content-filter' | 'empty';

export type ChatState = {
  messages: ModelMessage[];
  status: ChatStatus;
  /** 承認を待っているツール呼び出し(表示順) */
  pending: PendingApproval[];
  decisions: Readonly<Record<string, ApprovalDecision>>;
  /** 全て判断した承認の応答。再開が成功したら履歴へ入れる */
  resume: ModelMessage | null;
  /** いまの利用者の発言に対して使ったstep数 */
  usedSteps: number;
  error: AiError | null;
  notice: ChatNotice | null;
  /** この会話で使ったトークン数の合計 */
  usage: TokenUsage;
};

export const createChatState = (): ChatState => ({
  messages: [],
  status: 'idle',
  pending: [],
  decisions: {},
  resume: null,
  usedSteps: 0,
  error: null,
  notice: null,
  usage: { inputTokens: 0, outputTokens: 0 },
});

/**
 * 新しい発言を送れる状態か
 *
 * 生成中・承認待ちは送らせない。承認の応答が履歴に入っていない(再開が済んでいない)間も、
 * 続ける・再試行・新しい会話のどれかを選ばせる
 */
export const canSend = (state: ChatState): boolean =>
  state.resume === null &&
  (state.status === 'idle' || state.status === 'error' || state.status === 'step-limit');

export const appendUserMessage = (state: ChatState, text: string): ChatState =>
  canSend(state)
    ? {
        ...state,
        messages: [...state.messages, { role: 'user', content: text }],
        status: 'generating',
        usedSteps: 0,
        error: null,
        notice: null,
      }
    : state;

/** 次の生成で使ってよいstep数 */
export const remainingSteps = (state: ChatState, maxSteps: number): number =>
  Math.max(maxSteps - state.usedSteps, 0);

/** 次の生成でAIへ送る履歴(再開なら、承認の応答を末尾に付ける) */
export const messagesForGeneration = (state: ChatState): ModelMessage[] =>
  state.resume === null ? state.messages : [...state.messages, state.resume];

/** `agent.generate()`の結果のうち、状態の遷移に要るもの */
export type GenerateOutcome = {
  responseMessages: ModelMessage[];
  stepCount: number;
  finishReason: string;
  approvals: PendingApproval[];
  usage: { inputTokens?: number; outputTokens?: number };
  /** 最後のstepの本文 */
  text: string;
};

const noticeOf = (outcome: GenerateOutcome): ChatNotice | null => {
  if (outcome.finishReason === 'length') return 'length';
  if (outcome.finishReason === 'content-filter') return 'content-filter';
  if (
    outcome.finishReason === 'stop' &&
    outcome.approvals.length === 0 &&
    outcome.text.trim() === '' &&
    outcome.stepCount <= 1
  ) {
    return 'empty';
  }
  return null;
};

export const applyGenerateOutcome = (
  state: ChatState,
  outcome: GenerateOutcome,
  maxSteps: number
): ChatState => {
  const usedSteps = state.usedSteps + outcome.stepCount;
  const status: ChatStatus =
    outcome.approvals.length > 0
      ? 'awaiting-approval'
      : // ツール呼び出しで終わったのは、step上限で止めたとき
        outcome.finishReason === 'tool-calls' && usedSteps >= maxSteps
        ? 'step-limit'
        : 'idle';
  return {
    ...state,
    messages: [...messagesForGeneration(state), ...outcome.responseMessages],
    status,
    pending: outcome.approvals,
    decisions: {},
    resume: null,
    usedSteps,
    error: null,
    notice: noticeOf(outcome),
    usage: {
      inputTokens: state.usage.inputTokens + (outcome.usage.inputTokens ?? 0),
      outputTokens: state.usage.outputTokens + (outcome.usage.outputTokens ?? 0),
    },
  };
};

/** 生成が失敗した。再開の応答(`resume`)は残し、再試行で同じ再開をやり直せるようにする */
export const applyGenerateError = (state: ChatState, error: AiError): ChatState => ({
  ...state,
  status: 'error',
  error,
});

/** 次に判断してもらう承認(表示順の先頭から) */
export const nextPendingApproval = (state: ChatState): PendingApproval | null =>
  state.status === 'awaiting-approval'
    ? (state.pending.find(({ approvalId }) => state.decisions[approvalId] === undefined) ?? null)
    : null;

/**
 * 承認待ちの1件を判断します
 *
 * 全て判断したら承認の応答を`resume`に作り、生成中へ進める(呼び出し側が再開する)。
 * stepを使い切っていれば再開せず、続けるかを利用者に選ばせる
 */
export const decideApproval = (
  state: ChatState,
  approvalId: string,
  decision: ApprovalDecision,
  maxSteps: number
): ChatState => {
  if (
    state.status !== 'awaiting-approval' ||
    !state.pending.some((pending) => pending.approvalId === approvalId)
  ) {
    return state;
  }
  const decisions = { ...state.decisions, [approvalId]: decision };
  if (state.pending.some((pending) => decisions[pending.approvalId] === undefined)) {
    return { ...state, decisions };
  }
  const resume: ModelMessage = {
    role: 'tool',
    content: state.pending.map(({ approvalId: id }) => {
      const { approved, reason } = decisions[id] as ApprovalDecision;
      return {
        type: 'tool-approval-response' as const,
        approvalId: id,
        approved,
        ...(reason === undefined || reason.trim() === '' ? {} : { reason: reason.trim() }),
      };
    }),
  };
  return {
    ...state,
    decisions,
    resume,
    status: remainingSteps(state, maxSteps) > 0 ? 'generating' : 'step-limit',
  };
};

/** step上限で止めた後、利用者が続行を選んだ */
export const continueAfterStepLimit = (state: ChatState): ChatState =>
  state.status === 'step-limit' ? { ...state, status: 'generating', usedSteps: 0 } : state;

/** 失敗した生成をやり直す(履歴と再開の応答はそのまま) */
export const retryAfterError = (state: ChatState): ChatState =>
  state.status === 'error' ? { ...state, status: 'generating', error: null } : state;

/**
 * 生成を利用者が止めた。履歴は生成前のまま残る
 *
 * 承認後の再開を止めたら、承認待ちへ戻して判断し直させる(承認の応答は履歴へ入れない)
 */
export const applyAbort = (state: ChatState): ChatState =>
  state.resume !== null
    ? { ...state, status: 'awaiting-approval', decisions: {}, resume: null }
    : { ...state, status: 'idle' };
