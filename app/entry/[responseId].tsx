import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, CategoryChip, PrimaryButton, Screen, StateCard, SuccessCheck } from '@/components';
import { useLocalJournal } from '@/features/local/local-journal-provider';
import type { JournalAnswer } from '@/features/local/state';
import { formatLongDate } from '@/features/journey/stats';
import { QUESTIONS } from '@/features/local/questions';
import { useTheme } from '@/theme/theme-provider';

type UpdateAnswer = (localDate: string, body: string) => Promise<void>;

function EntryEditor({ entry, updateAnswer }: { entry: JournalAnswer; updateAnswer: UpdateAnswer }) {
  const theme = useTheme();
  const [body, setBody] = useState(entry.body);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = QUESTIONS.find((item) => item.id === entry.questionId);
  const longDate = formatLongDate(entry.localDate);
  const revised = entry.updatedAt !== entry.createdAt;

  const change = (value: string) => {
    setBody(value);
    setSaved(false);
  };

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      await updateAnswer(entry.localDate, body);
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Değişiklik kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const overLimit = body.length > 10_000;
  const invalid = body.trim().length < 1 || overLimit;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: longDate,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.primary,
        }}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen eyebrow={longDate.toUpperCase()} title={entry.questionText}>
          {question ? <CategoryChip category={question.category} depth={question.depth} /> : null}

          <Text style={[styles.intro, { color: theme.inkSoft }]}>
            {revised
              ? 'Bu cevaba daha önce dokunmuştun. İstersen bugünkü gözünle yeniden düşünebilirsin.'
              : 'Geçmiş bir günün cevabı. İstersen bugünkü gözünle yeniden dokunabilirsin.'}
          </Text>

          <Card tone="surface" elevated padded>
            <View style={styles.editorHeader}>
              <Text style={[styles.editorTitle, { color: theme.ink }]}>Cevabın</Text>
              <Text style={[styles.counter, { color: overLimit ? theme.dangerInk : theme.inkMuted }]}>
                {body.length.toLocaleString('tr-TR')} / 10.000
              </Text>
            </View>
            <TextInput
              accessibilityLabel="Geçmiş cevabın"
              multiline
              value={body}
              onChangeText={change}
              placeholder="Bu güne dair düşüncelerin…"
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

          {saved && !error ? (
            <View style={styles.savedRow}>
              <SuccessCheck size={30} />
              <Text style={[styles.savedText, { color: theme.successInk }]}>
                Değişiklik güvenli alana kaydedildi.
              </Text>
            </View>
          ) : null}

          <PrimaryButton
            label={saving ? 'Kaydediliyor…' : 'Değişikliği kaydet'}
            glyph={saving ? undefined : '↻'}
            disabled={saving || invalid}
            onPress={save}
          />
          <Text style={[styles.private, { color: theme.inkMuted }]}>
            Cevap metni yalnızca cihazının güvenli alanında saklanır.
          </Text>
        </Screen>
      </KeyboardAvoidingView>
    </>
  );
}

export default function EntryDetailScreen() {
  const { responseId } = useLocalSearchParams<{ responseId: string }>();
  const journal = useLocalJournal();
  const entry = journal.history.find((item) => item.id === responseId);

  if (!entry) {
    return (
      <Screen title="Cevap bulunamadı">
        <StateCard
          glyph="🧭"
          title="Bu kaydı bulamadık"
          description="Bu cevap silinmiş ya da yerel arşivinde artık yer almıyor olabilir. Arşivine dönüp diğer günlere göz atabilirsin."
          tone="notice"
        />
      </Screen>
    );
  }

  return <EntryEditor key={entry.id} entry={entry} updateAnswer={journal.updateAnswer} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  intro: { fontSize: 15, lineHeight: 22 },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editorTitle: { fontSize: 15, fontWeight: '800' },
  counter: { fontSize: 12, fontWeight: '600' },
  editor: { minHeight: 220, fontSize: 17, lineHeight: 27, padding: 0 },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  savedText: { flex: 1, fontSize: 15, lineHeight: 22, fontWeight: '700' },
  private: { fontSize: 12, textAlign: 'center' },
});
