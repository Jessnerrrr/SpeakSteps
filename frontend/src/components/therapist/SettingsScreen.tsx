import { useEffect, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTherapist } from '@/components/therapist/TherapistProvider';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/therapist/icons';
import { profileInitial } from '@/Therapist-modules/therapist-homepage/data/sampleData';
import type { ThemeMode } from '@/styles/therapistPalette';

type SettingsPage = 'main' | 'profile' | 'password';
export type SettingsEntry = 'profile' | 'settings';

export function SettingsScreen({ entry }: { entry: SettingsEntry }) {
  const { setSettingsOpen } = useTherapist();
  const [page, setPage] = useState<SettingsPage>(entry === 'profile' ? 'profile' : 'main');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onKey = (event: Event) => {
      if ((event as { key?: string }).key !== 'Escape') return;
      if (page === 'password' || (page === 'profile' && entry === 'settings')) setPage('main');
      else setSettingsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [entry, page, setSettingsOpen]);

  return (
    <View style={styles.fill}>
      {page === 'main' ? <SettingsMain onEdit={() => setPage('profile')} onPassword={() => setPage('password')} /> : null}
      {page === 'profile' ? (
        <EditProfileScreen
          backLabel={entry === 'profile' ? 'Back' : 'Back to settings'}
          onBack={() => (entry === 'profile' ? setSettingsOpen(false) : setPage('main'))}
        />
      ) : null}
      {page === 'password' ? <ChangePasswordScreen onBack={() => setPage('main')} /> : null}
    </View>
  );
}

function SettingsMain({ onEdit, onPassword }: { onEdit: () => void; onPassword: () => void }) {
  const {
    palette,
    profile,
    themeMode,
    setThemeMode,
    newRecordings,
    setNewRecordings,
    followUpAlerts,
    setFollowUpAlerts,
    passwordUpdated,
    setSettingsOpen,
  } = useTherapist();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}
    >
      <Pressable accessibilityLabel="Back" onPress={() => setSettingsOpen(false)} style={[styles.back, { borderColor: palette.line, backgroundColor: palette.card }]}>
        <ChevronLeftIcon color={palette.text} size={18} />
      </Pressable>
      <View style={styles.profile}>
        <View style={[styles.avatar, { backgroundColor: palette.primary }]}>
          <Text style={styles.avatarText}>{profileInitial(profile.fullName)}</Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={[styles.name, { color: palette.text }]}>{profile.fullName}</Text>
          <Text style={[styles.role, { color: palette.muted }]}>{profile.role}</Text>
          <Text style={[styles.license, { color: palette.faint }]}>License: {profile.license}</Text>
        </View>
      </View>

      <Text style={[styles.section, { color: palette.muted }]}>Account</Text>
      <View style={[styles.card, { backgroundColor: palette.card }]}>
        <SettingsRow title="Edit Profile" subtitle="Name, clinic, contact number" onPress={onEdit} />
        <SettingsRow title="Clinic" subtitle={profile.clinic} />
        <SettingsRow title="Contact" subtitle={profile.contact} />
        <SettingsRow title="Email" subtitle={profile.email} />
        <SettingsRow
          title="Change Password"
          subtitle={passwordUpdated ? 'Password updated' : undefined}
          subtitleColor={passwordUpdated ? palette.green : undefined}
          onPress={onPassword}
          last
        />
      </View>

      <Text style={[styles.section, { color: palette.muted }]}>Notifications</Text>
      <View style={[styles.card, { backgroundColor: palette.card }]}>
        <ToggleRow
          title="New Recordings"
          subtitle="When a child or parent submits"
          value={newRecordings}
          onChange={setNewRecordings}
        />
        <ToggleRow
          title="Follow-Up Alerts"
          subtitle="Patients who need practice follow-up"
          value={followUpAlerts}
          onChange={setFollowUpAlerts}
          last
        />
      </View>

      <Text style={[styles.section, { color: palette.muted }]}>Appearance</Text>
      <View style={[styles.themeRow, { backgroundColor: palette.card }]}>
        <Text style={[styles.themeLabel, { color: palette.text }]}>Theme</Text>
        <View style={[styles.segment, { backgroundColor: palette.background }]}>
          {(['auto', 'light', 'dark'] as ThemeMode[]).map((mode) => {
            const selected = themeMode === mode;
            const label = mode === 'auto' ? 'Auto' : mode === 'light' ? 'Light' : 'Dark';
            return (
              <Pressable
                key={mode}
                onPress={() => setThemeMode(mode)}
                style={[styles.segmentItem, selected && { backgroundColor: palette.primarySoft }]}
              >
                <Text style={[styles.segmentText, { color: selected ? palette.primaryText : palette.muted }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

    </ScrollView>
  );
}

function SettingsRow({
  title,
  subtitle,
  subtitleColor,
  onPress,
  last,
}: {
  title: string;
  subtitle?: string;
  subtitleColor?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const { palette } = useTherapist();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title}
      disabled={!onPress}
      onPress={onPress}
      style={[styles.row, !last && { borderBottomColor: palette.line, borderBottomWidth: StyleSheet.hairlineWidth }]}
    >
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: palette.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.rowSubtitle, { color: subtitleColor || palette.faint }]}>{subtitle}</Text> : null}
      </View>
      {onPress ? <ChevronRightIcon color={palette.faint} /> : null}
    </Pressable>
  );
}

