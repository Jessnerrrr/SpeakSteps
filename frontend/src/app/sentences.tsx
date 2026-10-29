import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { sentences } from '../data/sentences';
import type { Language, Position, Sentence } from '../types/sentences';
import { POSITIONS } from '../types/sentences';

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
  onSelect,
}: {
  sentence: Sentence;
  onSelect: (s: Sentence) => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onSelect(sentence)}>
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
    SourGummy: require('../../assets/fonts/SourGummy.ttf'),
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sentences</Text>
        </View>

        <LanguageToggle value={language} onChange={setLanguage} />
        <PositionTabs value={position} onChange={setPosition} />

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <SentenceCard sentence={item} onSelect={handleSelect} />
          )}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#0865AD',
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
  headerTitle: { fontFamily: 'SourGummy', color: '#fff', fontSize: 20 },

  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E8F4FB',
    margin: 16,
    borderRadius: 25,
    padding: 4,
  },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#0865AD' },
  toggleText: { fontFamily: 'SourGummy', color: '#0865AD', fontSize: 14 },
  toggleTextActive: { color: '#fff' },

  tabRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#E8F4FB',
  },
  tabActive: { backgroundColor: '#FFB923' },
  tabText: { fontFamily: 'SourGummy', color: '#0865AD', fontSize: 13 },
  tabTextActive: { color: '#fff' },

  grid: { paddingHorizontal: 16, paddingBottom: 20 },
  gridRow: { justifyContent: 'space-between', marginBottom: 14 },

  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CBE6F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardInner: { marginBottom: 8 },
  cardSound: { fontFamily: 'SourGummy', fontSize: 22, color: '#0865AD' },
  cardSyllable: { fontFamily: 'SourGummy', fontSize: 14, color: '#555', marginTop: 2 },

  starRow: { flexDirection: 'row', gap: 2 },
  starFilled: { color: '#FFB923', fontSize: 16 },
  starEmpty: { color: '#DDD', fontSize: 16 },
});
