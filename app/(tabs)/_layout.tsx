import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, type ColorValue, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLocalJournal } from '@/features/local/local-journal-provider';
import { useTheme } from '@/theme/theme-provider';

const TabIcon = ({ symbol, focused, color }: { symbol: string; focused: boolean; color: ColorValue }) => (
  <Text style={{ fontSize: 19, color, opacity: focused ? 1 : 0.55 }}>{symbol}</Text>
);

export default function TabLayout() {
  const theme = useTheme();
  const journal = useLocalJournal();

  if (journal.loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
          <Text style={[styles.text, { color: theme.inkSoft }]}>Bugün hazırlanıyor…</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (!journal.state?.onboardingComplete) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.inkMuted,
        tabBarStyle: {
          backgroundColor: theme.backgroundElevated,
          borderTopColor: theme.border,
          height: 74,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Bugün', tabBarIcon: ({ focused, color }) => <TabIcon symbol="✎" focused={focused} color={color} /> }}
      />
      <Tabs.Screen
        name="journey"
        options={{ title: 'Geçmiş', tabBarIcon: ({ focused, color }) => <TabIcon symbol="◷" focused={focused} color={color} /> }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: 'Yansıma', tabBarIcon: ({ focused, color }) => <TabIcon symbol="✦" focused={focused} color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Ayarlar', tabBarIcon: ({ focused, color }) => <TabIcon symbol="⚙" focused={focused} color={color} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  text: { fontSize: 15 },
});
