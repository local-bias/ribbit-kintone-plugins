import { isStepCount, type ModelMessage, ToolLoopAgent, tool } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';

/**
 * AI SDK 7の承認・再開・ツールごとのcontextの挙動を固定する契約テスト
 *
 * 本プラグインはこれらの仕組みに乗り、承認後のツール実行を自前で組まない(docs/07b 4-2章)。
 * SDKの更新で挙動が変わったら、ここが先に落ちる
 */

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};

const toolCall = (toolName: string, input: object, toolCallId = `call-${toolName}`) => ({
  content: [{ type: 'tool-call' as const, toolCallId, toolName, input: JSON.stringify(input) }],
  finishReason: { unified: 'tool-calls' as const, raw: 'tool_calls' },
  usage,
  warnings: [],
});

const text = (value: string) => ({
  content: [{ type: 'text' as const, text: value }],
  finishReason: { unified: 'stop' as const, raw: 'stop' },
  usage,
  warnings: [],
});

const OverridesSchema = z.object({ scope: z.enum(['private', 'public']).optional() });

const createAgent = (model: MockLanguageModelV4, readExecute = vi.fn(), writeExecute = vi.fn()) =>
  new ToolLoopAgent({
    model,
    instructions: 'test',
    tools: {
      read_thing: tool({
        inputSchema: z.object({ id: z.string() }),
        execute: async (input) => {
          readExecute(input);
          return { ok: true };
        },
      }),
      write_thing: tool({
        inputSchema: z.object({ scope: z.enum(['private', 'public']) }),
        contextSchema: z.object({ overrides: z.record(z.string(), OverridesSchema) }),
        execute: async (input, { context, toolCallId }) => {
          const applied = context.overrides[toolCallId]?.scope ?? input.scope;
          writeExecute({ input, applied });
          return { appliedScope: applied };
        },
      }),
    },
    toolApproval: { write_thing: 'user-approval' },
    toolsContext: { write_thing: { overrides: {} } },
    callOptionsSchema: z.object({ overrides: z.record(z.string(), OverridesSchema) }),
    prepareCall: ({ options, ...rest }) => ({
      ...rest,
      toolsContext: { ...rest.toolsContext, write_thing: { overrides: options?.overrides ?? {} } },
    }),
    maxRetries: 0,
    stopWhen: isStepCount(5),
  });

describe('AI SDK 7 の承認フロー', () => {
  test('承認が要らないツールはそのまま実行され、ループが続く', async () => {
    const readExecute = vi.fn();
    const model = new MockLanguageModelV4({
      doGenerate: [toolCall('read_thing', { id: '1' }), text('done')],
    });
    const result = await createAgent(model, readExecute).generate({
      prompt: 'hi',
      options: { overrides: {} },
    });
    expect(readExecute).toHaveBeenCalledWith({ id: '1' });
    expect(result.text).toBe('done');
    expect(result.steps).toHaveLength(2);
  });

  test('承認が要るツールは実行されず、承認要求で止まる。再開すると承認を反映して実行される', async () => {
    const writeExecute = vi.fn();
    const model = new MockLanguageModelV4({
      doGenerate: [toolCall('write_thing', { scope: 'public' }), text('saved')],
    });
    const agent = createAgent(model, vi.fn(), writeExecute);
    const messages: ModelMessage[] = [{ role: 'user', content: 'save' }];

    const first = await agent.generate({ messages, options: { overrides: {} } });
    expect(writeExecute).not.toHaveBeenCalled();
    const request = first.content.find((part) => part.type === 'tool-approval-request');
    expect(request).toMatchObject({
      type: 'tool-approval-request',
      toolCall: { toolName: 'write_thing', input: { scope: 'public' } },
    });
    if (request?.type !== 'tool-approval-request') throw new Error('no approval request');

    const resumed = await agent.generate({
      messages: [
        ...messages,
        ...first.responseMessages,
        {
          role: 'tool',
          content: [
            { type: 'tool-approval-response', approvalId: request.approvalId, approved: true },
          ],
        },
      ],
      // 承認カードで、利用者が影響範囲を「自分だけ」へ落とした
      options: { overrides: { [request.toolCall.toolCallId]: { scope: 'private' } } },
    });
    expect(writeExecute).toHaveBeenCalledWith({ input: { scope: 'public' }, applied: 'private' });
    expect(resumed.text).toBe('saved');
  });

  test('承認を挟んだ履歴は responseMessages で積む。次の発言で承認済みのツールを再実行しない', async () => {
    const writeExecute = vi.fn();
    const model = new MockLanguageModelV4({
      doGenerate: [
        toolCall('write_thing', { scope: 'private' }),
        toolCall('read_thing', { id: '9' }),
        text('saved'),
        text('next answer'),
      ],
    });
    const agent = createAgent(model, vi.fn(), writeExecute);
    const history: ModelMessage[] = [{ role: 'user', content: 'save' }];
    const first = await agent.generate({ messages: history, options: { overrides: {} } });
    const request = first.content.find((part) => part.type === 'tool-approval-request');
    if (request?.type !== 'tool-approval-request') throw new Error('no approval request');
    history.push(...first.responseMessages, {
      role: 'tool',
      content: [{ type: 'tool-approval-response', approvalId: request.approvalId, approved: true }],
    });

    const resumed = await agent.generate({ messages: history, options: { overrides: {} } });
    // `response.messages`は最後のstepだけ。承認したツールの結果と途中のstepは`responseMessages`にある
    expect(resumed.response.messages).toHaveLength(1);
    expect(resumed.responseMessages.length).toBeGreaterThan(1);
    history.push(...resumed.responseMessages, { role: 'user', content: 'more' });

    const next = await agent.generate({ messages: history, options: { overrides: {} } });
    expect(next.text).toBe('next answer');
    expect(writeExecute).toHaveBeenCalledTimes(1);
  });

  test('却下すると実行されない', async () => {
    const writeExecute = vi.fn();
    const model = new MockLanguageModelV4({
      doGenerate: [toolCall('write_thing', { scope: 'private' }), text('ok, not saved')],
    });
    const agent = createAgent(model, vi.fn(), writeExecute);
    const messages: ModelMessage[] = [{ role: 'user', content: 'save' }];
    const first = await agent.generate({ messages, options: { overrides: {} } });
    const request = first.content.find((part) => part.type === 'tool-approval-request');
    if (request?.type !== 'tool-approval-request') throw new Error('no approval request');

    const resumed = await agent.generate({
      messages: [
        ...messages,
        ...first.responseMessages,
        {
          role: 'tool',
          content: [
            {
              type: 'tool-approval-response',
              approvalId: request.approvalId,
              approved: false,
              reason: 'no',
            },
          ],
        },
      ],
      options: { overrides: {} },
    });
    expect(writeExecute).not.toHaveBeenCalled();
    expect(resumed.text).toBe('ok, not saved');
  });

  test('stopWhen の step 上限で止まる', async () => {
    const model = new MockLanguageModelV4({
      doGenerate: [
        toolCall('read_thing', { id: '1' }, 'a'),
        toolCall('read_thing', { id: '2' }, 'b'),
        toolCall('read_thing', { id: '3' }, 'c'),
      ],
    });
    const agent = new ToolLoopAgent({
      model,
      tools: {
        read_thing: tool({ inputSchema: z.object({ id: z.string() }), execute: async () => 1 }),
      },
      stopWhen: isStepCount(2),
    });
    const result = await agent.generate({ prompt: 'x' });
    expect(result.steps).toHaveLength(2);
  });
});
