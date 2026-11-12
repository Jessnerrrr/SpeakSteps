import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { useTherapist } from '@/components/therapist/TherapistProvider';
import { WordBank } from '@/Therapist-modules/therapist-activities/components/WordBank';
import { levelColors, practiceLevels, type PracticeLevel } from '@/Therapist-modules/therapist-activities/data/activityData';
import { useActivities } from '@/Therapist-modules/therapist-activities/state/ActivitiesProvider';

const tabs = ['Unassigned', 'Assigned', 'Completed'] as const;

export function ActivityLibrary() {
  const { palette } = useTherapist();
  const { activities, beginNewActivity, wordBank } = useActivities();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<(typeof tabs)[number]>('Unassigned');
  const [filters, setFilters] = useState<PracticeLevel[]>([]);
  const [section, setSection] = useState<'library' | 'bank'>('library');

  if (section === 'bank') return <WordBank onOpenLibrary={() => setSection('library')} />;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return activities.filter((activity) => {
      if (activity.status !== tab) return false;
      if (filters.length > 0 && !filters.includes(activity.level)) return false;
      if (!needle) return true;
      return `${activity.title} ${activity.sound} ${activity.level}`.toLowerCase().includes(needle);
    });
  }, [activities, filters, query, tab]);

  const toggle = (level: PracticeLevel) => {
    setFilters((current) => (current.includes(level) ? current.filter((item) => item !== level) : [...current, level]));
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text style={[styles.kicker, { color: palette.faint }]}>PURPOSEFUL PRACTICE</Text>
      <Text style={[styles.title, { color: palette.primary }]}>The activity library.</Text>
      <Text style={[styles.subtitle, { color: palette.muted }]}>Build the small steps that make a big difference.</Text>

      <View style={[styles.sectionTabs, { borderBottomColor: palette.line }]}>
        <Text style={[styles.sectionTab, styles.sectionTabOn, { color: palette.primary, borderBottomColor: palette.primary }]}>Activity Library</Text>
        <Pressable accessibilityRole="button" onPress={() => setSection('bank')}>
          <Text style={[styles.sectionTab, { color: palette.faint }]}>Word Bank ({wordBank.length})</Text>
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search activities..."
          placeholderTextColor={palette.faint}
          style={[styles.search, { borderColor: palette.line, color: palette.text, backgroundColor: palette.card }]}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            beginNewActivity();
            router.push('/therapist/activities/edit' as never);
          }}
          style={[styles.create, { backgroundColor: palette.primary }]}
        >
          <Text style={styles.createText}>+ Create a task</Text>
        </Pressable>
      </View>

      <View style={styles.statusRow}>
        {tabs.map((item) => {
          const selected = item === tab;
          return (
            <Pressable key={item} accessibilityRole="button" onPress={() => setTab(item)} style={[styles.status, selected ? { backgroundColor: palette.primary } : { backgroundColor: '#F3F4F6' }]}>
              <Text style={[styles.statusText, { color: selected ? '#FFFFFF' : palette.muted }]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.filters}>
        {practiceLevels.map((level) => {
          const selected = filters.includes(level);
          return (
            <Pressable key={level} accessibilityRole="button" onPress={() => toggle(level)} style={[styles.filter, selected && styles.filterOn]}>
              <Text style={[styles.filterText, selected && styles.filterTextOn]}>{level}</Text>
              {selected ? <Text style={styles.filterX}>×</Text> : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.grid}>
        {visible.map((activity) => (
          <Pressable key={activity.id} accessibilityRole="button" onPress={() => router.push(`/therapist/activities/${activity.id}` as never)} style={[styles.card, { borderColor: palette.line, backgroundColor: palette.card }]}>
            <View style={[styles.swatch, { backgroundColor: levelColors[activity.level] }]}>
              <Text style={styles.sound}>{activity.sound}</Text>
              <Text style={styles.wave}>≋</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.levelPill}>
                <Text style={styles.levelText}>{activity.level}</Text>
              </View>
              <Text style={[styles.cardTitle, { color: palette.text }]}>{activity.title}</Text>
              <Text style={[styles.cardMeta, { color: palette.faint }]}>{activity.language} · Therapist-created</Text>
              <Text style={[styles.viewLink, { color: palette.muted }]}>View activity ›</Text>
            </View>
          </Pressable>
        ))}
      </View>
      {visible.length === 0 ? <Text style={[styles.empty, { color: palette.muted }]}>No activities in this view.</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  kicker: { fontSize: 11, letterSpacing: 0.6, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '700', marginTop: 4 },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 14 },
  sectionTabs: { flexDirection: 'row', gap: 18, borderBottomWidth: 1, marginBottom: 14 },
  sectionTab: { fontSize: 14, fontWeight: '700', paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  sectionTabOn: {},
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  search: { flex: 1, height: 40, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 13 },
  create: { borderRadius: 10, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  createText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  status: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  statusText: { fontSize: 13, fontWeight: '700' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  filter: { borderWidth: 1, borderColor: '#E6EBEF', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  filterOn: { borderColor: '#C48B5A' },
  filterText: { fontSize: 12, color: '#63778A' },
  filterTextOn: { color: '#C48B5A', fontWeight: '700' },
  filterX: { color: '#C48B5A', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  swatch: { height: 92, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  sound: { fontSize: 28, fontWeight: '500', color: '#3F4A3A' },
  wave: { fontSize: 18, color: '#C48B5A' },
  cardBody: { padding: 12, gap: 4 },
  levelPill: { alignSelf: 'flex-start', backgroundColor: '#F8E7DC', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  levelText: { fontSize: 10, color: '#C48B5A', fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardMeta: { fontSize: 11 },
  viewLink: { fontSize: 12, marginTop: 4 },
  empty: { marginTop: 16, textAlign: 'center' },
});
