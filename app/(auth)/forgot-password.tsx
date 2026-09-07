import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { StateCard } from '@/components/StateCard';
import { supabase } from '@/lib/supabase/client';
import { colors, radius, spacing } from '@/theme/tokens';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const submit = async () => {
    setMessage(null);
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) {
      setIsError(true);
      setMessage('Geçerli bir e-posta adresi gir.');
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: 'onequestionaday://reset-password',
      });
      if (error) throw error;
      setIsError(false);
      setMessage('Şifre yenileme bağlantısı gönderildiyse e-posta kutunda göreceksin.');
    } catch {
      setIsError(true);
      setMessage('Şifre yenileme isteği gönderilemedi. Biraz sonra tekrar dene.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      eyebrow="HESABINI GERİ AL"
      title="Şifreni yenile"
      description="Güvenlik nedeniyle bir e-posta adresinin kayıtlı olup olmadığını burada doğrulamayız."
    >
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>E-posta</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="sen@example.com"
          placeholderTextColor={colors.inkMuted}
          style={styles.input}
          value={email}
        />
      </View>

      {message ? (
        <StateCard title={isError ? 'İşlem tamamlanamadı' : 'E-postanı kontrol et'} description={message} tone={isError ? 'notice' : 'neutral'} />
      ) : null}

      <PrimaryButton label={busy ? 'Gönderiliyor…' : 'Bağlantı gönder'} disabled={busy} onPress={submit} />

      <Link href="/(auth)/sign-in" style={styles.link}>
        Giriş ekranına dön
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fieldGroup: { gap: spacing.sm },
  label: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  input: {
    minHeight: 54,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  link: { color: colors.green, fontWeight: '800', fontSize: 14, textAlign: 'center' },
});
