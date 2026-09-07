import { supabase } from '@/lib/supabase/client';

export type JourneyResponseSummary = {
  id: string;
  local_date: string;
  journey_day: number;
  question_id: string;
  source_revision: number;
  updated_at: string;
};

export type ResponseDetail = JourneyResponseSummary & {
  body: string;
  prompt: string | null;
};

export async function fetchJourneyResponses(): Promise<JourneyResponseSummary[]> {
  const { data, error } = await supabase
    .from('responses')
    .select('id, local_date, journey_day, question_id, source_revision, updated_at')
    .order('local_date', { ascending: false })
    .limit(60);

  if (error) throw error;
  return (data ?? []) as JourneyResponseSummary[];
}

export async function fetchResponseDetail(responseId: string): Promise<ResponseDetail> {
  const { data: response, error } = await supabase
    .from('responses')
    .select('id, local_date, journey_day, question_id, source_revision, updated_at, body')
    .eq('id', responseId)
    .single();

  if (error) throw error;

  const { data: text } = await supabase
    .from('question_texts')
    .select('prompt')
    .eq('question_id', response.question_id)
    .eq('locale', 'tr')
    .maybeSingle();

  return {
    ...(response as JourneyResponseSummary & { body: string }),
    prompt: text?.prompt ?? null,
  };
}
