import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { StateCard } from '@/components/StateCard';
import { colors, radius, spacing } from '@/theme/tokens';

export default function TodayScreen() {
  return (
    <Screen eyebrow="7 EYLÜL • 1. GÜN" title="Bugünün Sorusu" scroll={false}>
      <View style={styles.body}>
        <View style={styles.sunBadge}>
          <Text style={styles.sun}>☼</Text>
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.question}>
            Son zamanlarda hayatında değiştirmek isteyip de sürekli ertelediğin şey ne?
          </Text>
          <View style={styles.rule} />
          <Text style={styles.quote}>“Dürüst cevaplar, daha iyi bir sen için.”</Text>
        </View>

        <StateCard
          title="Henüz bağlı değil"
          description="Bu ekran gerçek günlük verisine Phase 3 vertical slice sırasında bağlanacak. Şimdilik yalnızca uygulama kabuğunu ve durumları doğruluyoruz."
        />
      </View>

      <View style={styles.footer}>
        <PrimaryButton label="Cevabımı Yaz" disabled />
        <Text style={styles.helper}>Kayıt işlemi gerçek Supabase/RLS akışından önce etkinleştirilmeyecek.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  sunBadge: {
    alignSelf: 'center',
    width: 54,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sun: { color: colors.peachInk, fontSize: 30 },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  question: {
    color: colors.ink,
    fontSize: 29,
    lineHeight: 38,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  rule: { width: 52, height: 2, borderRadius: 2, backgroundColor: colors.peachInk, alignSelf: 'center' },
  quote: { color: colors.inkMuted, fontSize: 14, fontStyle: 'italic', textAlign: 'center' },
  footer: { gap: spacing.sm },
  helper: { color: colors.inkMuted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
