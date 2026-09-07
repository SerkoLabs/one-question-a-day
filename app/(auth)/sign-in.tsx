import { Link, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { CredentialsForm } from '@/features/auth/credentials-form';
import { supabase } from '@/lib/supabase/client';
import { colors, spacing } from '@/theme/tokens';

export default function SignInScreen() {
  return (
    <Screen
      eyebrow="TEKRAR HOŞ GELDİN"
      title="Yolculuğuna devam et"
      description="Cevapların ve raporların yalnızca hesabına bağlı özel veriler olarak saklanır."
    >
      <CredentialsForm
        submitLabel="Giriş yap"
        onSubmit={async ({ email, password }) => {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw new Error('E-posta veya şifre doğrulanamadı.');
          router.replace('/');
        }}
      />

      <View style={styles.links}>
        <Link href="/(auth)/forgot-password" style={styles.link}>
          Şifremi unuttum
        </Link>
        <View style={styles.inline}>
          <Text style={styles.muted}>Hesabın yok mu?</Text>
          <Link href="/(auth)/sign-up" style={styles.link}>
            Hesap oluştur
          </Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  links: { alignItems: 'center', gap: spacing.md },
  inline: { flexDirection: 'row', gap: 6 },
  muted: { color: colors.inkMuted, fontSize: 14 },
  link: { color: colors.green, fontWeight: '800', fontSize: 14 },
});
