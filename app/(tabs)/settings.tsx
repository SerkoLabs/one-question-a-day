import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { StateCard } from '@/components/StateCard';
import { colors, radius, spacing } from '@/theme/tokens';

const rows = [
  ['Günlük hatırlatma', 'Kapalı'],
  ['AI analizi', 'Onay gerekli'],
  ['Zaman dilimi', 'Kurulumda seçilecek'],
  ['Verilerim', 'Dışa aktar / hesabı sil'],
] as const;

export default function SettingsScreen() {
  return (
    <Screen
      eyebrow="KONTROL SENDE"
      title="Ayarlar"
      description="Günlüğün ve ondan türetilen raporlar yalnızca sana ait özel veridir."
    >
      <View style={styles.group}>
        {rows.map(([label, value], index) => (
          <View key={label} style={[styles.row, index !== rows.length - 1 && styles.withBorder]}>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{label}</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        ))}
      </View>

      <StateCard
        tone="notice"
        title="AI bir terapist değil"
        description="Analizler yalnızca kendi yazdıklarındaki tekrarları ve değişimleri görünür kılmak için tasarlanır. Klinik teşhis veya tedavi önerisi üretmez."
      />

      <View style={styles.privacyCard}>
        <Text style={styles.privacyEyebrow}>MAHREMİYET İLKESİ</Text>
        <Text style={styles.privacyTitle}>Cevapların analitik olaylara veya uygulama loglarına yazılmaz.</Text>
        <Text style={styles.privacyBody}>
          Ürün metrikleri yalnızca cevap verildi, rapor açıldı gibi içeriksiz olaylardan oluşacak.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  withBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  rowValue: { color: colors.inkMuted, fontSize: 13 },
  chevron: { color: colors.inkMuted, fontSize: 27, fontWeight: '300' },
  privacyCard: {
    backgroundColor: colors.greenSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  privacyEyebrow: { color: colors.green, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  privacyTitle: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  privacyBody: { color: colors.inkSoft, fontSize: 14, lineHeight: 21 },
});
