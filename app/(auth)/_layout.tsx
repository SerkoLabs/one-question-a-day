import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';

import { useSessionBootstrap } from '@/features/auth/session-provider';
import { colors } from '@/theme/tokens';

export default function AuthLayout() {
  const bootstrap = useSessionBootstrap();

  if (bootstrap.status === 'loading') {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={colors.green} />
      </SafeAreaView>
    );
  }

  if (bootstrap.status === 'ready') return <Redirect href="/(tabs)" />;
  if (bootstrap.status === 'onboarding') return <Redirect href="/onboarding" />;
  if (bootstrap.status === 'error' && bootstrap.session) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
