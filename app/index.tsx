import { Link, Redirect } from 'expo-router';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components';
import { useLocalJournal } from '@/features/local/local-journal-provider';
import { useEntrance } from '@/theme/motion';
import { useTheme } from '@/theme/theme-provider';

export default function WelcomeScreen() {
  const theme = useTheme();
  const journal = useLocalJournal();
  const hero = useEntrance(80);
  const actions = useEntrance(240);

  if (!journal.loading && journal.state?.onboardingComplete) return <Redirect href="/(tabs)" />;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <Animated.View style={{ opacity: hero.opacity, transform: [{ translateY: hero.translateY }], gap: 24 }}>
          <View style={[styles.mark, { backgroundColor: theme.primary }, theme.shadow('md')]}>
            <Text style={[styles.markText, { color: theme.onAccent }]}>1</Text>
          </View>
          <View style={styles.hero}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>
              Her gün{'\n'}yalnızca bir soru.
            </Text>
            <Text style={[styles.subtitle, { color: theme.inkSoft }]}>
              Birkaç cümle yaz. Bugünkü düşüncen, zamanla sana ait sessiz bir arşive dönüşsün.
            </Text>
          </View>
          <View style={styles.pills}>
            {['Günde tek soru', 'Cihazında güvende', 'Streak cezası yok'].map((pill) => (
              <View key={pill} style={[styles.pill, { backgroundColor: theme.surfaceMuted }]}>
                <Text style={[styles.pillText, { color: theme.inkSoft }]}>{pill}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {journal.loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.primary} />
            <Text style={[styles.muted, { color: theme.inkMuted }]}>Özel alanın hazırlanıyor…</Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: actions.opacity, transform: [{ translateY: actions.translateY }], gap: 14 }}>
            <Link href="/onboarding" asChild>
              <PrimaryButton label="Başla" glyph="✍️" />
            </Link>
            <Text style={[styles.muted, { color: theme.inkMuted }]}>
              Hesap gerekmez • Cevapların bu cihazda güvenli alanda kalır
            </Text>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 24, justifyContent: 'space-between', gap: 32 },
  mark: { width: 56, height: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  markText: { fontSize: 26, fontWeight: '900' },
  hero: { gap: 16 },
  title: { fontSize: 46, lineHeight: 52, fontWeight: '800', letterSpacing: -1.6 },
  subtitle: { fontSize: 18, lineHeight: 28 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  pillText: { fontSize: 13, fontWeight: '700' },
  loading: { alignItems: 'center', gap: 10 },
  muted: { textAlign: 'center', fontSize: 13, lineHeight: 19 },
});
