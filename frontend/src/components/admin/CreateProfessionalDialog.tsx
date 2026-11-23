import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { Professional, ProfessionalRole, TeacherSchoolRecord, TherapistStaffRecord } from '../../data/center-admin';
import { teacherSchoolRecords, therapistStaffRecords } from '../../data/center-admin';

const palette = { ink: '#17364D', muted: '#48657A', subtle: '#60788D', blue: '#0865AD', soft: '#EAF7FF', line: '#D9E5EE', white: '#FFFFFF', red: '#AD3B42', redSoft: '#FDEBED', green: '#287A4B', greenSoft: '#E8F4EC', violet: '#6941C6', violetSoft: '#F1EBFF' };

type TherapistDraft = TherapistStaffRecord & { role: 'Therapist' };
type TeacherDraft = TeacherSchoolRecord & { role: 'Teacher' };
export type ProfessionalDraft = TherapistDraft | TeacherDraft;
type LookupRecord = TherapistStaffRecord | TeacherSchoolRecord;

export default function CreateProfessionalDialog({ role, existingProfessionals, onClose, onCreate, onSwitchRole }: {
  role: ProfessionalRole;
  existingProfessionals: Professional[];
  onClose: () => void;
  onCreate: (draft: ProfessionalDraft) => void;
  onSwitchRole: (role: 'Student' | ProfessionalRole) => void;
}) {
  const [staffId, setStaffId] = useState('');
  const [matchedRecord, setMatchedRecord] = useState<LookupRecord | null>(null);
  const [error, setError] = useState('');

  const normalizedId = staffId.trim().toUpperCase();
  const alreadyRegistered = matchedRecord ? existingProfessionals.some((person) => person.role === role && (
    role === 'Therapist'
      ? person.staffId?.toUpperCase() === normalizedId || person.email.toLowerCase() === matchedRecord.email.toLowerCase()
      : person.professionalIdentifier === (matchedRecord as TeacherSchoolRecord).professionalIdentifier || person.email.toLowerCase() === matchedRecord.email.toLowerCase()
  )) : false;

  const lookup = () => {
    const query = staffId.trim().replace(/\s+/g, '').toUpperCase();
    if (!query) { setError('Enter a Staff ID.'); setMatchedRecord(null); return; }
    if (query.length > 40) { setError('Staff ID must be 40 characters or fewer.'); setMatchedRecord(null); return; }
    const record = role === 'Therapist'
      ? therapistStaffRecords.find((item) => item.staffId.toUpperCase() === query)
      : teacherSchoolRecords.find((item) => item.lookupStaffId.toUpperCase() === query);
    if (!record) {
      setMatchedRecord(null);
      setError(`No matching ${role} record was found. Check the Staff ID and try again.`);
      return;
    }
    setStaffId(query);
    setMatchedRecord(record);
    setError('');
  };

  const create = () => {
    if (!matchedRecord || alreadyRegistered) return;
    if (role === 'Therapist' && 'staffId' in matchedRecord) onCreate({ ...matchedRecord, role: 'Therapist' });
    if (role === 'Teacher' && 'lookupStaffId' in matchedRecord) onCreate({ ...matchedRecord, role: 'Teacher' });
  };

  const field = (label: string, value: string) => <View key={label} style={{ width: '50%', minWidth: 150, paddingVertical: 8, paddingRight: 14 }}><Text style={{ color: palette.subtle, fontSize: 10, marginBottom: 4 }}>{label}</Text><Text style={{ color: palette.ink, fontFamily: 'Geist-Medium', fontSize: 12 }}>{value || 'Not available'}</Text></View>;

  return <View style={{ minHeight: 0, flexShrink: 1 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 15, marginBottom: 13 }}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ color: palette.ink, fontFamily: 'Geist-SemiBold', fontSize: 19 }}>Add a {role.toLowerCase()}</Text>
        <Text style={{ color: palette.muted, fontSize: 12, lineHeight: 17, marginTop: 4 }}>Enter an existing Staff ID to load the matching record.</Text>
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close account form" onPress={onClose} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: '#F0F6FA' }}><Ionicons name="close" size={20} color={palette.ink} /></TouchableOpacity>
    </View>

    <Text style={{ color: palette.ink, fontSize: 12, fontFamily: 'Geist-SemiBold', marginBottom: 7 }}>Account type</Text>
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 13 }}>
      {(['Student', 'Therapist', 'Teacher'] as const).map((option) => {
        const selected = option === role;
        const color = option === 'Student' ? palette.green : option === 'Therapist' ? palette.blue : palette.violet;
        const soft = option === 'Student' ? palette.greenSoft : option === 'Therapist' ? palette.soft : palette.violetSoft;
        return <TouchableOpacity key={option} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => onSwitchRole(option)} style={{ flex: 1, minHeight: 42, borderWidth: 1, borderColor: selected ? color : palette.line, backgroundColor: selected ? soft : palette.white, borderRadius: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Ionicons name={option === 'Student' ? 'person-outline' : option === 'Therapist' ? 'heart-outline' : 'school-outline'} size={17} color={color} />
          <Text style={{ color, fontFamily: selected ? 'Geist-SemiBold' : 'Geist-Regular', fontSize: 12 }}>{option}</Text>
        </TouchableOpacity>;
      })}
    </View>

    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 9, marginBottom: 5 }}>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={{ color: palette.ink, fontSize: 12, fontFamily: 'Geist-SemiBold' }}>Staff ID</Text>
        <TextInput value={staffId} onChangeText={(value) => { setStaffId(value.toUpperCase()); setMatchedRecord(null); setError(''); }} onSubmitEditing={lookup} placeholder={role === 'Therapist' ? 'For example, TH-1234' : 'For example, TR-1234'} placeholderTextColor={palette.subtle} autoCapitalize="characters" autoCorrect={false} maxLength={40} accessibilityLabel="Staff ID" style={{ height: 42, paddingHorizontal: 11, borderRadius: 7, borderWidth: 1, borderColor: error ? palette.red : palette.line, backgroundColor: palette.white, color: palette.ink, fontSize: 13 }} />
      </View>
      <TouchableOpacity accessibilityRole="button" onPress={lookup} style={{ minHeight: 42, paddingHorizontal: 14, borderRadius: 7, backgroundColor: palette.blue, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: palette.white, fontFamily: 'Geist-SemiBold', fontSize: 12 }}>Search</Text></TouchableOpacity>
    </View>
    {error ? <Text accessibilityLiveRegion="polite" style={{ color: palette.red, fontSize: 11, lineHeight: 16, marginTop: 5 }}>{error}</Text> : null}

    <ScrollView style={{ flexShrink: 1, marginTop: 8 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 3 }}>
      {matchedRecord ? <>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 }}><Ionicons name="checkmark-circle" size={16} color={alreadyRegistered ? palette.red : palette.green} /><Text style={{ color: alreadyRegistered ? palette.red : palette.green, fontFamily: 'Geist-SemiBold', fontSize: 12 }}>{alreadyRegistered ? 'This record already has an account.' : 'Record found'}</Text></View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 4 }}>
          <View style={{ width: '100%', borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 10, marginTop: 4 }}><Text style={{ color: palette.ink, fontFamily: 'Geist-SemiBold', fontSize: 13 }}>{role === 'Therapist' ? 'Professional profile' : 'School record'}</Text></View>
          {field('Full name', matchedRecord.name)}
          {field('Work email', matchedRecord.email)}
          {role === 'Therapist' && 'staffId' in matchedRecord ? <>
            {field('Staff ID · admin provided', matchedRecord.staffId)}
            {field('Professional title', matchedRecord.professionalTitle)}
            {field('Specialization', matchedRecord.specialization)}
            {field('License / registration', matchedRecord.licenseNumber)}
            {field('Contact number', matchedRecord.contactNumber)}
            <Text style={{ color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 8 }}>Profile details are prefilled and can be updated by the Therapist after setup.</Text>
          </> : null}
          {role === 'Teacher' && 'lookupStaffId' in matchedRecord ? <>
            {field('Professional ID · school provided', matchedRecord.professionalIdentifier)}
            {field('School', matchedRecord.school)}
            {field('Grade / section', matchedRecord.gradeSections.join(', '))}
            <Text style={{ color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 8 }}>Teacher identity and school details are read from the school record.</Text>
          </> : null}
        </View>
      </> : null}
    </ScrollView>

    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 12, flexWrap: 'wrap' }}>
      <TouchableOpacity accessibilityRole="button" onPress={onClose} style={{ minHeight: 44, paddingHorizontal: 15, borderWidth: 1, borderColor: palette.line, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: palette.ink, fontFamily: 'Geist-Medium', fontSize: 13 }}>Cancel</Text></TouchableOpacity>
      {matchedRecord && !alreadyRegistered ? <TouchableOpacity accessibilityRole="button" onPress={create} style={{ minHeight: 44, paddingHorizontal: 15, borderRadius: 7, backgroundColor: palette.blue, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: palette.white, fontFamily: 'Geist-SemiBold', fontSize: 13 }}>Create {role} account</Text></TouchableOpacity> : null}
    </View>
  </View>;
}
