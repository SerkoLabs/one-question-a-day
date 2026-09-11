import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

type Props = {
  count: number;
  activeToday: boolean;
};

/**
 * Positive, non-punitive run indicator. Framed as momentum you have built, not
 * something about to be lost.
 */
export function StreakBadge({ count, activeToday }: Props) {
  const theme = useTheme();
  const caption =
    count === 0
      ? 'Bugün başlamak için güzel bir gün.'
      : activeToday
        ? 'Bugün de buradasın. Güzel gidiyor.'
        : 'Dün buradaydın. İstersen bugün de sürdür.';

  return (
    <View
      accessible
      accessibilityLabel={`${count} günlük seri. ${caption}`}
      style={[styles.wrap, { backgroundColor: theme.accentSoft, borderRadius: theme.radius.lg }]}
    >
      <View style={[styles.flameWrap, { backgroundColor: theme.surface, borderRadius: theme.radius.md }]}>
        <Text style={styles.flame}>{count > 0 ? '🔥' : '🌱'}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={[styles.count, { color: theme.accentInk }]}>
          {count}
          <Text style={[styles.unit, { color: theme.accentInk }]}> günlük seri</Text>
        </Text>
        <Text style={[styles.caption, { color: theme.accentInk }]}>{caption}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  flameWrap: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  flame: { fontSize: 26 },
  copy: { flex: 1, gap: 2 },
  count: { fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },
  unit: { fontSize: 15, fontWeight: '700' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '600', opacity: 0.9 },
});
