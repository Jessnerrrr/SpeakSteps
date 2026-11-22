// =============================================================================
// THERAPIST STUDENTS — All students directory & clinical record in one file
// Replaces: therapist-patients/pages, components, data
// =============================================================================

import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';

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

// ─── 1. Student Directory List ───────────────────────────────────────────────

export function PatientDirectory() {
  const navigation = useNavigation();
  const { palette, patients } = useTherapist();
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState('All Targets');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace('/therapist' as never);
    }
  };

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
          onPress={handleBack}
          style={[studentStyles.back, { borderColor: palette.line }]}
        >
          <ChevronLeftIcon color={palette.text} size={18} />
        </Pressable>
        <View style={studentStyles.titleBlock}>
          <Text style={[studentStyles.title, { color: '#0284C7' }]}>Students</Text>
          <Text style={[studentStyles.subtitle, { color: palette.muted }]}>Track sound targets & case histories</Text>
        </View>
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
            onPress={() => setMenuOpen(true)}
            style={[studentStyles.filter, { backgroundColor: palette.card, borderColor: palette.line }]}
          >
            <Text style={[studentStyles.filterText, { color: palette.muted }]} numberOfLines={1}>
              {target}
            </Text>
            <Text style={{ color: palette.faint }}>▾</Text>
          </Pressable>

          <Modal
            transparent
            visible={menuOpen}
            animationType="fade"
            onRequestClose={() => setMenuOpen(false)}
          >
            <Pressable style={studentStyles.popupOverlay} onPress={() => setMenuOpen(false)}>
              <Pressable style={[studentStyles.popupCard, { backgroundColor: palette.card, borderColor: palette.line }]} onPress={(e) => e.stopPropagation?.()}>
                <View style={[studentStyles.popupHeader, { borderBottomColor: palette.line }]}>
                  <Text style={[studentStyles.popupTitle, { color: palette.text }]}>Filter by Target Sound</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setMenuOpen(false)}
                    style={studentStyles.popupCloseBtn}
                    hitSlop={8}
                  >
                    <Text style={[studentStyles.popupCloseText, { color: palette.faint }]}>✕</Text>
                  </Pressable>
                </View>

                <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                  {['All Targets', ...targetSounds].map((option) => {
                    const isSelected = option === target;
                    return (
                      <Pressable
                        key={option}
                        accessibilityRole="button"
                        onPress={() => {
                          setTarget(option);
                          setMenuOpen(false);
                        }}
                        style={[
                          studentStyles.popupOption,
                          isSelected && { backgroundColor: '#E0F2FE' },
                        ]}
                      >
                        <Text
                          style={[
                            studentStyles.popupOptionText,
                            { color: palette.text },
                            isSelected && { color: '#0284C7', fontWeight: '700' },
                          ]}
                        >
                          {option}
                        </Text>
                        {isSelected && <Text style={{ color: '#0284C7', fontWeight: '700', fontSize: 16 }}>✓</Text>}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </Pressable>
            </Pressable>
          </Modal>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={studentStyles.list}>
        {visible.length === 0 ? (
          <Text style={[studentStyles.empty, { color: palette.muted }]}>No students match this search.</Text>
        ) : (
          visible.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function PatientCard({
  patient,
}: {
  patient: PatientRecord;
}) {
  const { palette } = useTherapist();
  const tone = (patient?.tone && toneColors[patient.tone]) ? toneColors[patient.tone] : toneColors.green;
  const name = patientName(patient);
  const meta = patientMeta(patient);
  return (
    <Pressable
      accessibilityLabel={name}
      onPress={() => router.push(`/therapist/patients/${patient.id}` as never)}
      style={[studentStyles.card, { backgroundColor: palette.card, borderColor: palette.line }]}
    >
      <View style={studentStyles.cardTop}>
        <View style={studentStyles.avatar}>
          <Text style={studentStyles.initials}>{patient.initials || 'S'}</Text>
        </View>
        <View style={studentStyles.copy}>
          <Text style={[studentStyles.name, { color: palette.text }]}>{name}</Text>
          <Text style={[studentStyles.meta, { color: palette.faint }]}>{meta}</Text>
        </View>
        <View style={[studentStyles.badge, { backgroundColor: tone.background }]}>
          <Text style={[studentStyles.badgeText, { color: tone.text }]}>{patient.accuracy ?? 0}%</Text>
        </View>
      </View>
      <View style={[studentStyles.divider, { backgroundColor: palette.line }]} />
      <View style={studentStyles.cardBottom}>
        <Text style={[studentStyles.diagnosis, { color: palette.muted, flex: 1 }]}>{patient.diagnosis || ''}</Text>
      </View>
    </Pressable>
  );
}

// ─── 2. Student Record / Detail Screen ───────────────────────────────────────

function AccomplishmentAudioPlayer({ item }: { item: { id: string; audioLabel: string; bars: number[] } }) {
  const { palette } = useTherapist();
  const [playing, setPlaying] = useState(false);
  return (
    <View style={[studentStyles.audio, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD', borderWidth: 1 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Pause audio' : 'Play audio'}
        onPress={() => setPlaying((p) => !p)}
        style={[studentStyles.playButtonCircle, { backgroundColor: '#0284C7' }]}
      >
        <Text style={studentStyles.playButtonIcon}>{playing ? '❚❚' : '▶'}</Text>
      </Pressable>
      <View style={{ flex: 1, marginHorizontal: 8 }}>
        <Text style={[studentStyles.audioTitle, { color: '#0369A1' }]}>Child Audio</Text>
        <Text style={[studentStyles.audioMeta, { color: palette.faint }]}>
          {playing ? 'Playing demo…' : item.audioLabel}
        </Text>
      </View>
      <View style={studentStyles.bars}>
        {item.bars.map((height, index) => (
          <View
            key={`${item.id}-${index}`}
            style={[
              studentStyles.bar,
              {
                height: playing ? Math.min(22, height + 4) : height,
                backgroundColor: playing ? '#0284C7' : '#38BDF8',
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export function PatientRecordScreen({ patientId }: { patientId: string }) {
  const navigation = useNavigation();
  const { palette, patients, addSoapNote } = useTherapist();
  const patient = patients.find((item) => item.id === patientId);
  const [composing, setComposing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [formError, setFormError] = useState('');

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace('/therapist/patients' as never);
    }
  };

  if (!patient) {
    return (
      <View style={studentStyles.missing}>
        <Text style={{ color: palette.muted }}>This student is no longer on the list.</Text>
      </View>
    );
  }

  const openForm = () => {
    setSaved(false);
    setFormError('');
    setComposing(true);
  };

  const saveNote = () => {
    try {
      if (!subjective.trim() || !objective.trim() || !assessment.trim() || !plan.trim()) {
        setFormError('Complete all Subjective, Objective, Assessment, and Plan fields.');
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
      setFormError('');
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save clinical note. Please try again.');
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={studentStyles.recordContent}>
      <Pressable
        accessibilityLabel="Back to students"
        onPress={handleBack}
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
        <Text style={[studentStyles.overviewTitle, { color: '#0284C7' }]}>Phoneme Target & Error Profile</Text>
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
          style={[studentStyles.soapButton, { backgroundColor: '#0284C7' }]}
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
            style={[studentStyles.saveNote, { backgroundColor: '#0284C7' }]}
          >
            <Text style={studentStyles.soapButtonText}>Save Clinical Note</Text>
          </Pressable>
        </View>
      ) : null}

      {!composing && patient.sessions.length === 0 ? (
        <View style={[studentStyles.emptyCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
          <Text style={[studentStyles.emptyTitle, { color: palette.text }]}>No Sessions Recorded Yet.</Text>
          <Text style={[studentStyles.emptyBody, { color: palette.muted }]}>
            This is a new student profile. Add the first SOAP note to start tracking articulation progress over time.
          </Text>
          <Pressable onPress={openForm}>
            <Text style={[studentStyles.emptyLink, { color: '#0284C7' }]}>+ Create First SOAP Note</Text>
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
              <AccomplishmentAudioPlayer item={item} />
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
  title: { fontFamily: 'SourGummy-Bold', fontSize: 24, lineHeight: 30 },
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
  cardPlayBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
  cardPlayIcon: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', marginLeft: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  miniPlayingBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  miniPlayingText: { color: '#0284C7', fontSize: 10, fontWeight: '600' },
  playButtonCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  playButtonIcon: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginLeft: 2 },
  audio: { marginTop: 8, borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  audioTitle: { fontSize: 12, fontWeight: '700' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 22 },
  bar: { width: 4, borderRadius: 2 },
  audioMeta: { fontSize: 11, marginTop: 2 },

  // Popup Dropdown Styles
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  popupCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  popupTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  popupCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  popupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    marginVertical: 2,
  },
  popupOptionText: {
    fontSize: 15,
  },
});
