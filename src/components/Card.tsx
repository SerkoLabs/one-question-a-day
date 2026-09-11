import type { PropsWithChildren, ReactNode } from 'react';
import { useState } from 'react';
import { Animated, Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { useEntrance, useReducedMotion } from '@/theme/motion';
import { useTheme } from '@/theme/theme-provider';

type Tone = 'surface' | 'muted' | 'primary' | 'accent';

type CardProps = PropsWithChildren<{
  tone?: Tone;
  padded?: boolean;
  bordered?: boolean;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  /** When set, the card fades/lifts in on mount, staggered by this delay (ms). */
  entranceDelay?: number;
}>;

function toneStyles(theme: ReturnType<typeof useTheme>, tone: Tone) {
  switch (tone) {
    case 'muted':
      return { backgroundColor: theme.surfaceMuted, borderColor: theme.border };
    case 'primary':
      return { backgroundColor: theme.primary, borderColor: theme.primary };
    case 'accent':
      return { backgroundColor: theme.accentSoft, borderColor: theme.accentSoft };
    default:
      return { backgroundColor: theme.surface, borderColor: theme.border };
  }
}

export function Card({
  children,
  tone = 'surface',
  padded = true,
  bordered = true,
  elevated = false,
  style,
  entranceDelay,
}: CardProps) {
  const theme = useTheme();
  const animate = entranceDelay !== undefined;
  const entrance = useEntrance(entranceDelay ?? 0);
  const base = [
    styles.card,
    padded && styles.padded,
    { borderRadius: theme.radius.lg, borderWidth: bordered ? 1 : 0, ...toneStyles(theme, tone) },
    elevated && theme.shadow('md'),
    style,
  ];

  if (!animate) return <View style={base}>{children}</View>;
  return (
    <Animated.View style={[base, { opacity: entrance.opacity, transform: [{ translateY: entrance.translateY }] }]}>
      {children}
    </Animated.View>
  );
}

type PressableCardProps = CardProps & {
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  right?: ReactNode;
};

export function PressableCard({
  onPress,
  accessibilityLabel,
  accessibilityHint,
  children,
  tone = 'surface',
  padded = true,
  bordered = true,
  elevated = false,
  style,
  entranceDelay,
}: PressableCardProps) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const scale = useState(() => new Animated.Value(1))[0];
  const entrance = useEntrance(entranceDelay ?? 0);

  const press = (to: number) => {
    if (reduced) return;
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 5 }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: entranceDelay !== undefined ? entrance.opacity : 1,
        transform: [
          { scale },
          ...(entranceDelay !== undefined ? [{ translateY: entrance.translateY }] : []),
        ],
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        onPressIn={() => press(0.98)}
        onPressOut={() => press(1)}
        style={({ pressed }) => [
          styles.card,
          padded && styles.padded,
          { borderRadius: theme.radius.lg, borderWidth: bordered ? 1 : 0, ...toneStyles(theme, tone) },
          elevated && theme.shadow('md'),
          pressed && { opacity: 0.92 },
          style,
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  padded: { padding: 20 },
});
