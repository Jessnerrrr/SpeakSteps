import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { Patient, Professional } from '../../data/center-admin';

const C = { ink: '#17364D', muted: '#48657A', subtle: '#60788D', blue: '#0865AD', soft: '#EAF7FF', line: '#D9E5EE', white: '#FFFFFF', green: '#287A4B', greenSoft: '#E8F5EC', yellow: '#8A5B00', yellowSoft: '#FFF4D8', red: '#AD3B42', redSoft: '#FDEBED' };

function Value({ label, value }: { label: string; value: string }) {
  return <View style={{ width: '50%', minWidth: 145, paddingVertical: 9, paddingRight: 14 }}><Text style={{ color: C.subtle, fontSize: 10, marginBottom: 4 }}>{label}</Text><Text style={{ color: C.ink, fontSize: 12, fontFamily: 'Geist-Medium' }}>{value}</Text></View>;
}

function Action({ label, onPress, tone = 'secondary' }: { label: string; onPress: () => void; tone?: 'primary' | 'secondary' | 'danger' }) {
  const background = tone === 'primary' ? C.blue : tone === 'danger' ? C.redSoft : C.white;
  const border = tone === 'primary' ? C.blue : tone === 'danger' ? '#F1C7CC' : C.line;
  const color = tone === 'primary' ? C.white : tone === 'danger' ? C.red : C.ink;
  return <TouchableOpacity accessibilityRole="button" onPress={onPress} style={{ minHeight: 42, paddingHorizontal: 13, borderWidth: 1, borderColor: border, borderRadius: 7, backgroundColor: background, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color, fontFamily: 'Geist-SemiBold', fontSize: 12 }}>{label}</Text></TouchableOpacity>;
}

