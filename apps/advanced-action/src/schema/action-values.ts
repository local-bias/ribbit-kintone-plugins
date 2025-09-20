import z from 'zod';

export const ActionParamSchema = z.object({
  values: z.record(
    z.string(),
    z.object({
      // srcType: z.string(),
      value: z.any(),
    })
  ),
});

export type ActionParam = z.infer<typeof ActionParamSchema>;
