import 'react-native-url-polyfill/auto';

import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';

import { readPublicEnv } from '@/lib/config/env';
import { secureAuthStorage } from '@/lib/supabase/secure-storage';

const env = readPublicEnv();

export const supabase = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: secureAuthStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

let autoRefreshInitialized = false;

export function initializeSupabaseAuthAutoRefresh() {
  if (autoRefreshInitialized) return () => undefined;
  autoRefreshInitialized = true;

  const handleAppState = (state: string) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  };

  handleAppState(AppState.currentState);
  const subscription = AppState.addEventListener('change', handleAppState);

  return () => {
    subscription.remove();
    supabase.auth.stopAutoRefresh();
    autoRefreshInitialized = false;
  };
}
