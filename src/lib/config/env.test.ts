import { readPublicEnv } from './env';

describe('readPublicEnv', () => {
  it('accepts a valid Supabase public configuration', () => {
    expect(
      readPublicEnv({
        EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
          'sb_publishable_abcdefghijklmnopqrstuvwxyz',
      }),
    ).toEqual({
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        'sb_publishable_abcdefghijklmnopqrstuvwxyz',
    });
  });

  it('rejects missing configuration with a clear error', () => {
    expect(() => readPublicEnv({})).toThrow(
      'Missing or invalid public app configuration',
    );
  });
});
