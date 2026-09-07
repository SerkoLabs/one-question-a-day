import { Link, Redirect } from 'expo-router';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { StateCard } from '@/components/StateCard';
import { useSessionBootstrap } from '@/features/auth/session-provider';
import { supabase } from '@/lib/supabase/client';
import { colors, radius, spacing } from '@/theme/tokens';

export default function WelcomeScreen() {
  const bootstrap = useSessionBootstrap();

  if (bootstrap.status === 'ready') return <Redirect href="/(tabs)" />;
  if (bootstrap.status === 'onboarding') return <Redirect href="/onboarding" />;

  const recoverFromSessionError = async () => {
    if (bootstrap.status !== 'error') return;
    if (bootstrap.session) {
      await supabase.auth.signOut();
    }
    await bootstrap.refreshProfile();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>1</Text>
          </View>
          <Text style={styles.brand}>ONE QUESTION A DAY</Text>
        </View>

        <View style={styles.hero}>
          <Text accessibilityRole="header" style={styles.title}>
            Her gün{`\n`}bir soru.{`\n`}Zaman içinde{`\n`}kendini gör.
          </Text>
          <Text style={styles.subtitle}>
            Bir yıl sonra bugünkü düşüncelerine bak. Nelerin değiştiğini, nelerin hep seninle kaldığını gör.
          </Text>
        </View>

        <View style={styles.previewCard} accessible accessibilityLabel="Uygulamanın ana vaadi">
          <Text style={styles.previewEyebrow}>365 GÜNLÜK YOLCULUK</Text>
          <Text style={styles.previewTitle}>Bir yıl sonra, kendinin yıllık raporuna bak.</Text>
          <View style={styles.previewStats}>
            <View style={styles.statPill}>
              <Text style={styles.statNumber}>1</Text>
              <Text style={styles.statLabel}>soru / gün</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statNumber}>30</Text>
              <Text style={styles.statLabel}>günde ilk ayna</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statNumber}>365</Text>
              <Text style={styles.statLabel}>günde portre</Text>
            </View>
          </View>
        </View>

        {bootstrap.status === 'loading' ? (
          <View style={styles.bootstrapRow} accessibilityLiveRegion="polite">
            <ActivityIndicator color={colors.green} />
            <Text style={styles.bootstrapText}>Hesabın kontrol ediliyor…</Text>
          </View>
        ) : null}

        {bootstrap.status === 'error' ? (
          <View style={styles.actions}>
            <StateCard title="Hesap durumu yüklenemedi" description={bootstrap.error} tone="notice" />
            <PrimaryButton label="Güvenli şekilde yeniden başlat" onPress={recoverFromSessionError} />
            <Text style={styles.footer}>
              Mevcut oturum temizlenir; sunucudaki günlük cevapların silinmez.
            </Text>
          </View>
        ) : null}

        {bootstrap.status === 'signed-out' ? (
          <View style={styles.actions}>
            <Link href="/(auth)/sign-up" style={styles.primaryLink} accessibilityRole="button">
              Hemen Başla
            </Link>
            <View style={styles.signInRow}>
              <Text style={styles.signInText}>Zaten hesabın var mı?</Text>
              <Link href="/(auth)/sign-in" style={styles.signInLink}>
                Giriş yap
              </Link>
            </View>
            <Text style={styles.footer}>Özel • Yargısız • Teşhis koymaz</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  brand: { color: colors.inkSoft, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  hero: { gap: spacing.md, flex: 1, justifyContent: 'center' },
  title: {
    color: colors.ink,
    fontSize: 45,
    lineHeight: 48,
    fontWeight: '700',
    letterSpacing: -1.8,
  },
  subtitle: { color: colors.inkSoft, fontSize: 17, lineHeight: 25, maxWidth: 520 },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  previewEyebrow: { color: colors.peachInk, fontWeight: '800', fontSize: 11, letterSpacing: 1.2 },
  previewTitle: { color: colors.ink, fontWeight: '700', fontSize: 20, lineHeight: 27 },
  previewStats: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  statPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    backgroundColor: colors.greenSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statNumber: { color: colors.green, fontSize: 15, fontWeight: '800' },
  statLabel: { color: colors.inkSoft, fontSize: 12, fontWeight: '600' },
  bootstrapRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  bootstrapText: { color: colors.inkSoft, fontSize: 14 },
  actions: { gap: spacing.md },
  primaryLink: {
    minHeight: 54,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.green,
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
  },
  signInRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  signInText: { color: colors.inkMuted, fontSize: 14 },
  signInLink: { color: colors.green, fontSize: 14, fontWeight: '800' },
  footer: { color: colors.inkMuted, textAlign: 'center', fontSize: 12, lineHeight: 18 },
});
