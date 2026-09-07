import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';

type Props = {
  title: string;
  description: string;
  tone?: 'neutral' | 'notice';
};

export function StateCard({ title, description, tone = 'neutral' }: Props) {
  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${description}`}
      style={[styles.card, tone === 'notice' && styles.notice]}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  notice: {
    backgroundColor: colors.peach,
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    color: colors.inkSoft,
    fontSize: 15,
    lineHeight: 22,
  },
});
