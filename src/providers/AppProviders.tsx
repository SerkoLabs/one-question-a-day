import type { PropsWithChildren } from 'react';

import { LocalJournalProvider } from '@/features/local/local-journal-provider';
import { ThemeProvider } from '@/theme/theme-provider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <LocalJournalProvider>{children}</LocalJournalProvider>
    </ThemeProvider>
  );
}
