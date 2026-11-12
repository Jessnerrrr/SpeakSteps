import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/therapist/icons';
import { useTherapist } from '@/components/therapist/TherapistProvider';
import { AudioCard } from '@/Therapist-modules/therapist-activities/components/AudioCard';
import {
  averageScore,
  formatAverage,
  positions,
  ratingGuide,
  scoredTargets,
  type ReviewTarget,
  type WordPosition,
} from '@/Therapist-modules/therapist-reviews/data/reviewData';
import { useReviews } from '@/Therapist-modules/therapist-reviews/state/ReviewsProvider';

export function RecordingReview({ reviewId }: { reviewId: string }) {
  const { palette } = useTherapist();
  const { reviews, updateReview, updateTarget, saveEvaluation } = useReviews();
  const review = reviews.find((item) => item.id === reviewId);
  const [guideOpen, setGuideOpen] = useState(true);
  const [notice, setNotice] = useState('');

  if (!review) {
    return (
      <View style={styles.missing}>
        <Text style={{ color: palette.muted }}>This review is no longer on the list.</Text>
      </View>
    );
  }

  const scored = scoredTargets(review);
  const average = averageScore(review);
  const positionSummary = (position: WordPosition) => {
    const group = review.targets.filter((target) => target.position === position);
    const done = group.filter((target) => target.score !== null);
    if (group.length === 0) return '0/0 scored';
    const avg = done.length === 0 ? '0' : (done.reduce((sum, target) => sum + (target.score || 0), 0) / done.length).toFixed(1);
    return `${done.length}/${group.length} · ${avg} scored`;
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityLabel="Back to reviews" onPress={() => router.push('/therapist/reviews' as never)} style={[styles.back, { borderColor: palette.line, backgroundColor: palette.card }]}>
        <ChevronLeftIcon color={palette.text} size={18} />
      </Pressable>

      <Text style={[styles.kicker, { color: palette.faint }]}>RECORDING REVIEW</Text>
      <Text style={styles.name}>{review.student}</Text>
      <Text style={[styles.activity, { color: palette.muted }]}>{review.activity} · {review.level}</Text>

      <View style={styles.stats}>
        <Stat value={`${scored.length}/${review.targets.length}`} label="rated" />
        <Stat value={formatAverage(average)} label="Average" />
        <Stat value={`${review.targets.length - scored.length}`} label="unscored" />
      </View>

      <Text style={[styles.disclaimer, { color: palette.faint }]}>
        Hold the recording on any placeholder and record SLP observations before clinical use. Scores are practice observations, not diagnostic results.
      </Text>

      <Pressable accessibilityRole="button" onPress={() => setGuideOpen((current) => !current)} style={styles.guideToggle}>
        <View style={{ transform: [{ rotate: guideOpen ? '90deg' : '0deg' }] }}>
          <ChevronRightIcon color="#C48B5A" size={14} />
        </View>
        <Text style={styles.guideTitle}>View 1-5 rating guide</Text>
      </Pressable>
      {guideOpen ? (
        <View style={styles.guide}>
          {ratingGuide.map((item, index) => (
            <Text key={item} style={[styles.guideLine, { color: palette.muted }]}>{index + 1} {item}</Text>
          ))}
        </View>
      ) : null}

      {positions.map((position) => (
        <View key={position} style={styles.positionBlock}>
          <View style={styles.positionHeader}>
            <Text style={[styles.position, { color: palette.text }]}>{position}</Text>
            <Text style={[styles.positionMeta, { color: palette.faint }]}>{positionSummary(position)}</Text>
          </View>
          {review.targets.filter((target) => target.position === position).map((target) => (
            <TargetCard key={target.id} reviewId={review.id} target={target} onChange={(patch) => updateTarget(review.id, target.id, patch)} />
          ))}
        </View>
      ))}

      <View style={[styles.summary, { borderColor: palette.line }]}>
        <View style={styles.positionHeader}>
          <Text style={[styles.position, { color: palette.text }]}>Evaluation Summary</Text>
          <Text style={[styles.positionMeta, { color: palette.faint }]}>{scored.length} rated · {review.targets.length - scored.length} unscored</Text>
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

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setNotice('Draft saved')}
          style={[styles.draft, { borderColor: palette.line, backgroundColor: palette.card }]}
        >
          <Text style={[styles.draftText, { color: palette.text }]}>Save Draft</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            saveEvaluation(review.id);
            router.push('/therapist/reviews' as never);
          }}
          style={styles.save}
        >
          <Text style={styles.saveText}>Save Evaluation</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const { palette } = useTherapist();
  return (
    <Text style={styles.stat}>
      <Text style={[styles.statValue, { color: palette.text }]}>{value} </Text>
      <Text style={[styles.statLabel, { color: palette.faint }]}>{label}</Text>
    </Text>
  );
}

function TargetCard({
  reviewId,
  target,
  onChange,
}: {
  reviewId: string;
  target: ReviewTarget;
  onChange: (patch: Partial<ReviewTarget>) => void;
}) {
  const { palette } = useTherapist();
  return (
    <View style={styles.target}>
      <Text style={[styles.word, { color: palette.text }]}>{target.text}</Text>
      <Text style={[styles.targetMeta, { color: palette.faint }]}>target</Text>
      <View style={styles.scores}>
        {[1, 2, 3, 4, 5].map((score) => {
          const selected = target.score === score;
          return (
            <Pressable
              key={`${reviewId}-${target.id}-${score}`}
              accessibilityRole="button"
              accessibilityLabel={`${target.text} score ${score}`}
              onPress={() => onChange({ score })}
              style={[styles.score, selected ? styles.scoreOn : { borderColor: palette.line, backgroundColor: palette.card }]}
            >
              <Text style={[styles.scoreText, { color: selected ? '#FFFFFF' : palette.muted }]}>{score}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable accessibilityRole="button" onPress={() => onChange({ notesOpen: !target.notesOpen })} style={styles.notesToggle}>
        <View style={{ transform: [{ rotate: target.notesOpen ? '90deg' : '0deg' }] }}>
          <ChevronRightIcon color="#C48B5A" size={14} />
        </View>
        <Text style={styles.notesLabel}>Recording and notes</Text>
      </Pressable>
      {target.notesOpen ? (
        <View style={styles.notes}>
          <AudioCard title="Student Final Take" meta="Demo Playback · 0:08" />
          <Field label="Short Feedback" value={target.feedback} placeholder="" onChangeText={(feedback) => onChange({ feedback })} />
          <Field label="Private Therapist Remarks" value={target.remarks} placeholder="" onChangeText={(remarks) => onChange({ remarks })} />
          <Text style={[styles.privateNote, { color: palette.faint }]}>Private remarks are only visible to you and not shared with guardians.</Text>
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
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: palette.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.faint}
        style={[styles.input, { borderColor: palette.line, color: palette.text, backgroundColor: palette.card }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 28 },
  missing: { padding: 24 },
  back: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  kicker: { fontSize: 11, letterSpacing: 0.6, fontWeight: '700' },
  name: { fontSize: 26, fontWeight: '700', color: '#C48B5A', marginTop: 4 },
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
