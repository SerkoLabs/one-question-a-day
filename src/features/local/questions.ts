export type Question = {
  id: string;
  text: string;
  category: 'daily_life' | 'relationships' | 'choices' | 'values' | 'fears' | 'identity' | 'meaning' | 'gratitude' | 'hopes' | 'change' | 'memories';
  depth: 1 | 2 | 3;
  eligible: boolean;
  active: boolean;
  contentVersion: number;
  safetyFlags: string[];
  followUp?: { comparisonGroup: string };
};

export const QUESTION_SET_VERSION = 'preview-tr-2026.1';

export const QUESTIONS: readonly Question[] = [
  { id: 'q01', text: 'Bugün zihninde en çok neye yer açmak istiyorsun?', category: 'daily_life', depth: 1, eligible: true, active: true, contentVersion: 1, safetyFlags: [] },
  { id: 'q02', text: 'Son zamanlarda verdiğin hangi küçük karar sana iyi geldi?', category: 'choices', depth: 1, eligible: true, active: true, contentVersion: 1, safetyFlags: [] },
  { id: 'q03', text: 'Şu sıralar hayatında neyi daha dikkatle dinliyorsun?', category: 'meaning', depth: 2, eligible: true, active: true, contentVersion: 1, safetyFlags: [] },
  { id: 'q04', text: 'Bugün birine söylemek isteyip de içinde tuttuğun ne var?', category: 'relationships', depth: 2, eligible: true, active: true, contentVersion: 1, safetyFlags: [] },
  { id: 'q05', text: 'Geçmişteki hangi haline bugün teşekkür edersin?', category: 'gratitude', depth: 2, eligible: true, active: true, contentVersion: 1, safetyFlags: [], followUp: { comparisonGroup: 'past-self' } },
  { id: 'q06', text: 'Bu hafta sana gerçekten önemli gelen şey neydi?', category: 'values', depth: 1, eligible: true, active: true, contentVersion: 1, safetyFlags: [] },
  { id: 'q07', text: 'Bugünkü enerjini tek bir şeye ayırsan bu ne olurdu?', category: 'choices', depth: 1, eligible: true, active: true, contentVersion: 1, safetyFlags: [] },
  { id: 'q08', text: 'Kendinle ilgili hangi düşüncen değişmeye başladı?', category: 'change', depth: 2, eligible: true, active: true, contentVersion: 1, safetyFlags: [] },
  { id: 'q09', text: 'Yakın zamanda seni şaşırtan bir an neydi?', category: 'memories', depth: 1, eligible: true, active: true, contentVersion: 1, safetyFlags: [] },
  { id: 'q10', text: 'Bugün hangi sınırını korumak sana iyi gelir?', category: 'values', depth: 2, eligible: true, active: true, contentVersion: 1, safetyFlags: [] },
  { id: 'q11', text: 'Şu an geleceğe dair en sade umudun ne?', category: 'hopes', depth: 1, eligible: true, active: true, contentVersion: 1, safetyFlags: [] },
  { id: 'q12', text: 'Ertelediğin hangi konuşma zihninde yer kaplıyor?', category: 'relationships', depth: 2, eligible: true, active: true, contentVersion: 1, safetyFlags: [] },
  { id: 'q13', text: 'Bugün kendine karşı nerede daha dürüst olabilirsin?', category: 'identity', depth: 2, eligible: true, active: true, contentVersion: 1, safetyFlags: [] },
  { id: 'q14', text: 'Belirsizliğine rağmen adım atmak istediğin şey ne?', category: 'fears', depth: 2, eligible: true, active: true, contentVersion: 1, safetyFlags: ['gentle-reflection'] },
] as const;
