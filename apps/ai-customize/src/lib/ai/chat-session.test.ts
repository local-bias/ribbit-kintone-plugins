import type { ModelMessage } from 'ai';
import { describe, expect, test } from 'vitest';
import { toChatItems } from './chat-items';
import {
  appendUserMessage,
  applyAbort,
  applyGenerateError,
  applyGenerateOutcome,
  canSend,
  continueAfterStepLimit,
  createChatState,
  decideApproval,
  type GenerateOutcome,
  messagesForGeneration,
  nextPendingApproval,
  remainingSteps,
  retryAfterError,
} from './chat-session';

const MAX_STEPS = 4;

const outcome = (overrides: Partial<GenerateOutcome> = {}): GenerateOutcome => ({
  responseMessages: [{ role: 'assistant', content: [{ type: 'text', text: 'ok' }] }],
  stepCount: 1,
  finishReason: 'stop',
  approvals: [],
  usage: { inputTokens: 10, outputTokens: 3 },
  text: 'ok',
  ...overrides,
});

const approval = (approvalId: string, toolCallId: string) => ({
  approvalId,
  toolCallId,
  toolName: 'read_asset',
  input: { id: '1' },
});

describe('チャットの進行', () => {
  test('送信して生成が終わると、履歴と使用量を積んで待機に戻る', () => {
    const sent = appendUserMessage(createChatState(), 'こんにちは');
    expect(sent.status).toBe('generating');
    expect(canSend(sent)).toBe(false);
    const done = applyGenerateOutcome(sent, outcome(), MAX_STEPS);
    expect(done).toMatchObject({
      status: 'idle',
      usedSteps: 1,
      usage: { inputTokens: 10, outputTokens: 3 },
    });
    expect(done.messages).toHaveLength(2);
  });

  test('承認は全て判断してから、応答をまとめて積んで再開する', () => {
    const waiting = applyGenerateOutcome(
      appendUserMessage(createChatState(), 'x'),
      outcome({
        approvals: [approval('a1', 'c1'), approval('a2', 'c2')],
        finishReason: 'tool-calls',
      }),
      MAX_STEPS
    );
    expect(waiting.status).toBe('awaiting-approval');
    expect(nextPendingApproval(waiting)?.approvalId).toBe('a1');

    const half = decideApproval(waiting, 'a1', { approved: true }, MAX_STEPS);
    expect(half.status).toBe('awaiting-approval');
    expect(nextPendingApproval(half)?.approvalId).toBe('a2');
    expect(half.messages).toHaveLength(waiting.messages.length);

    const resumed = decideApproval(half, 'a2', { approved: false, reason: '送らない' }, MAX_STEPS);
    expect(resumed.status).toBe('generating');
    // 承認の応答は、再開が成功するまで履歴に入れない
    expect(resumed.messages).toHaveLength(waiting.messages.length);
    expect(messagesForGeneration(resumed).at(-1)).toEqual({
      role: 'tool',
      content: [
        { type: 'tool-approval-response', approvalId: 'a1', approved: true },
        { type: 'tool-approval-response', approvalId: 'a2', approved: false, reason: '送らない' },
      ],
    });
  });

  test('承認カードで決めた値は、承認したツール呼び出しの分だけ再開に持ち運び、止めたら捨てる', () => {
    const waiting = applyGenerateOutcome(
      appendUserMessage(createChatState(), 'x'),
      outcome({
        approvals: [approval('a1', 'c1'), approval('a2', 'c2'), approval('a3', 'c3')],
        finishReason: 'tool-calls',
      }),
      MAX_STEPS
    );
    let state = decideApproval(
      waiting,
      'a1',
      { approved: true, override: { scope: 'private' } },
      MAX_STEPS
    );
    state = decideApproval(
      state,
      'a2',
      { approved: false, override: { scope: 'public' } },
      MAX_STEPS
    );
    state = decideApproval(state, 'a3', { approved: true }, MAX_STEPS);
    expect(state.resumeApprovals).toEqual({ c1: { scope: 'private' }, c3: {} });
    // 失敗して再試行するときは同じ値を使う
    expect(
      retryAfterError(applyGenerateError(state, { kind: 'network', retryable: true, detail: '' }))
        .resumeApprovals
    ).toEqual(state.resumeApprovals);
    expect(applyAbort(state).resumeApprovals).toEqual({});
    expect(applyGenerateOutcome(state, outcome(), MAX_STEPS).resumeApprovals).toEqual({});
  });

  test('承認後の再開を止めたら、承認待ちへ戻し、応答を履歴に残さない', () => {
    const waiting = applyGenerateOutcome(
      appendUserMessage(createChatState(), 'x'),
      outcome({ approvals: [approval('a1', 'c1')], finishReason: 'tool-calls' }),
      MAX_STEPS
    );
    const resumed = decideApproval(waiting, 'a1', { approved: true }, MAX_STEPS);
    const aborted = applyAbort(resumed);
    expect(aborted).toMatchObject({ status: 'awaiting-approval', resume: null, decisions: {} });
    expect(aborted.messages).toEqual(waiting.messages);
    expect(nextPendingApproval(aborted)?.approvalId).toBe('a1');
  });

  test('承認後の再開が失敗したら、新しい発言は送らせず、再試行で同じ再開をやり直す', () => {
    const waiting = applyGenerateOutcome(
      appendUserMessage(createChatState(), 'x'),
      outcome({ approvals: [approval('a1', 'c1')], finishReason: 'tool-calls' }),
      MAX_STEPS
    );
    const failed = applyGenerateError(
      decideApproval(waiting, 'a1', { approved: true }, MAX_STEPS),
      {
        kind: 'rate-limit',
        retryable: true,
        detail: '',
      }
    );
    expect(canSend(failed)).toBe(false);
    expect(appendUserMessage(failed, 'y')).toBe(failed);
    const retried = retryAfterError(failed);
    expect(retried.status).toBe('generating');
    expect(messagesForGeneration(retried).at(-1)).toMatchObject({ role: 'tool' });

    const done = applyGenerateOutcome(retried, outcome(), MAX_STEPS);
    expect(done.resume).toBeNull();
    expect(done.messages.at(-2)).toMatchObject({ role: 'tool' });
    expect(canSend(done)).toBe(true);
  });

  test('stepを使い切った時点の承認は、再開せず続行を選ばせる', () => {
    const waiting = applyGenerateOutcome(
      appendUserMessage(createChatState(), 'x'),
      outcome({
        stepCount: MAX_STEPS,
        approvals: [approval('a1', 'c1')],
        finishReason: 'tool-calls',
      }),
      MAX_STEPS
    );
    const decided = decideApproval(waiting, 'a1', { approved: true }, MAX_STEPS);
    expect(decided.status).toBe('step-limit');
    expect(canSend(decided)).toBe(false);
    const continued = continueAfterStepLimit(decided);
    expect(continued).toMatchObject({ status: 'generating', usedSteps: 0 });
    expect(messagesForGeneration(continued).at(-1)).toMatchObject({ role: 'tool' });
  });

  test('出力の上限で切れた・空の応答は知らせる', () => {
    const sent = appendUserMessage(createChatState(), 'x');
    expect(applyGenerateOutcome(sent, outcome({ finishReason: 'length' }), MAX_STEPS).notice).toBe(
      'length'
    );
    expect(
      applyGenerateOutcome(sent, outcome({ finishReason: 'content-filter' }), MAX_STEPS).notice
    ).toBe('content-filter');
    expect(applyGenerateOutcome(sent, outcome({ text: ' ' }), MAX_STEPS).notice).toBe('empty');
    expect(applyGenerateOutcome(sent, outcome(), MAX_STEPS).notice).toBeNull();
  });

  test('知らない承認IDや、承認待ちでないときの判断は無視する', () => {
    const idle = createChatState();
    expect(decideApproval(idle, 'a1', { approved: true }, MAX_STEPS)).toBe(idle);
  });

  test('step上限は承認をまたいで累積し、上限で止めたら続行を選ばせる', () => {
    let state = appendUserMessage(createChatState(), 'x');
    state = applyGenerateOutcome(
      state,
      outcome({ stepCount: 3, approvals: [approval('a1', 'c1')], finishReason: 'tool-calls' }),
      MAX_STEPS
    );
    expect(remainingSteps(state, MAX_STEPS)).toBe(1);
    state = decideApproval(state, 'a1', { approved: true }, MAX_STEPS);
    state = applyGenerateOutcome(
      state,
      outcome({ stepCount: 1, finishReason: 'tool-calls' }),
      MAX_STEPS
    );
    expect(state.status).toBe('step-limit');
    expect(remainingSteps(state, MAX_STEPS)).toBe(0);
    const continued = continueAfterStepLimit(state);
    expect(continued).toMatchObject({ status: 'generating', usedSteps: 0 });
  });

  test('失敗したら理由を残し、送信し直せる', () => {
    const failed = applyGenerateError(appendUserMessage(createChatState(), 'x'), {
      kind: 'rate-limit',
      retryable: true,
      detail: '',
    });
    expect(failed.status).toBe('error');
    expect(canSend(failed)).toBe(true);
  });
});

