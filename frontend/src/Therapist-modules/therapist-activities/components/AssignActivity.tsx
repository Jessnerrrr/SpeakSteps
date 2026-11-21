import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { useTherapist } from '@/components/therapist/TherapistProvider';
import { ChevronLeftIcon } from '@/components/therapist/icons';
import { PracticeContent } from '@/Therapist-modules/therapist-activities/components/ActivityDetail';
import { FieldMenu } from '@/Therapist-modules/therapist-activities/components/FieldMenu';
import { patientName } from '@/Therapist-modules/therapist-patients/data/samplePatients';
import { useActivities } from '@/Therapist-modules/therapist-activities/state/ActivitiesProvider';

export function AssignActivity() {
  const { palette, patients, patientsLoading } = useTherapist();
  const { activities, assignActivity, beginEdit, loading } = useActivities();
  const params = useLocalSearchParams<{ id?: string }>();
  const initialId = (Array.isArray(params.id) ? params.id[0] : params.id) || '';
  const studentNames = patients
    .filter((patient) => patient.patientCode)
    .map((patient) => `${patientName(patient)} · ${patient.patientCode}`);
  const [student, setStudent] = useState('');
  const [activityId, setActivityId] = useState(initialId || activities[0]?.id || '');
  const [dueDate, setDueDate] = useState('');
  const activity = activities.find((item) => item.id === activityId) || activities[0];
  const [instructions, setInstructions] = useState(activity?.instructions || '');
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!student && studentNames.length) setStudent(studentNames[0]);
  }, [student, studentNames]);

  const chooseActivity = (title: string) => {
    const next = activities.find((item) => item.title === title);
    if (!next) return;
    setActivityId(next.id);
    setInstructions(next.instructions);
    setPreview(false);
  };

  const assign = async () => {
    if (!student || !activity) {
      setError('Choose a student and an activity.');
      return;
    }
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dueDate)) {
      setError('Enter the due date as mm/dd/yyyy.');
      return;
    }
    const [, month, day, year] = dueDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/) || [];
    const selectedPatient = patients.find((patient) => student.endsWith(`· ${patient.patientCode}`));
    if (!selectedPatient?.patientCode || !month || !day || !year) {
      setError('Choose a patient with a saved patient ID and enter a valid due date.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await assignActivity(activity.id, selectedPatient.patientCode, `${year}-${month}-${day}`, instructions);
      router.push('/therapist/activities' as never);
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : 'Could not assign this activity.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={[styles.back, { borderColor: palette.line }]}>
        <ChevronLeftIcon color={palette.text} size={18} />
      </Pressable>
      <Text style={[styles.title, { color: palette.text }]}>Assign Activity</Text>
      {patientsLoading || loading ? <Text style={{ color: palette.muted }}>Loading saved patients and activities…</Text> : null}
      {!patientsLoading && studentNames.length === 0 ? <Text style={styles.error}>No saved patients with patient IDs are available in your caseload.</Text> : null}
      <FieldMenu label="Student" value={student} options={studentNames} onChange={setStudent} />
      <FieldMenu label="Activity" value={activity?.title || 'Select activity'} options={activities.map((item) => item.title)} onChange={chooseActivity} />
      <Pressable accessibilityRole="button" onPress={() => setPreview((open) => !open)} style={styles.previewToggle}>
        <Text style={styles.previewToggleText}>Activity Preview</Text>
        <Text style={styles.previewToggleText}>{preview ? '▴' : '▾'}</Text>
      </Pressable>
      {preview && activity ? (
        <View style={styles.preview}>
          <PracticeContent activity={{ ...activity, instructions }} />
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                beginEdit(activity.id);
                router.push('/therapist/activities/edit' as never);
              }}
              style={[styles.secondary, { borderColor: palette.line }]}
            >
              <Text style={[styles.secondaryText, { color: palette.text }]}>Edit Activity</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={saving} onPress={() => void assign()} style={styles.primary}>
              <Text style={styles.primaryText}>{saving ? 'Assigning…' : 'Assign Activity'}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <Text style={[styles.label, { color: palette.text }]}>Due Date</Text>
      <TextInput value={dueDate} onChangeText={setDueDate} placeholder="mm/dd/yyyy" placeholderTextColor={palette.faint} style={[styles.input, { borderColor: palette.line, color: palette.text }]} />
      <Text style={[styles.label, { color: palette.text }]}>Instructions</Text>
      <TextInput
        value={instructions}
        onChangeText={setInstructions}
        multiline
        style={[styles.input, styles.multiline, { borderColor: palette.line, color: palette.text }]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={[styles.secondary, { borderColor: palette.line }]}>
          <Text style={[styles.secondaryText, { color: palette.text }]}>Cancel</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={saving} onPress={() => void assign()} style={styles.primary}>
          <Text style={styles.primaryText}>{saving ? 'Assigning…' : 'Assign Activity'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 28, gap: 12 },
  back: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  label: { fontSize: 15, fontWeight: '700' },
  input: { minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 14 },
  multiline: { minHeight: 72, paddingVertical: 10 },
  previewToggle: {
    borderWidth: 1,
    borderColor: '#F0D2BC',
    backgroundColor: '#FFF8F3',
    borderRadius: 10,
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewToggleText: { color: '#C48B5A', fontWeight: '700' },
  preview: { gap: 10 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  primary: { backgroundColor: '#C48B5A', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
  secondary: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  secondaryText: { fontWeight: '700' },
  error: { color: '#F5693F' },
});
