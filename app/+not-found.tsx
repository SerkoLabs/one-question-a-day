import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Glyph, PrimaryButton, Screen } from '@/components';
import { useTheme } from '@/theme/theme-provider';

export default function NotFoundScreen() {
  const theme = useTheme();

  return (
    <Screen
      eyebrow="404"
      title="Bu sayfa yok"
      description="Bağlantı eski veya eksik olabilir."
      scroll={false}
    >
      <View style={styles.body}>
        <Glyph symbol="🧭" tone="accent" size={84} />
        <Text style={[styles.copy, { color: theme.inkSoft }]}>
          Yolculuğun kaybolmadı. Buradan güvenle başlangıç ekranına dönebilirsin.
        </Text>
        <Link href="/" asChild>
          <PrimaryButton label="Başlangıca dön" glyph="→" accessibilityLabel="Başlangıca dön" />
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  copy: { fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 340 },
});
