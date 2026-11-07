import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { useTherapist } from '@/components/therapist/TherapistProvider';
import { ChevronLeftIcon } from '@/components/therapist/icons';
import { formatSoapDate, patientMeta, patientName, type SoapNote } from '@/Therapist-modules/therapist-patients/data/samplePatients';

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
      <View style={styles.missing}>
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
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Pressable accessibilityLabel="Back to patients" onPress={() => router.push('/therapist/patients' as never)} style={[styles.back, { borderColor: palette.line, backgroundColor: palette.card }]}>
        <ChevronLeftIcon color={palette.text} size={18} />
      </Pressable>

      <View style={[styles.profileCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: patient.avatar }]}>
            <Text style={styles.initials}>{patient.initials}</Text>
          </View>
          <View style={styles.profileCopy}>
            <Text style={[styles.name, { color: palette.text }]}>{patientName(patient)}</Text>
            <Text style={[styles.meta, { color: palette.faint }]}>{patientMeta(patient)}</Text>
            <Text style={[styles.diagnosis, { color: palette.muted }]}>{patient.diagnosis}</Text>
          </View>
        </View>
        <View style={styles.stats}>
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

      <Text style={[styles.section, { color: palette.muted }]}>OVERVIEW</Text>
      <View style={[styles.overview, { backgroundColor: palette.card, borderColor: palette.line }]}>
        <Text style={[styles.overviewTitle, { color: palette.primary }]}>Phoneme Target & Error Profile</Text>
        <OverviewRow label="Primary Phoneme Target:" value={patient.targetDetail} />
        <OverviewRow label="Secondary Targets:" value={patient.secondaryTargets} />
        <OverviewRow label="Error Pattern Taxonomy:" value={patient.patternDetail} />
        <OverviewRow label="Language Profile:" value={patient.languageDetail} />
      </View>

      <View style={styles.soapHeader}>
        <Text style={[styles.section, { color: palette.muted, marginBottom: 0 }]}>SOAP SESSION HISTORY</Text>
        <Pressable accessibilityRole="button" onPress={openForm} style={[styles.soapButton, { backgroundColor: palette.primary }]}>
          <Text style={styles.soapButtonText}>+ New SOAP Note</Text>
        </Pressable>
      </View>

      {composing ? (
        <View style={[styles.noteCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
          <Text style={[styles.noteTitle, { color: palette.text }]}>Add SOAP Clinical Entry</Text>
          <SoapInput label="S (Subjective)" value={subjective} onChangeText={setSubjective} placeholder="e.g. Cooperative" />
          <SoapInput label="O (Objective)" value={objective} onChangeText={setObjective} placeholder="e.g. 15/20 trials" />
          <SoapInput label="A (Assessment)" value={assessment} onChangeText={setAssessment} placeholder="e.g. Improving" />
          <SoapInput label="P (Plan)" value={plan} onChangeText={setPlan} placeholder="e.g. Advance to words" />
          {formError ? <Text style={[styles.formError, { color: palette.alert }]}>{formError}</Text> : null}
          <Pressable accessibilityRole="button" onPress={saveNote} style={[styles.saveNote, { backgroundColor: palette.primary }]}>
            <Text style={styles.soapButtonText}>Save Clinical Note</Text>
          </Pressable>
        </View>
      ) : null}

      {!composing && patient.sessions.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>No Sessions Recorded Yet.</Text>
          <Text style={[styles.emptyBody, { color: palette.muted }]}>
            This is a new patient profile. Add the first SOAP note to start tracking articulation progress over time.
          </Text>
          <Pressable onPress={openForm}>
            <Text style={[styles.emptyLink, { color: palette.primary }]}>+ Create First SOAP Note</Text>
          </Pressable>
        </View>
      ) : null}

      {!composing
        ? patient.sessions.map((session) => (
            <View key={session.id} style={[styles.noteCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
              <Text style={[styles.sessionTitle, { color: palette.text }]}>
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
        <View style={styles.success}>
          <Text style={styles.successText}>SOAP Note Added Successfully!</Text>
        </View>
      ) : null}

      {patient.accomplishments.length > 0 ? (
        <View style={styles.accomplishments}>
          <Text style={[styles.section, { color: palette.muted }]}>ACCOMPLISHMENT HISTORY</Text>
          {patient.accomplishments.map((item) => (
            <View
              key={item.id}
              style={[
                styles.accomplishment,
                { backgroundColor: palette.card, borderColor: palette.line, borderLeftColor: item.accent === 'green' ? '#43B05C' : '#F5A524' },
              ]}
            >
              <Text style={[styles.accomplishmentDate, { color: palette.faint }]}>{item.dateLabel}</Text>
              <Text style={[styles.accomplishmentTitle, { color: palette.text }]}>{item.title}</Text>
              <Text style={[styles.accomplishmentBody, { color: palette.muted }]}>{item.targetAccuracy}</Text>
              {item.clinicianNotes ? <Text style={[styles.accomplishmentBody, { color: palette.muted }]}>{item.clinicianNotes}</Text> : null}
              {item.quote ? <Text style={[styles.quote, { color: '#E07A5F' }]}>{item.quote}</Text> : null}
              <View style={[styles.audio, { backgroundColor: '#FFF7ED' }]}>
                <Text style={styles.audioTitle}>Child Audio</Text>
                <View style={styles.bars}>
                  {item.bars.map((height, index) => (
                    <View key={`${item.id}-${index}`} style={[styles.bar, { height, backgroundColor: '#F5A524' }]} />
                  ))}
                </View>
                <Text style={[styles.audioMeta, { color: palette.faint }]}>{item.audioLabel}</Text>
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
    <View style={[styles.stat, { backgroundColor: background }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {detail ? <Text style={[styles.statDetail, { color }]}>{detail}</Text> : null}
      {caption ? <Text style={styles.statCaption}>{caption}</Text> : null}
    </View>
  );
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  const { palette } = useTherapist();
  return (
    <View style={styles.overviewRow}>
      <Text style={[styles.overviewLabel, { color: palette.muted }]}>{label}</Text>
      <Text style={[styles.overviewBody, { color: palette.primary }]}>{value}</Text>
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
    <View style={styles.soapField}>
      <Text style={[styles.soapLabel, { color: palette.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.faint}
        style={[styles.soapInput, { color: palette.text, borderColor: palette.line, backgroundColor: palette.input }]}
      />
    </View>
  );
}

function SoapLine({ letter, color, text }: { letter: string; color: string; text: string }) {
  const { palette } = useTherapist();
  return (
    <Text style={[styles.soapLine, { color: palette.text }]}>
      <Text style={{ color, fontWeight: '700' }}>{letter}: </Text>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  missing: { padding: 24 },
  back: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 12 },
  profileRow: { flexDirection: 'row', gap: 10 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFFFFF', fontWeight: '700' },
  profileCopy: { flex: 1, gap: 2 },
  name: { fontSize: 18, fontWeight: '700' },
  meta: { fontSize: 12 },
  diagnosis: { fontSize: 12 },
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
