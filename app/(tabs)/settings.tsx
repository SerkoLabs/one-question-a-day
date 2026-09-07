import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { StateCard } from '@/components/StateCard';
import { useSessionBootstrap } from '@/features/auth/session-provider';
import { clearProtectedQueryCache } from '@/lib/query/client';
import { supabase } from '@/lib/supabase/client';
import { colors, radius, spacing } from '@/theme/tokens';

export default function SettingsScreen() {
  const bootstrap = useSessionBootstrap();
  const profile = bootstrap.status === 'ready' ? bootstrap.profile : null;
  const userId = bootstrap.status === 'ready' ? bootstrap.session.user.id : '';
  const [timezone, setTimezone] = useState(profile?.timezone ?? '');
  const [aiConsent, setAiConsent] = useState(false);

  useEffect(() => {
    if (profile?.timezone != null) setTimezone(profile.timezone);
  }, [profile?.timezone]);

  useEffect(() => {
    if (!userId) return;
    void supabase
      .from('profiles')
      .select('ai_analysis_consent')
      .eq('id', userId)
      .single()
      .then(({ data }) => setAiConsent(Boolean(data?.ai_analysis_consent)));
  }, [userId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !timezone.trim()) throw new Error('Zaman dilimi boş bırakılamaz.');
      const { error } = await supabase
        .from('profiles')
        .update({ timezone: timezone.trim(), ai_analysis_consent: aiConsent })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => bootstrap.refreshProfile(),
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    await clearProtectedQueryCache();
    router.replace('/');
  };

  return (
    <Screen
      eyebrow="KONTROL SENDE"
      title="Ayarlar"
      description="Günlüğün ve ondan türetilen raporlar yalnızca sana ait özel veridir."
    >
      <View style={styles.group}>
        <View style={[styles.row, styles.withBorder]}>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>AI analizi</Text>
            <Text style={styles.rowValue}>
              {aiConsent ? 'Yeni cevapların dönemsel analiz için işlenebilir.' : 'Kapalı — günlük tutmaya devam edebilirsin.'}
            </Text>
          </View>
          <Switch
            accessibilityLabel="AI analizini aç veya kapat"
            onValueChange={setAiConsent}
            thumbColor="#FFFFFF"
            trackColor={{ false: colors.border, true: colors.green }}
            value={aiConsent}
          />
        </View>

        <View style={[styles.row, styles.withBorder]}>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Zaman dilimi</Text>
            <Text style={styles.rowValue}>Geçmiş cevap tarihleri değişmez; yalnızca bundan sonraki gün sınırı etkilenir.</Text>
            <TextInput
              autoCapitalize="none"
              onChangeText={setTimezone}
              placeholder="Europe/Istanbul"
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
              value={timezone}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Günlük hatırlatma</Text>
            <Text style={styles.rowValue}>
              Yerel bildirim izni ve zamanlama Phase 6'da bağlanacak. Hazır olmadan sahte bir “açık” durumu göstermiyoruz.
            </Text>
          </View>
        </View>
      </View>

      {saveMutation.isError ? (
        <StateCard
          tone="notice"
          title="Ayarlar kaydedilemedi"
          description="Zaman diliminin geçerli bir IANA adı olduğundan ve bağlantının açık olduğundan emin ol."
        />
      ) : null}
      {saveMutation.isSuccess ? (
        <StateCard title="Ayarların kaydedildi" description="Yeni tercihler hesabına uygulandı." />
      ) : null}
      <PrimaryButton
        label={saveMutation.isPending ? 'Kaydediliyor…' : 'Ayarları Kaydet'}
        disabled={saveMutation.isPending}
        onPress={() => saveMutation.mutate()}
      />

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

      <PrimaryButton label="Çıkış Yap" tone="secondary" onPress={signOut} />
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
  row: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.lg, gap: spacing.md },
  withBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowCopy: { flex: 1, gap: spacing.sm },
  rowTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  rowValue: { color: colors.inkMuted, fontSize: 13, lineHeight: 19 },
  input: {
    minHeight: 48,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    fontSize: 14,
  },
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
