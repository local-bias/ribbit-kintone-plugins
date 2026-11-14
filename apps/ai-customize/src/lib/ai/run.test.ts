import type { ModelMessage } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { describe, expect, test, vi } from 'vitest';
import { createTestAsset } from '@/test/fixtures';
import { createCustomizeAgent } from './agent';
import { toChatItems } from './chat-items';
import {
  appendUserMessage,
  applyGenerateOutcome,
  createChatState,
  decideApproval,
  messagesForGeneration,
  remainingSteps,
} from './chat-session';
import { pruneForModel, runAgent } from './run';
import { type ChatToolServices, createReadTools, NO_APPROVAL_TOOLS } from './tools';

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};
const toolCall = (toolName: string, input: object, toolCallId: string) => ({
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

const target = { spaceId: '0', appId: '42' };

const createServices = (overrides: Partial<ChatToolServices> = {}): ChatToolServices => ({
  target,
  loginUserCode: 'sato',
  appContext: vi.fn(async () => ({
    appId: '42',
    appName: '案件',
    appDescription: '',
    screen: 'detail' as const,
    recordId: '1',
    language: 'ja',
    isGuestSpace: false,
    loginUser: { code: 'sato', name: '佐藤' },
  })),
  getFormFields: vi.fn(async () => ({})),
  getFormLayout: vi.fn(async () => []),
  getViews: vi.fn(async () => ({})),
  queryDom: vi.fn(() => ({ count: 0, samples: [], truncated: false })),
  getRecordSample: vi.fn(async () => ({ records: [], missingFields: [], truncated: false })),
  listAssets: vi.fn(async () => []),
  loadAsset: vi.fn(async (id: string) =>
    createTestAsset({ id, code: '/* 既存のコード */', scope: 'public', ...target2 })
  ),
  ...overrides,
});
const target2 = { targetAppId: '42', targetSpaceId: '0' };

const MAX_STEPS = 8;

const run = (
  agent: ReturnType<typeof createCustomizeAgent>,
  messages: ModelMessage[],
  steps: number
) =>
  runAgent({ agent, messages, remainingSteps: steps, abortSignal: new AbortController().signal });

describe('チャットの1往復(Agent + 読み取りツール + 承認)', () => {
  test('コード本文は承認するまで取得せず、承認後にSDKが実行して会話が続く', async () => {
    const services = createServices();
    const model = new MockLanguageModelV4({
      doGenerate: [
        toolCall('get_app_context', {}, 'c1'),
        toolCall('read_asset', { id: '7' }, 'c2'),
        text('コードを読みました'),
      ],
    });
    const agent = createCustomizeAgent({
      model,
      instructions: 'test',
      tools: createReadTools(services, { recordSample: false }),
      maxOutputTokens: 1000,
      temperature: null,
    });

    let state = appendUserMessage(createChatState(), '既存のコードを直して');
    state = applyGenerateOutcome(state, await run(agent, state.messages, MAX_STEPS), MAX_STEPS);
    expect(state.status).toBe('awaiting-approval');
    expect(state.pending).toEqual([
      expect.objectContaining({ toolName: 'read_asset', input: { id: '7' } }),
    ]);
    expect(services.loadAsset).not.toHaveBeenCalled();

    state = decideApproval(
      state,
      state.pending[0]?.approvalId ?? '',
      { approved: true },
      MAX_STEPS
    );
    state = applyGenerateOutcome(
      state,
      await run(agent, messagesForGeneration(state), remainingSteps(state, MAX_STEPS)),
      MAX_STEPS
    );
    expect(services.loadAsset).toHaveBeenCalledWith('7');
    expect(state.status).toBe('idle');
    const items = toChatItems(state.messages, { generating: false });
    expect(items.at(-1)).toMatchObject({ kind: 'assistant', text: 'コードを読みました' });
    expect(
      items.find((item) => item.kind === 'tool' && item.toolName === 'read_asset')
    ).toMatchObject({
      status: 'done',
      output: expect.objectContaining({ code: '/* 既存のコード */' }),
    });
    // 最後のプロンプトには承認したツールの結果が載っている
    expect(JSON.stringify(model.doGenerateCalls.at(-1)?.prompt)).toContain('既存のコード');
  });

  test('read_asset は取り直したアセットを再認可し、他のアプリや他人のprivateは存在も返さない', async () => {
    const tools = createReadTools(
      createServices({
        loadAsset: vi.fn(async (id: string) =>
          id === '1'
            ? createTestAsset({ id, targetAppId: '99', targetSpaceId: '0', scope: 'public' })
            : createTestAsset({ id, ...target2, scope: 'private', ownerCode: 'tanaka' })
        ),
      }),
      { recordSample: false }
    );
    const execute = tools.read_asset.execute;
    if (execute === undefined) throw new Error('no execute');
    const options = { toolCallId: 'x', messages: [], context: undefined as never };
    expect(await execute({ id: '1' }, options)).toEqual({ error: 'not-found' });
    expect(await execute({ id: '2' }, options)).toEqual({ error: 'not-found' });
  });

  test('レコードの値を送るツールは、設定で有効なときだけ載せる', () => {
    const services = createServices();
    expect('get_record_sample' in createReadTools(services, { recordSample: false })).toBe(false);
    expect('get_record_sample' in createReadTools(services, { recordSample: true })).toBe(true);
  });
});

describe('pruneForModel', () => {
  test('予算に収まっていれば何も省かない', () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: '1' },
      {
        role: 'assistant',
        content: [{ type: 'tool-call', toolCallId: 'a', toolName: 't', input: {} }],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'a',
            toolName: 't',
            output: { type: 'json', value: { code: 'x'.repeat(2000) } },
          },
        ],
      },
      { role: 'user', content: '2' },
    ];
    expect(pruneForModel(messages)).toEqual(messages);
  });

  test('予算を超えたら、最後の発言より前の大きなツール結果から省き、対応関係は残す', () => {
    const big = { type: 'json' as const, value: { data: 'x'.repeat(2000) } };
    const messages: ModelMessage[] = [
      { role: 'user', content: '1' },
      {
        role: 'assistant',
        content: [{ type: 'tool-call', toolCallId: 'a', toolName: 't', input: {} }],
      },
      {
        role: 'tool',
        content: [{ type: 'tool-result', toolCallId: 'a', toolName: 't', output: big }],
      },
      { role: 'user', content: '2' },
      {
        role: 'assistant',
        content: [{ type: 'tool-call', toolCallId: 'b', toolName: 't', input: {} }],
      },
      {
        role: 'tool',
        content: [{ type: 'tool-result', toolCallId: 'b', toolName: 't', output: big }],
      },
    ];
    const pruned = pruneForModel(messages, 3000);
    expect(pruned[2]).toMatchObject({
      content: [{ type: 'tool-result', toolCallId: 'a', output: { type: 'text' } }],
    });
    expect(pruned[5]).toBe(messages[5]);
    expect(messages[2]).toMatchObject({ content: [{ output: big }] });
  });
});

