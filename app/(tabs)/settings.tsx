import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Glyph, Screen, SectionTitle } from '@/components';
import { useLocalJournal } from '@/features/local/local-journal-provider';
import { useTheme, useThemeController, type ThemeMode } from '@/theme/theme-provider';

const APPEARANCE_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'Sistem' },
  { mode: 'light', label: 'Açık' },
  { mode: 'dark', label: 'Koyu' },
];

type InfoItem = { glyph: string; tone: 'primary' | 'accent'; label: string; value: string };

export default function SettingsScreen() {
  const theme = useTheme();
  const { mode, setMode } = useThemeController();
  const journal = useLocalJournal();

  const info: InfoItem[] = [
    { glyph: '🌍', tone: 'primary', label: 'Zaman dilimi', value: journal.state?.timezone ?? '—' },
    { glyph: '🗂️', tone: 'accent', label: 'Soru seti', value: journal.state?.questionSetVersion ?? '—' },
  ];

  return (
    <Screen eyebrow="YEREL ÖNİZLEME" title="Ayarlar">
      <SectionTitle title="Görünüm" />

      <Card tone="surface" entranceDelay={40}>
        <View style={[styles.segment, { backgroundColor: theme.surfaceMuted, borderRadius: theme.radius.md }]}>
          {APPEARANCE_OPTIONS.map((option) => {
            const selected = mode === option.mode;
            return (
              <Pressable
                key={option.mode}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected }}
                onPress={() => setMode(option.mode)}
                style={[
                  styles.segmentItem,
                  { borderRadius: theme.radius.sm },
                  selected && { backgroundColor: theme.primary, ...theme.shadow('sm') },
                ]}
              >
                <Text
                  style={[
                    theme.type.label,
                    styles.segmentLabel,
                    { color: selected ? theme.onAccent : theme.ink },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[theme.type.caption, { color: theme.inkMuted }]}>
          Sistemi seçersen cihaz teması takip edilir.
        </Text>
      </Card>

      {info.map((item, index) => (
        <Card key={item.label} tone="surface" entranceDelay={120 + index * 60} style={styles.infoCard}>
          <Glyph symbol={item.glyph} tone={item.tone} />
          <View style={styles.infoCopy}>
            <Text style={[theme.type.eyebrow, { color: theme.inkMuted }]}>{item.label.toUpperCase()}</Text>
            <Text style={[styles.infoValue, { color: theme.ink }]}>{item.value}</Text>
          </View>
        </Card>
      ))}

      <Card tone="surface" entranceDelay={240} style={styles.retentionCard}>
        <View style={styles.retentionHeader}>
          <Glyph symbol="🔒" tone="primary" />
          <Text style={[theme.type.title, styles.retentionTitle, { color: theme.ink }]}>Saklama sınırı</Text>
        </View>
        <Text style={[theme.type.body, { color: theme.inkSoft }]}>
          Onboarding, soru atamaları, taslaklar ve cevaplar cihazın güvenli yerel alanında tutulur. Ham günlük
          metni loglanmaz veya analitiğe gönderilmez.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', padding: 4, gap: 4 },
  segmentItem: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  segmentLabel: { fontWeight: '700' },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  infoCopy: { flex: 1, gap: 4 },
  infoValue: { fontSize: 17, fontWeight: '700' },
  retentionCard: { gap: 12 },
  retentionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  retentionTitle: { flex: 1 },
});
