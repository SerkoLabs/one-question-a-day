import { useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, CategoryChip, Celebrate, PrimaryButton, Screen, StateCard, StreakBadge, SuccessCheck } from '@/components';
import { useLocalJournal } from '@/features/local/local-journal-provider';
import { computeStats, formatLongDate } from '@/features/journey/stats';
import { useEntrance } from '@/theme/motion';
import { useTheme } from '@/theme/theme-provider';

type Journal = ReturnType<typeof useLocalJournal>;

function TodayEditor({ journal }: { journal: Journal }) {
  const theme = useTheme();
  const [draft, setDraft] = useState(journal.draft);
  const [justSaved, setJustSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardEntrance = useEntrance(60);
  if (!journal.question || !journal.today) return null;

  const stats = computeStats(journal.history, journal.today);
  const alreadyAnswered = Boolean(journal.answer);

  const change = (value: string) => {
    setDraft(value);
    setJustSaved(false);
    void journal.setDraft(value).catch(() => setError('Taslak güvenli alana yazılamadı.'));
  };
  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      await journal.completeToday(draft);
      setJustSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Cevap kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };
  const trimmed = draft.trim().length;
  const invalid = trimmed < 1 || draft.length > 10_000;
  const overLimit = draft.length > 10_000;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen eyebrow={formatLongDate(journal.today).toUpperCase()} title="Bugünün sorusu">
        <StreakBadge count={stats.currentStreak} activeToday={stats.activeToday || justSaved} />

        <Animated.View style={{ opacity: cardEntrance.opacity, transform: [{ translateY: cardEntrance.translateY }] }}>
          <Card tone="surface" elevated style={styles.questionCard}>
            <CategoryChip category={journal.question.category} depth={journal.question.depth} />
            <Text accessibilityRole="header" style={[styles.question, { color: theme.ink }]}>
              {journal.question.text}
            </Text>
          </Card>
        </Animated.View>

        <Card tone="surface" padded>
          <View style={styles.editorHeader}>
            <Text style={[styles.editorTitle, { color: theme.ink }]}>Cevabın</Text>
            <Text style={[styles.counter, { color: overLimit ? theme.dangerInk : theme.inkMuted }]}>
              {draft.length.toLocaleString('tr-TR')} / 10.000
            </Text>
          </View>
          <TextInput
            accessibilityLabel="Bugünkü cevabın"
            multiline
            value={draft}
            onChangeText={change}
            placeholder="Aklından geçenleri birkaç cümleyle yaz…"
            placeholderTextColor={theme.inkMuted}
            style={[styles.editor, { color: theme.ink }]}
            textAlignVertical="top"
          />
        </Card>

        {error ? (
          <StateCard
            glyph="🌤️"
            title="Metnin kaybolmadı"
            description={`${error} Bu ekranda kalıp tekrar deneyebilirsin.`}
            tone="danger"
          />
        ) : null}

        {(justSaved || alreadyAnswered) && !error ? (
          <View style={styles.savedRow}>
            <SuccessCheck size={30} />
            <Text style={[styles.savedText, { color: theme.successInk }]}>
              Bugünün cevabı kaydedildi. Yarın yeni bir soru burada olacak.
            </Text>
          </View>
        ) : null}

        <PrimaryButton
          label={saving ? 'Kaydediliyor…' : alreadyAnswered ? 'Cevabı güncelle' : 'Bugünün cevabını kaydet'}
          glyph={saving ? undefined : alreadyAnswered ? '↻' : '✓'}
          disabled={saving || invalid}
          onPress={save}
        />
        <Text style={[styles.private, { color: theme.inkMuted }]}>
          Cevap metni loglara veya analitiğe yazılmaz.
        </Text>
      </Screen>
      <Celebrate show={justSaved && !alreadyAnswered} />
    </KeyboardAvoidingView>
  );
}

export default function TodayScreen() {
  const journal = useLocalJournal();
  return <TodayEditor key={journal.today ?? 'loading'} journal={journal} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  questionCard: { paddingVertical: 28, gap: 16 },
  question: { fontSize: 28, lineHeight: 38, fontWeight: '800', letterSpacing: -0.6 },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editorTitle: { fontSize: 15, fontWeight: '800' },
  counter: { fontSize: 12, fontWeight: '600' },
  editor: { minHeight: 200, fontSize: 17, lineHeight: 27, padding: 0 },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  savedText: { flex: 1, fontSize: 15, lineHeight: 22, fontWeight: '700' },
  private: { fontSize: 12, textAlign: 'center' },
});
