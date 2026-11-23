import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

type StudentRecord = {
  studentNumber: string; name: string; grade: string; section: string; guardian: string;
  guardianEmail: string; guardianPhone: string; school: string; teacherId: string;
};
type Therapist = { id: string; name: string; assigned: number };
type Teacher = { id: string; name: string };

const SCHOOL_RECORDS: StudentRecord[] = [
  { studentNumber: 'SN-1234', name: 'Nico Alvarez', grade: 'Grade 2', section: 'Sampaguita', guardian: 'Mara Alvarez', guardianEmail: 'mara.alvarez@example.org', guardianPhone: '+63 917 555 0142', school: 'Riverside Learning Center', teacherId: 'pro-2' },
  { studentNumber: 'SS-25015', name: 'Ella Villanueva', grade: 'Grade 1', section: 'Molave', guardian: 'Rina Villanueva', guardianEmail: 'rina.v@example.org', guardianPhone: '+63 918 555 0108', school: 'Riverside Learning Center', teacherId: 'pro-6' },
  { studentNumber: 'SS-25016', name: 'Gabriel Flores', grade: 'Grade 3', section: 'Narra', guardian: 'Luis Flores', guardianEmail: 'luis.flores@example.org', guardianPhone: '+63 905 555 0136', school: 'Northview School', teacherId: 'pro-2' },
];

const palette = { ink: '#17364D', muted: '#48657A', blue: '#0865AD', soft: '#EAF7FF', green: '#287A4B', greenSoft: '#E8F4EC', violet: '#6941C6', violetSoft: '#F1EBFF', line: '#D9E5EE', white: '#FFFFFF', red: '#A33C3C' };