describe('承認の要否', () => {
  test('レコードの値を送るツールも、承認するまで値を取得しない', async () => {
    const services = createServices();
    const model = new MockLanguageModelV4({
      doGenerate: [toolCall('get_record_sample', { fields: ['金額'] }, 'c1'), text('ok')],
    });
    const agent = createCustomizeAgent({
      model,
      instructions: 'test',
      tools: createReadTools(services, { recordSample: true }),
      maxOutputTokens: 1000,
      temperature: null,
    });
    const outcome = await run(agent, [{ role: 'user', content: 'x' }], MAX_STEPS);
    expect(outcome.approvals).toEqual([expect.objectContaining({ toolName: 'get_record_sample' })]);
    expect(services.getRecordSample).not.toHaveBeenCalled();
  });

  test('承認なしで動くのは、構造・メタデータを読むツールだけ', () => {
    const tools = createReadTools(createServices(), { recordSample: true });
    const withoutApproval = Object.keys(tools).filter((name) => NO_APPROVAL_TOOLS.has(name));
    expect(withoutApproval.sort()).toEqual(
      [
        'get_app_context',
        'get_form_fields',
        'get_form_layout',
        'get_views',
        'list_assets',
        'query_dom',
      ].sort()
    );
    expect(
      Object.keys(tools)
        .filter((name) => !NO_APPROVAL_TOOLS.has(name))
        .sort()
    ).toEqual(['get_record_sample', 'read_asset']);
  });
});
