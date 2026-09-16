import { StyleSheet, Text, View } from 'react-native';

import { Card, CategoryChip, ProgressBar, Screen, SectionTitle, StatTile, StateCard } from '@/components';
import { calendarMonth, categoryBreakdown, computeStats, recentDays } from '@/features/journey/stats';
import { useLocalJournal } from '@/features/local/local-journal-provider';
import { useTheme } from '@/theme/theme-provider';

const HEADER = {
  eyebrow: 'GÖRÜNÜR DEĞİŞİM',
  title: 'Yansımalar',
  description: 'Zaman içindeki emeğin, kanıtlarıyla.',
} as const;

const NOTICE = {
  glyph: '🤍',
  title: 'Yapay zekâ yorumu yok',
  description:
    'Bu önizleme cevaplarını analiz etmez. İleride raporlar gözlemi olası çıkarımdan ayıracak; psikolojik teşhis, risk skoru veya kesin kişilik hükmü sunmayacak.',
} as const;

export default function ReflectionScreen() {
  const theme = useTheme();
  const { history, today } = useLocalJournal();

  // `today` is null only during the first load pass.
  if (!today) {
    return (
      <Screen eyebrow={HEADER.eyebrow} title={HEADER.title} description={HEADER.description}>
        <Text style={[theme.type.body, { color: theme.inkMuted }]}>Günlüğün yükleniyor…</Text>
      </Screen>
    );
  }

  const stats = computeStats(history, today);

  if (stats.answeredCount === 0) {
    return (
      <Screen eyebrow={HEADER.eyebrow} title={HEADER.title} description={HEADER.description}>
        <StateCard
          glyph="🌱"
          title="Henüz yansıtacak bir şey yok"
          description="Bugünün sorusunu cevapla; buradaki grafikler ilk günden başlayarak yavaşça dolmaya başlar."
        />
        <StateCard tone="notice" glyph={NOTICE.glyph} title={NOTICE.title} description={NOTICE.description} />
      </Screen>
    );
  }

  const recent = recentDays(history, today, 14);
  const answeredIn14 = recent.filter((day) => day.answered).length;
  const month = calendarMonth(history, today);
  const monthAnswered = month.weeks
    .flat()
    .filter((cell): cell is Extract<typeof cell, { inMonth: true }> => cell.inMonth && cell.answered).length;
  const slices = categoryBreakdown(history);

  return (
    <Screen eyebrow={HEADER.eyebrow} title={HEADER.title} description={HEADER.description}>
      {/* Truthful, non-punitive tallies derived purely from answered days. */}
      <View style={styles.statRow}>
        <StatTile value={stats.answeredCount} label="cevaplanan gün" tone="primary" />
        <StatTile value={stats.currentStreak} label="günlük seri" tone="accent" glyph="🔥" />
        <StatTile value={stats.longestStreak} label="en uzun seri" glyph="🌟" />
      </View>

      <Card tone="surface" entranceDelay={60} style={styles.section}>
        <SectionTitle title="Son 14 gün" caption="Küçük kareler, gerçek günler." />
        <View
          accessible
          accessibilityLabel={`Son 14 günün ${answeredIn14}'i cevaplandı.`}
          style={styles.strip}
        >
          {recent.map((day) => {
            const bg = day.answered ? theme.primary : theme.surfaceStrong;
            return (
              <View
                key={day.date}
                style={[
                  styles.stripCell,
                  {
                    backgroundColor: bg,
                    borderRadius: theme.radius.xs,
                    borderColor: day.isToday ? theme.accent : bg,
                  },
                ]}
              />
            );
          })}
        </View>
      </Card>

      <Card tone="surface" entranceDelay={120} style={styles.section}>
        <SectionTitle title={month.title} caption="Bu ay yazdığın günler işaretli." />
        <View accessibilityLabel={`${month.title} ayında ${monthAnswered} gün cevaplandı.`} style={styles.calGrid}>
          <View style={styles.calRow}>
            {month.weekdayHeaders.map((header) => (
              <View key={header} style={styles.calHeadCell}>
                <Text style={[styles.calHead, { color: theme.inkMuted }]}>{header}</Text>
              </View>
            ))}
          </View>
          {month.weeks.map((week, weekIndex) => (
            <View key={`week-${weekIndex}`} style={styles.calRow}>
              {week.map((cell, cellIndex) => {
                if (!cell.inMonth) {
                  return <View key={`spacer-${weekIndex}-${cellIndex}`} style={styles.calCell} />;
                }
                const bg = cell.answered ? theme.primary : theme.surfaceMuted;
                const fg = cell.answered ? theme.onAccent : theme.inkMuted;
                return (
                  <View
                    key={cell.date}
                    style={[
                      styles.calCell,
                      styles.calCellFilled,
                      {
                        backgroundColor: bg,
                        borderRadius: theme.radius.sm,
                        borderColor: cell.isToday ? theme.accent : bg,
                      },
                    ]}
                  >
                    <Text style={[styles.calDay, { color: fg }]}>{cell.label}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </Card>

      <Card tone="surface" entranceDelay={180} style={styles.section}>
        <SectionTitle title="Hangi temalara döndün?" caption="En çok döndüğün temalar önde." />
        <View style={styles.themeList}>
          {slices.map((slice) => (
            <View key={slice.key} style={styles.themeRow}>
              <CategoryChip category={slice.key} />
              <View style={styles.themeBar}>
                <ProgressBar
                  value={slice.ratio}
                  tone="accent"
                  accessibilityLabel={`${slice.label}: ${slice.count} cevap`}
                />
              </View>
              <Text style={[styles.themeCount, { color: theme.inkMuted }]}>{slice.count}</Text>
            </View>
          ))}
        </View>
      </Card>

      <StateCard tone="notice" glyph={NOTICE.glyph} title={NOTICE.title} description={NOTICE.description} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  statRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  section: { gap: 16 },

  strip: { flexDirection: 'row', gap: 5 },
  stripCell: { flex: 1, aspectRatio: 1, borderWidth: 2 },

  calGrid: { gap: 6 },
  calRow: { flexDirection: 'row', gap: 6 },
  calHeadCell: { flex: 1, alignItems: 'center' },
  calHead: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
  calCell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calCellFilled: { borderWidth: 2 },
  calDay: { fontSize: 13, fontWeight: '700' },

  themeList: { gap: 14 },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  themeBar: { flex: 1 },
  themeCount: { fontSize: 15, fontWeight: '800', minWidth: 24, textAlign: 'right' },
});
