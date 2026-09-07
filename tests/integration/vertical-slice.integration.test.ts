import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.TEST_SUPABASE_URL;
const publishableKey = process.env.TEST_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
const hasIntegrationEnv = Boolean(url && publishableKey && serviceRoleKey);

const describeIntegration = hasIntegrationEnv ? describe : describe.skip;

function userClient(): SupabaseClient {
  if (!url || !publishableKey) throw new Error('Missing Supabase integration test configuration');
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

describeIntegration('VS-1: auth → onboarding → today → persist → reload → RLS isolation', () => {
  if (!url || !serviceRoleKey) return;

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const createdUserIds: string[] = [];

  afterAll(async () => {
    await Promise.all(createdUserIds.map((id) => admin.auth.admin.deleteUser(id)));
  });

  test('persists one daily answer and prevents cross-user reads/writes', async () => {
    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const password = `Test-${nonce}-A9!`;
    const emailA = `vs1-a-${nonce}@example.test`;
    const emailB = `vs1-b-${nonce}@example.test`;

    const [createdA, createdB] = await Promise.all([
      admin.auth.admin.createUser({ email: emailA, password, email_confirm: true }),
      admin.auth.admin.createUser({ email: emailB, password, email_confirm: true }),
    ]);

    expect(createdA.error).toBeNull();
    expect(createdB.error).toBeNull();
    if (!createdA.data.user || !createdB.data.user) throw new Error('Test users were not created');
    createdUserIds.push(createdA.data.user.id, createdB.data.user.id);

    const clientA = userClient();
    const clientB = userClient();

    expect((await clientA.auth.signInWithPassword({ email: emailA, password })).error).toBeNull();
    expect((await clientB.auth.signInWithPassword({ email: emailB, password })).error).toBeNull();

    const onboardingA = await clientA.rpc('complete_onboarding', {
      p_timezone: 'Europe/Istanbul',
      p_locale: 'tr',
      p_reminder_enabled: false,
      p_reminder_local_time: null,
      p_ai_analysis_consent: false,
    });
    const onboardingB = await clientB.rpc('complete_onboarding', {
      p_timezone: 'Europe/Istanbul',
      p_locale: 'tr',
      p_reminder_enabled: false,
      p_reminder_local_time: null,
      p_ai_analysis_consent: false,
    });
    expect(onboardingA.error).toBeNull();
    expect(onboardingB.error).toBeNull();

    const todayA = await clientA.rpc('get_today_state', { p_locale: 'tr' });
    expect(todayA.error).toBeNull();
    expect(Array.isArray(todayA.data)).toBe(true);
    const todayRow = todayA.data?.[0] as
      | { question_id: string; response_id: string | null; journey_day: number }
      | undefined;
    expect(todayRow?.journey_day).toBe(1);
    expect(todayRow?.response_id).toBeNull();
    if (!todayRow?.question_id) throw new Error('Day 1 development question seed is missing');

    const inserted = await clientA
      .from('responses')
      .insert({
        user_id: createdA.data.user.id,
        question_id: todayRow.question_id,
        body: 'Synthetic integration-test reflection. No real journal content.',
      })
      .select('id, body, journey_day, source_revision')
      .single();

    expect(inserted.error).toBeNull();
    expect(inserted.data?.journey_day).toBe(1);
    expect(inserted.data?.source_revision).toBe(1);
    if (!inserted.data?.id) throw new Error('Response insert did not return an id');

    const reloadedToday = await clientA.rpc('get_today_state', { p_locale: 'tr' });
    expect(reloadedToday.error).toBeNull();
    expect(reloadedToday.data?.[0]?.response_id).toBe(inserted.data.id);

    const userBRead = await clientB.from('responses').select('id, body').eq('id', inserted.data.id);
    expect(userBRead.error).toBeNull();
    expect(userBRead.data).toEqual([]);

    const userBWrite = await clientB.from('responses').insert({
      user_id: createdA.data.user.id,
      question_id: todayRow.question_id,
      body: 'Synthetic unauthorized write attempt.',
    });
    expect(userBWrite.error).not.toBeNull();

    const duplicate = await clientA.from('responses').insert({
      user_id: createdA.data.user.id,
      question_id: todayRow.question_id,
      body: 'Synthetic duplicate same-day write attempt.',
    });
    expect(duplicate.error).not.toBeNull();

    const updated = await clientA
      .from('responses')
      .update({ body: 'Synthetic edited integration-test reflection.' })
      .eq('id', inserted.data.id)
      .select('source_revision')
      .single();
    expect(updated.error).toBeNull();
    expect(updated.data?.source_revision).toBe(2);
  }, 30_000);
});
