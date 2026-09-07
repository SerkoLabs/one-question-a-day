export const MAX_RESPONSE_CHARACTERS = 10_000;

export function normalizeResponseBody(value: string): string {
  const normalized = value.trim();
  if (normalized.length < 1) {
    throw new Error('Cevap boş bırakılamaz.');
  }
  if (normalized.length > MAX_RESPONSE_CHARACTERS) {
    throw new Error(`Cevap en fazla ${MAX_RESPONSE_CHARACTERS.toLocaleString('tr-TR')} karakter olabilir.`);
  }
  return normalized;
}
