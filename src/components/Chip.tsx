import { StyleSheet, Text, View } from 'react-native';

import { useThemeController } from '@/theme/theme-provider';
import { categoryColors, categoryLabel } from '@/theme/tokens';

type ChipProps = {
  label: string;
  bg?: string;
  ink?: string;
  glyph?: string;
};

export function Chip({ label, bg, ink, glyph }: ChipProps) {
  const { theme } = useThemeController();
  return (
    <View style={[styles.chip, { backgroundColor: bg ?? theme.surfaceMuted }]}>
      {glyph ? <Text style={[styles.glyph, { color: ink ?? theme.inkSoft }]}>{glyph}</Text> : null}
      <Text style={[styles.label, { color: ink ?? theme.inkSoft }]}>{label}</Text>
    </View>
  );
}

/** Chip coloured by question category, respecting the active scheme. */
export function CategoryChip({ category, depth }: { category: string; depth?: number }) {
  const { scheme } = useThemeController();
  const { bg, ink } = categoryColors(category, scheme);
  const label = depth ? `${categoryLabel(category)} · derinlik ${depth}` : categoryLabel(category);
  return <Chip label={label} bg={bg} ink={ink} />;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  glyph: { fontSize: 13 },
  label: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
});
