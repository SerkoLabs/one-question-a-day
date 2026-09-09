import { secureAuthStorage } from '@/lib/supabase/secure-storage';
import { createInitialState, migrateState, type LocalJournalState } from './state';

const POINTER_KEY = 'one-question-a-day.local-journal.active';
const SLOT_KEYS = ['one-question-a-day.local-journal.a', 'one-question-a-day.local-journal.b'] as const;
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

async function parseSlot(key: string, fallback: LocalJournalState): Promise<LocalJournalState | null> {
  try {
    const raw = await secureAuthStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalJournalState> | null;
    if (!parsed || parsed.schemaVersion !== 1 || typeof parsed.profileId !== 'string') return null;
    return migrateState(parsed, fallback);
  } catch {
    return null;
  }
}

export const localJournalRepository = {
  async load(): Promise<LocalJournalState> {
    const fallback = createInitialState(newProfileId(), defaultTimezone());
    const pointer = await secureAuthStorage.getItem(POINTER_KEY).catch(() => null);
    const preferred = pointer === '1' ? 1 : 0;
    const current = await parseSlot(SLOT_KEYS[preferred], fallback);
    if (current) return current;
    const previous = await parseSlot(SLOT_KEYS[preferred === 0 ? 1 : 0], fallback);
    return previous ?? fallback;
  },
  save(state: LocalJournalState): Promise<void> {
    writeQueue = writeQueue.then(async () => {
      const pointer = await secureAuthStorage.getItem(POINTER_KEY).catch(() => '0');
      const nextIndex = pointer === '1' ? 0 : 1;
      await secureAuthStorage.setItem(SLOT_KEYS[nextIndex], JSON.stringify(state));
      await secureAuthStorage.setItem(POINTER_KEY, String(nextIndex));
    });
    return writeQueue;
  },
};
