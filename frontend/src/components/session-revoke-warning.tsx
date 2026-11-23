import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  device: string;
  isDark: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function SessionRevokeWarning({ device, isDark, onCancel, onConfirm }: Props) {
  const textColor = isDark ? '#F1F5F9' : '#17364D';

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]} accessibilityViewIsModal>
      <View style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
        <Ionicons name="warning-outline" size={24} color={isDark ? '#FCD998' : '#966018'} />
        <Text accessibilityRole="alert" style={[styles.title, { color: textColor }]}>Revoke this session?</Text>
        <Text style={[styles.message, { color: textColor }]}>This will end the session for {device}. You'll need to sign in again on that device.</Text>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" style={styles.button} onPress={onCancel}>
            <Text style={[styles.label, { color: textColor }]}>Cancel</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={[styles.button, styles.danger]} onPress={onConfirm}>
            <Text style={[styles.label, styles.dangerText]}>Revoke session</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { zIndex: 10, elevation: 10, backgroundColor: 'rgba(15, 34, 53, 0.45)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  card: { width: '100%', maxWidth: 340, borderRadius: 16, padding: 18, gap: 10 },
  title: { fontSize: 18, fontWeight: '700' },
  message: { fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  button: { minHeight: 44, borderRadius: 9, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '700' },
  danger: { backgroundColor: '#AC3840' },
  dangerText: { color: '#FFFFFF' },
});
