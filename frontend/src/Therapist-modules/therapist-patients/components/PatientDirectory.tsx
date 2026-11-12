import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { useTherapist } from '@/components/therapist/TherapistProvider';
import { ChevronLeftIcon } from '@/components/therapist/icons';
import { targetSounds } from '@/Therapist-modules/therapist-patients/data/options';
import { patientMeta, patientName, type AccuracyTone, type PatientRecord } from '@/Therapist-modules/therapist-patients/data/samplePatients';

const toneColors: Record<AccuracyTone, { background: string; text: string }> = {
  green: { background: '#E5F6EA', text: '#43B05C' },
  peach: { background: '#FDE8E0', text: '#E07A5F' },
  blue: { background: '#E3F4FC', text: '#0EA5E9' },
};

export function PatientDirectory() {
  const { palette, patients, setAddPatientOpen } = useTherapist();
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState('All Targets');
  const [menuOpen, setMenuOpen] = useState(false);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return patients.filter((patient) => {
      const targetMatch = target === 'All Targets' || patient.targetSound === target;
      if (!targetMatch) return false;
      if (!needle) return true;
      const haystack = [patientName(patient), patient.diagnosis, patient.targetSound, patientMeta(patient), patient.initials]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [patients, query, target]);

  return (
    <View style={styles.fill}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Back to home" onPress={() => router.push('/therapist' as never)} style={[styles.back, { borderColor: palette.line }]}>
          <ChevronLeftIcon color={palette.text} size={18} />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: palette.primary }]}>Patients</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>Track sound targets & case histories</Text>
        </View>
        <Pressable
          accessibilityLabel="Add patient"
          onPress={() => setAddPatientOpen(true)}
          style={[styles.plus, { backgroundColor: palette.primarySoft }]}
        >
          <Text style={[styles.plusText, { color: palette.primary }]}>+</Text>
        </Pressable>
      </View>

      <View style={styles.tools}>
        <View style={[styles.search, { backgroundColor: palette.card, borderColor: palette.line }]}>
          <Text style={[styles.searchIcon, { color: palette.faint }]}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, sounds"
            placeholderTextColor={palette.faint}
            style={[styles.searchInput, { color: palette.text }]}
          />
        </View>
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter by target sound"
            onPress={() => setMenuOpen((open) => !open)}
            style={[styles.filter, { backgroundColor: palette.card, borderColor: palette.line }]}
          >
            <Text style={[styles.filterText, { color: palette.muted }]} numberOfLines={1}>
              {target}
            </Text>
            <Text style={{ color: palette.faint }}>▾</Text>
          </Pressable>
          {menuOpen ? (
            <View style={[styles.menu, { backgroundColor: palette.card, borderColor: palette.line }]}>
              {['All Targets', ...targetSounds].map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  onPress={() => {
                    setTarget(option);
                    setMenuOpen(false);
                  }}
                  style={[styles.menuItem, option === target && { backgroundColor: palette.primarySoft }]}
                >
                  <Text style={[styles.menuText, { color: option === target ? palette.primaryText : palette.text }]}>{option}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {visible.length === 0 ? (
          <Text style={[styles.empty, { color: palette.muted }]}>No patients match this search.</Text>
        ) : (
          visible.map((patient) => <PatientCard key={patient.id} patient={patient} />)
        )}
      </ScrollView>
    </View>
  );
}

function PatientCard({ patient }: { patient: PatientRecord }) {
  const { palette } = useTherapist();
  const tone = toneColors[patient.tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={patientName(patient)}
      onPress={() => router.push(`/therapist/patients/${patient.id}` as never)}
      style={[styles.card, { backgroundColor: palette.card, borderColor: palette.line }]}
    >
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{patient.initials}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={[styles.name, { color: palette.text }]}>{patientName(patient)}</Text>
          <Text style={[styles.meta, { color: palette.faint }]}>{patientMeta(patient)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: tone.background }]}>
          <Text style={[styles.badgeText, { color: tone.text }]}>{patient.accuracy}%</Text>
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: palette.line }]} />
      <Text style={[styles.diagnosis, { color: palette.muted }]}>{patient.diagnosis}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  back: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1 },
  title: { fontSize: 26, fontWeight: '700', lineHeight: 30 },
  subtitle: { fontSize: 12, marginTop: 2 },
  plus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: { fontSize: 24, lineHeight: 26, fontWeight: '500' },
  tools: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    zIndex: 2,
  },
  search: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },
  filter: {
    height: 42,
    minWidth: 118,
    maxWidth: 150,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  filterText: { flex: 1, fontSize: 12, fontWeight: '600' },
  menu: {
    position: 'absolute',
    top: 46,
    right: 0,
    width: 160,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 5,
  },
  menuItem: { paddingHorizontal: 12, paddingVertical: 10 },
  menuText: { fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  empty: { textAlign: 'center', marginTop: 24, fontSize: 14 },
  card: { borderWidth: 1, borderRadius: 16, padding: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7EDF2',
  },
  initials: { color: '#7B8B9C', fontWeight: '700', fontSize: 13 },
  copy: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 11, marginTop: 2 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  divider: { height: 1, marginVertical: 10 },
  diagnosis: { fontSize: 12 },
});
