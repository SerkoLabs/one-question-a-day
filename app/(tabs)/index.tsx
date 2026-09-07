import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { StateCard } from '@/components/StateCard';
import { useSessionBootstrap } from '@/features/auth/session-provider';
import { fetchTodayState, saveTodayResponse } from '@/features/today/today-api';
import { queryClient } from '@/lib/query/client';
import { colors, radius, spacing } from '@/theme/tokens';

export default function TodayScreen() {
  const bootstrap = useSessionBootstrap();
  const userId = bootstrap.status === 'ready' ? bootstrap.session.user.id : '';
  const [draft, setDraft] = useState('');

  const todayQuery = useQuery({
    queryKey: ['today', userId],
    queryFn: fetchTodayState,
    enabled: Boolean(userId),
  });

  useEffect(() => {
    if (todayQuery.data) setDraft(todayQuery.data.body ?? '');
  }, [todayQuery.data?.response_id, todayQuery.data?.body]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!todayQuery.data || !userId) throw new Error('Günün sorusu hazır değil.');
      await saveTodayResponse({
        userId,
        questionId: todayQuery.data.question_id,
        responseId: todayQuery.data.response_id,
        body: draft,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['today', userId] });
      await queryClient.invalidateQueries({ queryKey: ['journey', userId] });
    },
  });

  if (todayQuery.isLoading) {
    return (
      <Screen title="Bugünün Sorusu" scroll={false}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.green} />
          <Text style={styles.helper}>Bugünün sorusu hazırlanıyor…</Text>
        </View>
      </Screen>
    );
  }

  if (todayQuery.isError) {
    return (
      <Screen title="Bugünün Sorusu" scroll={false}>
        <View style={styles.centered}>
          <StateCard
            title="Bugünün sorusu yüklenemedi"
            description="Bağlantını kontrol edip tekrar deneyebilirsin. Kaydedilmiş bir cevap varsa burada değiştirilmez."
            tone="notice"
          />
          <PrimaryButton label="Tekrar dene" onPress={() => todayQuery.refetch()} />
        </View>
      </Screen>
    );
  }

  if (!todayQuery.data || !todayQuery.data.prompt) {
    return (
      <Screen title="Bugünün Sorusu" scroll={false}>
        <View style={styles.centered}>
          <StateCard
            title="Bugünün içeriği hazır değil"
            description="Geçerli yolculuk günü için soru bulunamadı. Uygulama rastgele bir soru seçmez; içerik düzeltilene kadar bekler."
            tone="notice"
          />
        </View>
      </Screen>
    );
  }

  const isAnswered = Boolean(todayQuery.data.response_id);
  const trimmedLength = draft.trim().length;
  const invalidLength = trimmedLength < 1 || draft.length > 10_000;

  return (
    <Screen
      eyebrow={`${todayQuery.data.local_date} • ${todayQuery.data.journey_day}. GÜN`}
      title="Bugünün Sorusu"
    >
      <View style={styles.sunBadge}>
        <Text style={styles.sun}>☼</Text>
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.question}>{todayQuery.data.prompt}</Text>
        <View style={styles.rule} />
        <Text style={styles.quote}>“Dürüst cevaplar, daha iyi bir sen için.”</Text>
      </View>

      <View style={styles.editorCard}>
        <View style={styles.editorHeader}>
          <Text style={styles.editorTitle}>{isAnswered ? 'Bugünkü cevabın' : 'Cevabını yaz'}</Text>
          <Text style={styles.counter}>{draft.length} / 10.000</Text>
        </View>
        <TextInput
          accessibilityLabel="Bugünkü cevabın"
          multiline
          onChangeText={setDraft}
          placeholder="Aklından geçenleri olduğu gibi yaz…"
          placeholderTextColor={colors.inkMuted}
          style={styles.editor}
          textAlignVertical="top"
          value={draft}
        />
      </View>

      {saveMutation.isError ? (
        <StateCard
          title="Cevap kaydedilemedi"
          description="Metnin bu ekranda kaldı. Bağlantını kontrol edip tekrar kaydedebilirsin."
          tone="notice"
        />
      ) : null}

      <View style={styles.footer}>
        <PrimaryButton
          label={saveMutation.isPending ? 'Kaydediliyor…' : isAnswered ? 'Cevabı Güncelle' : 'Cevabımı Kaydet'}
          disabled={saveMutation.isPending || invalidLength}
          onPress={() => saveMutation.mutate()}
        />
        <Text style={styles.helper}>
          {isAnswered
            ? `Kaydedildi • revizyon ${todayQuery.data.source_revision ?? 1}`
            : 'Kaydettiğinde cevap yalnızca hesabına ait özel veri olarak saklanır.'}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  sunBadge: {
    alignSelf: 'center',
    width: 54,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sun: { color: colors.peachInk, fontSize: 30 },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  question: {
    color: colors.ink,
    fontSize: 28,
    lineHeight: 37,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  rule: { width: 52, height: 2, borderRadius: 2, backgroundColor: colors.peachInk, alignSelf: 'center' },
  quote: { color: colors.inkMuted, fontSize: 14, fontStyle: 'italic', textAlign: 'center' },
  editorCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  editorTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  counter: { color: colors.inkMuted, fontSize: 11 },
  editor: {
    minHeight: 170,
    color: colors.ink,
    fontSize: 16,
    lineHeight: 24,
    padding: 0,
  },
  footer: { gap: spacing.sm },
  helper: { color: colors.inkMuted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
