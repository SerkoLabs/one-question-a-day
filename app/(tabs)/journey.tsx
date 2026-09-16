import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CategoryChip, PressableCard, Screen, StateCard, StreakBadge } from '@/components';
import { computeStats, formatLongDate } from '@/features/journey/stats';
import { useLocalJournal } from '@/features/local/local-journal-provider';
import { QUESTIONS } from '@/features/local/questions';
import { useTheme } from '@/theme/theme-provider';

/** Question category lookup by id — the question set is static, so build once. */
const CATEGORY_BY_QUESTION = new Map(QUESTIONS.map((question) => [question.id, question.category] as const));

export default function HistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { history, today } = useLocalJournal();
  const stats = computeStats(history, today);

  return (
    <Screen eyebrow="SESSİZ ARŞİVİN" title="Geçmiş" description="Eski düşüncelerin burada, olduğu gibi kalır.">
      {stats.answeredCount > 0 ? (
        <StreakBadge count={stats.currentStreak} activeToday={stats.activeToday} />
      ) : null}

      {history.length === 0 ? (
        <StateCard
          glyph="🌱"
          title="İlk cevapla başlar"
          description="Bugünün sorusunu kaydettiğinde tarih, soru ve cevabın burada görünecek."
        />
      ) : (
        <View style={styles.list}>
          {history.map((item, index) => {
            const category = CATEGORY_BY_QUESTION.get(item.questionId);
            return (
              <PressableCard
                key={item.id}
                entranceDelay={Math.min(index, 6) * 70}
                accessibilityLabel={`${formatLongDate(item.localDate)} tarihli cevabı aç`}
                accessibilityHint="Bu güne ait cevabı açar"
                onPress={() =>
                  router.push({ pathname: '/entry/[responseId]', params: { responseId: item.id } })
                }
              >
                <Text style={[styles.date, { color: theme.accentInk }]}>
                  {formatLongDate(item.localDate)}
                </Text>
                {category ? <CategoryChip category={category} /> : null}
                <Text style={[theme.type.title, { color: theme.ink }]} numberOfLines={2}>
                  {item.questionText}
                </Text>
                <Text style={[theme.type.body, { color: theme.inkSoft }]} numberOfLines={3}>
                  {item.body}
                </Text>
              </PressableCard>
            );
          })}
        </View>
      )}

      <Text style={[styles.note, { color: theme.inkMuted }]}>
        Kaçırılan günler boş kalır. Geriye dönük baskı veya streak cezası yoktur.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 16 },
  date: { fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
  note: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
