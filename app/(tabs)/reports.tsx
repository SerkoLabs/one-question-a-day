import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { StateCard } from '@/components/StateCard';
import { useLocalJournal } from '@/features/local/local-journal-provider';
import { colors, radius, spacing } from '@/theme/tokens';

export default function ReflectionScreen() {
  const { history } = useLocalJournal();
  return <Screen eyebrow="GELECEKTE" title="Yansımalar" description="Yeterli zaman ve açık onay olmadan senin hakkında yorum üretmeyiz.">
    <View style={styles.card}><Text style={styles.count}>{history.length}</Text><Text style={styles.label}>günlük cevap</Text></View>
    <StateCard title="Henüz bir rapor yok" description="Bu önizleme yapay zekâ analizi yapmaz. Gelecekteki raporlar gözlemi olası çıkarımdan ayıracak ve psikolojik teşhis sunmayacak." tone="notice" />
  </Screen>;
}
const styles = StyleSheet.create({ card: { backgroundColor: colors.green, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' }, count: { color: '#fff', fontSize: 42, fontWeight: '800' }, label: { color: '#DDECE4', fontSize: 14 } });
