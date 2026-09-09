import type { PropsWithChildren } from 'react';

import { LocalJournalProvider } from '@/features/local/local-journal-provider';

export function AppProviders({ children }: PropsWithChildren) {
  return <LocalJournalProvider>{children}</LocalJournalProvider>;
}
