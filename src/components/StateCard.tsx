import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

type Tone = 'neutral' | 'notice' | 'success' | 'danger';

type Props = {
  title: string;
  description: string;
  tone?: Tone;
  glyph?: string;
};

export function StateCard({ title, description, tone = 'neutral', glyph }: Props) {
  const theme = useTheme();

  const surface =
    tone === 'notice' ? theme.accentSoft
      : tone === 'success' ? theme.successSoft
        : tone === 'danger' ? theme.dangerSoft
          : theme.surface;
  const titleColor =
    tone === 'notice' ? theme.accentInk
      : tone === 'success' ? theme.successInk
        : tone === 'danger' ? theme.dangerInk
          : theme.ink;
  const bodyColor = tone === 'neutral' ? theme.inkSoft : titleColor;
  const border = tone === 'neutral' ? { borderWidth: 1, borderColor: theme.border } : null;

  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${description}`}
      style={[styles.card, border, { backgroundColor: surface, borderRadius: theme.radius.lg }]}
    >
      <View style={styles.head}>
        {glyph ? <Text style={styles.glyph}>{glyph}</Text> : null}
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
      </View>
      <Text style={[styles.description, { color: bodyColor }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  glyph: { fontSize: 18 },
  title: { fontSize: 18, fontWeight: '800', flex: 1 },
  description: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
});
