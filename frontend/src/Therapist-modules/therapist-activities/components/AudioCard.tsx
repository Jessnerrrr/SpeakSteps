import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const bars = [8, 14, 10, 18, 12, 16, 9, 15];

export function AudioCard({ title, meta }: { title: string; meta: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <Pressable accessibilityRole="button" onPress={() => setPlaying((current) => !current)} style={styles.card}>
      <View style={styles.play}>
        <Text style={styles.playIcon}>{playing ? '❚❚' : '▶'}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{playing ? 'Playing demo…' : meta}</Text>
      </View>
      <View style={styles.bars}>
        {bars.map((height, index) => (
          <View key={index} style={[styles.bar, { height: playing ? height + 4 : height }]} />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#F0D2BC',
    backgroundColor: '#FFF8F3',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  play: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  copy: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  meta: { fontSize: 12, color: '#8B9AAB', marginTop: 2 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 22 },
  bar: { width: 4, borderRadius: 2, backgroundColor: '#F97316' },
});
