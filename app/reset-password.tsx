import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { StateCard } from '@/components/StateCard';
import { supabase } from '@/lib/supabase/client';
import { colors, radius, spacing } from '@/theme/tokens';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (password.length < 8) {
      setError('Yeni şifre en az 8 karakter olmalı.');
      return;
    }
    if (password !== confirmation) {
      setError('Şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        throw new Error('Şifre yenileme bağlantısı geçersiz veya süresi dolmuş olabilir.');
      }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.replace('/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Şifre güncellenemedi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      eyebrow="GÜVENLİK"
      title="Yeni şifreni belirle"
      description="Bu ekran yalnızca geçerli şifre yenileme bağlantısından açıldığında çalışır."
    >
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Yeni şifre</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="new-password"
          onChangeText={setPassword}
          placeholder="En az 8 karakter"
          placeholderTextColor={colors.inkMuted}
          secureTextEntry
          style={styles.input}
          value={password}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Yeni şifre tekrar</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="new-password"
          onChangeText={setConfirmation}
          placeholder="Şifreni tekrar gir"
          placeholderTextColor={colors.inkMuted}
          secureTextEntry
          style={styles.input}
          value={confirmation}
        />
      </View>
      {error ? <StateCard title="Şifre güncellenemedi" description={error} tone="notice" /> : null}
      <PrimaryButton label={busy ? 'Güncelleniyor…' : 'Şifreyi güncelle'} disabled={busy} onPress={submit} />
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
});