function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
  last,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
  last?: boolean;
}) {
  const { palette } = useTherapist();
  return (
    <View style={[styles.row, !last && { borderBottomColor: palette.line, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.rowSubtitle, { color: palette.faint }]}>{subtitle}</Text>
      </View>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        onPress={() => onChange(!value)}
        style={[
          styles.track,
          {
            backgroundColor: value ? palette.primary : palette.line,
            justifyContent: value ? 'flex-end' : 'flex-start',
          },
        ]}
      >
        <View style={styles.knob} />
      </Pressable>
    </View>
  );
}

function EditProfileScreen({ onBack, backLabel }: { onBack: () => void; backLabel: string }) {
  const { palette, profile, updateProfile } = useTherapist();
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState(profile.fullName);
  const [clinic, setClinic] = useState(profile.clinic);
  const [contact, setContact] = useState(profile.contact);
  const [error, setError] = useState('');

  const save = () => {
    if (fullName.trim().length < 2) {
      setError('Enter the therapist name.');
      return;
    }
    if (!clinic.trim()) {
      setError('Enter a clinic name.');
      return;
    }
    const digits = contact.replace(/\D/g, '');
    if (digits.length < 7) {
      setError('Enter a valid contact number.');
      return;
    }
    updateProfile({ fullName: fullName.trim(), clinic: clinic.trim(), contact: contact.trim() });
    onBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
        <View style={styles.formHeader}>
          <Pressable accessibilityLabel={backLabel} onPress={onBack} hitSlop={8}>
            <ChevronLeftIcon color={palette.text} />
          </Pressable>
          <Text style={[styles.formTitle, { color: palette.text }]}>Edit Profile</Text>
        </View>
        <Field label="Name" value={fullName} onChangeText={setFullName} />
        <Field label="Clinic" value={clinic} onChangeText={setClinic} />
        <Field label="Contact number" value={contact} onChangeText={setContact} keyboardType="phone-pad" />
        {error ? <Text style={[styles.error, { color: palette.alert }]}>{error}</Text> : null}
        <Pressable style={[styles.save, { backgroundColor: palette.primary }]} onPress={save}>
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ChangePasswordScreen({ onBack }: { onBack: () => void }) {
  const { palette, updatePassword } = useTherapist();
  const insets = useSafeAreaInsets();
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const save = () => {
    if (nextPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    const message = updatePassword(currentPassword, nextPassword);
    if (message) {
      setError(message);
      return;
    }
    onBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
        <View style={styles.formHeader}>
          <Pressable accessibilityLabel="Back to settings" onPress={onBack} hitSlop={8}>
            <ChevronLeftIcon color={palette.text} />
          </Pressable>
          <Text style={[styles.formTitle, { color: palette.text }]}>Change Password</Text>
        </View>
        <Field label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
        <Field label="New password" value={nextPassword} onChangeText={setNextPassword} secureTextEntry />
        <Field label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
        <Text style={[styles.hint, { color: palette.muted }]}>
          Use 8–20 characters with a lowercase letter, a capital letter, a number, and a special character.
        </Text>
        {error ? <Text style={[styles.error, { color: palette.alert }]}>{error}</Text> : null}
        <Pressable style={[styles.save, { backgroundColor: palette.primary }]} onPress={save}>
          <Text style={styles.saveText}>Update password</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'phone-pad';
}) {
  const { palette } = useTherapist();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: palette.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        placeholderTextColor={palette.faint}
        style={[styles.input, { color: palette.text, backgroundColor: palette.input, borderColor: palette.line }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  profileCopy: { flex: 1, gap: 2 },
  name: { fontSize: 18, fontWeight: '700' },
  role: { fontSize: 13 },
  license: { fontSize: 12 },
  section: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 22,
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowCopy: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSubtitle: { fontSize: 12 },
  track: {
    width: 46,
    height: 28,
    borderRadius: 14,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  themeRow: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  themeLabel: { fontSize: 15, fontWeight: '600' },
  segment: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 3,
  },
  segmentItem: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  segmentText: { fontSize: 13, fontWeight: '600' },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  formTitle: { fontSize: 20, fontWeight: '700' },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  hint: { fontSize: 12, lineHeight: 18, marginBottom: 8 },
  error: { fontSize: 13, marginBottom: 8 },
  save: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
