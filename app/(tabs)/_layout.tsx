import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useLocalJournal } from '@/features/local/local-journal-provider';
import { colors } from '@/theme/tokens';

const icon = (symbol: string, focused: boolean) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{symbol}</Text>;

export default function TabLayout() {
  const journal = useLocalJournal();
  if (journal.loading) return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color={colors.green} /><Text style={styles.text}>Bugün hazırlanıyor…</Text></View></SafeAreaView>;
  if (!journal.state?.onboardingComplete) return <Redirect href="/" />;
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.green, tabBarInactiveTintColor: colors.inkMuted, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 72, paddingTop: 7, paddingBottom: 9 }, tabBarLabelStyle: { fontSize: 11, fontWeight: '700' } }}>
      <Tabs.Screen name="index" options={{ title: 'Bugün', tabBarIcon: ({ focused }) => icon('●', focused) }} />
      <Tabs.Screen name="journey" options={{ title: 'Geçmiş', tabBarIcon: ({ focused }) => icon('◷', focused) }} />
      <Tabs.Screen name="reports" options={{ title: 'Yansıma', tabBarIcon: ({ focused }) => icon('◌', focused) }} />
      <Tabs.Screen name="settings" options={{ title: 'Ayarlar', tabBarIcon: ({ focused }) => icon('⚙', focused) }} />
    </Tabs>
  );
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }, text: { color: colors.inkSoft } });
