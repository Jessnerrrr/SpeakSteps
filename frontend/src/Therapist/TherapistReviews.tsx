// =============================================================================
// THERAPIST REVIEWS — All reviews list & review evaluation in one file
// Replaces: therapist-reviews/pages, components, data
// =============================================================================

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TherapistShell } from '@/components/therapist/TherapistShell';
import { useTherapist } from '@/components/therapist/TherapistProvider';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/therapist/icons';
import { AudioCard } from '@/Therapist-modules/therapist-activities/components/AudioCard';
import { useReviews } from '@/Therapist-modules/therapist-reviews/state/ReviewsProvider';
import type { ReviewRecord, ReviewStatus, ReviewTarget, WordPosition } from '@/Therapist-modules/therapist-reviews/data/reviewData';
import {
  averageScore,
  formatAverage,
  positions,
  ratingGuide,
  scoredTargets,
} from '@/Therapist-modules/therapist-reviews/data/reviewData';

// ─── Status Pill Component (Exact same size & centered) ───────────────────────

function StatusPill({ status }: { status: ReviewStatus }) {
  const reviewed = status === 'Reviewed';
  return (
    <View style={[reviewStyles.pill, { backgroundColor: reviewed ? '#E6EED9' : '#F8E7DC' }]}>
      <Text style={[reviewStyles.pillText, { color: reviewed ? '#5E8246' : '#B87A46' }]}>{status}</Text>
    </View>
  );
}

