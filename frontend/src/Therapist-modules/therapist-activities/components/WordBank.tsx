import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { FilterIcon, PencilIcon, SearchIcon, TrashIcon } from '@/components/therapist/icons';
import { useTherapist } from '@/components/therapist/TherapistProvider';
import { FieldMenu } from '@/Therapist-modules/therapist-activities/components/FieldMenu';
import {
  activityLanguages,
  targetSounds,
  wordPositions,
  type TargetSound,
  type WordPosition,
} from '@/Therapist-modules/therapist-activities/data/activityData';
import { useActivities } from '@/Therapist-modules/therapist-activities/state/ActivitiesProvider';

type Chip = { key: string; label: string; clear: () => void };

export function WordBank({ onOpenLibrary }: { onOpenLibrary: () => void }) {
  const { palette } = useTherapist();
  const { wordBank, addBankWord, removeBankWord } = useActivities();
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sounds, setSounds] = useState<TargetSound[]>(['/r/', '/s/']);
  const [positions, setPositions] = useState<WordPosition[]>(['Initial']);
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [word, setWord] = useState('');
  const [sound, setSound] = useState<TargetSound>('/r/');
  const [position, setPosition] = useState<WordPosition>('Initial');
  const [language, setLanguage] = useState<string>('English');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return wordBank.filter((item) => {
      if (sounds.length > 0 && !sounds.includes(item.sound)) return false;
      if (positions.length > 0 && !positions.includes(item.position)) return false;
      if (languages.length > 0 && !languages.includes(item.language)) return false;
      if (!needle) return true;
      return item.text.toLowerCase().includes(needle);
    });
  }, [languages, positions, query, sounds, wordBank]);

  const chips: Chip[] = [
    ...sounds.map((item) => ({
      key: `sound-${item}`,
      label: item,
      clear: () => setSounds((current) => current.filter((value) => value !== item)),
    })),
    ...positions.map((item) => ({
      key: `position-${item}`,
      label: item,
      clear: () => setPositions((current) => current.filter((value) => value !== item)),
    })),
    ...languages.map((item) => ({
      key: `language-${item}`,
      label: item,
      clear: () => setLanguages((current) => current.filter((value) => value !== item)),
    })),
  ];

  const toggle = <T extends string>(value: T, selected: T[], setSelected: (next: T[]) => void) => {
    setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  const save = () => {
    const text = word.trim().toLowerCase();
    if (!text) return;
    addBankWord({ id: `bank-${Date.now()}`, text, sound, position, language });
    setWord('');
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={[styles.kicker, { color: palette.faint }]}>PURPOSEFUL PRACTICE</Text>
      <Text style={[styles.title, { color: palette.primary }]}>The word bank.</Text>
      <Text style={[styles.subtitle, { color: palette.muted }]}>Reusable targets organized by sound, position and language.</Text>

      <View style={[styles.sectionTabs, { borderBottomColor: palette.line }]}>
        <Pressable accessibilityRole="button" onPress={onOpenLibrary}>
          <Text style={[styles.sectionTab, { color: palette.faint }]}>Activity Library</Text>
        </Pressable>
        <Text style={[styles.sectionTab, styles.sectionTabOn, { color: palette.primary, borderBottomColor: palette.primary }]}>
          Word Bank ({wordBank.length})
        </Text>
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.search, { borderColor: palette.line, backgroundColor: palette.card }]}>
          <SearchIcon color={palette.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search for a specific word..."
            placeholderTextColor={palette.faint}
            style={[styles.searchInput, { color: palette.text }]}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setAdding((current) => !current);
            setEditing(false);
          }}
          style={[styles.add, { backgroundColor: palette.primary }]}
        >
          <Text style={styles.addText}>+ Add a word</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filter word bank"
          onPress={() => setFiltersOpen((current) => !current)}
          style={[styles.filterButton, { borderColor: palette.line, backgroundColor: palette.card }]}
        >
          <FilterIcon color={palette.text} />
        </Pressable>
      </View>

      {filtersOpen ? (
        <View style={[styles.filterPanel, { borderColor: palette.line, backgroundColor: palette.card }]}>
          <Text style={[styles.filterLabel, { color: palette.muted }]}>Sound</Text>
          <View style={styles.choiceRow}>
            {targetSounds.map((item) => (
              <Pressable key={item} accessibilityRole="button" onPress={() => toggle(item, sounds, setSounds)} style={[styles.choice, sounds.includes(item) && styles.choiceOn]}>
                <Text style={[styles.choiceText, sounds.includes(item) && styles.choiceTextOn]}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.filterLabel, { color: palette.muted }]}>Position</Text>
          <View style={styles.choiceRow}>
            {wordPositions.map((item) => (
              <Pressable key={item} accessibilityRole="button" onPress={() => toggle(item, positions, setPositions)} style={[styles.choice, positions.includes(item) && styles.choiceOn]}>
                <Text style={[styles.choiceText, positions.includes(item) && styles.choiceTextOn]}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.filterLabel, { color: palette.muted }]}>Language</Text>
          <View style={styles.choiceRow}>
            {activityLanguages.map((item) => (
              <Pressable key={item} accessibilityRole="button" onPress={() => toggle(item, languages, setLanguages)} style={[styles.choice, languages.includes(item) && styles.choiceOn]}>
                <Text style={[styles.choiceText, languages.includes(item) && styles.choiceTextOn]}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {chips.length > 0 ? (
        <View style={styles.chips}>
          {chips.map((chip) => (
            <Pressable key={chip.key} accessibilityRole="button" onPress={chip.clear} style={styles.chip}>
              <Text style={styles.chipText}>{chip.label}</Text>
              <Text style={styles.chipX}>×</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {adding ? (
        <View style={styles.form}>
          <Text style={[styles.formTitle, { color: palette.text }]}>Add a Word Bank Entry</Text>
          <Text style={[styles.fieldLabel, { color: palette.text }]}>Word</Text>
          <TextInput
            value={word}
            onChangeText={setWord}
            placeholder="Target word"
            placeholderTextColor={palette.faint}
            style={[styles.wordInput, { borderColor: palette.line, color: palette.text, backgroundColor: palette.card }]}
          />
          <View style={styles.menuField}>
            <FieldMenu label="Sound" value={sound} options={targetSounds} onChange={(value) => setSound(value as TargetSound)} />
          </View>
          <View style={styles.menuField}>
            <FieldMenu label="Position" value={position} options={wordPositions} onChange={(value) => setPosition(value as WordPosition)} />
          </View>
          <View style={styles.menuField}>
            <FieldMenu label="Language" value={language} options={activityLanguages} onChange={setLanguage} />
          </View>
          <Pressable accessibilityRole="button" onPress={save} style={[styles.save, { backgroundColor: palette.primary }]}>
            <Text style={styles.saveText}>Save Phrase</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.listHeader}>
        <Text style={[styles.listTitle, { color: palette.text }]}>Word Bank List</Text>
        {adding ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={editing ? 'Finish removing words' : 'Remove words'}
            onPress={() => setEditing((current) => !current)}
            hitSlop={8}
          >
            {editing ? <TrashIcon color={palette.faint} /> : <PencilIcon color={palette.faint} />}
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.list, { borderColor: palette.line, backgroundColor: palette.card }]}>
        {visible.map((item, index) => (
          <View key={item.id} style={[styles.row, index > 0 && { borderTopColor: palette.line, borderTopWidth: 1 }]}>
            <Text style={[styles.word, { color: palette.text }]}>{item.text}</Text>
            {editing ? (
              <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.text}`} onPress={() => removeBankWord(item.id)} hitSlop={8}>
                <Text style={[styles.minus, { color: palette.faint }]}>—</Text>
              </Pressable>
            ) : (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.position}</Text>
              </View>
            )}
          </View>
        ))}
        {visible.length === 0 ? <Text style={[styles.empty, { color: palette.muted }]}>No words match this view.</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 28 },
  kicker: { fontSize: 11, letterSpacing: 0.6, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '700', marginTop: 4 },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 14 },
  sectionTabs: { flexDirection: 'row', gap: 18, borderBottomWidth: 1, marginBottom: 14 },
  sectionTab: { fontSize: 14, fontWeight: '700', paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  sectionTabOn: {},
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 },
  search: { flex: 1, height: 40, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },
  add: { height: 40, borderRadius: 10, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  addText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  filterButton: { width: 40, height: 40, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  filterPanel: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12, gap: 8 },
  filterLabel: { fontSize: 12, fontWeight: '700' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderWidth: 1, borderColor: '#D7E8F2', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  choiceOn: { borderColor: '#0EA5E9', backgroundColor: '#E7F6FD' },
  choiceText: { fontSize: 12, color: '#63778A' },
  choiceTextOn: { color: '#0284C7', fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: '#8ED4F2', borderRadius: 999, paddingLeft: 12, paddingRight: 8, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipText: { color: '#38B6E6', fontSize: 13, fontWeight: '600' },
  chipX: { color: '#38B6E6', fontSize: 14, fontWeight: '700' },
  form: { marginBottom: 8 },
  formTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  wordInput: { height: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 14, marginBottom: 12 },
  menuField: { marginBottom: 12 },
  save: { alignSelf: 'flex-end', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, marginTop: 4, marginBottom: 16 },
  saveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  listTitle: { fontSize: 16, fontWeight: '700' },
  list: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  row: { minHeight: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  word: { fontSize: 14 },
  badge: { backgroundColor: '#D9F3FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: '#38B6E6', fontSize: 12, fontWeight: '700' },
  minus: { fontSize: 18, fontWeight: '700', paddingHorizontal: 6 },
  empty: { padding: 16, textAlign: 'center' },
});
