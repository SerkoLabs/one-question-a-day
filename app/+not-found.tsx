import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { colors, radius, spacing } from '@/theme/tokens';

export default function NotFoundScreen() {
  return (
    <Screen eyebrow="404" title="Bu sayfa yok" description="Bağlantı eski veya eksik olabilir." scroll={false}>
      <View style={styles.body}>
        <Text style={styles.symbol}>○</Text>
        <Text style={styles.copy}>Yolculuğun kaybolmadı. Güvenli başlangıç ekranına dönebilirsin.</Text>
        <Link href="/" style={styles.link} accessibilityRole="button">
          Başlangıca dön
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  symbol: { color: colors.peachInk, fontSize: 68, fontWeight: '200' },
  copy: { color: colors.inkSoft, fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 340 },
  link: {
    backgroundColor: colors.green,
    color: '#FFFFFF',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 15,
    overflow: 'hidden',
    fontSize: 15,
    fontWeight: '800',
  },
});
