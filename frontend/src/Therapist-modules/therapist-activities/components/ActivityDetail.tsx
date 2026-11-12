import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useTherapist } from '@/components/therapist/TherapistProvider';
import { ChevronLeftIcon } from '@/components/therapist/icons';
import { AudioCard } from '@/Therapist-modules/therapist-activities/components/AudioCard';
import { usesPhraseFields, wordPositions, type Activity } from '@/Therapist-modules/therapist-activities/data/activityData';
import { useActivities } from '@/Therapist-modules/therapist-activities/state/ActivitiesProvider';

export function ActivityDetail({ activityId }: { activityId: string }) {
  const { palette } = useTherapist();
  const { activities, beginEdit } = useActivities();
  const activity = activities.find((item) => item.id === activityId);

  if (!activity) {
    return <Text style={{ color: palette.muted, padding: 20 }}>This activity is no longer in the library.</Text>;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Pressable accessibilityLabel="Back to library" onPress={() => router.push('/therapist/activities' as never)} style={[styles.back, { borderColor: palette.line }]}>
        <ChevronLeftIcon color={palette.text} size={18} />
      </Pressable>
      <View style={styles.badge}><Text style={styles.badgeText}>{activity.level}</Text></View>
      <Text style={[styles.title, { color: palette.text }]}>{activity.title}</Text>
      <Text style={[styles.meta, { color: palette.faint }]}>{activity.sound} · {activity.positions[0] || 'Initial'} · {activity.language}</Text>
      <Section title="Instructions" body={activity.instructions} />
      <Section title="Articulatory Guide" body={activity.guide} />
      <PracticeContent activity={activity} />
      <Text style={[styles.section, { color: palette.text }]}>Preview Audio Model</Text>
      <AudioCard title="Pronunciation Model" meta="Demo Playback • 0:08" />
      <Text style={[styles.section, { color: palette.text }]}>Visual Material</Text>
      <View style={[styles.visual, { borderColor: palette.line }]}><Text style={{ color: palette.faint }}>{activity.visualName || '▶'}</Text></View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            beginEdit(activity.id);
            router.push('/therapist/activities/edit' as never);
          }}
          style={[styles.secondary, { borderColor: palette.line }]}
        >
          <Text style={[styles.secondaryText, { color: palette.text }]}>Edit Activity</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push(`/therapist/activities/assign?id=${activity.id}` as never)} style={styles.primary}>
          <Text style={styles.primaryText}>Assign Activity</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

export function PracticeContent({ activity }: { activity: Activity }) {
  const { palette } = useTherapist();
  const phraseMode = usesPhraseFields(activity.level);
  return (
    <View style={styles.practice}>
      <Text style={[styles.section, { color: palette.text }]}>Practice Content</Text>
      {wordPositions.map((position) => {
        const words = activity.words.filter((word) => word.position === position);
        return (
          <View key={position} style={styles.positionBlock}>
            <Text style={[styles.positionTitle, { color: palette.text }]}>{position} · {words.length} targets</Text>
            {words.length === 0 ? <Text style={{ color: palette.faint }}>No targets yet.</Text> : null}
            <View style={styles.chips}>
              {words.map((word) => (
                <View key={word.id} style={styles.chip}><Text style={styles.chipText}>{word.text}</Text></View>
              ))}
            </View>
            {phraseMode ? words.map((word) => (word.phrase ? <Text key={`${word.id}-line`} style={{ color: palette.muted }}>{word.phrase}</Text> : null)) : null}
          </View>
        );
      })}
      {phraseMode ? activity.customLines.map((line, index) => <Text key={index} style={{ color: palette.muted }}>{line}</Text>) : null}
    </View>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  const { palette } = useTherapist();
  return (
    <View style={styles.sectionBlock}>
      <Text style={[styles.section, { color: palette.text }]}>{title}</Text>
      <Text style={{ color: palette.muted, lineHeight: 18 }}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 28, gap: 8 },
  back: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  badge: { alignSelf: 'flex-start', backgroundColor: '#F8E7DC', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8 },
  badgeText: { color: '#C48B5A', fontSize: 12, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '700' },
  meta: { fontSize: 13, marginBottom: 8 },
  section: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  sectionBlock: { gap: 4, borderTopWidth: 1, borderTopColor: '#E6EBEF', paddingTop: 8 },
  practice: { gap: 8, borderTopWidth: 1, borderTopColor: '#E6EBEF', paddingTop: 8 },
  positionBlock: { gap: 6 },
  positionTitle: { fontSize: 14, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#E7C7A8', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { color: '#C48B5A', fontWeight: '600' },
  visual: { height: 140, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  primary: { backgroundColor: '#C48B5A', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
  secondary: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  secondaryText: { fontWeight: '700' },
});
