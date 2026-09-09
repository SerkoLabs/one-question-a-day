import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { StateCard } from '@/components/StateCard';
import { useLocalJournal } from '@/features/local/local-journal-provider';
import { colors, radius, spacing } from '@/theme/tokens';

export default function TodayScreen() {
  const journal = useLocalJournal();
  const [draft, setDraft] = useState(journal.draft);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setDraft(journal.draft), [journal.today, journal.draft]);
  if (!journal.question || !journal.today) return null;

  const change = (value: string) => {
    setDraft(value);
    setSaved(false);
    void journal.setDraft(value).catch(() => setError('Taslak güvenli alana yazılamadı.'));
  };
  const save = async () => {
    setError(null);
    try {
      await journal.setDraft(draft);
      await journal.completeToday();
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Cevap kaydedilemedi.');
    }
  };
  const invalid = draft.trim().length < 1 || draft.length > 10_000;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen eyebrow={journal.today} title="Bugünün sorusu">
        <View style={styles.questionCard}>
          <Text accessibilityRole="header" style={styles.question}>{journal.question.text}</Text>
          <Text style={styles.category}>{journal.question.category.replace('_', ' ')} • derinlik {journal.question.depth}</Text>
        </View>
        <View style={styles.editorCard}>
          <View style={styles.editorHeader}><Text style={styles.editorTitle}>Cevabın</Text><Text style={styles.counter}>{draft.length} / 10.000</Text></View>
          <TextInput accessibilityLabel="Bugünkü cevabın" multiline value={draft} onChangeText={change} placeholder="Aklından geçenleri birkaç cümleyle yaz…" placeholderTextColor={colors.inkMuted} style={styles.editor} textAlignVertical="top" />
        </View>
        {error ? <StateCard title="Metnin kaybolmadı" description={`${error} Bu ekranda kalıp tekrar deneyebilirsin.`} tone="notice" /> : null}
        {saved || journal.answer ? <StateCard title="Bugünün cevabı kaydedildi." description="Şimdi bırakabilirsin. Yarın yeni bir soru burada olacak." /> : null}
        <PrimaryButton label={journal.answer ? 'Cevabı güncelle' : 'Bugünün cevabını kaydet'} disabled={invalid} onPress={save} />
        <Text style={styles.private}>Cevap metni loglara veya analitiğe yazılmaz.</Text>
      </Screen>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  questionCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, gap: spacing.lg },
  question: { color: colors.ink, fontSize: 30, lineHeight: 40, fontWeight: '700', letterSpacing: -0.7 },
  category: { color: colors.peachInk, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  editorCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  editorTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  counter: { color: colors.inkMuted, fontSize: 11 },
  editor: { minHeight: 210, color: colors.ink, fontSize: 17, lineHeight: 27, padding: 0 },
  private: { color: colors.inkMuted, fontSize: 12, textAlign: 'center' },
});
