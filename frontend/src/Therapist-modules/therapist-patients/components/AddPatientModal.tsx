import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useTherapist } from '@/components/therapist/TherapistProvider';
import { SelectField } from '@/Therapist-modules/therapist-patients/components/SelectField';
import {
  dominantErrorPatterns,
  hierarchyLevels,
  languageProfiles,
  patientSuffixes,
  phonemePositions,
  targetSounds,
  type PhonemePosition,
} from '@/Therapist-modules/therapist-patients/data/options';
import { type NewPatientInput } from '@/Therapist-modules/therapist-patients/data/samplePatients';

const emptyForm = (): NewPatientInput => ({
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  dateOfBirth: '',
  age: '',
  languageProfile: '',
  diagnosis: '',
  guardianName: '',
  relationship: '',
  contactNumber: '',
  guardianEmail: '',
  targetSound: '',
  hierarchyLevel: '',
  phonemePositions: [],
  secondaryTargets: '',
  dominantErrorPattern: '',
  dominantErrorOther: '',
  errorPatternTaxonomy: '',
  clinicalNotation: '',
});

export function AddPatientModal() {
  const { palette, setAddPatientOpen, addPatient } = useTherapist();
  const [form, setForm] = useState<NewPatientInput>(emptyForm);
  const [errors, setErrors] = useState<string[]>([]);

  const set = <K extends keyof NewPatientInput>(key: K, value: NewPatientInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const togglePosition = (position: PhonemePosition) => {
    setForm((current) => ({
      ...current,
      phonemePositions: current.phonemePositions.includes(position)
        ? current.phonemePositions.filter((item) => item !== position)
        : [...current.phonemePositions, position],
    }));
  };

  const onDobChange = (value: string) => {
    const age = ageFromDob(value);
    setForm((current) => ({ ...current, dateOfBirth: value, age: age || current.age }));
  };

  const save = () => {
    const nextErrors = validatePatient(form);
    setErrors(nextErrors);
    if (nextErrors.length > 0) return;
    addPatient(form);
    setForm(emptyForm());
    setAddPatientOpen(false);
  };

  const close = () => setAddPatientOpen(false);

  return (
    <View style={styles.layer}>
      <Pressable style={styles.backdrop} onPress={close} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <View style={[styles.sheet, { backgroundColor: palette.card }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: palette.text }]}>Add Patient Profile</Text>
            <Pressable accessibilityLabel="Close add patient" onPress={close} hitSlop={8}>
              <Text style={[styles.close, { color: palette.muted }]}>×</Text>
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            {errors.length > 0 ? <Text style={[styles.error, { color: palette.alert }]}>{errors[0]}</Text> : null}

            <Text style={[styles.section, { color: palette.primary }]}>1. PERSONAL INFORMATION</Text>
            <View style={styles.row}>
              <Field label="First Name" required value={form.firstName} onChangeText={(value) => set('firstName', value)} placeholder="Enter first name" />
              <Field label="Middle Name" value={form.middleName} onChangeText={(value) => set('middleName', value)} placeholder="Optional" />
            </View>
            <View style={styles.row}>
              <Field label="Last Name" required value={form.lastName} onChangeText={(value) => set('lastName', value)} placeholder="Enter last name" />
              <SelectField label="Suffix" value={form.suffix} placeholder="Suffix" options={patientSuffixes} onChange={(value) => set('suffix', value)} />
            </View>
            <View style={styles.row}>
              <Field label="Date of Birth" required value={form.dateOfBirth} onChangeText={onDobChange} placeholder="mm/dd/yyyy" />
              <Field label="Age" required value={form.age} onChangeText={(value) => set('age', value.replace(/[^\d]/g, ''))} placeholder="Age" keyboardType="number-pad" />
            </View>
            <SelectField
              label="Language Profile"
              required
              value={form.languageProfile}
              placeholder="Select language profile"
              options={languageProfiles}
              onChange={(value) => set('languageProfile', value)}
            />
            <Field
              label="Primary Diagnosis / Disorder Label"
              required
              value={form.diagnosis}
              onChangeText={(value) => set('diagnosis', value)}
              placeholder="e.g. Articulation Disorder - Rhoticity"
            />

            <Text style={[styles.section, { color: palette.primary }]}>2. GUARDIAN & EMERGENCY CONTACT</Text>
            <Field label="Guardian Full Name" required value={form.guardianName} onChangeText={(value) => set('guardianName', value)} placeholder="Enter guardian name" />
            <View style={styles.row}>
              <Field label="Relationship" required value={form.relationship} onChangeText={(value) => set('relationship', value)} placeholder="Parent" />
              <Field label="Contact Number" required value={form.contactNumber} onChangeText={(value) => set('contactNumber', value)} placeholder="+63" keyboardType="phone-pad" />
            </View>
            <Field
              label="Guardian Email Address"
              required
              value={form.guardianEmail}
              onChangeText={(value) => set('guardianEmail', value)}
              placeholder="name@email.com"
              keyboardType="email-address"
            />

            <Text style={[styles.section, { color: palette.primary }]}>3. SPEECH SOUND BASELINE</Text>
            <View style={styles.row}>
              <SelectField
                label="Target Sound Error"
                required
                value={form.targetSound}
                placeholder="Select sound"
                options={targetSounds}
                onChange={(value) => set('targetSound', value)}
              />
              <SelectField
                label="Hierarchy Level"
                required
                value={form.hierarchyLevel}
                placeholder="Select level"
                options={hierarchyLevels}
                onChange={(value) => set('hierarchyLevel', value)}
              />
            </View>
            <Text style={[styles.label, { color: palette.muted }]}>
              Phoneme Error Position <Text style={{ color: palette.alert }}>*</Text>
            </Text>
            <View style={styles.checks}>
              {phonemePositions.map((position) => {
                const checked = form.phonemePositions.includes(position);
                return (
                  <Pressable key={position} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => togglePosition(position)} style={styles.check}>
                    <View style={[styles.box, { borderColor: checked ? palette.primary : palette.line, backgroundColor: checked ? palette.primary : palette.card }]}>
                      {checked ? <Text style={styles.checkMark}>✓</Text> : null}
                    </View>
                    <Text style={[styles.checkLabel, { color: palette.text }]}>{position}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Field label="Secondary Phoneme Targets" required value={form.secondaryTargets} onChangeText={(value) => set('secondaryTargets', value)} placeholder="/l/, /w/" />
            <SelectField
              label="Dominant Error Pattern"
              required
              value={form.dominantErrorPattern}
              placeholder="Select pattern"
              options={dominantErrorPatterns}
              onChange={(value) => set('dominantErrorPattern', value)}
            />
            {form.dominantErrorPattern === 'Others:' ? (
              <Field label="Other pattern" required value={form.dominantErrorOther} onChangeText={(value) => set('dominantErrorOther', value)} placeholder="Describe the pattern" />
            ) : null}
            <Field label="Error Pattern Taxonomy" required value={form.errorPatternTaxonomy} onChangeText={(value) => set('errorPatternTaxonomy', value)} placeholder="e.g. Gliding" />
            <Field label="Clinical Notation" required value={form.clinicalNotation} onChangeText={(value) => set('clinicalNotation', value)} placeholder='e.g. "Rabbit" → "Wabbit"' />
          </ScrollView>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={close} style={styles.cancel}>
              <Text style={[styles.cancelText, { color: palette.muted }]}>Cancel</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={save} style={[styles.save, { backgroundColor: palette.primary }]}>
              <Text style={styles.saveText}>Save Patient</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  required,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
}) {
  const { palette } = useTherapist();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: palette.muted }]}>
        {label}
        {required ? <Text style={{ color: palette.alert }}> *</Text> : null}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.faint}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        style={[styles.input, { color: palette.text, backgroundColor: palette.input, borderColor: palette.line }]}
      />
    </View>
  );
}

