import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { StateCard } from '@/components/StateCard';
import { useLocalJournal } from '@/features/local/local-journal-provider';
import type { JournalAnswer } from '@/features/local/state';
import { colors, radius, spacing } from '@/theme/tokens';

function EntryEditor({ entry, updateAnswer }: { entry: JournalAnswer; updateAnswer: (localDate: string, body: string) => Promise<void> }) {
  const [body, setBody] = useState(entry.body);
  const [saved, setSaved] = useState(false);
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: entry.localDate, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.green }} />
      <Screen eyebrow={entry.localDate} title={entry.questionText}>
        <View style={styles.card}><TextInput accessibilityLabel="Geçmiş cevabın" multiline value={body} onChangeText={(value) => { setBody(value); setSaved(false); }} style={styles.editor} textAlignVertical="top" /></View>
        <PrimaryButton label="Değişikliği kaydet" disabled={!body.trim() || body.length > 10_000} onPress={() => void updateAnswer(entry.localDate, body).then(() => setSaved(true))} />
        {saved ? <Text style={styles.saved}>Değişiklik güvenli alana kaydedildi.</Text> : null}
      </Screen>
    </>
  );
}

export default function EntryDetailScreen() {
  const { responseId } = useLocalSearchParams<{ responseId: string }>();
  const journal = useLocalJournal();
  const entry = journal.history.find((item) => item.id === responseId);
  if (!entry) return <Screen title="Cevap bulunamadı"><StateCard title="Bu kayıt açılamadı" description="Kayıt silinmiş veya yerel veri okunamamış olabilir." tone="notice" /></Screen>;
  return <EntryEditor key={entry.id} entry={entry} updateAnswer={journal.updateAnswer} />;
}

const styles = StyleSheet.create({ card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg }, editor: { minHeight: 260, color: colors.ink, fontSize: 17, lineHeight: 27 }, saved: { color: colors.green, textAlign: 'center', fontWeight: '700' } });
