import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function CheckinHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onBack}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={26} color="#0C66AD" />
      </Pressable>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C2DCEC',
  },
  pressed: { backgroundColor: '#EAF4FB' },
  title: { flex: 1, fontFamily: 'SourGummy-Bold', fontSize: 23, color: '#0C66AD' },
});
