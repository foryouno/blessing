import { z } from 'zod';

const envSchema = z.object({
  TOS_ACCESS_KEY_ID: z.string().min(1, 'Missing TOS_ACCESS_KEY_ID'),
  TOS_SECRET_ACCESS_KEY: z.string().min(1, 'Missing TOS_SECRET_ACCESS_KEY'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
      throw new Error(`Environment variable validation failed:\n${missing}`);
    }
    throw error;
  }
}

export const env = validateEnv();
