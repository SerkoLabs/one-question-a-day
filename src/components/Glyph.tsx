import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

type Props = {
  symbol: string;
  tone?: 'primary' | 'accent' | 'muted';
  size?: number;
};

/** A rounded tile holding a single emoji/symbol, used as a lightweight icon. */
export function Glyph({ symbol, tone = 'primary', size = 44 }: Props) {
  const theme = useTheme();
  const bg = tone === 'accent' ? theme.accentSoft : tone === 'muted' ? theme.surfaceMuted : theme.primarySoft;
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: theme.radius.md, backgroundColor: bg }]}>
      <Text style={{ fontSize: size * 0.5 }}>{symbol}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
});
