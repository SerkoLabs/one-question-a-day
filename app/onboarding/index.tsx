import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { useLocalJournal } from '@/features/local/local-journal-provider';
import { colors, radius, spacing } from '@/theme/tokens';

export default function OnboardingScreen() {
  const journal = useLocalJournal();
  const [saving, setSaving] = useState(false);
  if (journal.state?.onboardingComplete) return <Redirect href="/(tabs)" />;

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul';
  const start = async () => {
    setSaving(true);
    try {
      await journal.completeOnboarding(timezone);
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen eyebrow="KISA BİR BAŞLANGIÇ" title="Bir soru. Bir cevap. Bugünlük bu kadar.">
      <View style={styles.card}>
        <Text style={styles.number}>01</Text><Text style={styles.copy}>Her yerel takvim gününde yalnızca bir küratörlü soru görürsün.</Text>
        <Text style={styles.number}>02</Text><Text style={styles.copy}>Yazdığın taslak ve cevap cihazının güvenli alanında saklanır.</Text>
        <Text style={styles.number}>03</Text><Text style={styles.copy}>Kaçırdığın günler için suçluluk yok. Arşivin yalnızca yaşadığın günleri taşır.</Text>
      </View>
      <View style={styles.zone}><Text style={styles.zoneLabel}>Yerel gün sınırı</Text><Text style={styles.zoneValue}>{timezone}</Text></View>
      <PrimaryButton label={saving ? 'Hazırlanıyor…' : 'Bugünün sorusuna geç'} disabled={saving} onPress={start} />
      <Text style={styles.privacy}>Bu önizleme cevaplarını sunucuya, analitiğe veya üçüncü taraf yapay zekâya göndermez.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  number: { color: colors.peachInk, fontSize: 12, fontWeight: '800', letterSpacing: 1.4, marginTop: spacing.sm },
  copy: { color: colors.ink, fontSize: 17, lineHeight: 26 },
  zone: { backgroundColor: colors.greenSoft, borderRadius: radius.md, padding: spacing.md, gap: 4 },
  zoneLabel: { color: colors.inkMuted, fontSize: 12 },
  zoneValue: { color: colors.green, fontSize: 16, fontWeight: '700' },
  privacy: { color: colors.inkMuted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
