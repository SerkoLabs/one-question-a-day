import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { StateCard } from '@/components/StateCard';
import { useLocalJournal } from '@/features/local/local-journal-provider';
import { colors, radius, spacing } from '@/theme/tokens';

export default function HistoryScreen() {
  const { history } = useLocalJournal();
  return (
    <Screen eyebrow="SESSİZ ARŞİVİN" title="Geçmiş" description="Eski düşüncelerin burada, olduğu gibi kalır.">
      {!history.length ? <StateCard title="İlk cevapla başlar" description="Bugünün sorusunu kaydettiğinde tarih, soru ve cevabın burada görünecek." /> : null}
      <View style={styles.list}>
        {history.map((item) => (
          <Link key={item.id} href={{ pathname: '/entry/[responseId]', params: { responseId: item.id } }} asChild>
            <Pressable accessibilityRole="button" accessibilityLabel={`${item.localDate} tarihli cevabı aç`} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <Text style={styles.date}>{item.localDate}</Text>
              <Text style={styles.question} numberOfLines={2}>{item.questionText}</Text>
              <Text style={styles.answer} numberOfLines={3}>{item.body}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
      <Text style={styles.note}>Kaçırılan günler boş kalır. Geriye dönük baskı veya streak cezası yoktur.</Text>
    </Screen>
  );
}
const styles = StyleSheet.create({ list: { gap: spacing.md }, card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm }, pressed: { opacity: 0.72 }, date: { color: colors.peachInk, fontSize: 12, fontWeight: '800' }, question: { color: colors.ink, fontSize: 19, lineHeight: 26, fontWeight: '700' }, answer: { color: colors.inkSoft, fontSize: 15, lineHeight: 23 }, note: { color: colors.inkMuted, fontSize: 12, lineHeight: 18, textAlign: 'center' } });