// ─── 1. Reviews Main List Screen ─────────────────────────────────────────────

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
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={reviewStyles.content}>
      <Text style={[reviewStyles.kicker, { color: palette.faint }]}>LISTEN. REFLECT. GUIDE.</Text>
      <Text style={[reviewStyles.title, { color: palette.primary }]}>Every attempt matters.</Text>
      <Text style={[reviewStyles.subtitle, { color: palette.muted }]}>Your clinical judgment stays at the center.</Text>

      <View style={[reviewStyles.tabs, { borderBottomColor: palette.line }]}>
        {filters.map((item) => {
          const selected = item === filter;
          return (
            <Pressable key={item} accessibilityRole="button" onPress={() => setFilter(item)}>
              <Text
                style={[
                  reviewStyles.tab,
                  {
                    color: selected ? palette.primary : palette.faint,
                    borderBottomColor: selected ? palette.primary : 'transparent',
                  },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={reviewStyles.list}>
        {visible.map((review) => (
          <Pressable
            key={review.id}
            accessibilityRole="button"
            onPress={() => router.push(`/therapist/reviews/${review.id}` as never)}
            style={[reviewStyles.card, { borderColor: palette.line, backgroundColor: palette.card }]}
          >
            <View style={[reviewStyles.avatar, { backgroundColor: review.avatar }]}>
              <Text style={reviewStyles.initial}>{review.initial}</Text>
            </View>
            <View style={reviewStyles.copy}>
              <Text style={[reviewStyles.name, { color: palette.text }]}>{review.student}</Text>
              <Text style={[reviewStyles.meta, { color: palette.faint }]}>
                {review.activity} · {review.level}
              </Text>
            </View>
            <StatusPill status={review.status} />
            <ChevronRightIcon color={palette.faint} size={16} />
          </Pressable>
        ))}
        {visible.length === 0 ? (
          <Text style={[reviewStyles.empty, { color: palette.muted }]}>No {filter.toLowerCase()} reviews.</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

// ─── 2. Recording Review Detail Screen ───────────────────────────────────────

export function RecordingReview({ reviewId }: { reviewId: string }) {
  const { palette } = useTherapist();
  const { reviews, updateReview, updateTarget, saveEvaluation } = useReviews();
  const review = reviews.find((item) => item.id === reviewId);
  const [guideOpen, setGuideOpen] = useState(true);
  const [notice, setNotice] = useState('');

  if (!review) {
    return (
      <View style={reviewStyles.missing}>
        <Text style={{ color: palette.muted }}>This review is no longer on the list.</Text>
      </View>
    );
  }

  const scored = scoredTargets(review);
  const average = averageScore(review);
  const positionSummary = (pos: WordPosition) => {
    const group = review.targets.filter((target) => target.position === pos);
    const done = group.filter((target) => target.score !== null);
    if (group.length === 0) return '0/0 scored';
    const avg =
      done.length === 0
        ? '0'
        : (done.reduce((sum, target) => sum + (target.score || 0), 0) / done.length).toFixed(1);
    return `${done.length}/${group.length} · ${avg} scored`;
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={reviewStyles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        accessibilityLabel="Back to reviews"
        onPress={() => router.push('/therapist/reviews' as never)}
        style={[reviewStyles.back, { borderColor: palette.line, backgroundColor: palette.card }]}
      >
        <ChevronLeftIcon color={palette.text} size={18} />
      </Pressable>

      <Text style={[reviewStyles.kicker, { color: palette.faint }]}>RECORDING REVIEW</Text>
      <Text style={reviewStyles.detailName}>{review.student}</Text>
      <Text style={[reviewStyles.activity, { color: palette.muted }]}>
        {review.activity} · {review.level}
      </Text>

      <View style={reviewStyles.stats}>
        <Stat value={`${scored.length}/${review.targets.length}`} label="rated" />
        <Stat value={formatAverage(average)} label="Average" />
        <Stat value={`${review.targets.length - scored.length}`} label="unscored" />
      </View>
      <Text style={[reviewStyles.disclaimer, { color: palette.faint }]}>
        Hold the recording on any placeholder and record SLP observations before clinical use. Scores are practice
        observations, not diagnostic results.
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={() => setGuideOpen((c) => !c)}
        style={reviewStyles.guideToggle}
      >
        <View style={{ transform: [{ rotate: guideOpen ? '90deg' : '0deg' }] }}>
          <ChevronRightIcon color="#C48B5A" size={14} />
        </View>
        <Text style={reviewStyles.guideTitle}>View 1-5 rating guide</Text>
      </Pressable>
      {guideOpen ? (
        <View style={reviewStyles.guide}>
          {ratingGuide.map((item, index) => (
            <Text key={item} style={[reviewStyles.guideLine, { color: palette.muted }]}>
              {index + 1} {item}
            </Text>
          ))}
        </View>
      ) : null}

      {positions.map((pos) => (
        <View key={pos} style={reviewStyles.positionBlock}>
          <View style={reviewStyles.positionHeader}>
            <Text style={[reviewStyles.position, { color: palette.text }]}>{pos}</Text>
            <Text style={[reviewStyles.positionMeta, { color: palette.faint }]}>{positionSummary(pos)}</Text>
          </View>
          {review.targets
            .filter((target) => target.position === pos)
            .map((target) => (
              <TargetCard
                key={target.id}
                reviewId={review.id}
                target={target}
                audioUrl={review.audioRecordingUrl}
                onChange={(patch) => updateTarget(review.id, target.id, patch)}
              />
            ))}
        </View>
      ))}

      <View style={[reviewStyles.summary, { borderColor: palette.line }]}>
        <View style={reviewStyles.positionHeader}>
          <Text style={[reviewStyles.position, { color: palette.text }]}>Evaluation Summary</Text>
          <Text style={[reviewStyles.positionMeta, { color: palette.faint }]}>
            {scored.length} rated · {review.targets.length - scored.length} unscored
          </Text>
        </View>
        <Field
          label="Overall Observations"
          value={review.observations}
          placeholder="What did you notice?"
          onChangeText={(observations) => updateReview(review.id, { observations })}
        />
        <Field
          label="Parent Approved Feedback"
          value={review.parentFeedback}
          placeholder="A short update for the student's guardian"
          onChangeText={(parentFeedback) => updateReview(review.id, { parentFeedback })}
        />
        <Field
          label="Recommended Home Practice"
          value={review.homePractice}
          placeholder="e.g. Practice initial /r/ slowly."
          onChangeText={(homePractice) => updateReview(review.id, { homePractice })}
        />
      </View>

      {notice ? <Text style={reviewStyles.notice}>{notice}</Text> : null}
      <View style={reviewStyles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setNotice('Draft saved')}
          style={[reviewStyles.draft, { borderColor: palette.line, backgroundColor: palette.card }]}
        >
          <Text style={[reviewStyles.draftText, { color: palette.text }]}>Save Draft</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            saveEvaluation(review.id);
            router.push('/therapist/reviews' as never);
          }}
          style={reviewStyles.save}
        >
          <Text style={reviewStyles.saveText}>Save Evaluation</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const { palette } = useTherapist();
  return (
    <Text style={reviewStyles.stat}>
      <Text style={[reviewStyles.statValue, { color: palette.text }]}>{value} </Text>
      <Text style={[reviewStyles.statLabel, { color: palette.faint }]}>{label}</Text>
    </Text>
  );
}

function TargetCard({
  reviewId,
  target,
  audioUrl,
  onChange,
}: {
  reviewId: string;
  target: ReviewTarget;
  audioUrl?: string;
  onChange: (patch: Partial<ReviewTarget>) => void;
}) {
  const { palette } = useTherapist();
  return (
    <View style={reviewStyles.target}>
      <Text style={[reviewStyles.word, { color: palette.text }]}>{target.text}</Text>
      <Text style={[reviewStyles.targetMeta, { color: palette.faint }]}>target</Text>
      <View style={reviewStyles.scores}>
        {[1, 2, 3, 4, 5].map((score) => {
          const selected = target.score === score;
          return (
            <Pressable
              key={`${reviewId}-${target.id}-${score}`}
              accessibilityRole="button"
              accessibilityLabel={`${target.text} score ${score}`}
              onPress={() => onChange({ score })}
              style={[
                reviewStyles.score,
                selected ? reviewStyles.scoreOn : { borderColor: palette.line, backgroundColor: palette.card },
              ]}
            >
              <Text style={[reviewStyles.scoreText, { color: selected ? '#FFFFFF' : palette.muted }]}>{score}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange({ notesOpen: !target.notesOpen })}
        style={reviewStyles.notesToggle}
      >
        <View style={{ transform: [{ rotate: target.notesOpen ? '90deg' : '0deg' }] }}>
          <ChevronRightIcon color="#C48B5A" size={14} />
        </View>
        <Text style={reviewStyles.notesLabel}>Recording and notes</Text>
      </Pressable>
      {target.notesOpen ? (
        <View style={reviewStyles.notes}>
          <AudioCard
            title="Student Final Take"
            meta="Demo Playback · 0:08"
            audioUrl={audioUrl}
            empty="No child recording available."
          />
          <Field
            label="Short Feedback"
            value={target.feedback}
            placeholder=""
            onChangeText={(feedback) => onChange({ feedback })}
          />
          <Field
            label="Private Therapist Remarks"
            value={target.remarks}
            placeholder=""
            onChangeText={(remarks) => onChange({ remarks })}
          />
          <Text style={[reviewStyles.privateNote, { color: palette.faint }]}>
            Private remarks are only visible to you and not shared with guardians.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
}) {
  const { palette } = useTherapist();
  return (
    <View style={reviewStyles.field}>
      <Text style={[reviewStyles.fieldLabel, { color: palette.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.faint}
        style={[reviewStyles.input, { borderColor: palette.line, color: palette.text, backgroundColor: palette.card }]}
      />
    </View>
  );
}

// ─── Default Page Exports with TherapistShell ────────────────────────────────

export default function TherapistReviews() {
  return (
    <TherapistShell active="reviews">
      <ReviewList />
    </TherapistShell>
  );
}

export function TherapistReviewDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <TherapistShell active="reviews">
      <RecordingReview reviewId={id || ''} />
    </TherapistShell>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const reviewStyles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  kicker: { fontSize: 11, letterSpacing: 0.6, fontWeight: '700' },
  title: { fontFamily: 'SourGummy-Bold', fontSize: 24, marginTop: 4 },
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
  pill: { width: 76, height: 26, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  empty: { textAlign: 'center', marginTop: 12 },

  // Detail Screen Styles
  missing: { padding: 24 },
  back: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  detailName: { fontSize: 26, fontWeight: '700', color: '#C48B5A', marginTop: 4 },
  activity: { fontSize: 13, marginTop: 2, marginBottom: 14 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  stat: { flex: 1 },
  statValue: { fontSize: 14, fontWeight: '700' },
  statLabel: { fontSize: 13 },
  disclaimer: { fontSize: 12, lineHeight: 17, marginBottom: 12 },
  guideToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  guideTitle: { color: '#C48B5A', fontSize: 13, fontWeight: '700' },
  guide: { gap: 2, marginBottom: 14, paddingLeft: 20 },
  guideLine: { fontSize: 13 },
  positionBlock: { marginBottom: 8 },
  positionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 },
  position: { fontSize: 16, fontWeight: '700' },
  positionMeta: { fontSize: 12 },
  target: { marginBottom: 12 },
  word: { fontSize: 15, fontWeight: '700' },
  targetMeta: { fontSize: 12, marginTop: 1, marginBottom: 8 },
  scores: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  score: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  scoreOn: { backgroundColor: '#C48B5A', borderColor: '#C48B5A' },
  scoreText: { fontSize: 14, fontWeight: '700' },
  notesToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  notesLabel: { color: '#C48B5A', fontSize: 13, fontWeight: '700' },
  notes: { gap: 10, marginBottom: 4 },
  privateNote: { fontSize: 11, lineHeight: 15, marginTop: -4 },
  summary: { borderTopWidth: 1, paddingTop: 14, marginTop: 6, gap: 4 },
  field: { marginBottom: 10 },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: { minHeight: 42, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 13 },
  notice: { color: '#6A8F55', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  draft: { flex: 1, borderWidth: 1, borderRadius: 12, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  draftText: { fontSize: 14, fontWeight: '700' },
  save: { flex: 1, borderRadius: 12, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#C48B5A' },
  saveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

});
