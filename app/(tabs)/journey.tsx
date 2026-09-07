import { Link } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { StateCard } from '@/components/StateCard';
import { useSessionBootstrap } from '@/features/auth/session-provider';
import { fetchJourneyResponses } from '@/features/journey/journey-api';
import { fetchTodayState } from '@/features/today/today-api';
import { colors, radius, spacing } from '@/theme/tokens';

export default function JourneyScreen() {
  const bootstrap = useSessionBootstrap();
  const userId = bootstrap.status === 'ready' ? bootstrap.session.user.id : '';

  const historyQuery = useQuery({
    queryKey: ['journey', userId],
    queryFn: fetchJourneyResponses,
    enabled: Boolean(userId),
  });

  const todayQuery = useQuery({
    queryKey: ['today', userId],
    queryFn: fetchTodayState,
    enabled: Boolean(userId),
  });

  const answeredCount = historyQuery.data?.length ?? 0;
  const elapsedDays = Math.max(todayQuery.data?.journey_day ?? 1, 1);
  const progressPercent = Math.min(100, (answeredCount / 365) * 100);

  return (
    <Screen
      eyebrow="ZAMAN ÇİZGİN"
      title="Benim Yolculuğum"
      description="Cevapların biriktikçe değişim burada görünür olacak."
    >
      <View style={styles.progressCard}>
        <Text style={styles.progressNumber}>{answeredCount} / 365</Text>
        <Text style={styles.progressLabel}>Bu yıl kendin için durduğun günler</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.progressMeta}>Yolculuğun {Math.min(elapsedDays, 365)}. günü</Text>
      </View>

      {historyQuery.isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.green} />
          <Text style={styles.muted}>Geçmiş cevapların yükleniyor…</Text>
        </View>
      ) : null}

      {historyQuery.isError ? (
        <View style={styles.errorStack}>
          <StateCard
            title="Geçmiş cevaplar yüklenemedi"
            description="Bugünün sorusunu kullanmaya devam edebilirsin. Geçmişi yeniden yüklemek için tekrar dene."
            tone="notice"
          />
          <PrimaryButton label="Tekrar dene" onPress={() => historyQuery.refetch()} />
        </View>
      ) : null}

      {!historyQuery.isLoading && !historyQuery.isError && answeredCount === 0 ? (
        <StateCard
          title="İlk cevapla başlar"
          description="Henüz kaydedilmiş bir cevabın yok. İlk sorunu cevapladığında burada tarihini ve yolculuk gününü göreceksin."
        />
      ) : null}

      {historyQuery.data?.length ? (
        <View style={styles.list}>
          <Text style={styles.sectionTitle}>Son cevapların</Text>
          {historyQuery.data.map((item) => (
            <Link
              key={item.id}
              href={{ pathname: '/entry/[responseId]', params: { responseId: item.id } }}
              style={styles.entryLink}
              accessibilityRole="button"
            >
              <View style={styles.entryRow}>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayNumber}>{item.journey_day}</Text>
                  <Text style={styles.dayLabel}>gün</Text>
                </View>
                <View style={styles.entryCopy}>
                  <Text style={styles.entryDate}>{item.local_date}</Text>
                  <Text style={styles.entryMeta}>Cevabı aç • revizyon {item.source_revision}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </Link>
          ))}
        </View>
      ) : null}

      <StateCard
        tone="notice"
        title="Kaçırılan günler sorun değil"
        description="Bu ürün streak kaybıyla cezalandırmaz. Geçmiş bir güne sonradan cevap eklemek yerine bugün devam edersin."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressCard: {
    backgroundColor: colors.green,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  progressNumber: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  progressLabel: { color: '#DDECE4', fontSize: 14, lineHeight: 20 },
  progressMeta: { color: '#BFD5C9', fontSize: 12 },
  progressTrack: { height: 8, backgroundColor: '#FFFFFF33', borderRadius: radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: radius.pill },
  loadingRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  errorStack: { gap: spacing.md },
  muted: { color: colors.inkMuted, fontSize: 13 },
  list: { gap: spacing.sm },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginBottom: spacing.xs },
  entryLink: { borderRadius: radius.md, overflow: 'hidden' },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  dayBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: { color: colors.green, fontSize: 17, fontWeight: '800' },
  dayLabel: { color: colors.inkMuted, fontSize: 9, fontWeight: '700' },
  entryCopy: { flex: 1, gap: 4 },
  entryDate: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  entryMeta: { color: colors.inkMuted, fontSize: 12 },
  chevron: { color: colors.inkMuted, fontSize: 26 },
});
