import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import type { Buddy } from '@/data/buddy-store';

export function ChildActivityEmpty({ buddy, hint }: { buddy: Buddy; hint: string }) {
  return (
    <View style={styles.card}>
      <Image source={buddy.image} contentFit="contain" style={styles.buddy} />
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.title}>No activities here yet</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, borderRadius: 16, borderWidth: 1, borderColor: '#C9E5F6', backgroundColor: '#EEF8FF' },
  buddy: { width: 58, height: 58 },
  copy: { flex: 1, gap: 3 },
  title: { color: '#0D68AC', fontFamily: 'SourGummy-Bold', fontSize: 16 },
  hint: { color: '#365F7C', fontFamily: 'SourGummy-Medium', fontSize: 14 },
});
