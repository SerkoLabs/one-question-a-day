import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { StateCard } from '@/components/StateCard';
import { colors, radius, spacing } from '@/theme/tokens';

const months = [
  ['Oca', 'Yeni başlangıçlar'],
  ['Şub', 'İlişkiler'],
  ['Mar', 'Kariyer sorgulamaları'],
  ['Nis', 'Belirsizlik'],
  ['May', 'Değişim isteği'],
  ['Haz', 'Denge arayışı'],
] as const;

export default function JourneyScreen() {
  return (
    <Screen
      eyebrow="ZAMAN ÇİZGİN"
      title="Benim Yolculuğum"
      description="Cevapların biriktikçe değişim burada görünür olacak."
    >
      <View style={styles.progressCard}>
        <Text style={styles.progressNumber}>0 / 365</Text>
        <Text style={styles.progressLabel}>Bu yıl kendin için durduğun günler</Text>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
      </View>

      <View style={styles.timeline}>
        {months.map(([month, label], index) => (
          <View key={month} style={styles.timelineRow}>
            <Text style={styles.month}>{month}</Text>
            <View style={styles.dotColumn}>
              <View style={[styles.dot, index === 0 && styles.activeDot]} />
              {index !== months.length - 1 ? <View style={styles.line} /> : null}
            </View>
            <View style={styles.timelineCard}>
              <Text style={styles.timelineTitle}>{label}</Text>
              <Text style={styles.timelineDescription}>Yeterli veri oluştuğunda dönem özeti burada görünecek.</Text>
            </View>
          </View>
        ))}
      </View>

      <StateCard
        tone="notice"
        title="Kaçırılan günler sorun değil"
        description="Bu ürün streak kaybıyla cezalandırmaz. Yolculuk, cevap verdiğin günlerden oluşur."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressCard: {
    backgroundColor: colors.green,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  progressNumber: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  progressLabel: { color: '#DDECE4', fontSize: 14, lineHeight: 20 },
  progressTrack: { height: 8, backgroundColor: '#FFFFFF33', borderRadius: radius.pill, overflow: 'hidden' },
  progressFill: { width: '2%', height: '100%', backgroundColor: '#FFFFFF', borderRadius: radius.pill },
  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.sm },
  month: { width: 34, paddingTop: 16, color: colors.inkMuted, fontSize: 12, fontWeight: '700' },
  dotColumn: { width: 18, alignItems: 'center' },
  dot: { marginTop: 18, width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.border },
  activeDot: { backgroundColor: colors.green },
  line: { flex: 1, width: 2, backgroundColor: colors.border, minHeight: 48 },
  timelineCard: {
    flex: 1,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  timelineTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  timelineDescription: { color: colors.inkMuted, fontSize: 12, lineHeight: 18 },
});
