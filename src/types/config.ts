import { z } from 'zod';

export const systemConfigSchema = z.object({
  taxMethod: z.enum(['flat', 'bracket']),
  flatRate: z.number().min(0).max(1),
  currencyRates: z.object({
    ILS: z.number(),
    USD: z.number(),
    EUR: z.number(),
  }),
  osPaturThresholdAgora: z.number().int(),
});

export type SystemConfig = z.infer<typeof systemConfigSchema>;
