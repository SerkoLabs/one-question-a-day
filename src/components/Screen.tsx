import type { PropsWithChildren, ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

type ScreenProps = PropsWithChildren<{
  title?: string;
  eyebrow?: string;
  description?: string;
  right?: ReactNode;
  scroll?: boolean;
  /** Tint used for the eyebrow label; defaults to the playful accent ink. */
  eyebrowTone?: 'accent' | 'primary';
}>;

export function Screen({
  children,
  title,
  eyebrow,
  description,
  right,
  scroll = true,
  eyebrowTone = 'accent',
}: ScreenProps) {
  const theme = useTheme();
  const eyebrowColor = eyebrowTone === 'primary' ? theme.primary : theme.accentInk;

  const content = (
    <View style={styles.content}>
      {(eyebrow || title || description || right) && (
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            {eyebrow ? <Text style={[theme.type.eyebrow, { color: eyebrowColor }]}>{eyebrow}</Text> : null}
            {title ? (
              <Text accessibilityRole="header" style={[theme.type.h1, { color: theme.ink }]}>
                {title}
              </Text>
            ) : null}
            {description ? (
              <Text style={[theme.type.bodyLg, { color: theme.inkSoft }]}>{description}</Text>
            ) : null}
          </View>
          {right}
        </View>
      )}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 44, gap: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  headerCopy: { flex: 1, gap: 6 },
});
