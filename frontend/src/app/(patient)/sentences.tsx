import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// Fixed paths: only go up two levels to reach data and types from app/patient
import { sentences } from '../../data/sentences';
import type { Language, Position, Sentence } from '../../types/sentences';
import { POSITIONS } from '../../types/sentences';

// ─── Language Toggle ──────────────────────────────────────────────────────────
function LanguageToggle({
  value,
  onChange,
}: {
  value: Language;
  onChange: (l: Language) => void;
}) {
  const langs: Language[] = ['English', 'Tagalog'];
  return (
    <View style={styles.toggleRow}>
      {langs.map((l) => (
        <TouchableOpacity
          key={l}
          style={[styles.toggleBtn, value === l && styles.toggleBtnActive]}
          onPress={() => onChange(l)}
        >
          <Text style={[styles.toggleText, value === l && styles.toggleTextActive]}>
            {l}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Position Tabs ────────────────────────────────────────────────────────────
function PositionTabs({
  value,
  onChange,
}: {
  value: Position;
  onChange: (p: Position) => void;
}) {
  return (
    <View style={styles.tabRow}>
      {POSITIONS.map((p) => (
        <TouchableOpacity
          key={p}
          style={[styles.tab, value === p && styles.tabActive]}
          onPress={() => onChange(p)}
        >
          <Text style={[styles.tabText, value === p && styles.tabTextActive]}>
            {p}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ stars }: { stars: 0 | 1 | 2 | 3 }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3].map((i) => (
        <Text key={i} style={i <= stars ? styles.starFilled : styles.starEmpty}>
          ★
        </Text>
      ))}
    </View>
  );
}

// ─── Sentence Card ────────────────────────────────────────────────────────────
function SentenceCard({
  sentence,
  index,
  onSelect,
}: {
  sentence: Sentence;
  index: number;
  onSelect: (s: Sentence) => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onSelect(sentence)}>
      <View style={styles.cardTopline}>
        <Text style={styles.cardNumber}>{String(index + 1).padStart(2, '0')}</Text>
        <Text style={styles.cardAction}>PRACTICE</Text>
      </View>
      <View style={styles.cardInner}>
        <Text style={styles.cardSound}>{sentence.sound}</Text>
        <Text style={styles.cardSyllable}>{sentence.syllable}</Text>
      </View>
      <StarRating stars={sentence.stars} />
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SentencesScreen() {
  const [language, setLanguage] = useState<Language>('English');
  const [position, setPosition] = useState<Position>('Initial');

  const [fontsLoaded] = useFonts({
    SourGummy: require('../../../assets/SourGummy.ttf'), // Font path requires three levels up from app/patient
  });
  
  if (!fontsLoaded) return null;

  const items = sentences[language][position];

  const handleSelect = (sentence: Sentence) => {
    router.push({
      pathname: '/practice',
      params: {
        sentenceId: sentence.id,
        sound: sentence.sound,
        syllable: sentence.syllable,
        stars: sentence.stars,
        position,
      },
    } as any);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.eyebrow}>SPEECH PRACTICE</Text>
              <Text style={styles.headerTitle}>Sentence library</Text>
            </View>
          </View>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          ListHeaderComponent={
            <View style={styles.contentHeader}>
              <Text style={styles.pageTitle}>Choose a sound to practice</Text>
              <Text style={styles.pageSubtitle}>
                Build confidence one clear sentence at a time.
              </Text>
              <Text style={styles.controlLabel}>Language</Text>
              <LanguageToggle value={language} onChange={setLanguage} />
              <View style={styles.positionHeading}>
                <Text style={styles.controlLabel}>Sound position</Text>
                <Text style={styles.promptCount}>{items.length} prompts</Text>
              </View>
              <PositionTabs value={position} onChange={setPosition} />
            </View>
          }
          renderItem={({ item, index }) => (
            <SentenceCard sentence={item} index={index} onSelect={handleSelect} />
          )}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    backgroundColor: '#0865AD',
    paddingTop: 56,
    paddingBottom: 22,
  },
  headerContent: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  backIcon: { color: '#fff', fontSize: 22, lineHeight: 26, fontWeight: 'bold' },
  eyebrow: {
    color: '#FFB923',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  headerTitle: { fontFamily: 'SourGummy', color: '#fff', fontSize: 25 },

  contentHeader: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingTop: 28,
    paddingHorizontal: 20,
  },
  pageTitle: {
    color: '#0865AD',
    fontFamily: 'SourGummy',
    fontSize: 27,
    lineHeight: 32,
    marginBottom: 8,
  },
  pageSubtitle: { color: '#666', fontSize: 14, marginBottom: 22 },
  controlLabel: {
    color: '#0865AD',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  positionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  promptCount: { color: '#999', fontSize: 12, marginBottom: 8 },

  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E8F4FB',
    borderRadius: 12,
    padding: 3,
    marginBottom: 22,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#0865AD' },
  toggleText: { fontFamily: 'SourGummy', color: '#0865AD', fontSize: 14 },
  toggleTextActive: { color: '#fff' },

  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#E8F4FB',
  },
  tabActive: { backgroundColor: '#FFB923' },
  tabText: { fontFamily: 'SourGummy', color: '#0865AD', fontSize: 13 },
  tabTextActive: { color: '#fff' },

  grid: { paddingHorizontal: 16, paddingBottom: 30 },
  gridRow: { justifyContent: 'space-between', marginBottom: 14 },

  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#CBE6F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
  },
  cardTopline: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  cardNumber: { color: '#9AA4AA', fontSize: 11, fontWeight: '700' },
  cardAction: { color: '#0865AD', fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  cardInner: { marginBottom: 18 },
  cardSound: { fontFamily: 'SourGummy', fontSize: 28, color: '#0865AD' },
  cardSyllable: { fontFamily: 'SourGummy', fontSize: 16, color: '#555', marginTop: 3 },

  starRow: { flexDirection: 'row', gap: 2 },
  starFilled: { color: '#FFB923', fontSize: 16 },
  starEmpty: { color: '#DDD', fontSize: 16 },
});