function ageFromDob(value: string) {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return '';
  const date = new Date(Number(match[3]), Number(match[1]) - 1, Number(match[2]));
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const month = today.getMonth() - date.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < date.getDate())) age -= 1;
  return age >= 0 && age < 120 ? String(age) : '';
}

function validatePatient(form: NewPatientInput) {
  if (!form.firstName.trim() || !form.lastName.trim()) return ['Enter the patient’s first and last name.'];
  if (!form.dateOfBirth.trim() || !form.age.trim()) return ['Enter the date of birth and age.'];
  if (!form.languageProfile) return ['Select a language profile.'];
  if (!form.diagnosis.trim()) return ['Enter the primary diagnosis.'];
  if (!form.guardianName.trim() || !form.relationship.trim()) return ['Enter the guardian name and relationship.'];
  if (form.contactNumber.replace(/\D/g, '').length < 7) return ['Enter a valid contact number.'];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guardianEmail.trim())) return ['Enter a valid guardian email address.'];
  if (!form.targetSound) return ['Select a target sound error.'];
  if (!form.hierarchyLevel) return ['Select a hierarchy level.'];
  if (form.phonemePositions.length === 0) return ['Select at least one phoneme error position.'];
  if (!form.secondaryTargets.trim()) return ['Enter the secondary phoneme targets.'];
  if (!form.dominantErrorPattern) return ['Select a dominant error pattern.'];
  if (form.dominantErrorPattern === 'Others:' && !form.dominantErrorOther.trim()) return ['Describe the other error pattern.'];
  if (!form.errorPatternTaxonomy.trim() || !form.clinicalNotation.trim()) return ['Enter the error pattern taxonomy and clinical notation.'];
  return [];
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 30, justifyContent: 'center' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(15, 23, 42, 0.28)' },
  sheetWrap: { marginHorizontal: 16, maxHeight: '92%' },
  sheet: { borderRadius: 18, overflow: 'hidden', maxHeight: '100%' },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  close: { fontSize: 26, lineHeight: 28 },
  form: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  section: { fontSize: 12, fontWeight: '700', marginTop: 8 },
  row: { flexDirection: 'row', gap: 10 },
  field: { flex: 1, gap: 6 },
  label: { fontSize: 12, fontWeight: '600' },
  input: { height: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 13 },
  checks: { flexDirection: 'row', gap: 14 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  box: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  checkLabel: { fontSize: 13 },
  error: { fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, padding: 16 },
  cancel: { paddingVertical: 10, paddingHorizontal: 8 },
  cancelText: { fontSize: 14, fontWeight: '600' },
  save: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  saveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
