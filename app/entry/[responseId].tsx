import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { StateCard } from '@/components/StateCard';
import { useSessionBootstrap } from '@/features/auth/session-provider';
import { fetchResponseDetail } from '@/features/journey/journey-api';
import { saveTodayResponse } from '@/features/today/today-api';
import { queryClient } from '@/lib/query/client';
import { colors, radius, spacing } from '@/theme/tokens';

export default function EntryDetailScreen() {
  const params = useLocalSearchParams<{ responseId: string }>();
  const responseId = Array.isArray(params.responseId) ? params.responseId[0] : params.responseId;
  const bootstrap = useSessionBootstrap();
  const userId = bootstrap.status === 'ready' ? bootstrap.session.user.id : '';
  const [draft, setDraft] = useState('');

  const detailQuery = useQuery({
    queryKey: ['response', responseId, userId],
    queryFn: () => fetchResponseDetail(responseId),
    enabled: Boolean(responseId && userId),
  });

  useEffect(() => {
    if (detailQuery.data) setDraft(detailQuery.data.body);
  }, [detailQuery.data?.id, detailQuery.data?.body]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!detailQuery.data || !userId) throw new Error('Cevap yüklenemedi.');
      await saveTodayResponse({
        userId,
        questionId: detailQuery.data.question_id,
        responseId: detailQuery.data.id,
        body: draft,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['response', responseId, userId] }),
        queryClient.invalidateQueries({ queryKey: ['journey', userId] }),
        queryClient.invalidateQueries({ queryKey: ['today', userId] }),
      ]);
    },
  });

  return (
    <Screen
      eyebrow={detailQuery.data ? `${detailQuery.data.local_date} • ${detailQuery.data.journey_day}. GÜN` : 'GEÇMİŞ CEVAP'}
      title="Geçmişteki Sen"
      right={
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.close}>Kapat</Text>
        </Pressable>
      }
    >
      {detailQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.green} />
        </View>
      ) : null}

      {detailQuery.isError ? (
        <View style={styles.stack}>
          <StateCard
            title="Bu cevap açılamadı"
            description="Cevap silinmiş, erişim yetkin değişmiş veya bağlantı kesilmiş olabilir."
            tone="notice"
          />
          <PrimaryButton label="Tekrar dene" onPress={() => detailQuery.refetch()} />
        </View>
      ) : null}

      {detailQuery.data ? (
        <>
          <View style={styles.questionCard}>
            <Text style={styles.label}>O GÜNÜN SORUSU</Text>
            <Text style={styles.question}>{detailQuery.data.prompt ?? 'Soru metni şu anda kullanılamıyor.'}</Text>
          </View>

          <View style={styles.editorCard}>
            <View style={styles.editorHeader}>
              <Text style={styles.editorTitle}>Cevabın</Text>
              <Text style={styles.counter}>{draft.length} / 10.000</Text>
            </View>
            <TextInput
              accessibilityLabel="Geçmiş cevabın"
              multiline
              onChangeText={setDraft}
              style={styles.editor}
              textAlignVertical="top"
              value={draft}
            />
          </View>

          {updateMutation.isError ? (
            <StateCard
              title="Değişiklik kaydedilemedi"
              description="Metnin ekranda kaldı. Yeniden deneyebilirsin."
              tone="notice"
            />
          ) : null}

          <PrimaryButton
            label={updateMutation.isPending ? 'Kaydediliyor…' : 'Değişikliği Kaydet'}
            disabled={updateMutation.isPending || draft.trim().length < 1 || draft.length > 10_000}
            onPress={() => updateMutation.mutate()}
          />
          <Text style={styles.revision}>Kaynak revizyonu: {detailQuery.data.source_revision}</Text>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  close: { color: colors.green, fontSize: 14, fontWeight: '800', paddingTop: 8 },
  centered: { minHeight: 260, alignItems: 'center', justifyContent: 'center' },
  stack: { gap: spacing.md },
  questionCard: {
    backgroundColor: colors.peach,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  label: { color: colors.peachInk, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  question: { color: colors.ink, fontSize: 22, lineHeight: 29, fontWeight: '700' },
  editorCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  editorTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  counter: { color: colors.inkMuted, fontSize: 11 },
  editor: { minHeight: 220, color: colors.ink, fontSize: 16, lineHeight: 24, padding: 0 },
  revision: { color: colors.inkMuted, fontSize: 11, textAlign: 'center' },
});
