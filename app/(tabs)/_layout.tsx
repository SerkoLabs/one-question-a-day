import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { colors } from '@/theme/tokens';

const icon = (symbol: string, focused: boolean) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{symbol}</Text>
);

export default function TabLayout() {
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