export default function CreatePatientDialog({ teachers, therapists, existingNumbers, onClose, onCreate, onSwitchRole }: {
  teachers: Teacher[]; therapists: Therapist[]; existingNumbers: string[];
  onClose: () => void; onCreate: (record: StudentRecord, teacherId: string, therapistId: string) => void;
  onSwitchRole: (role: 'Therapist' | 'Teacher') => void;
}) {
  const [studentNumber, setStudentNumber] = useState('');
  const [record, setRecord] = useState<StudentRecord | null>(null);
  const [teacherId, setTeacherId] = useState('');
  const [therapistId, setTherapistId] = useState('');
  const [lookupState, setLookupState] = useState<'idle' | 'searching' | 'not-found' | 'unavailable' | 'already-registered'>('idle');
  const [roleSelect, setRoleSelect] = useState<'teacher' | 'therapist' | null>(null);

  const sortedTherapists = useMemo(() => [...therapists].sort((a, b) => a.assigned - b.assigned || a.name.localeCompare(b.name)), [therapists]);
  const close = () => {
    setStudentNumber(''); setRecord(null); setTeacherId(''); setTherapistId(''); setLookupState('idle'); setRoleSelect(null); onClose();
  };
  const lookup = () => {
    const number = studentNumber.trim().toUpperCase();
    if (!number) { setLookupState('not-found'); return; }
    setLookupState('searching'); setRecord(null); setTeacherId(''); setTherapistId('');
    setTimeout(() => {
      if (number === 'SS-25099') { setLookupState('unavailable'); return; }
      if (existingNumbers.includes(number)) { setLookupState('already-registered'); return; }
      const found = SCHOOL_RECORDS.find((item) => item.studentNumber === number);
      if (!found) { setLookupState('not-found'); return; }
      setRecord(found); setTeacherId(found.teacherId); setLookupState('idle');
    }, 400);
  };
  const create = () => { if (record && teacherId && therapistId) onCreate(record, teacherId, therapistId); close(); };

  return <>
    <View style={{ flex: 1, minHeight: 0 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 15, marginBottom: 14 }}>
        <View style={{ flex: 1, paddingRight: 12 }}><Text style={{ color: palette.ink, fontFamily: 'Geist-SemiBold', fontSize: 19 }}>Add a student</Text><Text style={{ color: palette.muted, fontSize: 12, lineHeight: 17, marginTop: 4 }}>Look up an existing student and confirm their Therapist.</Text></View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close student setup" onPress={close} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: '#F0F6FA' }}><Ionicons name="close" size={20} color={palette.ink} /></TouchableOpacity>
      </View>
      <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '700', marginBottom: 7 }}>Account type</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        {(['Student', 'Therapist', 'Teacher'] as const).map((role) => {
          const color = role === 'Student' ? palette.green : role === 'Therapist' ? palette.blue : palette.violet;
          const soft = role === 'Student' ? palette.greenSoft : role === 'Therapist' ? palette.soft : palette.violetSoft;
          const selected = role === 'Student';
          return <TouchableOpacity key={role} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={selected ? undefined : () => onSwitchRole(role as 'Therapist' | 'Teacher')} style={{ flex: 1, minHeight: 42, borderWidth: 1, borderColor: selected ? color : palette.line, backgroundColor: selected ? soft : palette.white, borderRadius: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Ionicons name={role === 'Student' ? 'person-outline' : role === 'Therapist' ? 'heart-outline' : 'school-outline'} size={17} color={color} /><Text style={{ color, fontSize: 12, fontWeight: selected ? '700' : '400' }}>{role}</Text></TouchableOpacity>;
        })}
      </View>
      <ScrollView style={{ flex: 1, minHeight: 0 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 8 }}>
        <Text style={labelStyle}>Student number</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 7 }}>
          <TextInput value={studentNumber} onChangeText={(value) => { setStudentNumber(value.toUpperCase()); setLookupState('idle'); }} placeholder="For example, SN-1234" placeholderTextColor="#627A8E" autoCapitalize="characters" returnKeyType="search" onSubmitEditing={lookup} accessibilityLabel="Student number" style={{ flex: 1, minWidth: 0, height: 42, borderWidth: 1, borderColor: palette.line, borderRadius: 7, paddingHorizontal: 11, color: palette.ink, fontSize: 13 }} />
          <TouchableOpacity accessibilityRole="button" onPress={lookup} disabled={lookupState === 'searching'} style={{ minHeight: 42, paddingHorizontal: 14, borderRadius: 7, backgroundColor: palette.blue, alignItems: 'center', justifyContent: 'center', opacity: lookupState === 'searching' ? .7 : 1 }}><Text style={{ color: palette.white, fontFamily: 'Geist-SemiBold', fontSize: 12 }}>{lookupState === 'searching' ? 'Searching…' : 'Search'}</Text></TouchableOpacity>
        </View>
        {lookupState === 'not-found' ? <Text accessibilityLiveRegion="polite" style={messageStyle(palette.red)}>No student matched that number. Check it and try again.</Text> : null}
        {lookupState === 'unavailable' ? <Text accessibilityLiveRegion="polite" style={messageStyle(palette.red)}>The school record lookup is unavailable in this demo. Try again later.</Text> : null}
        {lookupState === 'already-registered' ? <Text accessibilityLiveRegion="polite" style={messageStyle(palette.red)}>This student is already registered. Find them in Students.</Text> : null}
        {record ? <>
          <Section title="Student information" hint="Retrieved from the school record · read only">
            <Info label="Student" value={record.name} /><Info label="Student number" value={record.studentNumber} /><Info label="Grade & section" value={`${record.grade} · ${record.section}`} /><Info label="School" value={record.school} />
          </Section>
          <Section title="Guardian information" hint="Registered contact · read only">
            <Info label="Guardian" value={record.guardian} /><Info label="Email for setup invitation" value={record.guardianEmail} /><Info label="Contact number" value={record.guardianPhone} />
          </Section>
          <Section title="Assigned teacher" hint="Prefilled from school record; change it for this student only">
            <Choice value={teacherId} options={teachers} onPress={() => setRoleSelect('teacher')} empty="Choose an active Teacher" />
          </Section>
          <Section title="Assigned Therapist" hint="Required · sorted by current enrolled student count">
            {sortedTherapists.length ? sortedTherapists.map((person) => <TouchableOpacity key={person.id} accessibilityRole="radio" accessibilityState={{ checked: therapistId === person.id }} onPress={() => setTherapistId(person.id)} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#E7EEF4', paddingVertical: 8 }}>
              <View style={{ width: 19, height: 19, borderRadius: 10, borderWidth: 1.5, borderColor: therapistId === person.id ? palette.blue : '#7B91A3', alignItems: 'center', justifyContent: 'center' }}>{therapistId === person.id ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: palette.blue }} /> : null}</View>
              <Text style={{ flex: 1, color: palette.ink, fontSize: 14, fontWeight: '600' }}>{person.name}</Text><Text style={{ color: palette.muted, fontSize: 12 }}>{person.assigned} assigned</Text>
            </TouchableOpacity>) : <Text style={messageStyle(palette.red)}>No active Therapists are available. A student account cannot be created until one is active.</Text>}
          </Section>
        </> : null}
      </ScrollView>
      {record && (!teacherId || !therapistId) ? <Text accessibilityLiveRegion="polite" style={messageStyle(palette.red)}>{!teacherId ? 'Choose an active Teacher to continue.' : 'Choose a Therapist to create this student account.'}</Text> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 14, flexWrap: 'wrap' }}>
        <Action label="Cancel" onPress={close} />
        <Action label="Create student account" primary disabled={!record || !teacherId || !therapistId} onPress={create} />
      </View>
    </View>
    <Modal visible={roleSelect !== null} transparent animationType="fade" onRequestClose={() => setRoleSelect(null)}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(14, 38, 56, 0.38)', justifyContent: 'center', alignItems: 'center', padding: 16 }} onPress={() => setRoleSelect(null)}>
        <Pressable onPress={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: 420, backgroundColor: palette.white, borderRadius: 11, padding: 20 }}>
          <Text style={{ color: palette.ink, fontFamily: 'Geist-SemiBold', fontSize: 18, marginBottom: 10 }}>Choose an active {roleSelect === 'teacher' ? 'Teacher' : 'Therapist'}</Text>
          {(roleSelect === 'teacher' ? teachers.map((item) => ({ ...item, assigned: 0 })) : sortedTherapists).map((item) => <TouchableOpacity key={item.id} accessibilityRole="button" onPress={() => { if (roleSelect === 'teacher') setTeacherId(item.id); else setTherapistId(item.id); setRoleSelect(null); }} style={{ minHeight: 48, borderTopWidth: 1, borderTopColor: palette.line, justifyContent: 'center' }}><Text style={{ color: palette.ink, fontSize: 14 }}>{item.name}</Text></TouchableOpacity>)}
          {roleSelect === 'teacher' && teachers.length === 0 ? <Text style={messageStyle(palette.red)}>No active Teachers are available.</Text> : null}
          <Action label="Cancel" onPress={() => setRoleSelect(null)} />
        </Pressable>
      </Pressable>
    </Modal>
  </>;
}

