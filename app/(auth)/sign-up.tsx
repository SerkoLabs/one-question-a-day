import { Link, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { CredentialsForm } from '@/features/auth/credentials-form';
import { supabase } from '@/lib/supabase/client';
import { colors, spacing } from '@/theme/tokens';

export default function SignUpScreen() {
  return (
    <Screen
      eyebrow="İLK GÜN"
      title="Kendine bir yıl ver"
      description="Her gün tek bir soruyla başlayacağız. Uzun cevap vermek zorunda değilsin."
    >
      <CredentialsForm
        submitLabel="Hesap oluştur"
        onSubmit={async ({ email, password }) => {
          const { data, error } = await supabase.auth.signUp({ email, password });
          if (error) {
            if (error.message.toLowerCase().includes('registered')) {
              throw new Error('Bu e-posta zaten kayıtlı. Giriş yapmayı dene.');
            }
            throw new Error('Hesap oluşturulamadı. Bilgileri kontrol edip tekrar dene.');
          }

          if (!data.session) {
            throw new Error(
              'Hesabın oluşturuldu. E-posta doğrulaması açıksa gelen kutundaki bağlantıyı onayladıktan sonra giriş yap.',
            );
          }

          router.replace('/');
        }}
      />

      <View style={styles.inline}>
        <Text style={styles.muted}>Zaten hesabın var mı?</Text>
        <Link href="/(auth)/sign-in" style={styles.link}>
          Giriş yap
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  muted: { color: colors.inkMuted, fontSize: 14 },
  link: { color: colors.green, fontWeight: '800', fontSize: 14 },
});
