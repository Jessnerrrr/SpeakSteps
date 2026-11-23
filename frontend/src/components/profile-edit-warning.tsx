import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

export function ProfileEditWarning({ isDark = false, style }: { isDark?: boolean; style?: StyleProp<ViewStyle> }) {
  const color = isDark ? '#FFE2A3' : '#704500';
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[
      styles.warning,
      { backgroundColor: isDark ? '#3D2D15' : '#FFF3D5', borderColor: isDark ? '#876729' : '#ECC779' },
      style,
    ]}>
      <Ionicons name="warning-outline" size={20} color={color} />
      <View style={styles.copy}>
        <Text style={[styles.title, { color }]}>Profile editing is on</Text>
        <Text style={[styles.message, { color }]}>Save your changes before leaving this screen.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  warning: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8 },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '700' },
  message: { fontSize: 13, lineHeight: 18 },
});
