import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { AssignmentHistory, Patient, Professional } from '../../data/center-admin';
import AccountDetailsActionRow from './AccountDetailsActionRow';

const C = { ink: '#17364D', muted: '#48657A', subtle: '#60788D', line: '#D9E5EE', green: '#287A4B' };

function Value({ label, value }: { label: string; value: string }) {
  return <View style={{ width: '50%', minWidth: 145, paddingVertical: 8, paddingRight: 14 }}>
    <Text style={{ color: C.subtle, fontSize: 11, lineHeight: 15, marginBottom: 3 }}>{label}</Text>
    <Text style={{ color: C.ink, fontSize: 14, lineHeight: 20, fontFamily: 'Geist-Medium' }}>{value}</Text>
  </View>;
}

function Section({ title, children, divider = false }: { title: string; children: React.ReactNode; divider?: boolean }) {
  return <View style={{ paddingTop: 18, marginTop: 4, borderTopWidth: divider ? 1 : 0, borderTopColor: C.line }}>
    <Text style={{ color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 15, lineHeight: 20, marginBottom: 7 }}>{title}</Text>
    {children}
  </View>;
}

const displayDate = (date: string) => {
  const parsed = new Date(`${date.slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? 'Not recorded' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed);
};

export default function ProfessionalDetails({ person, students, historicalAssignments = [], onOpenStudent, onResendInvitation, onSuspend, onReactivate, onDeactivate }: {
  person: Professional;
  students: Patient[];
  historicalAssignments?: { assignment: AssignmentHistory; student?: Patient }[];
  onOpenStudent: (student: Patient) => void;
  onResendInvitation: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
  onDeactivate: () => void;
}) {
  const access = person.access ?? (person.status === 'Suspended' ? 'Suspended' : 'Active');
  const membership = person.membership ?? (person.status === 'Deactivated' ? 'Deactivated' : 'Active');
  const setup = person.invitation === 'Completed' ? 'Completed' : person.invitation === 'Expired' ? 'Expired' : 'Pending';
  const activeStudents = students.filter((student) => student.enrollment === 'Enrolled');
  const field = (label: string, value?: string) => <Value label={label} value={value?.trim() || (person.role === 'Therapist' ? 'Not provided' : 'Unavailable in school records')} />;

  return <View>
    <Section title="Current Caseload">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <Text style={{ color: C.muted, fontSize: 12, lineHeight: 17 }}>Students currently assigned</Text>
        <Text style={{ color: C.muted, fontSize: 12, lineHeight: 17, textAlign: 'right' }}>{activeStudents.length} {activeStudents.length === 1 ? 'student' : 'students'}</Text>
      </View>
      {activeStudents.map((student) => <TouchableOpacity key={student.id} accessibilityRole="button" accessibilityLabel={`Open ${student.name}, currently assigned Student`} onPress={() => onOpenStudent(student)} style={{ minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 8 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ color: C.ink, fontFamily: 'Geist-Medium', fontSize: 14, lineHeight: 19 }}>{student.name}</Text>
          <Text style={{ color: C.muted, fontSize: 12, lineHeight: 17, marginTop: 2 }}>{student.studentNumber}</Text>
        </View>
        <Text style={{ color: C.green, fontFamily: 'Geist-Medium', fontSize: 12 }}>Current</Text>
        <Ionicons name="chevron-forward" size={16} color={C.subtle} />
      </TouchableOpacity>)}
      {activeStudents.length === 0 ? <View style={{ paddingVertical: 16, alignItems: 'center' }}><Text style={{ color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 15, lineHeight: 20 }}>No active assignments</Text><Text style={{ color: C.muted, fontSize: 12, lineHeight: 17, marginTop: 3, textAlign: 'center' }}>This {person.role.toLowerCase()} has no students currently assigned.</Text></View> : null}
    </Section>

    {historicalAssignments.length ? <Section title="Historical assignments" divider>
      {historicalAssignments.map(({ assignment, student }) => <View key={assignment.id} style={{ minHeight: 54, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 8 }}>
        <Text style={{ color: C.ink, fontFamily: 'Geist-Medium', fontSize: 13, lineHeight: 18 }}>{student?.name ?? 'Student record unavailable'} · {student?.studentNumber ?? 'Student number unavailable'}</Text>
        <Text style={{ color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 2 }}>{assignment.role} assignment · {assignment.endReason || 'Reason not recorded'} · {assignment.endedAt ? displayDate(assignment.endedAt) : 'End date not recorded'}</Text>
      </View>)}
    </Section> : null}

    <Section title={person.role === 'Therapist' ? 'Professional information' : 'School information'} divider>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {person.role === 'Therapist' ? <>
          {field('Professional title', person.professionalTitle)}
          {field('Specialization', person.specialization)}
          {field('License / registration', person.licenseNumber)}
          {field('Contact number', person.contactNumber)}
        </> : <>
          {field('School', person.school)}
          {field('Grade / section', person.gradeSections?.join(', '))}
        </>}
        <Value label="Account created" value={displayDate(person.joined)} />
      </View>
    </Section>

    <Section title="Account actions" divider>
      {setup !== 'Completed' ? <AccountDetailsActionRow title="Follow up on setup" detail="No email is sent." label="Follow up" onPress={onResendInvitation} tone="primary" /> : null}
      {membership === 'Deactivated' ? <AccountDetailsActionRow title="Reinstate professional" detail="Restore center membership." label="Reinstate" onPress={onReactivate} tone="primary" /> : <>
        {access === 'Suspended'
          ? <AccountDetailsActionRow title="Restore account access" detail="Allow this professional to sign in." label="Reactivate access" onPress={onReactivate} tone="primary" />
          : <AccountDetailsActionRow title="Suspend access" detail="Require a reason to continue." label="Suspend" onPress={onSuspend} />}
        <AccountDetailsActionRow title="Deactivate professional" detail={`${activeStudents.length} enrolled Students linked.`} label="Deactivate" onPress={onDeactivate} tone="danger" />
      </>}
    </Section>
  </View>;
}
