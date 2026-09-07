import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useSessionBootstrap } from '@/features/auth/session-provider';
import { colors } from '@/theme/tokens';

const icon = (symbol: string, focused: boolean) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{symbol}</Text>
);

export default function TabLayout() {
  const bootstrap = useSessionBootstrap();

  if (bootstrap.status === 'loading') {
    return (
      <SafeAreaView style={styles.loadingSafeArea}>
        <View style={styles.loadingBody}>
          <ActivityIndicator color={colors.green} />
          <Text style={styles.loadingText}>Yolculuğun hazırlanıyor…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (bootstrap.status === 'signed-out' || bootstrap.status === 'error') {
    return <Redirect href="/" />;
  }

  if (bootstrap.status === 'onboarding') {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 76,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Bugün', tabBarIcon: ({ focused }) => icon('◉', focused) }}
      />
      <Tabs.Screen
        name="journey"
        options={{ title: 'Yolculuğum', tabBarIcon: ({ focused }) => icon('◌', focused) }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: 'Raporlar', tabBarIcon: ({ focused }) => icon('▥', focused) }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Ayarlar', tabBarIcon: ({ focused }) => icon('⚙', focused) }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingSafeArea: { flex: 1, backgroundColor: colors.background },
  loadingBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.inkSoft, fontSize: 14 },
});
