import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useReducedMotion } from '@/theme/motion';
import { useTheme } from '@/theme/theme-provider';

type Props = {
  /** 0..1 */
  value: number;
  tone?: 'primary' | 'accent';
  height?: number;
  accessibilityLabel?: string;
};

export function ProgressBar({ value, tone = 'primary', height = 12, accessibilityLabel }: Props) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const progress = useState(() => new Animated.Value(reduced ? clamped : 0))[0];

  useEffect(() => {
    if (reduced) {
      progress.setValue(clamped);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: clamped,
      duration: 620,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [clamped, reduced, progress]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const fill = tone === 'accent' ? theme.accent : theme.primary;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[styles.track, { height, borderRadius: height, backgroundColor: theme.surfaceStrong }]}
    >
      <Animated.View style={[styles.fill, { width, borderRadius: height, backgroundColor: fill }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden', width: '100%' },
  fill: { height: '100%' },
});
