import {
  PROMPT_INTERACTIVE_AI_RESPONSE_HTML,
  PROMPT_INTERACTIVE_AI_RESPONSE_MESSAGE,
  PROMPT_INTERACTIVE_AI_RESPONSE_QUICK_REPLIES,
  PROMPT_INTERACTIVE_AI_RESPONSE_QUICK_REPLIES_ACTION,
  PROMPT_INTERACTIVE_AI_RESPONSE_QUICK_REPLIES_LABEL,
} from '@/prompts/ai';
import { z } from 'zod';

const MODALITY_TYPES = ['text', 'image', 'audio', 'video', 'file'] as const;

const ModalityTypeSchema = z.enum(MODALITY_TYPES);

export const REASONING_EFFORT_TYPES = [
  'model-default',
  'none',
  'minimal',
  'low',
  'medium',
  'high',
] as const;

export const ReasoningEffortTypeSchema = z.enum(REASONING_EFFORT_TYPES);

export type ReasoningEffortType = z.infer<typeof ReasoningEffortTypeSchema>;

export const VERBOSITY_TYPES = ['model-default', 'low', 'medium', 'high'] as const;

export const VerbosityTypeSchema = z.enum(VERBOSITY_TYPES);

export type VerbosityType = z.infer<typeof VerbosityTypeSchema>;

const OpenrouterAvailableModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  created: z.number(),
  context_length: z.number(),
  architecture: z.object({
    modality: z.string(),
    input_modalities: z.array(ModalityTypeSchema),
    output_modalities: z.array(ModalityTypeSchema),
    tokenizer: z.string(),
    instruct_type: z.string().nullable(),
  }),
  pricing: z.object({
    prompt: z.string(),
    completion: z.string(),
    request: z.string().optional(),
    image: z.string().optional(),
    web_search: z.string().optional(),
    internal_reasoning: z.string().optional(),
  }),
});
export type OpenrouterAvailableModel = z.infer<typeof OpenrouterAvailableModelSchema>;

export const OpenrouterAvailableModelsResponseSchema = z.object({
  data: z.array(OpenrouterAvailableModelSchema),
});
export type OpenrouterAvailableModelsResponse = z.infer<
  typeof OpenrouterAvailableModelsResponseSchema
>;

export const InteractiveAIResponseSchema = z.object({
  message: z.string().describe(PROMPT_INTERACTIVE_AI_RESPONSE_MESSAGE),
  html: z.string().nullable().describe(PROMPT_INTERACTIVE_AI_RESPONSE_HTML),
  quickReplies: z
    .array(
      z.object({
        label: z.string().describe(PROMPT_INTERACTIVE_AI_RESPONSE_QUICK_REPLIES_LABEL),
        action: z.string().describe(PROMPT_INTERACTIVE_AI_RESPONSE_QUICK_REPLIES_ACTION),
      })
    )
    .describe(PROMPT_INTERACTIVE_AI_RESPONSE_QUICK_REPLIES)
    .nullable(),
});
