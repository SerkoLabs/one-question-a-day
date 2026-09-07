import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { StateCard } from '@/components/StateCard';
import { colors, radius, spacing } from '@/theme/tokens';

const reportCards = [
  {
    label: 'Aylık rapor',
    title: 'Bu ay nasıldın?',
    detail: 'En az 8 cevapla ilk düşünsel aynan açılır.',
    badge: '30 gün',
  },
  {
    label: '6 aylık rapor',
    title: 'Değişim haritan',
    detail: 'Tekrar eden ve güçlenen temaları dönemler arasında gör.',
    badge: '6 ay',
  },
  {
    label: 'Yıllık portre',
    title: 'Bir yıl önceki sen, bugünkü sen',
    detail: 'Değerler, ilişkiler, yönelimler ve bakış açındaki değişimi karşılaştır.',
    badge: '365 gün',
  },
] as const;

export default function ReportsScreen() {
  return (
    <Screen
      eyebrow="DÜŞÜNSEL AYNA"
      title="Raporlar"
      description="Raporlar teşhis koymaz; kendi cevaplarındaki tekrar ve değişimleri sana geri gösterir."
    >
      <View style={styles.stack}>
        {reportCards.map((card, index) => (
          <View key={card.label} style={[styles.card, index === 2 && styles.yearCard]}>
            <View style={styles.cardTop}>
              <Text style={[styles.label, index === 2 && styles.yearSoft]}>{card.label.toUpperCase()}</Text>
              <View style={[styles.badge, index === 2 && styles.yearBadge]}>
                <Text style={[styles.badgeText, index === 2 && styles.yearBadgeText]}>{card.badge}</Text>
              </View>
            </View>
            <Text style={[styles.title, index === 2 && styles.yearText]}>{card.title}</Text>
            <Text style={[styles.detail, index === 2 && styles.yearSoft]}>{card.detail}</Text>
            <Text style={[styles.locked, index === 2 && styles.yearSoft]}>Henüz yeterli veri yok</Text>
          </View>
        ))}
      </View>

      <StateCard
        title="Neden hemen rapor yok?"
        description="Az veriden büyük sonuç çıkarmak bu ürünün amacına ters. Yeterli cevap oluşana kadar uygulama kesinlik iddiasında bulunmaz."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  yearCard: { backgroundColor: colors.green, borderColor: colors.green },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  label: { color: colors.peachInk, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  badge: { backgroundColor: colors.greenSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { color: colors.green, fontSize: 11, fontWeight: '800' },
  yearBadge: { backgroundColor: '#FFFFFF22' },
  yearBadgeText: { color: '#FFFFFF' },
  title: { color: colors.ink, fontSize: 22, lineHeight: 28, fontWeight: '800' },
  detail: { color: colors.inkSoft, fontSize: 14, lineHeight: 21 },
  locked: { color: colors.inkMuted, fontSize: 12, fontWeight: '700', marginTop: 4 },
  yearText: { color: '#FFFFFF' },
  yearSoft: { color: '#DDECE4' },
});
