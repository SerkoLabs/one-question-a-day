import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { localJournalRepository } from './repository';
import {
  ensureAssignment,
  localDateFor,
  orderedHistory,
  questionFor,
  saveAnswer,
  type JournalAnswer,
  type LocalJournalState,
} from './state';

type JournalContextValue = {
  loading: boolean;
  state: LocalJournalState | null;
  today: string | null;
  question: ReturnType<typeof questionFor> | null;
  draft: string;
  answer: JournalAnswer | null;
  history: JournalAnswer[];
  completeOnboarding(timezone: string): Promise<void>;
  setDraft(value: string): Promise<void>;
  completeToday(): Promise<void>;
  updateAnswer(localDate: string, body: string): Promise<void>;
  refreshDay(date?: Date): Promise<void>;
};

const JournalContext = createContext<JournalContextValue | null>(null);

export function LocalJournalProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<LocalJournalState | null>(null);
  const [today, setToday] = useState<string | null>(null);

  const commit = useCallback(async (next: LocalJournalState) => {
    setState(next);
    await localJournalRepository.save(next);
  }, []);

  const refreshDay = useCallback(async (date = new Date()) => {
    setState((current) => {
      if (!current) return current;
      const localDate = localDateFor(date, current.timezone);
      setToday(localDate);
      const next = ensureAssignment(current, localDate);
      void localJournalRepository.save(next);
      return next;
    });
  }, []);

  useEffect(() => {
    void localJournalRepository.load().then((loaded) => {
      const localDate = localDateFor(new Date(), loaded.timezone);
      const next = ensureAssignment(loaded, localDate);
      setToday(localDate);
      setState(next);
      return localJournalRepository.save(next);
    });
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refreshDay();
    });
    return () => subscription.remove();
  }, [refreshDay]);

  const value = useMemo<JournalContextValue>(() => {
    const question = state && today ? questionFor(state, today) : null;
    return {
      loading: !state || !today,
      state,
      today,
      question,
      draft: state && today ? state.drafts[today] ?? state.answers[today]?.body ?? '' : '',
      answer: state && today ? state.answers[today] ?? null : null,
      history: state ? orderedHistory(state) : [],
      completeOnboarding: async (timezone) => {
        if (!state) return;
        localDateFor(new Date(), timezone);
        const localDate = localDateFor(new Date(), timezone);
        setToday(localDate);
        await commit(ensureAssignment({ ...state, timezone, onboardingComplete: true }, localDate));
      },
      setDraft: async (draft) => {
        if (!state || !today) return;
        await commit({ ...state, drafts: { ...state.drafts, [today]: draft } });
      },
      completeToday: async () => {
        if (!state || !today) return;
        await commit(saveAnswer(state, today, state.drafts[today] ?? state.answers[today]?.body ?? '', new Date().toISOString()));
      },
      updateAnswer: async (localDate, body) => {
        if (!state) return;
        await commit(saveAnswer(state, localDate, body, new Date().toISOString()));
      },
      refreshDay,
    };
  }, [commit, refreshDay, state, today]);

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}

export function useLocalJournal() {
  const value = useContext(JournalContext);
  if (!value) throw new Error('useLocalJournal must be used inside LocalJournalProvider');
  return value;
}
