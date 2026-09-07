import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function FoundationScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>ONE QUESTION A DAY</Text>
        </View>

        <View style={styles.hero}>
          <Text accessibilityRole="header" style={styles.title}>
            Her gün bir soru.{`\n`}Zaman içinde kendini gör.
          </Text>
          <Text style={styles.subtitle}>
            Küçük bir günlük alışkanlık. Aylar sonra kendi düşüncelerinin değişimini görebileceğin özel bir zaman çizelgesi.
          </Text>
        </View>

        <View style={styles.questionCard} accessible accessibilityLabel="Örnek günlük soru">
          <Text style={styles.eyebrow}>BUGÜNÜN SORUSU</Text>
          <Text style={styles.question}>
            Son zamanlarda hayatında değiştirmek isteyip de sürekli ertelediğin şey ne?
          </Text>
          <Text style={styles.note}>Uygulama temeli hazırlanıyor.</Text>
        </View>

        <Text style={styles.footer}>Özel • Yargısız • Teşhis koymaz</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F1E8',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#C9D8C7',
    backgroundColor: '#EEF4EC',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: {
    color: '#335846',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  hero: {
    gap: 16,
  },
  title: {
    color: '#173B2D',
    fontSize: 42,
    lineHeight: 47,
    fontWeight: '700',
    letterSpacing: -1.4,
  },
  subtitle: {
    color: '#596760',
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 560,
  },
  questionCard: {
    backgroundColor: '#FFFCF7',
    borderRadius: 28,
    padding: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E7DED1',
  },
  eyebrow: {
    color: '#A06E4B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  question: {
    color: '#26352E',
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '600',
  },
  note: {
    color: '#8B928D',
    fontSize: 13,
  },
  footer: {
    color: '#74827A',
    textAlign: 'center',
    fontSize: 13,
  },
});