const labelStyle = { color: palette.ink, fontSize: 13, fontWeight: '700' as const };
const messageStyle = (color: string) => ({ color, fontSize: 12, lineHeight: 17, marginTop: 8 });
function Section({ title, hint, children }: React.PropsWithChildren<{ title: string; hint: string }>) {
  return <View style={{ paddingTop: 16 }}><Text style={{ color: palette.ink, fontSize: 15, fontWeight: '700' }}>{title}</Text><Text style={{ color: palette.muted, fontSize: 12, marginTop: 3, marginBottom: 8 }}>{hint}</Text>{children}</View>;
}
function Info({ label, value }: { label: string; value: string }) {
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 4 }}><Text style={{ color: palette.muted, fontSize: 12 }}>{label}</Text><Text selectable style={{ color: palette.ink, fontSize: 12, fontWeight: '600', flexShrink: 1, textAlign: 'right' }}>{value}</Text></View>;
}
function Choice({ value, options, onPress, empty }: { value: string; options: Teacher[]; onPress: () => void; empty: string }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel="Edit assigned teacher" onPress={onPress} style={{ minHeight: 46, borderWidth: 1, borderColor: palette.line, borderRadius: 7, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><Text style={{ color: value ? palette.ink : palette.muted, fontSize: 13 }}>{options.find((item) => item.id === value)?.name ?? empty}</Text><Ionicons name="pencil" size={17} color="#7B8794" /></TouchableOpacity>;
}
function Action({ label, onPress, primary = false, disabled = false }: { label: string; onPress: () => void; primary?: boolean; disabled?: boolean }) {
  return <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={{ minHeight: 44, paddingHorizontal: 15, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: primary ? palette.blue : palette.white, borderWidth: primary ? 0 : 1, borderColor: palette.line, opacity: disabled ? .45 : 1 }}><Text style={{ color: primary ? palette.white : palette.ink, fontFamily: 'Geist-SemiBold', fontSize: 13 }}>{label}</Text></TouchableOpacity>;
}
