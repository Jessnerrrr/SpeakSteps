import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTherapist } from '@/components/therapist/TherapistProvider';
import { sampleStats, type HomeStat, type StatTone } from '@/Therapist-modules/therapist-homepage/data/sampleData';

export function StatGrid() {
  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <StatCard item={sampleStats[0]} />
        <StatCard item={sampleStats[1]} />
      </View>
      <View style={styles.row}>
        <StatCard item={sampleStats[2]} />
        <StatCard item={sampleStats[3]} />
      </View>
    </View>
  );
}

function StatCard({ item }: { item: HomeStat }) {
  const { palette } = useTherapist();
  const tone = toneColor(item.tone, palette);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(item.href as never)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: palette.card,
          shadowColor: palette.shadow,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.top}>
        <Text style={[styles.value, { color: tone }]}>{item.value}</Text>
        <View style={[styles.badge, { backgroundColor: tone }]}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      </View>
      <Text style={[styles.label, { color: palette.muted }]}>{item.label}</Text>
    </Pressable>
  );
}

function toneColor(
  tone: StatTone,
  palette: { green: string; alert: string; primary: string; orange: string },
) {
  if (tone === 'green') return palette.green;
  if (tone === 'alert') return palette.alert;
  if (tone === 'orange') return palette.orange;
  return palette.primary;
}

const styles = StyleSheet.create({
  grid: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    minHeight: 108,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
  },
});
