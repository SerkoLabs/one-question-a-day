import type { PropsWithChildren, ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme/tokens';

type ScreenProps = PropsWithChildren<{
  title?: string;
  eyebrow?: string;
  description?: string;
  right?: ReactNode;
  scroll?: boolean;
}>;

export function Screen({
  children,
  title,
  eyebrow,
  description,
  right,
  scroll = true,
}: ScreenProps) {
  const content = (
    <View style={styles.content}>
      {(eyebrow || title || description || right) && (
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            {title ? (
              <Text accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
            ) : null}
            {description ? <Text style={styles.description}>{description}</Text> : null}
          </View>
          {right}
        </View>
      )}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
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
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.peachInk,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  description: {
    color: colors.inkSoft,
    fontSize: 15,
    lineHeight: 22,
  },
});
