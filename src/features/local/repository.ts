import { secureAuthStorage } from '@/lib/supabase/secure-storage';
import { createInitialState, migrateState, type LocalJournalState } from './state';

const STORAGE_KEY = 'one-question-a-day.local-journal.v1';
let writeQueue = Promise.resolve();

function defaultTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul';
  } catch {
    return 'Europe/Istanbul';
  }
}

function newProfileId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const localJournalRepository = {
  async load(): Promise<LocalJournalState> {
    const fallback = createInitialState(newProfileId(), defaultTimezone());
    try {
      const raw = await secureAuthStorage.getItem(STORAGE_KEY);
      return raw ? migrateState(JSON.parse(raw), fallback) : fallback;
    } catch {
      return fallback;
    }
  },
  save(state: LocalJournalState): Promise<void> {
    writeQueue = writeQueue.then(() => secureAuthStorage.setItem(STORAGE_KEY, JSON.stringify(state)));
    return writeQueue;
  },
};
