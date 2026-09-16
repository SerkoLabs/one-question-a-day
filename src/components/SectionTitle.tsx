import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

type Props = {
  title: string;
  caption?: string;
  right?: ReactNode;
};

export function SectionTitle({ title, caption, right }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={[theme.type.h2, { color: theme.ink }]}>
          {title}
        </Text>
        {caption ? <Text style={[theme.type.body, { color: theme.inkMuted }]}>{caption}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  copy: { flex: 1, gap: 2 },
});
