import { secureAuthStorage } from '@/lib/supabase/secure-storage';
import { createInitialState, migrateState, type LocalJournalState } from './state';

const POINTER_KEY = 'one-question-a-day.local-journal.active';
const SLOT_KEYS = ['one-question-a-day.local-journal.a', 'one-question-a-day.local-journal.b'] as const;
let writeQueue = Promise.resolve();

type StoredEnvelope = { sequence: number; state: LocalJournalState };

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

async function parseSlot(key: string, fallback: LocalJournalState): Promise<StoredEnvelope | null> {
  try {
    const raw = await secureAuthStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredEnvelope> | null;
    if (!parsed || !Number.isSafeInteger(parsed.sequence) || !parsed.state) return null;
    if (parsed.state.schemaVersion !== 1 || typeof parsed.state.profileId !== 'string') return null;
    return { sequence: parsed.sequence as number, state: migrateState(parsed.state, fallback) };
  } catch {
    return null;
  }
}

async function readSlots(fallback: LocalJournalState) {
  return Promise.all(SLOT_KEYS.map((key) => parseSlot(key, fallback)));
}

export const localJournalRepository = {
  async load(): Promise<LocalJournalState> {
    const fallback = createInitialState(newProfileId(), defaultTimezone());
    const pointer = await secureAuthStorage.getItem(POINTER_KEY).catch(() => null);
    const slots = await readSlots(fallback);
    const preferred = pointer === '1' ? slots[1] : pointer === '0' ? slots[0] : null;
    if (preferred) return preferred.state;
    const newest = slots.filter((slot): slot is StoredEnvelope => Boolean(slot)).sort((a, b) => b.sequence - a.sequence)[0];
    return newest?.state ?? fallback;
  },
  save(state: LocalJournalState): Promise<void> {
    writeQueue = writeQueue.catch(() => undefined).then(async () => {
      const fallback = createInitialState(state.profileId, state.timezone);
      const slots = await readSlots(fallback);
      const highestSequence = Math.max(0, ...slots.map((slot) => slot?.sequence ?? 0));
      const pointer = await secureAuthStorage.getItem(POINTER_KEY).catch(() => null);
      const activeIndex = pointer === '1' ? 1 : pointer === '0' ? 0 : (slots[1]?.sequence ?? 0) > (slots[0]?.sequence ?? 0) ? 1 : 0;
      const nextIndex = activeIndex === 1 ? 0 : 1;
      const envelope: StoredEnvelope = { sequence: highestSequence + 1, state };
      await secureAuthStorage.setItem(SLOT_KEYS[nextIndex], JSON.stringify(envelope));
      await secureAuthStorage.setItem(POINTER_KEY, String(nextIndex));
    });
    return writeQueue;
  },
};
