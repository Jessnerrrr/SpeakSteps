import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { useTherapist } from '@/components/therapist/TherapistProvider';
import { ChevronLeftIcon } from '@/components/therapist/icons';
import { PracticeContent } from '@/Therapist-modules/therapist-activities/components/ActivityDetail';
import { FieldMenu } from '@/Therapist-modules/therapist-activities/components/FieldMenu';
import { patientName } from '@/Therapist-modules/therapist-patients/data/samplePatients';
import { useActivities } from '@/Therapist-modules/therapist-activities/state/ActivitiesProvider';

export function AssignActivity() {
  const { palette, patients } = useTherapist();
  const { activities, assignActivity, beginEdit } = useActivities();
  const params = useLocalSearchParams<{ id?: string }>();
  const initialId = (Array.isArray(params.id) ? params.id[0] : params.id) || 'ready-set-r';
  const studentNames = patients.map((patient) => patientName(patient));
  const [student, setStudent] = useState(studentNames[0] || '');
  const [activityId, setActivityId] = useState(initialId || activities[0]?.id || '');
  const [dueDate, setDueDate] = useState('01/11/2026');
  const activity = activities.find((item) => item.id === activityId) || activities[0];
  const [instructions, setInstructions] = useState(activity?.instructions || '');
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');

  const chooseActivity = (title: string) => {
    const next = activities.find((item) => item.title === title);
    if (!next) return;
    setActivityId(next.id);
    setInstructions(next.instructions);
    setPreview(false);
  };

  const assign = () => {
    if (!student || !activity) {
      setError('Choose a student and an activity.');
      return;
    }
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dueDate)) {
      setError('Enter the due date as mm/dd/yyyy.');
      return;
    }
    assignActivity(activity.id, student, dueDate, instructions);
    router.push('/therapist/activities' as never);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={[styles.back, { borderColor: palette.line }]}>
        <ChevronLeftIcon color={palette.text} size={18} />
      </Pressable>
      <Text style={[styles.title, { color: palette.text }]}>Assign Activity</Text>
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
            <Pressable accessibilityRole="button" onPress={assign} style={styles.primary}>
              <Text style={styles.primaryText}>Assign Activity</Text>
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
        <Pressable accessibilityRole="button" onPress={assign} style={styles.primary}>
          <Text style={styles.primaryText}>Assign Activity</Text>
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
