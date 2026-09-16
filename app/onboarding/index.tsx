import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, Screen } from '@/components';
import { useLocalJournal } from '@/features/local/local-journal-provider';
import { useTheme } from '@/theme/theme-provider';

const STEPS = [
  { glyph: '📅', title: 'Günde tek soru', copy: 'Her yerel takvim gününde yalnızca bir küratörlü soru görürsün.' },
  { glyph: '🔒', title: 'Yalnızca sende', copy: 'Yazdığın taslak ve cevap cihazının güvenli alanında saklanır.' },
  { glyph: '🌱', title: 'Baskı yok', copy: 'Kaçırdığın günler için suçluluk yok. Arşivin yalnızca yaşadığın günleri taşır.' },
];

export default function OnboardingScreen() {
  const theme = useTheme();
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
      <View style={styles.steps}>
        {STEPS.map((step, index) => (
          <Card key={step.title} tone="surface" entranceDelay={index * 90} style={styles.step}>
            <View style={[styles.glyphTile, { backgroundColor: theme.primarySoft, borderRadius: theme.radius.md }]}>
              <Text style={styles.glyph}>{step.glyph}</Text>
            </View>
            <View style={styles.stepCopy}>
              <Text style={[styles.stepTitle, { color: theme.ink }]}>{step.title}</Text>
              <Text style={[styles.stepText, { color: theme.inkSoft }]}>{step.copy}</Text>
            </View>
          </Card>
        ))}
      </View>

      <View style={[styles.zone, { backgroundColor: theme.primarySoft, borderRadius: theme.radius.md }]}>
        <Text style={[styles.zoneLabel, { color: theme.inkMuted }]}>Yerel gün sınırı</Text>
        <Text style={[styles.zoneValue, { color: theme.primaryInk }]}>{timezone}</Text>
      </View>

      <PrimaryButton
        label={saving ? 'Hazırlanıyor…' : 'Bugünün sorusuna geç'}
        glyph={saving ? undefined : '→'}
        disabled={saving}
        onPress={start}
      />
      <Text style={[styles.privacy, { color: theme.inkMuted }]}>
        Bu önizleme cevaplarını sunucuya, analitiğe veya üçüncü taraf yapay zekâya göndermez.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  steps: { gap: 12 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  glyphTile: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontSize: 24 },
  stepCopy: { flex: 1, gap: 3 },
  stepTitle: { fontSize: 16, fontWeight: '800' },
  stepText: { fontSize: 15, lineHeight: 22 },
  zone: { padding: 16, gap: 4 },
  zoneLabel: { fontSize: 12, fontWeight: '600' },
  zoneValue: { fontSize: 16, fontWeight: '800' },
  privacy: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
