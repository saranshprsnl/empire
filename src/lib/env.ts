import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection URL'),
  REDIS_URL: z.string().url('REDIS_URL must be a valid connection URL'),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required'),
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  MEILI_HOST: z.string().url().default('http://localhost:7700'),
  MEILI_MASTER_KEY: z.string().min(1, 'MEILI_MASTER_KEY is required'),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
});

const isBuildTime = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

let validatedEnv: z.infer<typeof envSchema>;

if (isBuildTime) {
  // Gracefully bypass strict schema requirements during Next.js static asset build phase
  validatedEnv = process.env as any;
} else {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Critical Error: Environment configuration validation failed:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    throw new Error('Environment configuration validation failed. Check your process environment variables.');
  }
  validatedEnv = result.data;
}

export const env = validatedEnv;
export default env;
