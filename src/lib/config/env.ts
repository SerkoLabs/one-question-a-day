import { z } from 'zod';

const publicEnvSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function readPublicEnv(
  source: Record<string, string | undefined> = process.env,
): PublicEnv {
  const result = publicEnvSchema.safeParse({
    EXPO_PUBLIC_SUPABASE_URL: source.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      source.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!result.success) {
    throw new Error(
      'Missing or invalid public app configuration. Copy .env.example and set the Supabase URL and publishable key. Never place OPENAI_API_KEY or service-role credentials in EXPO_PUBLIC_* variables.',
    );
  }

  return result.data;
}