export default function ProfessionalDetails({ person, students, onClose, onOpenStudent, onResendInvitation, onSuspend, onReactivate, onDeactivate }: {
  person: Professional;
  students: Patient[];
  onClose: () => void;
  onOpenStudent: (student: Patient) => void;
  onResendInvitation: () => void;
  onSuspend: (reason: string) => void;
  onReactivate: () => void;
  onDeactivate: () => void;
}) {
  const [suspending, setSuspending] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const access = person.access ?? (person.status === 'Suspended' ? 'Suspended' : 'Active');
  const membership = person.membership ?? (person.status === 'Deactivated' ? 'Deactivated' : 'Active');
  const setup = person.invitation === 'Completed' ? 'Completed' : person.invitation === 'Failed' ? 'Needs attention' : 'Pending';
  const suspend = () => {
    if (!reason.trim()) { setError('Enter a reason to suspend access.'); return; }
    onSuspend(reason.trim());
  };
  const field = (label: string, value?: string) => <Value label={label} value={value?.trim() || (person.role === 'Therapist' ? 'Not provided' : 'Unavailable in school records')} />;

  return <View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 19 }}>
      <View style={{ flex: 1 }}><Text style={{ color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 19 }}>{suspending ? 'Suspend access' : `${person.role} details`}</Text><Text style={{ color: C.muted, fontSize: 12, lineHeight: 17, marginTop: 4 }}>{suspending ? 'This prevents the account from signing in. Existing Student assignments stay unchanged.' : 'Account identity, setup, and assigned Students'}</Text></View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={suspending ? 'Cancel suspension' : 'Close professional details'} onPress={suspending ? () => { setSuspending(false); setReason(''); setError(''); } : onClose} style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: '#F0F6FA' }}><Ionicons name={suspending ? 'arrow-back' : 'close'} size={19} color={C.ink} /></TouchableOpacity>
    </View>

    {suspending ? <>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 7, backgroundColor: C.yellowSoft, marginBottom: 16 }}><Ionicons name="warning-outline" size={18} color={C.yellow} /><Text style={{ flex: 1, color: C.ink, fontSize: 12, lineHeight: 17 }}>Suspending {person.name} blocks sign-in. Their professional history and current Student assignments will remain in the center.</Text></View>
      <Text style={{ color: C.ink, fontSize: 12, fontFamily: 'Geist-SemiBold', marginBottom: 7 }}>Reason for suspension</Text>
      <TextInput value={reason} onChangeText={(value) => { setReason(value); setError(''); }} placeholder="Explain why access should be suspended" placeholderTextColor={C.subtle} multiline accessibilityLabel="Reason for suspension" style={{ minHeight: 90, paddingHorizontal: 11, paddingVertical: 10, borderRadius: 7, borderWidth: 1, borderColor: error ? C.red : C.line, color: C.ink, fontSize: 13, textAlignVertical: 'top' }} />
      {error ? <Text accessibilityLiveRegion="polite" style={{ color: C.red, fontSize: 11, marginTop: 6 }}>{error}</Text> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, paddingTop: 17, marginTop: 14, borderTopWidth: 1, borderTopColor: C.line }}><Action label="Cancel" onPress={() => { setSuspending(false); setReason(''); setError(''); }} /><Action label="Suspend Access" tone="danger" onPress={suspend} /></View>
    </> : <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: C.line }}><View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.blue, fontFamily: 'Geist-SemiBold', fontSize: 11 }}>{person.name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</Text></View><View style={{ flex: 1, minWidth: 0 }}><Text style={{ color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 17 }}>{person.name}</Text><Text style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{person.email}</Text></View></View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 10 }}>
        <Value label="Role" value={person.role} />
        <Value label={person.role === 'Therapist' ? 'Staff ID · admin provided' : 'Professional ID · school provided'} value={person.role === 'Therapist' ? person.staffId ?? 'Not recorded' : person.professionalIdentifier ?? 'Unavailable in school records'} />
        <Value label="Account access" value={access} />
        <Value label="Center membership" value={membership} />
        <Value label="Setup" value={setup} />
        <Value label="Created" value={person.joined} />
      </View>

      <View style={{ paddingTop: 14, borderTopWidth: 1, borderTopColor: C.line }}>
        <Text style={{ color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 13, marginBottom: 3 }}>{person.role === 'Therapist' ? 'Professional profile' : 'School record'}</Text>
        <Text style={{ color: C.muted, fontSize: 11, lineHeight: 16, marginBottom: 6 }}>{person.role === 'Therapist' ? 'Prefilled from the staff record; the Therapist can update it after setup.' : 'Read-only information from the authoritative school directory.'}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {person.role === 'Therapist' ? <>
            <Value label="First name" value={person.firstName || 'Not provided'} />
            <Value label="Middle name" value={person.middleName || 'Not provided'} />
            <Value label="Last name" value={person.lastName || 'Not provided'} />
            {field('Professional title', person.professionalTitle)}
            {field('Specialization', person.specialization)}
            {field('License / registration', person.licenseNumber)}
            {field('Contact number', person.contactNumber)}
          </> : <>
            {field('School', person.school)}
            {field('Grade / section', person.gradeSections?.join(', '))}
          </>}
        </View>
      </View>

      <View style={{ paddingTop: 15, marginTop: 6, borderTopWidth: 1, borderTopColor: C.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 13 }}>Assigned Students</Text><Text style={{ color: C.muted, fontSize: 11 }}>{students.length}</Text></View>
        {students.map((student) => <TouchableOpacity key={student.id} accessibilityRole="link" accessibilityLabel={`Open ${student.name} in Students`} onPress={() => onOpenStudent(student)} style={{ minHeight: 53, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: C.line }}><View style={{ flex: 1, minWidth: 0 }}><Text style={{ color: C.ink, fontFamily: 'Geist-Medium', fontSize: 12 }}>{student.name}</Text><Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{student.studentNumber}</Text></View><Text style={{ color: student.enrollment === 'Enrolled' ? C.green : C.subtle, fontSize: 11 }}>{student.enrollment}</Text><Ionicons name="chevron-forward" size={15} color={C.subtle} /></TouchableOpacity>)}
        {students.length === 0 ? <Text style={{ color: C.muted, fontSize: 12, paddingVertical: 10 }}>No Students are currently assigned.</Text> : null}
      </View>

      <View style={{ paddingTop: 15, marginTop: 7, borderTopWidth: 1, borderTopColor: C.line }}>
        <Text style={{ color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 13, marginBottom: 10 }}>Account management</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 }}>
          {person.invitation !== 'Completed' ? <Action label="Record invitation follow-up" onPress={onResendInvitation} /> : null}
          {membership === 'Deactivated' ? <Action label="Reactivate account" tone="primary" onPress={onReactivate} /> : <>
            {access === 'Suspended' ? <Action label="Reactivate access" tone="primary" onPress={onReactivate} /> : <Action label="Suspend access" tone="danger" onPress={() => setSuspending(true)} />}
            <Action label="Deactivate account" onPress={onDeactivate} />
          </>}
        </View>
      </View>
    </>}
  </View>;
}
