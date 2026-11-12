import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ChevronRightIcon } from '@/components/therapist/icons';
import { useTherapist } from '@/components/therapist/TherapistProvider';
import type { ReviewStatus } from '@/Therapist-modules/therapist-reviews/data/reviewData';
import { useReviews } from '@/Therapist-modules/therapist-reviews/state/ReviewsProvider';

const filters = ['All', 'Pending', 'Reviewed'] as const;

export function ReviewList() {
  const { palette } = useTherapist();
  const { reviews } = useReviews();
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');

  const visible = useMemo(
    () => (filter === 'All' ? reviews : reviews.filter((review) => review.status === filter)),
    [filter, reviews],
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text style={[styles.kicker, { color: palette.faint }]}>LISTEN. REFLECT. GUIDE.</Text>
      <Text style={[styles.title, { color: palette.primary }]}>Every attempt matters.</Text>
      <Text style={[styles.subtitle, { color: palette.muted }]}>Your clinical judgment stays at the center.</Text>

      <View style={[styles.tabs, { borderBottomColor: palette.line }]}>
        {filters.map((item) => {
          const selected = item === filter;
          return (
            <Pressable key={item} accessibilityRole="button" onPress={() => setFilter(item)}>
              <Text style={[styles.tab, { color: selected ? palette.primary : palette.faint, borderBottomColor: selected ? palette.primary : 'transparent' }]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.list}>
        {visible.map((review) => (
          <Pressable
            key={review.id}
            accessibilityRole="button"
            onPress={() => router.push(`/therapist/reviews/${review.id}` as never)}
            style={[styles.card, { borderColor: palette.line, backgroundColor: palette.card }]}
          >
            <View style={[styles.avatar, { backgroundColor: review.avatar }]}>
              <Text style={styles.initial}>{review.initial}</Text>
            </View>
            <View style={styles.copy}>
              <Text style={[styles.name, { color: palette.text }]}>{review.student}</Text>
              <Text style={[styles.meta, { color: palette.faint }]}>{review.activity} · {review.level}</Text>
            </View>
            <StatusPill status={review.status} />
            <ChevronRightIcon color={palette.faint} size={16} />
          </Pressable>
        ))}
        {visible.length === 0 ? <Text style={[styles.empty, { color: palette.muted }]}>No {filter.toLowerCase()} reviews.</Text> : null}
      </View>
    </ScrollView>
  );
}

function StatusPill({ status }: { status: ReviewStatus }) {
  const reviewed = status === 'Reviewed';
  return (
    <View style={[styles.pill, { backgroundColor: reviewed ? '#E7F0DC' : '#F8E7DC' }]}>
      <Text style={[styles.pillText, { color: reviewed ? '#6A8F55' : '#C48B5A' }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  kicker: { fontSize: 11, letterSpacing: 0.6, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '700', marginTop: 4 },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 14 },
  tabs: { flexDirection: 'row', gap: 18, borderBottomWidth: 1, marginBottom: 14 },
  tab: { fontSize: 14, fontWeight: '700', paddingBottom: 8, borderBottomWidth: 2, marginBottom: -1 },
  list: { gap: 10 },
  card: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 16, fontWeight: '700', color: '#607086' },
  copy: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 2 },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 12 },
});
