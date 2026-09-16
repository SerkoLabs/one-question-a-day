import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

import { useReducedMotion } from '@/theme/motion';
import { useTheme } from '@/theme/theme-provider';

type Tone = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = ComponentProps<typeof Pressable> & {
  label: string;
  tone?: Tone;
  /** Optional leading glyph (emoji or short symbol). */
  glyph?: string;
};

export function PrimaryButton({ label, tone = 'primary', glyph, disabled, ...props }: Props) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const scale = useState(() => new Animated.Value(1))[0];

  const press = (to: number) => {
    if (reduced) return;
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };

  const bg =
    tone === 'primary' ? theme.primary
      : tone === 'danger' ? theme.dangerSoft
        : tone === 'secondary' ? theme.surface
          : 'transparent';
  const borderColor =
    tone === 'primary' ? theme.primary
      : tone === 'danger' ? theme.dangerSoft
        : tone === 'ghost' ? 'transparent'
          : theme.borderStrong;
  const labelColor =
    tone === 'primary' ? theme.onAccent
      : tone === 'danger' ? theme.dangerInk
        : tone === 'ghost' ? theme.primary
          : theme.ink;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: Boolean(disabled) }}
        disabled={disabled}
        onPressIn={() => press(0.97)}
        onPressOut={() => press(1)}
        style={({ pressed }) => [
          styles.base,
          tone === 'primary' && theme.shadow('sm'),
          { backgroundColor: bg, borderColor },
          pressed && { opacity: 0.9 },
          disabled && styles.disabled,
        ]}
        {...props}
      >
        {glyph ? <Text style={[styles.glyph, { color: labelColor }]}>{glyph}</Text> : null}
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: 999,
    paddingHorizontal: 24,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  disabled: { opacity: 0.45 },
  glyph: { fontSize: 18 },
  label: { fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
});
