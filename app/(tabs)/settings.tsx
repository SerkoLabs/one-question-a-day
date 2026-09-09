import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useLocalJournal } from '@/features/local/local-journal-provider';
import { colors, radius, spacing } from '@/theme/tokens';

export default function SettingsScreen() {
  const journal = useLocalJournal();
  return <Screen eyebrow="YEREL ÖNİZLEME" title="Ayarlar">
    <View style={styles.card}><Text style={styles.label}>Zaman dilimi</Text><Text style={styles.value}>{journal.state?.timezone}</Text></View>
    <View style={styles.card}><Text style={styles.label}>Soru seti</Text><Text style={styles.value}>{journal.state?.questionSetVersion}</Text></View>
    <View style={styles.card}><Text style={styles.label}>Saklama sınırı</Text><Text style={styles.copy}>Onboarding, soru atamaları, taslaklar ve cevaplar cihazın güvenli yerel alanında tutulur. Ham günlük metni loglanmaz veya analitiğe gönderilmez.</Text></View>
  </Screen>;
}
const styles = StyleSheet.create({ card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.lg, gap: spacing.xs }, label: { color: colors.inkMuted, fontSize: 12, fontWeight: '700' }, value: { color: colors.ink, fontSize: 17, fontWeight: '700' }, copy: { color: colors.inkSoft, fontSize: 15, lineHeight: 23 } });
