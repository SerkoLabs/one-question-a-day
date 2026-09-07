import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { AuthLinkBridge } from '@/features/auth/auth-link-bridge';
import { SessionProvider } from '@/features/auth/session-provider';
import { queryClient } from '@/lib/query/client';
import { initializeSupabaseAuthAutoRefresh } from '@/lib/supabase/client';

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => initializeSupabaseAuthAutoRefresh(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthLinkBridge />
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );
}
