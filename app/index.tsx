import { Link, Redirect } from 'expo-router';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useLocalJournal } from '@/features/local/local-journal-provider';
import { colors, radius, spacing } from '@/theme/tokens';

export default function WelcomeScreen() {
  const journal = useLocalJournal();
  if (!journal.loading && journal.state?.onboardingComplete) return <Redirect href="/(tabs)" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.mark}><Text style={styles.markText}>1</Text></View>
        <View style={styles.hero}>
          <Text accessibilityRole="header" style={styles.title}>Her gün yalnızca bir soru.</Text>
          <Text style={styles.subtitle}>Birkaç cümle yaz. Bugünkü düşüncen, zamanla sana ait sessiz bir arşive dönüşsün.</Text>
        </View>
        {journal.loading ? (
          <View style={styles.loading}><ActivityIndicator color={colors.green} /><Text style={styles.muted}>Özel alanın hazırlanıyor…</Text></View>
        ) : (
          <View style={styles.actions}>
            <Link href="/onboarding" style={styles.primary} accessibilityRole="button">Başla</Link>
            <Text style={styles.muted}>Hesap gerekmez • Cevapların bu cihazda güvenli alanda kalır</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.lg, justifyContent: 'space-between', gap: spacing.xl },
  mark: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  markText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  hero: { gap: spacing.md },
  title: { color: colors.ink, fontSize: 48, lineHeight: 53, fontWeight: '700', letterSpacing: -1.7 },
  subtitle: { color: colors.inkSoft, fontSize: 18, lineHeight: 28 },
  actions: { gap: spacing.md },
  primary: { minHeight: 56, padding: 17, borderRadius: radius.pill, overflow: 'hidden', backgroundColor: colors.green, color: '#fff', textAlign: 'center', fontSize: 17, fontWeight: '800' },
  loading: { alignItems: 'center', gap: spacing.sm },
  muted: { color: colors.inkMuted, textAlign: 'center', fontSize: 13, lineHeight: 19 },
});
