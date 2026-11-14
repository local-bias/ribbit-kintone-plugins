import { isStepCount, type LanguageModel, ToolLoopAgent } from 'ai';
import { z } from 'zod';
import { NO_APPROVAL_TOOLS, type ReadTools } from './tools';

/**
 * カスタマイズを作るAgent
 *
 * - ストリーミングは使わない(kintoneのproxyは応答を一度に返す。docs/07b 7章)
 * - SDKの自動再試行は0にする。二重課金と、書き込みツールの重複実行を避けるため(docs/07b 8章)
 * - 承認が要らないツールだけを許可リストで宣言し、それ以外は全て承認させる。承認後の実行はSDKに任せる(docs/07b 4-2章)
 * - step上限は利用者の発言1件ぶんで累積させるため、呼び出しごとに残りを渡す
 *
 * @see docs/07b-ai-providers.md 4章
 */

export const AgentCallOptionsSchema = z.object({
  /** この呼び出しで使ってよいstep数(利用者の発言1件に対する残り) */
  remainingSteps: z.number().int().min(1),
});
export type AgentCallOptions = z.infer<typeof AgentCallOptionsSchema>;

/** Agentが使うツール。P4で書き込み系を足す */
export type AgentTools = ReadTools;

export const createCustomizeAgent = (params: {
  model: LanguageModel;
  instructions: string;
  tools: AgentTools;
  maxOutputTokens: number;
  temperature: number | null;
}) =>
  new ToolLoopAgent<AgentCallOptions, AgentTools>({
    model: params.model,
    instructions: params.instructions,
    tools: params.tools,
    // 既定は承認が要る。承認なしで動くのは、構造・メタデータだけを読むツールに限る
    toolApproval: ({ toolCall }) =>
      NO_APPROVAL_TOOLS.has(toolCall.toolName) ? 'not-applicable' : 'user-approval',
    maxOutputTokens: params.maxOutputTokens,
    ...(params.temperature === null ? {} : { temperature: params.temperature }),
    maxRetries: 0,
    callOptionsSchema: AgentCallOptionsSchema,
    prepareCall: ({ options, ...rest }) => ({
      ...rest,
      stopWhen: isStepCount(options.remainingSteps),
    }),
  });

export type CustomizeAgent = ReturnType<typeof createCustomizeAgent>;
