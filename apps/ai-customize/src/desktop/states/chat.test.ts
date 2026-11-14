import { describe, expect, test, vi } from 'vitest';
import type { GenerateOutcome } from '@/lib/ai/chat-session';
import { createTestCommonConfig } from '@/test/fixtures';
import type { ChatRuntime } from '../chat/runtime';
import {
  chatStateAtom,
  decideApprovalAtom,
  generationStartedAtAtom,
  newConversationAtom,
  retryChatAtom,
  sendMessageAtom,
  stopGenerationAtom,
} from './chat';
import { createTestServices } from './test-services';

const common = createTestCommonConfig({
  providerType: 'openai',
  model: 'gpt-x',
  registeredProxyEndpoint: 'https://api.openai.com/v1/responses',
  maxToolSteps: 4,
});

const outcome = (overrides: Partial<GenerateOutcome> = {}): GenerateOutcome => ({
  responseMessages: [{ role: 'assistant', content: [{ type: 'text', text: 'ok' }] }],
  stepCount: 1,
  finishReason: 'stop',
  approvals: [],
  usage: { inputTokens: 1, outputTokens: 1 },
  text: 'ok',
  ...overrides,
});

const setup = (run: ChatRuntime['run']) => {
  const runtime: ChatRuntime = {
    run: vi.fn(run),
    classifyError: vi.fn((error: unknown) =>
      error instanceof DOMException && error.name === 'AbortError'
        ? { kind: 'aborted' as const, retryable: true, detail: '' }
        : { kind: 'rate-limit' as const, retryable: true, detail: '' }
    ),
  };
  const { store, services } = createTestServices({
    assets: [],
    overrides: { common, createChatRuntime: vi.fn(async () => runtime) },
  });
  return { store, services, runtime };
};

describe('チャットの状態', () => {
  test('送信すると、使ってよいstep数を渡してAgentを呼び、結果を積む', async () => {
    const { store, runtime, services } = setup(async () => outcome());
    await store.set(sendMessageAtom, '  一覧の色を変えたい  ');

    expect(runtime.run).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: '一覧の色を変えたい' }],
        remainingSteps: 4,
      })
    );
    expect(store.get(chatStateAtom).status).toBe('idle');
    expect(store.get(chatStateAtom).messages).toHaveLength(2);
    expect(store.get(generationStartedAtAtom)).toBeNull();

    // 同じ画面では実行部分を作り直さない
    await store.set(sendMessageAtom, 'もう一つ');
    expect(services.createChatRuntime).toHaveBeenCalledTimes(1);
  });

  test('承認を待ち、判断したら残りのstep数で再開する', async () => {
    const run = vi
      .fn<ChatRuntime['run']>()
      .mockResolvedValueOnce(
        outcome({
          stepCount: 1,
          finishReason: 'tool-calls',
          approvals: [
            { approvalId: 'a1', toolCallId: 'c1', toolName: 'read_asset', input: { id: '3' } },
          ],
        })
      )
      .mockResolvedValueOnce(outcome());
    const { store, runtime } = setup(run);

    await store.set(sendMessageAtom, '直して');
    expect(store.get(chatStateAtom).status).toBe('awaiting-approval');

    await store.set(decideApprovalAtom, { approvalId: 'a1', approved: true });
    expect(runtime.run).toHaveBeenLastCalledWith(expect.objectContaining({ remainingSteps: 3 }));
    expect(store.get(chatStateAtom).status).toBe('idle');
  });

  test('止めたら待機をやめ、後から届いた結果は捨てる', async () => {
    let resolve: (value: GenerateOutcome) => void = () => {};
    const { store } = setup(() => new Promise((r) => (resolve = r)));
    const pending = store.set(sendMessageAtom, 'x');
    await new Promise((r) => setTimeout(r, 0));
    expect(store.get(chatStateAtom).status).toBe('generating');

    store.set(stopGenerationAtom);
    expect(store.get(chatStateAtom).status).toBe('idle');
    resolve(outcome({ responseMessages: [{ role: 'assistant', content: 'late' }] }));
    await pending;
    expect(store.get(chatStateAtom).messages).toEqual([{ role: 'user', content: 'x' }]);
  });

  test('失敗したら理由を残し、再試行で同じ履歴から呼び直す', async () => {
    const run = vi
      .fn<ChatRuntime['run']>()
      .mockRejectedValueOnce(new Error('429'))
      .mockResolvedValueOnce(outcome());
    const { store } = setup(run);
    await store.set(sendMessageAtom, 'x');
    expect(store.get(chatStateAtom)).toMatchObject({
      status: 'error',
      error: { kind: 'rate-limit' },
    });

    await store.set(retryChatAtom);
    expect(store.get(chatStateAtom).status).toBe('idle');
    expect(run).toHaveBeenCalledTimes(2);
  });

  test('AIが未設定(APIキー未登録)なら呼ばずにエラーにする', async () => {
    const { store, services } = createTestServices({ assets: [] });
    await store.set(sendMessageAtom, 'x');
    expect(store.get(chatStateAtom).status).toBe('error');
    expect(services.createChatRuntime).not.toHaveBeenCalled();
  });

  test('承認後の再開を止めたら承認待ちへ戻り、応答は履歴に入らない', async () => {
    let resolve: (value: GenerateOutcome) => void = () => {};
    const run = vi
      .fn<ChatRuntime['run']>()
      .mockResolvedValueOnce(
        outcome({
          finishReason: 'tool-calls',
          approvals: [
            { approvalId: 'a1', toolCallId: 'c1', toolName: 'read_asset', input: { id: '3' } },
          ],
        })
      )
      .mockImplementationOnce(() => new Promise((r) => (resolve = r)));
    const { store } = setup(run);
    await store.set(sendMessageAtom, 'x');
    const before = store.get(chatStateAtom).messages;

    const resuming = store.set(decideApprovalAtom, { approvalId: 'a1', approved: true });
    await new Promise((r) => setTimeout(r, 0));
    store.set(stopGenerationAtom);
    resolve(outcome());
    await resuming;

    expect(store.get(chatStateAtom)).toMatchObject({ status: 'awaiting-approval', resume: null });
    expect(store.get(chatStateAtom).messages).toEqual(before);
  });

  test('チャットを使えない人は送れない', async () => {
    const { store, runtime, services } = setup(async () => outcome());
    vi.mocked(services.loadCanChat).mockResolvedValue(false);
    await store.set(sendMessageAtom, 'x');
    expect(runtime.run).not.toHaveBeenCalled();
    expect(store.get(chatStateAtom).messages).toEqual([]);
  });

  test('新しい会話にすると履歴を消す', async () => {
    const { store } = setup(async () => outcome());
    await store.set(sendMessageAtom, 'x');
    store.set(newConversationAtom);
    expect(store.get(chatStateAtom).messages).toEqual([]);
  });
});
