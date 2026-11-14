import type { ModelMessage } from 'ai';

/**
 * 会話履歴(`ModelMessage`)から、チャット画面に並べる項目を作ります(純粋関数)
 *
 * AI SDKのmessage partをそのまま画面へ渡さず、表示用の判別共用体にする(docs/07b 4章)。
 * 承認の要求と応答はツールの状態としてまとめ、ツールの結果は対応する呼び出しのカードに付ける
 */

export type ToolStatus =
  | 'done'
  | 'error'
  /** 利用者が却下した */
  | 'denied'
  | 'awaiting-approval'
  /** 承認したが、まだ結果が無い(生成中) */
  | 'running'
  /** 結果が無いまま終わった(中断など) */
  | 'interrupted';

export type ChatItem =
  | { kind: 'user'; id: string; text: string }
  | { kind: 'assistant'; id: string; text: string }
  | {
      kind: 'tool';
      id: string;
      toolCallId: string;
      toolName: string;
      input: unknown;
      status: ToolStatus;
      /** 結果(エラーならその説明)。承認待ち・却下では無い */
      output?: unknown;
    };

type ToolResultOutput =
  | { type: 'json' | 'text'; value: unknown }
  | { type: 'error-text' | 'error-json'; value: unknown }
  | { type: 'execution-denied'; reason?: string }
  | { type: string; value?: unknown };

type Outcome = { status: ToolStatus; output?: unknown };

const toText = (content: ModelMessage['content']): string =>
  typeof content === 'string'
    ? content
    : content.flatMap((part) => (part.type === 'text' ? [part.text] : [])).join('');

/** ツールの結果と承認の応答を、toolCallIdごとに集める */
const collectOutcomes = (messages: readonly ModelMessage[]) => {
  const outcomes = new Map<string, Outcome>();
  const approvalToCall = new Map<string, string>();
  const approvals = new Map<string, boolean>();
  for (const message of messages) {
    if (typeof message.content === 'string') continue;
    for (const part of message.content) {
      if (part.type === 'tool-approval-request') {
        approvalToCall.set(part.approvalId, part.toolCallId);
      } else if (part.type === 'tool-approval-response') {
        approvals.set(part.approvalId, part.approved);
      } else if (part.type === 'tool-result') {
        const output = part.output as ToolResultOutput;
        outcomes.set(
          part.toolCallId,
          output.type === 'execution-denied'
            ? { status: 'denied' }
            : output.type === 'error-text' || output.type === 'error-json'
              ? { status: 'error', output: 'value' in output ? output.value : undefined }
              : { status: 'done', output: 'value' in output ? output.value : undefined }
        );
      }
    }
  }
  const approvalByCall = new Map(
    [...approvalToCall].map(([approvalId, toolCallId]) => [toolCallId, approvals.get(approvalId)])
  );
  return { outcomes, approvalToCall, approvalByCall };
};

export const toChatItems = (
  messages: readonly ModelMessage[],
  options: { generating: boolean }
): ChatItem[] => {
  const { outcomes, approvalToCall, approvalByCall } = collectOutcomes(messages);
  const requested = new Set(approvalToCall.values());
  const items: ChatItem[] = [];
  messages.forEach((message, messageIndex) => {
    if (message.role === 'user') {
      items.push({ kind: 'user', id: `m${messageIndex}`, text: toText(message.content) });
      return;
    }
    if (message.role !== 'assistant') {
      return;
    }
    if (typeof message.content === 'string') {
      items.push({ kind: 'assistant', id: `m${messageIndex}`, text: message.content });
      return;
    }
    message.content.forEach((part, partIndex) => {
      const id = `m${messageIndex}-${partIndex}`;
      if (part.type === 'text' && part.text.trim() !== '') {
        items.push({ kind: 'assistant', id, text: part.text });
      } else if (part.type === 'tool-call') {
        const outcome = outcomes.get(part.toolCallId);
        const approved = approvalByCall.get(part.toolCallId);
        const status: ToolStatus =
          outcome?.status ??
          (approved === false
            ? 'denied'
            : approved === true
              ? options.generating
                ? 'running'
                : 'interrupted'
              : requested.has(part.toolCallId)
                ? 'awaiting-approval'
                : options.generating
                  ? 'running'
                  : 'interrupted');
        items.push({
          kind: 'tool',
          id,
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          input: part.input,
          status,
          ...(outcome?.output === undefined ? {} : { output: outcome.output }),
        });
      }
    });
  });
  return items;
};
