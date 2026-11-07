import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTherapist } from '@/components/therapist/TherapistProvider';
import { GearIcon, PersonIcon } from '@/components/therapist/icons';

export function SideMenu({
  onClose,
  onProfile,
  onSettings,
}: {
  onClose: () => void;
  onProfile: () => void;
  onSettings: () => void;
}) {
  const { palette } = useTherapist();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // This safely prevents the crash by stopping mobile devices from running web code
    if (Platform.OS !== 'web') return;

    const onKey = (event: any) => {
      if (event.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <View style={styles.overlay}>
      <Pressable accessibilityLabel="Close menu" onPress={onClose} style={styles.backdrop} />
      <View style={[styles.panel, { backgroundColor: palette.card, paddingTop: insets.top + 18, paddingBottom: insets.bottom + 16 }]}>
        <Pressable accessibilityRole="button" onPress={onProfile} style={styles.item}>
          <PersonIcon color={palette.text} />
          <Text style={[styles.label, { color: palette.text }]}>Profile</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onSettings} style={styles.item}>
          <GearIcon color={palette.text} />
          <Text style={[styles.label, { color: palette.text }]}>Settings</Text>
        </Pressable>
        <View style={styles.spacer} />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/therapist-login' as never)}
          style={[styles.item, styles.logout, { borderTopColor: palette.line }]}
        >
          <Text style={[styles.label, { color: palette.text }]}>Log out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.28)' },
  panel: { width: 260, position: 'absolute', top: 0, bottom: 0, left: 0, paddingHorizontal: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12 },
  label: { fontSize: 16, fontWeight: '600' },
  spacer: { flex: 1 },
  logout: { borderTopWidth: StyleSheet.hairlineWidth, borderRadius: 0, marginHorizontal: 8 },
});