describe('toChatItems', () => {
  const messages: ModelMessage[] = [
    { role: 'user', content: '色を変えて' },
    {
      role: 'assistant',
      content: [
        { type: 'text', text: '確認します' },
        { type: 'tool-call', toolCallId: 'c1', toolName: 'get_form_fields', input: {} },
        { type: 'tool-call', toolCallId: 'c2', toolName: 'read_asset', input: { id: '3' } },
        { type: 'tool-approval-request', approvalId: 'a2', toolCallId: 'c2' },
      ],
    },
    {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: 'c1',
          toolName: 'get_form_fields',
          output: { type: 'json', value: [{ code: '金額' }] },
        },
      ],
    },
  ];

  test('発言・ツールの結果・承認待ちを、表示用の項目にする', () => {
    expect(toChatItems(messages, { generating: false })).toEqual([
      { kind: 'user', id: 'm0', text: '色を変えて' },
      { kind: 'assistant', id: 'm1-0', text: '確認します' },
      {
        kind: 'tool',
        id: 'm1-1',
        toolCallId: 'c1',
        toolName: 'get_form_fields',
        input: {},
        status: 'done',
        output: [{ code: '金額' }],
      },
      {
        kind: 'tool',
        id: 'm1-2',
        toolCallId: 'c2',
        toolName: 'read_asset',
        input: { id: '3' },
        status: 'awaiting-approval',
      },
    ]);
  });

  test('却下・エラー・承認後の実行中を区別する', () => {
    const denied = [
      ...messages,
      {
        role: 'tool',
        content: [{ type: 'tool-approval-response', approvalId: 'a2', approved: false }],
      },
    ] as ModelMessage[];
    expect(toChatItems(denied, { generating: true }).at(-1)).toMatchObject({ status: 'denied' });

    const approved = [
      ...messages,
      {
        role: 'tool',
        content: [{ type: 'tool-approval-response', approvalId: 'a2', approved: true }],
      },
    ] as ModelMessage[];
    expect(toChatItems(approved, { generating: true }).at(-1)).toMatchObject({ status: 'running' });

    const failed = [
      ...approved,
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'c2',
            toolName: 'read_asset',
            output: { type: 'error-text', value: 'Error: boom' },
          },
        ],
      },
    ] as ModelMessage[];
    expect(toChatItems(failed, { generating: false }).at(-1)).toMatchObject({
      status: 'error',
      output: 'Error: boom',
    });
  });
});
