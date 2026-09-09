import { QUESTIONS } from './questions';
import { createInitialState, ensureAssignment, localDateFor, migrateState, orderedHistory, questionFor, saveAnswer, selectQuestion } from './state';

describe('deterministic local daily journey', () => {
  test('same user, set and local day always returns the same question', () => {
    const input = { profileId: 'user-a', localDate: '2026-09-09' };
    expect(selectQuestion(input).id).toBe(selectQuestion(input).id);
  });

  test('a complete preview cycle contains no duplicate question', () => {
    const start = Date.UTC(2026, 8, 1);
    const ids = QUESTIONS.map((_, index) => {
      const localDate = new Date(start + index * 86_400_000).toISOString().slice(0, 10);
      return selectQuestion({ profileId: 'user-a', localDate }).id;
    });
    expect(new Set(ids).size).toBe(QUESTIONS.length);
  });

  test('timezone calculation follows local calendar day across midnight', () => {
    const instant = new Date('2026-03-29T21:30:00.000Z');
    expect(localDateFor(instant, 'Europe/Istanbul')).toBe('2026-03-30');
    expect(localDateFor(instant, 'America/New_York')).toBe('2026-03-29');
  });

  test('DST transition still produces the correct local calendar date', () => {
    expect(localDateFor(new Date('2026-11-01T05:30:00Z'), 'America/New_York')).toBe('2026-11-01');
    expect(localDateFor(new Date('2026-11-01T06:30:00Z'), 'America/New_York')).toBe('2026-11-01');
  });

  test('timezone travel does not mutate an existing assignment', () => {
    const base = createInitialState('user-a', 'Europe/Istanbul');
    const assigned = ensureAssignment(base, '2026-09-09');
    const original = questionFor(assigned, '2026-09-09').id;
    const travelled = ensureAssignment({ ...assigned, timezone: 'America/New_York' }, '2026-09-09');
    expect(questionFor(travelled, '2026-09-09').id).toBe(original);
  });

  test('draft is removed only after answer state is created', () => {
    const state = ensureAssignment({ ...createInitialState('user-a', 'Europe/Istanbul'), drafts: { '2026-09-09': 'Taslağım' } }, '2026-09-09');
    const saved = saveAnswer(state, '2026-09-09', state.drafts['2026-09-09'], '2026-09-09T09:00:00Z');
    expect(saved.drafts['2026-09-09']).toBeUndefined();
    expect(saved.answers['2026-09-09'].body).toBe('Taslağım');
  });

  test('history is newest first and preserves question snapshots', () => {
    let state = ensureAssignment(createInitialState('user-a', 'Europe/Istanbul'), '2026-09-08');
    state = saveAnswer(state, '2026-09-08', 'Önceki', '2026-09-08T09:00:00Z');
    state = ensureAssignment(state, '2026-09-09');
    state = saveAnswer(state, '2026-09-09', 'Bugünkü', '2026-09-09T09:00:00Z');
    expect(orderedHistory(state).map((entry) => entry.localDate)).toEqual(['2026-09-09', '2026-09-08']);
    expect(orderedHistory(state)[0].questionText.length).toBeGreaterThan(0);
  });

  test('unknown schema data fails closed to a clean migration state', () => {
    const fallback = createInitialState('new-user', 'Europe/Istanbul');
    expect(migrateState({ schemaVersion: 999, profileId: 'old-user' }, fallback)).toEqual(fallback);
  });
});
