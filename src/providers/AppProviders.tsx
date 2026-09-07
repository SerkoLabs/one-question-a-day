import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@/lib/query/client';
import { initializeSupabaseAuthAutoRefresh } from '@/lib/supabase/client';

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => initializeSupabaseAuthAutoRefresh(), []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
