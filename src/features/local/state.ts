import { QUESTIONS, QUESTION_SET_VERSION, type Question } from './questions';

export const LOCAL_SCHEMA_VERSION = 1;

export type JournalAnswer = {
  id: string;
  localDate: string;
  questionId: string;
  questionText: string;
  questionSetVersion: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type LocalJournalState = {
  schemaVersion: number;
  profileId: string;
  onboardingComplete: boolean;
  locale: 'tr';
  timezone: string;
  questionSetVersion: string;
  assignments: Record<string, string>;
  drafts: Record<string, string>;
  answers: Record<string, JournalAnswer>;
  lastObservedLocalDate: string | null;
};

export function localDateFor(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function ordinal(localDate: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
  if (!match) throw new Error('Geçersiz yerel tarih.');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function selectQuestion(input: { profileId: string; localDate: string; questionSetVersion?: string; questions?: readonly Question[] }): Question {
  const version = input.questionSetVersion ?? QUESTION_SET_VERSION;
  const eligible = (input.questions ?? QUESTIONS)
    .filter((question) => question.active && question.eligible)
    .sort((a, b) => {
      const aHash = stableHash(`${input.profileId}|${version}|${a.id}`);
      const bHash = stableHash(`${input.profileId}|${version}|${b.id}`);
      return aHash - bHash || a.id.localeCompare(b.id);
    });
  const selected = eligible[Math.abs(ordinal(input.localDate)) % eligible.length];
  if (!selected) throw new Error('Aktif soru bulunamadı.');
  return selected;
}

export function createInitialState(profileId: string, timezone: string): LocalJournalState {
  return { schemaVersion: LOCAL_SCHEMA_VERSION, profileId, onboardingComplete: false, locale: 'tr', timezone, questionSetVersion: QUESTION_SET_VERSION, assignments: {}, drafts: {}, answers: {}, lastObservedLocalDate: null };
}

export function migrateState(raw: unknown, fallback: LocalJournalState): LocalJournalState {
  if (!raw || typeof raw !== 'object') return fallback;
  const candidate = raw as Partial<LocalJournalState>;
  if (candidate.schemaVersion !== LOCAL_SCHEMA_VERSION || typeof candidate.profileId !== 'string') return fallback;
  return { ...fallback, ...candidate, assignments: candidate.assignments ?? {}, drafts: candidate.drafts ?? {}, answers: candidate.answers ?? {} };
}

export function ensureAssignment(state: LocalJournalState, localDate: string): LocalJournalState {
  if (state.assignments[localDate]) return { ...state, lastObservedLocalDate: localDate };
  const question = selectQuestion({ profileId: state.profileId, localDate, questionSetVersion: state.questionSetVersion });
  return { ...state, assignments: { ...state.assignments, [localDate]: question.id }, lastObservedLocalDate: localDate };
}

export function questionFor(state: LocalJournalState, localDate: string): Question {
  const assignedId = state.assignments[localDate] ?? selectQuestion({ profileId: state.profileId, localDate, questionSetVersion: state.questionSetVersion }).id;
  const question = QUESTIONS.find((item) => item.id === assignedId);
  if (!question) throw new Error('Atanmış soru bu içerik sürümünde bulunamadı.');
  return question;
}

export function saveAnswer(state: LocalJournalState, localDate: string, bodyInput: string, now: string): LocalJournalState {
  const body = bodyInput.trim();
  if (!body || body.length > 10_000) throw new Error('Cevap 1–10.000 karakter olmalı.');
  const assigned = ensureAssignment(state, localDate);
  const question = questionFor(assigned, localDate);
  const previous = assigned.answers[localDate];
  const answer: JournalAnswer = { id: previous?.id ?? `${localDate}:${question.id}`, localDate, questionId: question.id, questionText: previous?.questionText ?? question.text, questionSetVersion: previous?.questionSetVersion ?? assigned.questionSetVersion, body, createdAt: previous?.createdAt ?? now, updatedAt: now };
  const remainingDrafts = { ...assigned.drafts };
  delete remainingDrafts[localDate];
  return { ...assigned, drafts: remainingDrafts, answers: { ...assigned.answers, [localDate]: answer } };
}

export function orderedHistory(state: LocalJournalState): JournalAnswer[] {
  return Object.values(state.answers).sort((a, b) => b.localDate.localeCompare(a.localDate));
}
