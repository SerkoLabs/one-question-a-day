import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { PrimaryButton } from '@/components/PrimaryButton';
import { StateCard } from '@/components/StateCard';
import { colors, radius, spacing } from '@/theme/tokens';

const schema = z.object({
  email: z.string().trim().email('Geçerli bir e-posta adresi gir.'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı.'),
});

type Props = {
  submitLabel: string;
  onSubmit: (values: { email: string; password: string }) => Promise<void>;
};

export function CredentialsForm({ submitLabel, onSubmit }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Bilgileri kontrol et.');
      return;
    }

    setBusy(true);
    try {
      await onSubmit(parsed.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'İşlem tamamlanamadı. Tekrar dene.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.stack}>
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

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Şifre</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="password"
          onChangeText={setPassword}
          placeholder="En az 8 karakter"
          placeholderTextColor={colors.inkMuted}
          secureTextEntry
          style={styles.input}
          value={password}
        />
      </View>

      {error ? <StateCard tone="notice" title="İşlem tamamlanamadı" description={error} /> : null}
      <PrimaryButton label={busy ? 'Bekle…' : submitLabel} onPress={submit} disabled={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.lg },
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
