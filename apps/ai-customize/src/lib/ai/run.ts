import type { ModelMessage } from 'ai';
import type { AgentCallOptions, CustomizeAgent } from './agent';
import type { GenerateOutcome, PendingApproval } from './chat-session';

/**
 * Agentを1回呼び、チャットの状態遷移に要る形にまとめます
 *
 * @see docs/07-ai-tools.md 2章
 */

/**
 * AIへ送る履歴の大きさの目安(JSONの文字数)
 *
 * 超えたら、古いツール結果から省く。モデルの文脈長はさまざまなので、多くのモデルに収まる控えめな値にする
 */
export const HISTORY_BUDGET_CHARS = 120_000;

/** これより小さいツール結果は省いても縮まないため残す */
const MIN_PRUNABLE_CHARS = 500;

const PRUNED_OUTPUT = {
  type: 'text' as const,
  value: '(古いツール結果のため省略しました。必要なら同じツールを呼び直してください)',
};

const sizeOf = (value: unknown): number => JSON.stringify(value).length;

/**
 * AIへ送る履歴が大きすぎるとき、古いツール結果から省きます(純粋関数)
 *
 * 最後の利用者の発言より前のツール結果だけを対象にし、テキストのやり取りは残す。
 * ツールの呼び出しと結果の対応(toolCallId)は崩さない
 */
export const pruneForModel = (
  messages: readonly ModelMessage[],
  budget = HISTORY_BUDGET_CHARS
): ModelMessage[] => {
  let total = sizeOf(messages);
  if (total <= budget) return [...messages];
  const lastUserIndex = messages.findLastIndex((message) => message.role === 'user');
  return messages.map((message, index) => {
    if (total <= budget || index >= lastUserIndex || message.role !== 'tool') return message;
    return {
      ...message,
      content: message.content.map((part) => {
        if (total <= budget || part.type !== 'tool-result') return part;
        const size = sizeOf(part.output);
        if (size < MIN_PRUNABLE_CHARS) return part;
        total -= size - sizeOf(PRUNED_OUTPUT);
        return { ...part, output: PRUNED_OUTPUT };
      }),
    };
  });
};

export const runAgent = async (params: {
  agent: CustomizeAgent;
  messages: readonly ModelMessage[];
  remainingSteps: number;
  /** 承認したツール呼び出しと、承認カードで決めた値(再開のときだけ中身がある) */
  approvals?: AgentCallOptions['approvals'];
  abortSignal: AbortSignal;
  /**
   * stepが終わるたびに、ここまでのstepのメッセージを渡す(画面に往復ごとの進み具合を出すため)
   *
   * 履歴として確定するのは、全体が成功したときの`responseMessages`だけ
   */
  onStep?: (messages: ModelMessage[]) => void;
}): Promise<GenerateOutcome> => {
  const steps: ModelMessage[] = [];
  const result = await params.agent.generate({
    messages: pruneForModel(params.messages),
    options: { remainingSteps: params.remainingSteps, approvals: params.approvals ?? {} },
    abortSignal: params.abortSignal,
    onStepEnd: (step) => {
      steps.push(...step.response.messages);
      params.onStep?.([...steps]);
    },
  });
  const approvals: PendingApproval[] = result.content.flatMap((part) =>
    part.type === 'tool-approval-request'
      ? [
          {
            approvalId: part.approvalId,
            toolCallId: part.toolCall.toolCallId,
            toolName: part.toolCall.toolName,
            input: part.toolCall.input,
          },
        ]
      : []
  );
  return {
    // 承認したツールの実行結果と全stepのメッセージ(`response.messages`は最後のstepだけ)
    responseMessages: result.responseMessages,
    stepCount: result.steps.length,
    finishReason: result.finishReason,
    approvals,
    usage: {
      inputTokens: result.totalUsage.inputTokens,
      outputTokens: result.totalUsage.outputTokens,
    },
    text: result.text,
  };
};
