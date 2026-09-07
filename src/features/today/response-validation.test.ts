import { MAX_RESPONSE_CHARACTERS, normalizeResponseBody } from './response-validation';

describe('normalizeResponseBody', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeResponseBody('  Bugün daha sakin hissettim.  ')).toBe('Bugün daha sakin hissettim.');
  });

  it('rejects blank answers', () => {
    expect(() => normalizeResponseBody('   \n  ')).toThrow('Cevap boş bırakılamaz.');
  });

  it('accepts exactly the maximum number of characters', () => {
    const value = 'a'.repeat(MAX_RESPONSE_CHARACTERS);
    expect(normalizeResponseBody(value)).toHaveLength(MAX_RESPONSE_CHARACTERS);
  });

  it('rejects answers above the maximum', () => {
    const value = 'a'.repeat(MAX_RESPONSE_CHARACTERS + 1);
    expect(() => normalizeResponseBody(value)).toThrow();
  });
});
