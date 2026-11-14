import { isStepCount, type LanguageModel, ToolLoopAgent } from 'ai';
import { z } from 'zod';
import { NO_APPROVAL_TOOLS, type ReadTools } from './tools';
import { ApprovalOverrideSchema, type WriteAssetInput } from './write-approval';
import type { WriteTools } from './write-tools';

/**
 * カスタマイズを作るAgent
 *
 * - ストリーミングは使わない(kintoneのproxyは応答を一度に返す。docs/07b 7章)
 * - SDKの自動再試行は0にする。二重課金と、書き込みツールの重複実行を避けるため(docs/07b 8章)
 * - 承認が要らないツールだけを許可リストで宣言し、それ以外は全て承認させる。承認後の実行はSDKに任せる(docs/07b 4-2章)
 * - step上限は利用者の発言1件ぶんで累積させるため、呼び出しごとに残りを渡す
 * - 承認カードで利用者が決めた値は、呼び出しごとの`approvals`から書き込みツールの`toolsContext`へ写す
 *
 * @see docs/07b-ai-providers.md 4章
 */

export const AgentCallOptionsSchema = z.object({
  /** この呼び出しで使ってよいstep数(利用者の発言1件に対する残り) */
  remainingSteps: z.number().int().min(1),
  /** 承認したツール呼び出し(toolCallId)と、承認カードで決めた値 */
  approvals: z.record(z.string(), ApprovalOverrideSchema),
});
export type AgentCallOptions = z.infer<typeof AgentCallOptionsSchema>;

export type AgentTools = ReadTools & WriteTools;

export const createCustomizeAgent = (params: {
  model: LanguageModel;
  instructions: string;
  tools: AgentTools;
  maxOutputTokens: number;
  temperature: number | null;
  /**
   * 入力だけで保存できないと分かる`write_asset`か
   *
   * 利用者に判断させる前に実行させ、拒否の理由をツール結果としてAIへ返す(実行しても検証で必ず拒否される)
   */
  rejectsWriteBeforeApproval: (input: WriteAssetInput) => boolean;
}) =>
  new ToolLoopAgent<AgentCallOptions, AgentTools>({
    model: params.model,
    instructions: params.instructions,
    tools: params.tools,
    // 既定は承認が要る。承認なしで動くのは、構造・メタデータだけを読むツールと、保存しないプレビューに限る
    toolApproval: ({ toolCall }) => {
      if (NO_APPROVAL_TOOLS.has(toolCall.toolName)) return 'not-applicable';
      if (
        toolCall.toolName === 'write_asset' &&
        params.rejectsWriteBeforeApproval(toolCall.input as WriteAssetInput)
      ) {
        return 'not-applicable';
      }
      return 'user-approval';
    },
    toolsContext: {
      write_asset: { approvals: {} },
      set_asset_state: { approvals: {} },
      delete_asset: { approvals: {} },
    },
    maxOutputTokens: params.maxOutputTokens,
    ...(params.temperature === null ? {} : { temperature: params.temperature }),
    maxRetries: 0,
    callOptionsSchema: AgentCallOptionsSchema,
    prepareCall: ({ options, ...rest }) => {
      // 承認の上書きは書き込みツールのcontextにだけ載せる(読み取りツールへは渡さない)
      const context = { approvals: options.approvals };
      return {
        ...rest,
        stopWhen: isStepCount(options.remainingSteps),
        toolsContext: {
          ...rest.toolsContext,
          write_asset: context,
          set_asset_state: context,
          delete_asset: context,
        },
      };
    },
  });

export type CustomizeAgent = ReturnType<typeof createCustomizeAgent>;
