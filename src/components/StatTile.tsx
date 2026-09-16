import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useReducedMotion } from '@/theme/motion';
import { useTheme } from '@/theme/theme-provider';

type Props = {
  value: number;
  label: string;
  glyph?: string;
  tone?: 'surface' | 'primary' | 'accent';
  /** Count up from 0 to `value` on mount unless reduced motion is on. */
  animate?: boolean;
  suffix?: string;
};

export function StatTile({ value, label, glyph, tone = 'surface', animate = true, suffix }: Props) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const shouldAnimate = animate && !reduced;
  const [counted, setCounted] = useState(shouldAnimate ? 0 : value);
  const display = shouldAnimate ? counted : value;

  useEffect(() => {
    if (!shouldAnimate) return;
    const start = Date.now();
    const duration = 700;
    const timer = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setCounted(Math.round(eased * value));
      if (t >= 1) clearInterval(timer);
    }, 32);
    return () => clearInterval(timer);
  }, [value, shouldAnimate]);

  const bg = tone === 'primary' ? theme.primary : tone === 'accent' ? theme.accentSoft : theme.surface;
  const numberColor = tone === 'primary' ? theme.onAccent : tone === 'accent' ? theme.accentInk : theme.ink;
  const labelColor = tone === 'primary' ? theme.primarySoft : tone === 'accent' ? theme.accentInk : theme.inkMuted;
  const border = tone === 'surface' ? { borderWidth: 1, borderColor: theme.border } : null;

  return (
    <View
      accessible
      accessibilityLabel={`${value}${suffix ? ` ${suffix}` : ''} ${label}`}
      style={[styles.tile, border, { backgroundColor: bg, borderRadius: theme.radius.lg }]}
    >
      {glyph ? <Text style={styles.glyph}>{glyph}</Text> : null}
      <Text style={[styles.value, { color: numberColor }]}>
        {display}
        {suffix ? <Text style={[styles.suffix, { color: labelColor }]}>{suffix}</Text> : null}
      </Text>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minWidth: 96, padding: 18, gap: 2, alignItems: 'flex-start' },
  glyph: { fontSize: 22, marginBottom: 2 },
  value: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  suffix: { fontSize: 15, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', lineHeight: 17 },
});
