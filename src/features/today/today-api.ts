import { normalizeResponseBody } from '@/features/today/response-validation';
import { supabase } from '@/lib/supabase/client';

export type TodayState = {
  local_date: string;
  journey_day: number;
  question_id: string;
  prompt: string | null;
  response_id: string | null;
  body: string | null;
  source_revision: number | null;
};

export async function fetchTodayState(): Promise<TodayState | null> {
  const { data, error } = await supabase.rpc('get_today_state', { p_locale: 'tr' });
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : null;
  return row ? (row as TodayState) : null;
}

export async function saveTodayResponse(input: {
  userId: string;
  questionId: string;
  responseId: string | null;
  body: string;
}) {
  const body = normalizeResponseBody(input.body);

  if (input.responseId) {
    const { error } = await supabase
      .from('responses')
      .update({ body })
      .eq('id', input.responseId)
      .eq('user_id', input.userId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('responses').insert({
    user_id: input.userId,
    question_id: input.questionId,
    body,
  });

  if (error && error.code !== '23505') throw error;
  // 23505 can occur when two devices save the same daily answer concurrently.
  // The caller refetches the canonical server row instead of assuming which write won.
}
