import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { useReducedMotion } from '@/theme/motion';
import { useTheme } from '@/theme/theme-provider';

/** A check mark that springs into a circle on mount. Used to confirm a save. */
export function SuccessCheck({ size = 34 }: { size?: number }) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const scale = useState(() => new Animated.Value(reduced ? 1 : 0))[0];

  useEffect(() => {
    if (reduced) return;
    const animation = Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 12,
      bounciness: 10,
    });
    animation.start();
    return () => animation.stop();
  }, [reduced, scale]);

  return (
    <Animated.View
      style={[
        styles.check,
        { width: size, height: size, borderRadius: size, backgroundColor: theme.success, transform: [{ scale }] },
      ]}
    >
      <Text style={[styles.checkGlyph, { color: theme.onAccent, fontSize: size * 0.55 }]}>✓</Text>
    </Animated.View>
  );
}

type Particle = { left: number; hue: string; delay: number; drift: number; rotate: number };

/**
 * Lightweight confetti overlay. Plays once when `show` becomes true and stays
 * out of the way (pointerEvents none). Skipped entirely under reduced motion.
 */
export function Celebrate({ show }: { show: boolean }) {
  const reduced = useReducedMotion();
  const theme = useTheme();
  const progress = useState(() => new Animated.Value(0))[0];

  const particles = useMemo<Particle[]>(() => {
    const hues = [theme.accent, theme.primary, theme.success, theme.accentInk];
    return Array.from({ length: 14 }, (_, i) => ({
      left: 6 + (i / 14) * 88 + (i % 2 ? 3 : -3),
      hue: hues[i % hues.length] ?? theme.accent,
      delay: (i % 5) * 60,
      drift: i % 2 ? 24 : -20,
      rotate: (i % 3) - 1,
    }));
  }, [theme]);

  useEffect(() => {
    if (!show || reduced) return;
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [show, reduced, progress]);

  if (!show || reduced) return null;

  return (
    <View pointerEvents="none" style={styles.confetti}>
      {particles.map((particle, index) => {
        const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-10, 220] });
        const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, particle.drift] });
        const opacity = progress.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] });
        const rotate = progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${particle.rotate * 220}deg`],
        });
        return (
          <Animated.View
            key={index}
            style={[
              styles.piece,
              {
                left: `${particle.left}%`,
                backgroundColor: particle.hue,
                opacity,
                transform: [{ translateY }, { translateX }, { rotate }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  check: { alignItems: 'center', justifyContent: 'center' },
  checkGlyph: { fontWeight: '900' },
  confetti: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'flex-start', overflow: 'hidden' },
  piece: { position: 'absolute', top: 0, width: 9, height: 14, borderRadius: 2 },
});
