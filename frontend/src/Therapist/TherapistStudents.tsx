// =============================================================================
// THERAPIST STUDENTS — All students directory & clinical record in one file
// Replaces: therapist-patients/pages, components, data
// =============================================================================

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TherapistShell } from '@/components/therapist/TherapistShell';
import { useTherapist } from '@/components/therapist/TherapistProvider';
import { ChevronLeftIcon } from '@/components/therapist/icons';
import { targetSounds } from '@/Therapist-modules/therapist-patients/data/options';
import type { AccuracyTone, PatientRecord, SoapNote } from '@/Therapist-modules/therapist-patients/data/samplePatients';
import { formatSoapDate, patientMeta, patientName } from '@/Therapist-modules/therapist-patients/data/samplePatients';

const toneColors: Record<AccuracyTone, { background: string; text: string }> = {
  green: { background: '#E5F6EA', text: '#43B05C' },
  peach: { background: '#FDE8E0', text: '#E07A5F' },
  blue: { background: '#E3F4FC', text: '#0EA5E9' },
};

// ─── 1. Patient Directory List ───────────────────────────────────────────────

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
    <View style={studentStyles.fill}>
      <View style={studentStyles.header}>
        <Pressable
          accessibilityLabel="Back to home"
          onPress={() => router.push('/therapist' as never)}
          style={[studentStyles.back, { borderColor: palette.line }]}
        >
          <ChevronLeftIcon color={palette.text} size={18} />
        </Pressable>
        <View style={studentStyles.titleBlock}>
          <Text style={[studentStyles.title, { color: palette.primary }]}>Patients</Text>
          <Text style={[studentStyles.subtitle, { color: palette.muted }]}>Track sound targets & case histories</Text>
        </View>
        <Pressable
          accessibilityLabel="Add patient"
          onPress={() => setAddPatientOpen(true)}
          style={[studentStyles.plus, { backgroundColor: palette.primarySoft }]}
        >
          <Text style={[studentStyles.plusText, { color: palette.primary }]}>+</Text>
        </Pressable>
      </View>

      <View style={studentStyles.tools}>
        <View style={[studentStyles.search, { backgroundColor: palette.card, borderColor: palette.line }]}>
          <Text style={[studentStyles.searchIcon, { color: palette.faint }]}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, sounds"
            placeholderTextColor={palette.faint}
            style={[studentStyles.searchInput, { color: palette.text }]}
          />
        </View>
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter by target sound"
            onPress={() => setMenuOpen((open) => !open)}
            style={[studentStyles.filter, { backgroundColor: palette.card, borderColor: palette.line }]}
          >
            <Text style={[studentStyles.filterText, { color: palette.muted }]} numberOfLines={1}>
              {target}
            </Text>
            <Text style={{ color: palette.faint }}>▾</Text>
          </Pressable>
          {menuOpen ? (
            <View style={[studentStyles.menu, { backgroundColor: palette.card, borderColor: palette.line }]}>
              {['All Targets', ...targetSounds].map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  onPress={() => {
                    setTarget(option);
                    setMenuOpen(false);
                  }}
                  style={[studentStyles.menuItem, option === target && { backgroundColor: palette.primarySoft }]}
                >
                  <Text style={[studentStyles.menuText, { color: option === target ? palette.primaryText : palette.text }]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={studentStyles.list}>
        {visible.length === 0 ? (
          <Text style={[studentStyles.empty, { color: palette.muted }]}>No patients match this search.</Text>
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
      style={[studentStyles.card, { backgroundColor: palette.card, borderColor: palette.line }]}
    >
      <View style={studentStyles.cardTop}>
        <View style={studentStyles.avatar}>
          <Text style={studentStyles.initials}>{patient.initials}</Text>
        </View>
        <View style={studentStyles.copy}>
          <Text style={[studentStyles.name, { color: palette.text }]}>{patientName(patient)}</Text>
          <Text style={[studentStyles.meta, { color: palette.faint }]}>{patientMeta(patient)}</Text>
        </View>
        <View style={[studentStyles.badge, { backgroundColor: tone.background }]}>
          <Text style={[studentStyles.badgeText, { color: tone.text }]}>{patient.accuracy}%</Text>
        </View>
      </View>
      <View style={[studentStyles.divider, { backgroundColor: palette.line }]} />
      <Text style={[studentStyles.diagnosis, { color: palette.muted }]}>{patient.diagnosis}</Text>
    </Pressable>
  );
}

// ─── 2. Patient Record / Detail Screen ───────────────────────────────────────

export function PatientRecordScreen({ patientId }: { patientId: string }) {
  const { palette, patients, addSoapNote } = useTherapist();
  const patient = patients.find((item) => item.id === patientId);
  const [composing, setComposing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [formError, setFormError] = useState('');

  if (!patient) {
    return (
      <View style={studentStyles.missing}>
        <Text style={{ color: palette.muted }}>This patient is no longer on the list.</Text>
      </View>
    );
  }

  const openForm = () => {
    setSaved(false);
    setFormError('');
    setComposing(true);
  };

  const saveNote = () => {
    if (!subjective.trim() || !objective.trim() || !assessment.trim() || !plan.trim()) {
      setFormError('Complete the subjective, objective, assessment, and plan.');
      return;
    }
    const note: SoapNote = {
      id: `soap-${Date.now()}`,
      number: patient.sessions.length + 1,
      dateLabel: formatSoapDate(),
      subjective: subjective.trim(),
      objective: objective.trim(),
      assessment: assessment.trim(),
      plan: plan.trim(),
    };
    addSoapNote(patient.id, note);
    setSubjective('');
    setObjective('');
    setAssessment('');
    setPlan('');
    setComposing(false);
    setSaved(true);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={studentStyles.recordContent}>
      <Pressable
        accessibilityLabel="Back to patients"
        onPress={() => router.push('/therapist/patients' as never)}
        style={[studentStyles.recordBack, { borderColor: palette.line, backgroundColor: palette.card }]}
      >
        <ChevronLeftIcon color={palette.text} size={18} />
      </Pressable>

      <View style={[studentStyles.profileCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
        <View style={studentStyles.profileRow}>
          <View style={[studentStyles.profileAvatar, { backgroundColor: patient.avatar }]}>
            <Text style={studentStyles.profileInitials}>{patient.initials}</Text>
          </View>
          <View style={studentStyles.profileCopy}>
            <Text style={[studentStyles.profileName, { color: palette.text }]}>{patientName(patient)}</Text>
            <Text style={[studentStyles.profileMeta, { color: palette.faint }]}>{patientMeta(patient)}</Text>
            <Text style={[studentStyles.profileDiagnosis, { color: palette.muted }]}>{patient.diagnosis}</Text>
          </View>
        </View>
        <View style={studentStyles.stats}>
          <StatCard
            label="Current Accuracy"
            value={`${patient.accuracy}%`}
            detail={patient.accuracyDelta !== undefined ? `+${patient.accuracyDelta}%` : undefined}
            caption={patient.baseline ? 'Baseline' : undefined}
            background="#E7F8EE"
            color="#43B05C"
          />
          <StatCard
            label="Current Stage"
            value={patient.hierarchyLevel === 'Isolation' ? 'Isolated Sounds' : patient.hierarchyLevel}
            caption="Target Mode"
            background="#E7F6FD"
            color="#0EA5E9"
          />
          <StatCard
            label="Home Compliance"
            value={patient.compliance !== undefined ? `${patient.compliance}%` : '—'}
            caption={patient.complianceNote}
            background="#FFF4E8"
            color="#F5A524"
          />
        </View>
      </View>

      <Text style={[studentStyles.section, { color: palette.muted }]}>OVERVIEW</Text>
      <View style={[studentStyles.overview, { backgroundColor: palette.card, borderColor: palette.line }]}>
        <Text style={[studentStyles.overviewTitle, { color: palette.primary }]}>Phoneme Target & Error Profile</Text>
        <OverviewRow label="Primary Phoneme Target:" value={patient.targetDetail} />
        <OverviewRow label="Secondary Targets:" value={patient.secondaryTargets} />
        <OverviewRow label="Error Pattern Taxonomy:" value={patient.patternDetail} />
        <OverviewRow label="Language Profile:" value={patient.languageDetail} />
      </View>

      <View style={studentStyles.soapHeader}>
        <Text style={[studentStyles.section, { color: palette.muted, marginBottom: 0 }]}>SOAP SESSION HISTORY</Text>
        <Pressable
          accessibilityRole="button"
          onPress={openForm}
          style={[studentStyles.soapButton, { backgroundColor: palette.primary }]}
        >
          <Text style={studentStyles.soapButtonText}>+ New SOAP Note</Text>
        </Pressable>
      </View>

      {composing ? (
        <View style={[studentStyles.noteCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
          <Text style={[studentStyles.noteTitle, { color: palette.text }]}>Add SOAP Clinical Entry</Text>
          <SoapInput label="S (Subjective)" value={subjective} onChangeText={setSubjective} placeholder="e.g. Cooperative" />
          <SoapInput label="O (Objective)" value={objective} onChangeText={setObjective} placeholder="e.g. 15/20 trials" />
          <SoapInput label="A (Assessment)" value={assessment} onChangeText={setAssessment} placeholder="e.g. Improving" />
          <SoapInput label="P (Plan)" value={plan} onChangeText={setPlan} placeholder="e.g. Advance to words" />
          {formError ? <Text style={[studentStyles.formError, { color: palette.alert }]}>{formError}</Text> : null}
          <Pressable
            accessibilityRole="button"
            onPress={saveNote}
            style={[studentStyles.saveNote, { backgroundColor: palette.primary }]}
          >
            <Text style={studentStyles.soapButtonText}>Save Clinical Note</Text>
          </Pressable>
        </View>
      ) : null}

      {!composing && patient.sessions.length === 0 ? (
        <View style={[studentStyles.emptyCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
          <Text style={[studentStyles.emptyTitle, { color: palette.text }]}>No Sessions Recorded Yet.</Text>
          <Text style={[studentStyles.emptyBody, { color: palette.muted }]}>
            This is a new patient profile. Add the first SOAP note to start tracking articulation progress over time.
          </Text>
          <Pressable onPress={openForm}>
            <Text style={[studentStyles.emptyLink, { color: palette.primary }]}>+ Create First SOAP Note</Text>
          </Pressable>
        </View>
      ) : null}

      {!composing
        ? patient.sessions.map((session) => (
            <View key={session.id} style={[studentStyles.noteCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
              <Text style={[studentStyles.sessionTitle, { color: palette.text }]}>
                Session #{session.number} • {session.dateLabel}
              </Text>
              <SoapLine letter="S" color="#0EA5E9" text={session.subjective} />
              <SoapLine letter="O" color="#43B05C" text={session.objective} />
              <SoapLine letter="A" color="#F5A524" text={session.assessment} />
              <SoapLine letter="P" color="#0EA5E9" text={session.plan} />
            </View>
          ))
        : null}

      {saved && !composing ? (
        <View style={studentStyles.success}>
          <Text style={studentStyles.successText}>SOAP Note Added Successfully!</Text>
        </View>
      ) : null}

      {patient.accomplishments.length > 0 ? (
        <View style={studentStyles.accomplishments}>
          <Text style={[studentStyles.section, { color: palette.muted }]}>ACCOMPLISHMENT HISTORY</Text>
          {patient.accomplishments.map((item) => (
            <View
              key={item.id}
              style={[
                studentStyles.accomplishment,
                {
                  backgroundColor: palette.card,
                  borderColor: palette.line,
                  borderLeftColor: item.accent === 'green' ? '#43B05C' : '#F5A524',
                },
              ]}
            >
              <Text style={[studentStyles.accomplishmentDate, { color: palette.faint }]}>{item.dateLabel}</Text>
              <Text style={[studentStyles.accomplishmentTitle, { color: palette.text }]}>{item.title}</Text>
              <Text style={[studentStyles.accomplishmentBody, { color: palette.muted }]}>{item.targetAccuracy}</Text>
              {item.clinicianNotes ? (
                <Text style={[studentStyles.accomplishmentBody, { color: palette.muted }]}>{item.clinicianNotes}</Text>
              ) : null}
              {item.quote ? <Text style={[studentStyles.quote, { color: '#E07A5F' }]}>{item.quote}</Text> : null}
              <View style={[studentStyles.audio, { backgroundColor: '#FFF7ED' }]}>
                <Text style={studentStyles.audioTitle}>Child Audio</Text>
                <View style={studentStyles.bars}>
                  {item.bars.map((height, index) => (
                    <View key={`${item.id}-${index}`} style={[studentStyles.bar, { height, backgroundColor: '#F5A524' }]} />
                  ))}
                </View>
                <Text style={[studentStyles.audioMeta, { color: palette.faint }]}>{item.audioLabel}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  detail,
  caption,
  background,
  color,
}: {
  label: string;
  value: string;
  detail?: string;
  caption?: string;
  background: string;
  color: string;
}) {
  return (
    <View style={[studentStyles.stat, { backgroundColor: background }]}>
      <Text style={studentStyles.statLabel}>{label}</Text>
      <Text style={[studentStyles.statValue, { color }]}>{value}</Text>
      {detail ? <Text style={[studentStyles.statDetail, { color }]}>{detail}</Text> : null}
      {caption ? <Text style={studentStyles.statCaption}>{caption}</Text> : null}
    </View>
  );
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  const { palette } = useTherapist();
  return (
    <View style={studentStyles.overviewRow}>
      <Text style={[studentStyles.overviewLabel, { color: palette.muted }]}>{label}</Text>
      <Text style={[studentStyles.overviewBody, { color: palette.primary }]}>{value}</Text>
    </View>
  );
}

function SoapInput({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  const { palette } = useTherapist();
  return (
    <View style={studentStyles.soapField}>
      <Text style={[studentStyles.soapLabel, { color: palette.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.faint}
        style={[studentStyles.soapInput, { color: palette.text, borderColor: palette.line, backgroundColor: palette.input }]}
      />
    </View>
  );
}

function SoapLine({ letter, color, text }: { letter: string; color: string; text: string }) {
  const { palette } = useTherapist();
  return (
    <Text style={[studentStyles.soapLine, { color: palette.text }]}>
      <Text style={{ color, fontWeight: '700' }}>{letter}: </Text>
      {text}
    </Text>
  );
}

// ─── Default Page Exports with TherapistShell ────────────────────────────────

export default function TherapistStudents() {
  return (
    <TherapistShell active="patients">
      <PatientDirectory />
    </TherapistShell>
  );
}

export function TherapistStudentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <TherapistShell active="patients">
      <PatientRecordScreen patientId={Array.isArray(id) ? id[0] : id || ''} />
    </TherapistShell>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const studentStyles = StyleSheet.create({
  fill: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12 },
  back: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { flex: 1 },
  title: { fontSize: 26, fontWeight: '700', lineHeight: 30 },
  subtitle: { fontSize: 12, marginTop: 2 },
  plus: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  plusText: { fontSize: 24, lineHeight: 26, fontWeight: '500' },
  tools: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12, zIndex: 2 },
  search: { flex: 1, height: 42, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 6 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },
  filter: { height: 42, minWidth: 118, maxWidth: 150, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  filterText: { flex: 1, fontSize: 12, fontWeight: '600' },
  menu: { position: 'absolute', top: 46, right: 0, width: 160, borderWidth: 1, borderRadius: 12, overflow: 'hidden', zIndex: 5 },
  menuItem: { paddingHorizontal: 12, paddingVertical: 10 },
  menuText: { fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  empty: { textAlign: 'center', marginTop: 24, fontSize: 14 },
  card: { borderWidth: 1, borderRadius: 16, padding: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E7EDF2' },
  initials: { color: '#7B8B9C', fontWeight: '700', fontSize: 13 },
  copy: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 11, marginTop: 2 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  divider: { height: 1, marginVertical: 10 },
  diagnosis: { fontSize: 12 },

  // Record / Detail Styles
  recordContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  missing: { padding: 24 },
  recordBack: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  profileCard: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 12 },
  profileRow: { flexDirection: 'row', gap: 10 },
  profileAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  profileInitials: { color: '#FFFFFF', fontWeight: '700' },
  profileCopy: { flex: 1, gap: 2 },
  profileName: { fontSize: 18, fontWeight: '700' },
  profileMeta: { fontSize: 12 },
  profileDiagnosis: { fontSize: 12 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, borderRadius: 12, padding: 8, minHeight: 78 },
  statLabel: { fontSize: 10, color: '#63778A', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700' },
  statDetail: { fontSize: 11, fontWeight: '700' },
  statCaption: { fontSize: 10, color: '#8B9AAB', marginTop: 2 },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, marginTop: 4 },
  overview: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  overviewTitle: { fontSize: 13, fontWeight: '700' },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  overviewLabel: { flex: 1, fontSize: 11, lineHeight: 16 },
  overviewBody: { flex: 1, fontSize: 11, lineHeight: 16, textAlign: 'right', fontWeight: '600' },
  soapHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  soapButton: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  soapButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  noteCard: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  sessionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  soapLine: { fontSize: 13, lineHeight: 18 },
  emptyCard: { borderWidth: 1, borderRadius: 16, padding: 18, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptyBody: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  emptyLink: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  noteTitle: { fontSize: 14, fontWeight: '700' },
  soapField: { gap: 4 },
  soapLabel: { fontSize: 12, fontWeight: '600' },
  soapInput: { height: 40, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, fontSize: 13 },
  formError: { fontSize: 12 },
  saveNote: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginTop: 4 },
  success: { backgroundColor: '#E7F8EE', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  successText: { color: '#2F7D3F', fontWeight: '700', fontSize: 14 },
  accomplishments: { gap: 10 },
  accomplishment: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 14, padding: 12, gap: 4 },
  accomplishmentDate: { fontSize: 11 },
  accomplishmentTitle: { fontSize: 14, fontWeight: '700' },
  accomplishmentBody: { fontSize: 12, lineHeight: 17 },
  quote: { fontSize: 12, lineHeight: 17, fontStyle: 'italic' },
  audio: { marginTop: 8, borderRadius: 12, padding: 10, gap: 6 },
  audioTitle: { fontSize: 12, fontWeight: '700', color: '#C2410C' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 22 },
  bar: { width: 4, borderRadius: 2 },
  audioMeta: { fontSize: 11 },
});
