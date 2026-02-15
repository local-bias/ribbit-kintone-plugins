import { PROMPT_FACT_CHECK_RESULT_LEVEL } from '@/prompts/ai';
import { z } from 'zod';

/**
 * ファクトチェック詳細のスキーマ
 */
export const FactCheckDetailSchema = z.object({
  claim: z.string().describe('検証対象の具体的な主張。'),
  verdict: z.enum(['correct', 'uncertain', 'incorrect']).describe(`ファクトチェックの結果。
- correct: 主張は正しい
- uncertain: 主張は不確か
- incorrect: 主張は誤っている`),
  explanation: z.string().describe('この判定に至った理由の説明。'),
  sources: z.array(z.string()).nullable().describe('検証に使用した情報源のURL。'),
  correction: z.string().nullable().describe('主張が誤っている場合の正しい情報。'),
});

/**
 * ファクトチェック結果のスキーマ
 */
export const FactCheckResultSchema = z.object({
  level: z
    .enum(['trusted', 'caution', 'inaccurate', 'skipped'])
    .describe(PROMPT_FACT_CHECK_RESULT_LEVEL),
  summary: z.string().describe('ファクトチェック結果の簡潔な要約。'),
  details: z.array(FactCheckDetailSchema).nullable(),
});

export type FactCheckDetail = z.infer<typeof FactCheckDetailSchema>;
export type FactCheckResult = z.infer<typeof FactCheckResultSchema>;
export type FactCheckStatus =
  | 'checking'
  | 'trusted'
  | 'caution'
  | 'inaccurate'
  | 'skipped'
  | 'error';
