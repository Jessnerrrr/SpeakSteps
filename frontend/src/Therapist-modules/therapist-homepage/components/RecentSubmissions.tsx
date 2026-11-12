import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTherapist } from '@/components/therapist/TherapistProvider';
import { sampleSubmissions, type Submission } from '@/Therapist-modules/therapist-homepage/data/sampleData';

type RecentSubmissionsProps = {
  onViewAll: () => void;
  onOpen: (submission: Submission) => void;
};

export function RecentSubmissions({ onViewAll, onOpen }: RecentSubmissionsProps) {
  const { palette } = useTherapist();

  return (
    <View style={[styles.panel, { backgroundColor: palette.recent }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.primary }]}>Recent Submission</Text>
        <Pressable accessibilityRole="button" onPress={onViewAll} hitSlop={6}>
          <Text style={[styles.viewAll, { color: palette.primary }]}>View All</Text>
        </Pressable>
      </View>
      {sampleSubmissions.map((item) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item.name}
          key={item.id}
          onPress={() => onOpen(item)}
          style={({ pressed }) => [styles.card, { backgroundColor: palette.card, opacity: pressed ? 0.92 : 1 }]}
        >
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>{item.initials}</Text>
            </View>
            <View style={styles.copy}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: palette.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.time, { color: palette.faint }]}>{item.timestamp}</Text>
              </View>
              <Text style={[styles.detail, { color: palette.muted }]}>{item.detail}</Text>
              <Text style={[styles.stage, { color: palette.faint }]}>{item.stage}</Text>
              <View style={styles.progressRow}>
                <View style={[styles.track, { backgroundColor: '#E6EBEF' }]}>
                  <View style={[styles.fill, { width: `${Math.round(item.progress * 100)}%` }]} />
                </View>
                <Text style={styles.percent}>{Math.round(item.progress * 100)}%</Text>
              </View>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 18,
    padding: 12,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    borderRadius: 14,
    padding: 12,
  },
  identity: {
    flexDirection: 'row',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7EDF2',
  },
  initials: {
    color: '#7B8B9C',
    fontSize: 12,
    fontWeight: '700',
  },
  copy: { flex: 1, gap: 4 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  time: {
    fontSize: 11,
    textAlign: 'right',
    maxWidth: 118,
  },
  detail: { fontSize: 11, lineHeight: 15 },
  stage: { fontSize: 11 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#43B05C',
  },
  percent: { color: '#43B05C', fontSize: 11, fontWeight: '700', width: 32, textAlign: 'right' },
});
