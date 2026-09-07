import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { StateCard } from '@/components/StateCard';
import { useSessionBootstrap } from '@/features/auth/session-provider';
import { supabase } from '@/lib/supabase/client';
import { colors, radius, spacing } from '@/theme/tokens';

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export default function OnboardingScreen() {
  const bootstrap = useSessionBootstrap();
  const detectedTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul',
    [],
  );
  const [timezone, setTimezone] = useState(detectedTimezone);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [aiConsent, setAiConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (bootstrap.status === 'signed-out') return <Redirect href="/" />;
  if (bootstrap.status === 'ready') return <Redirect href="/(tabs)" />;
  if (bootstrap.status === 'error') return <Redirect href="/" />;

  const complete = async () => {
    setError(null);
    if (!timezone.trim()) {
      setError('Zaman dilimi boş bırakılamaz.');
      return;
    }
    if (reminderEnabled && !timePattern.test(reminderTime)) {
      setError('Hatırlatma saatini 24 saat formatında HH:MM olarak gir.');
      return;
    }

    setBusy(true);
    try {
      const { error: rpcError } = await supabase.rpc('complete_onboarding', {
        p_timezone: timezone.trim(),
        p_locale: 'tr',
        p_reminder_enabled: reminderEnabled,
        p_reminder_local_time: reminderEnabled ? `${reminderTime}:00` : null,
        p_ai_analysis_consent: aiConsent,
      });
      if (rpcError) throw rpcError;
      await bootstrap.refreshProfile();
      router.replace('/');
    } catch {
      setError('Kurulum tamamlanamadı. Bilgileri kontrol edip tekrar dene.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      eyebrow="1 / 3 • BAŞLANGIÇ"
      title="Bu yolculuk sana göre olsun"
      description="Sadece gün sınırı, hatırlatma ve AI analizi tercihini ayarlıyoruz. Demografik bilgi toplamıyoruz."
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Zaman dilimin</Text>
        <Text style={styles.cardDescription}>
          Günün tek sorusu bu zaman dilimine göre değişir. Seyahat edersen daha sonra güncelleyebilirsin; geçmiş cevaplarının tarihleri değişmez.
        </Text>
        <TextInput
          autoCapitalize="none"
          onChangeText={setTimezone}
          placeholder="Europe/Istanbul"
          placeholderTextColor={colors.inkMuted}
          style={styles.input}
          value={timezone}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.cardTitle}>Günlük hatırlatma</Text>
            <Text style={styles.cardDescription}>İstersen günde bir kez sessizce hatırlatalım.</Text>
          </View>
          <Switch
            accessibilityLabel="Günlük hatırlatmayı aç"
            onValueChange={setReminderEnabled}
            thumbColor="#FFFFFF"
            trackColor={{ false: colors.border, true: colors.green }}
            value={reminderEnabled}
          />
        </View>
        {reminderEnabled ? (
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Saat</Text>
            <TextInput
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              onChangeText={setReminderTime}
              placeholder="20:00"
              placeholderTextColor={colors.inkMuted}
              style={[styles.input, styles.timeInput]}
              value={reminderTime}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.cardTitle}>Zaman içindeki değişimi AI ile analiz et</Text>
            <Text style={styles.cardDescription}>
              Açarsan cevapların, tema ve dönemsel değişim çıkarmak için güvenilir sunucu üzerinden AI sağlayıcısına gönderilebilir. Teşhis veya terapi amacıyla kullanılmaz.
            </Text>
          </View>
          <Switch
            accessibilityLabel="AI analizine izin ver"
            onValueChange={setAiConsent}
            thumbColor="#FFFFFF"
            trackColor={{ false: colors.border, true: colors.green }}
            value={aiConsent}
          />
        </View>
        <Text style={styles.consentFootnote}>
          Bu izin zorunlu değil. Kapalıyken günlük tutmaya devam edebilirsin; AI raporları oluşturulmaz.
        </Text>
      </View>

      {error ? <StateCard title="Kurulum tamamlanamadı" description={error} tone="notice" /> : null}
      <PrimaryButton label={busy ? 'Hazırlanıyor…' : 'Yolculuğu Başlat'} disabled={busy} onPress={complete} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  cardDescription: { color: colors.inkSoft, fontSize: 14, lineHeight: 21 },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
  switchRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  switchCopy: { flex: 1, gap: spacing.xs },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  timeLabel: { color: colors.inkSoft, fontSize: 14, fontWeight: '700' },
  timeInput: { width: 104, textAlign: 'center' },
  consentFootnote: { color: colors.inkMuted, fontSize: 12, lineHeight: 18 },
});
