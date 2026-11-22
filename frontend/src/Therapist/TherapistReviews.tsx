// =============================================================================
// THERAPIST REVIEWS — All reviews list & review evaluation in one file
// Replaces: therapist-reviews/pages, components, data
// =============================================================================

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import {
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Info,
  Lock,
  MessageSquare,
  Pause,
  Play,
  Save,
  Star,
  Volume2,
} from 'lucide-react-native';

import { TherapistShell } from '@/components/therapist/TherapistShell';
import { useTherapist } from '@/components/therapist/TherapistProvider';
import { useReviews } from '@/Therapist-modules/therapist-reviews/state/ReviewsProvider';
import type { ReviewRecord, ReviewStatus, ReviewTarget, WordPosition } from '@/Therapist-modules/therapist-reviews/data/reviewData';
import {
  averageScore,
  formatAverage,
  positions,
  ratingGuide,
  scoredTargets,
} from '@/Therapist-modules/therapist-reviews/data/reviewData';

// ─── Modern Audio Demo Card ──────────────────────────────────────────────────

function AudioCard({ title, meta }: { title: string; meta: string }) {
  const [playing, setPlaying] = useState(false);
  const bars = [8, 14, 10, 18, 12, 16, 9, 15, 11, 17];
  return (
    <Pressable accessibilityRole="button" onPress={() => setPlaying((c) => !c)} style={reviewStyles.audioCard}>
      <View style={reviewStyles.audioPlay}>
        {playing ? <Pause size={14} color="#FFFFFF" /> : <Play size={14} color="#FFFFFF" style={{ marginLeft: 2 }} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={reviewStyles.audioTitle}>{title}</Text>
        <Text style={reviewStyles.audioMeta}>{playing ? 'Playing take…' : meta}</Text>
      </View>
      <View style={reviewStyles.audioBars}>
        {bars.map((height, i) => (
          <View key={i} style={[reviewStyles.audioBar, { height: playing ? Math.min(22, height + 4) : height }]} />
        ))}
      </View>
    </Pressable>
  );
}

// ─── Status Pill Component ───────────────────────────────────────────────────

function StatusPill({ status }: { status: ReviewStatus }) {
  const reviewed = status === 'Reviewed';
  return (
    <View
      style={[
        reviewStyles.pill,
        {
          backgroundColor: reviewed ? '#DCFCE7' : '#FEF3C7',
          borderColor: reviewed ? '#BBF7D0' : '#FDE68A',
        },
      ]}
    >
      <Text style={[reviewStyles.pillText, { color: reviewed ? '#16A34A' : '#D97706' }]}>{status}</Text>
    </View>
  );
}

// ─── 1. Reviews Main List Screen ─────────────────────────────────────────────

const filters = ['All', 'Pending', 'Reviewed'] as const;

export function ReviewList() {
  const { palette, isDark } = useTherapist();
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
            <View style={[reviewStyles.avatar, { backgroundColor: review.avatar || '#E0F2FE' }]}>
              <Text style={reviewStyles.initial}>{review.initial}</Text>
            </View>
            <View style={reviewStyles.copy}>
              <Text style={[reviewStyles.name, { color: palette.text }]}>{review.student}</Text>
              <Text style={[reviewStyles.meta, { color: palette.faint }]}>
                {review.activity} · {review.level}
              </Text>
            </View>
            <StatusPill status={review.status} />
            <ChevronRight color={palette.faint} size={16} />
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
  const navigation = useNavigation();
  const { palette, isDark } = useTherapist();
  const { reviews, updateReview, updateTarget, saveEvaluation } = useReviews();
  const review = reviews.find((item) => item.id === reviewId);
  const [guideOpen, setGuideOpen] = useState(false);
  const [notice, setNotice] = useState('');

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace('/therapist/reviews' as never);
    }
  };

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
    if (group.length === 0) return '0/0 rated';
    const avg =
      done.length === 0
        ? '0'
        : (done.reduce((sum, target) => sum + (target.score || 0), 0) / done.length).toFixed(1);
    return `${done.length}/${group.length} rated · ${avg} avg`;
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={reviewStyles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Top Navigation Row ── */}
      <View style={reviewStyles.topNavRow}>
        <Pressable
          accessibilityLabel="Back to reviews"
          onPress={handleBack}
          style={[reviewStyles.back, { borderColor: palette.line, backgroundColor: palette.card }]}
        >
          <ChevronLeft color={palette.text} size={18} />
        </Pressable>
        <Text style={[reviewStyles.topNavTitle, { color: palette.text }]}>Recording Review</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Hero Student Summary Card ── */}
      <View style={[reviewStyles.heroCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
        <View style={reviewStyles.heroTopRow}>
          <View style={[reviewStyles.heroAvatar, { backgroundColor: review.avatar || '#E0F2FE' }]}>
            <Text style={reviewStyles.heroInitial}>{review.initial}</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[reviewStyles.heroStudentName, { color: palette.text }]}>{review.student}</Text>
              <StatusPill status={review.status} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <View style={[reviewStyles.pillTag, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
                <Text style={[reviewStyles.pillTagText, { color: '#0284C7' }]}>{review.activity}</Text>
              </View>
              <View style={[reviewStyles.pillTag, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                <Text style={[reviewStyles.pillTagText, { color: palette.muted }]}>{review.level}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[reviewStyles.heroDivider, { backgroundColor: palette.line }]} />

        {/* 3-column Clinical Metrics */}
        <View style={[reviewStyles.metricsContainer, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: palette.line }]}>
          <View style={reviewStyles.metricCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={13} color="#10B981" />
              <Text style={[reviewStyles.metricLabel, { color: palette.faint }]}>Rated</Text>
            </View>
            <Text style={[reviewStyles.metricVal, { color: palette.text }]}>
              {scored.length}/{review.targets.length}
            </Text>
          </View>
          <View style={[reviewStyles.metricDivider, { backgroundColor: palette.line }]} />
          <View style={reviewStyles.metricCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Star size={13} color="#F59E0B" />
              <Text style={[reviewStyles.metricLabel, { color: palette.faint }]}>Average</Text>
            </View>
            <Text style={[reviewStyles.metricVal, { color: '#0284C7' }]}>
              {formatAverage(average)} <Text style={{ fontSize: 11, color: palette.faint }}>/ 5</Text>
            </Text>
          </View>
          <View style={[reviewStyles.metricDivider, { backgroundColor: palette.line }]} />
          <View style={reviewStyles.metricCol}>
            <Text style={[reviewStyles.metricLabel, { color: palette.faint }]}>Unscored</Text>
            <Text style={[reviewStyles.metricVal, { color: review.targets.length - scored.length > 0 ? '#F59E0B' : '#10B981' }]}>
              {review.targets.length - scored.length}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Clinical Guidance Callout ── */}
      <View style={[reviewStyles.noticeCallout, { backgroundColor: isDark ? '#082F49' : '#F0F9FF', borderColor: isDark ? '#0369A1' : '#BAE6FD' }]}>
        <Info size={16} color="#0284C7" />
        <Text style={[reviewStyles.noticeCalloutText, { color: isDark ? '#BAE6FD' : '#0369A1' }]}>
          Hold the recording on any placeholder and record SLP observations before clinical use. Scores are practice observations, not diagnostic results.
        </Text>
      </View>

      {/* ── Rating Scale Accordion Card ── */}
      <View style={[reviewStyles.guideCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setGuideOpen((c) => !c)}
          style={reviewStyles.guideHeader}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[reviewStyles.guideIconWrap, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
              <Award size={15} color="#0284C7" />
            </View>
            <Text style={[reviewStyles.guideTitle, { color: palette.text }]}>Clinical 1-5 Rating Guide</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[reviewStyles.guideBadge, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
              <Text style={[reviewStyles.guideBadgeText, { color: palette.muted }]}>Standard</Text>
            </View>
            {guideOpen ? <ChevronUp size={16} color={palette.faint} /> : <ChevronDown size={16} color={palette.faint} />}
          </View>
        </Pressable>

        {guideOpen ? (
          <View style={[reviewStyles.guideBody, { borderTopColor: palette.line }]}>
            {ratingGuide.map((item, index) => {
              const scoreNum = index + 1;
              const scoreColors: Record<number, { bg: string; text: string }> = {
                1: { bg: '#FEE2E2', text: '#DC2626' },
                2: { bg: '#FFEDD5', text: '#EA580C' },
                3: { bg: '#FEF3C7', text: '#D97706' },
                4: { bg: '#E0F2FE', text: '#0284C7' },
                5: { bg: '#DCFCE7', text: '#16A34A' },
              };
              const c = scoreColors[scoreNum] || { bg: '#E2E8F0', text: '#475569' };
              return (
                <View key={item} style={reviewStyles.guideRow}>
                  <View style={[reviewStyles.guideScorePill, { backgroundColor: c.bg }]}>
                    <Text style={[reviewStyles.guideScorePillText, { color: c.text }]}>{scoreNum}</Text>
                  </View>
                  <Text style={[reviewStyles.guideRowText, { color: palette.text }]}>{item}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>

      {/* ── Targets by Word Position ── */}
      {positions.map((pos) => {
        const group = review.targets.filter((target) => target.position === pos);
        if (group.length === 0) return null;
        return (
          <View key={pos} style={reviewStyles.positionSection}>
            <View style={reviewStyles.positionHeaderRow}>
              <Text style={[reviewStyles.positionSectionTitle, { color: palette.text }]}>{pos} Position</Text>
              <View style={[reviewStyles.posSummaryBadge, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: palette.line }]}>
                <Text style={[reviewStyles.posSummaryText, { color: palette.muted }]}>{positionSummary(pos)}</Text>
              </View>
            </View>

            <View style={{ gap: 12 }}>
              {group.map((target) => (
                <TargetCard
                  key={target.id}
                  reviewId={review.id}
                  target={target}
                  onChange={(patch) => updateTarget(review.id, target.id, patch)}
                />
              ))}
            </View>
          </View>
        );
      })}

      {/* ── Evaluation Summary Card ── */}
      <View style={[reviewStyles.summaryCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
        <View style={reviewStyles.summaryCardHeader}>
          <View style={[reviewStyles.summaryIconWrap, { backgroundColor: isDark ? '#082F49' : '#E0F2FE' }]}>
            <MessageSquare size={16} color="#0284C7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[reviewStyles.summaryCardTitle, { color: palette.text }]}>Evaluation Summary</Text>
            <Text style={[reviewStyles.summaryCardSubtitle, { color: palette.faint }]}>
              {scored.length} of {review.targets.length} targets evaluated
            </Text>
          </View>
        </View>

        <View style={{ gap: 14 }}>
          <View style={{ gap: 6 }}>
            <Text style={[reviewStyles.inputLabel, { color: palette.text }]}>Overall Observations</Text>
            <TextInput
              value={review.observations}
              placeholder="What clinical patterns or sound substitutions did you notice?"
              placeholderTextColor={palette.faint}
              multiline
              onChangeText={(observations) => updateReview(review.id, { observations })}
              style={[
                reviewStyles.fieldInput,
                {
                  minHeight: 68,
                  paddingVertical: 10,
                  textAlignVertical: 'top',
                  borderColor: palette.line,
                  color: palette.text,
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                },
              ]}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={[reviewStyles.inputLabel, { color: palette.text }]}>Parent Approved Feedback</Text>
            <TextInput
              value={review.parentFeedback}
              placeholder="A constructive update for the student's guardian..."
              placeholderTextColor={palette.faint}
              multiline
              onChangeText={(parentFeedback) => updateReview(review.id, { parentFeedback })}
              style={[
                reviewStyles.fieldInput,
                {
                  minHeight: 68,
                  paddingVertical: 10,
                  textAlignVertical: 'top',
                  borderColor: palette.line,
                  color: palette.text,
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                },
              ]}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={[reviewStyles.inputLabel, { color: palette.text }]}>Recommended Home Practice</Text>
            <TextInput
              value={review.homePractice}
              placeholder="e.g. Practice initial /r/ with mirror 5 mins daily."
              placeholderTextColor={palette.faint}
              multiline
              onChangeText={(homePractice) => updateReview(review.id, { homePractice })}
              style={[
                reviewStyles.fieldInput,
                {
                  minHeight: 68,
                  paddingVertical: 10,
                  textAlignVertical: 'top',
                  borderColor: palette.line,
                  color: palette.text,
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* ── Status Toast ── */}
      {notice ? (
        <View style={reviewStyles.toastNotice}>
          <CheckCircle2 size={16} color="#10B981" />
          <Text style={reviewStyles.toastNoticeText}>{notice}</Text>
        </View>
      ) : null}

      {/* ── Bottom Actions ── */}
      <View style={reviewStyles.bottomActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setNotice('Draft saved successfully.')}
          style={[reviewStyles.draftBtn, { borderColor: palette.line, backgroundColor: palette.card }]}
        >
          <Text style={[reviewStyles.draftBtnText, { color: palette.text }]}>Save Draft</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            try {
              saveEvaluation(review.id);
              router.push('/therapist/reviews' as never);
            } catch (err: any) {
              setNotice(err?.message || 'Failed to save evaluation. Please try again.');
            }
          }}
          style={reviewStyles.saveBtn}
        >
          <Save size={16} color="#FFFFFF" />
          <Text style={reviewStyles.saveBtnText}>Save Evaluation</Text>
        </Pressable>
      </View>
    </ScrollView>
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
  const { palette, isDark } = useTherapist();
  return (
    <View style={[reviewStyles.targetCard, { backgroundColor: palette.card, borderColor: palette.line }]}>
      {/* Top Header */}
      <View style={reviewStyles.targetCardHeader}>
        <View style={{ gap: 2 }}>
          <Text style={[reviewStyles.targetWord, { color: palette.text }]}>{target.text}</Text>
          <Text style={[reviewStyles.targetSublabel, { color: palette.faint }]}>Target Phoneme Practice</Text>
        </View>
        <View
          style={[
            reviewStyles.scoreStatusBadge,
            target.score !== null
              ? { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }
              : { backgroundColor: isDark ? '#334155' : '#F1F5F9', borderColor: palette.line },
          ]}
        >
          <Text
            style={[
              reviewStyles.scoreStatusText,
              { color: target.score !== null ? '#16A34A' : palette.muted },
            ]}
          >
            {target.score !== null ? `Score: ${target.score} / 5` : 'Not Rated'}
          </Text>
        </View>
      </View>

      {/* Production Rating Selector */}
      <View style={reviewStyles.ratingSection}>
        <Text style={[reviewStyles.ratingSectionLabel, { color: palette.faint }]}>
          PRODUCTION RATING (1-5)
        </Text>
        <View style={reviewStyles.scoresRow}>
          {[1, 2, 3, 4, 5].map((score) => {
            const selected = target.score === score;
            return (
              <Pressable
                key={`${reviewId}-${target.id}-${score}`}
                accessibilityRole="button"
                accessibilityLabel={`${target.text} score ${score}`}
                onPress={() => onChange({ score })}
                style={[
                  reviewStyles.scoreBtn,
                  selected
                    ? reviewStyles.scoreBtnSelected
                    : { borderColor: palette.line, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' },
                ]}
              >
                <Text
                  style={[
                    reviewStyles.scoreBtnText,
                    { color: selected ? '#FFFFFF' : palette.text },
                  ]}
                >
                  {score}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Recording and Notes Collapsible */}
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange({ notesOpen: !target.notesOpen })}
        style={[reviewStyles.notesToggleBtn, { borderTopColor: palette.line }]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Volume2 size={15} color="#0284C7" />
          <Text style={reviewStyles.notesToggleText}>Student Recording & Notes</Text>
        </View>
        {target.notesOpen ? (
          <ChevronUp size={16} color={palette.faint} />
        ) : (
          <ChevronDown size={16} color={palette.faint} />
        )}
      </Pressable>

      {target.notesOpen ? (
        <View style={reviewStyles.notesBody}>
          <AudioCard title="Student Final Take" meta="Demo Playback • 0:08" />

          <View style={{ gap: 4 }}>
            <Text style={[reviewStyles.inputLabel, { color: palette.text }]}>Short Feedback (Student / Parent)</Text>
            <TextInput
              value={target.feedback}
              placeholder="e.g. Good tongue positioning, work on vowel release..."
              placeholderTextColor={palette.faint}
              onChangeText={(feedback) => onChange({ feedback })}
              style={[
                reviewStyles.fieldInput,
                { borderColor: palette.line, color: palette.text, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' },
              ]}
            />
          </View>

          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Lock size={12} color={palette.faint} />
              <Text style={[reviewStyles.inputLabel, { color: palette.text }]}>Private Therapist Remarks</Text>
            </View>
            <TextInput
              value={target.remarks}
              placeholder="Internal clinical notes, articulatory distortions, flags..."
              placeholderTextColor={palette.faint}
              onChangeText={(remarks) => onChange({ remarks })}
              style={[
                reviewStyles.fieldInput,
                { borderColor: palette.line, color: palette.text, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' },
              ]}
            />
            <Text style={[reviewStyles.privateNotice, { color: palette.faint }]}>
              Private remarks are only visible to you and not shared with guardians.
            </Text>
          </View>
        </View>
      ) : null}
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
  card: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 16, fontWeight: '700', color: '#0284C7' },
  copy: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 2 },
  pill: { minWidth: 76, height: 26, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  pillText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  empty: { textAlign: 'center', marginTop: 12 },

  // Detail Screen Styles
  missing: { padding: 24 },
  topNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 14 },
  topNavTitle: { fontSize: 15, fontWeight: '700' },
  back: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // Hero Student Card
  heroCard: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroAvatar: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  heroInitial: { fontSize: 20, fontWeight: '800', color: '#0284C7' },
  heroStudentName: { fontSize: 18, fontWeight: '800' },
  pillTag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  pillTagText: { fontSize: 11, fontWeight: '700' },
  heroDivider: { height: 1, marginVertical: 14 },

  // Clinical Metrics Row
  metricsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12 },
  metricCol: { flex: 1, alignItems: 'center', gap: 2 },
  metricLabel: { fontSize: 11, fontWeight: '600' },
  metricVal: { fontSize: 14, fontWeight: '800' },
  metricDivider: { width: 1, height: 26 },

  // Notice Callout
  noticeCallout: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 12 },
  noticeCalloutText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '500' },

  // Rating Guide Card
  guideCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14 },
  guideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  guideIconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  guideTitle: { fontSize: 14, fontWeight: '700' },
  guideBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  guideBadgeText: { fontSize: 10, fontWeight: '700' },
  guideBody: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, gap: 8 },
  guideRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  guideScorePill: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  guideScorePillText: { fontSize: 12, fontWeight: '800' },
  guideRowText: { fontSize: 13, fontWeight: '500' },

  // Position Section & Header
  positionSection: { marginBottom: 14 },
  positionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  positionSectionTitle: { fontSize: 16, fontWeight: '800' },
  posSummaryBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  posSummaryText: { fontSize: 11, fontWeight: '700' },

  // Target Card
  targetCard: { borderRadius: 18, borderWidth: 1, padding: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  targetCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  targetWord: { fontSize: 18, fontWeight: '800' },
  targetSublabel: { fontSize: 11, fontWeight: '600' },
  scoreStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  scoreStatusText: { fontSize: 11, fontWeight: '700' },

  // Score Selector
  ratingSection: { marginBottom: 12 },
  ratingSectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
  scoresRow: { flexDirection: 'row', gap: 8 },
  scoreBtn: { flex: 1, height: 42, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  scoreBtnSelected: { backgroundColor: '#0284C7', borderColor: '#0284C7', shadowColor: '#0284C7', shadowOpacity: 0.3, shadowRadius: 6, elevation: 2 },
  scoreBtnText: { fontSize: 15, fontWeight: '800' },

  // Notes Collapsible
  notesToggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1 },
  notesToggleText: { color: '#0284C7', fontSize: 13, fontWeight: '700' },
  notesBody: { marginTop: 12, gap: 12 },
  inputLabel: { fontSize: 12, fontWeight: '700' },
  fieldInput: { minHeight: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 13 },
  privateNotice: { fontSize: 11, lineHeight: 15, marginTop: 2 },

  // Summary Card
  summaryCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  summaryCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  summaryIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  summaryCardTitle: { fontSize: 16, fontWeight: '800' },
  summaryCardSubtitle: { fontSize: 11, marginTop: 1 },

  // Toast Notice
  toastNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 12, padding: 12, marginBottom: 12 },
  toastNoticeText: { color: '#16A34A', fontSize: 13, fontWeight: '700' },

  // Bottom Actions
  bottomActions: { flexDirection: 'row', gap: 12, marginBottom: 36 },
  draftBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  draftBtnText: { fontSize: 14, fontWeight: '700' },
  saveBtn: { flex: 1.4, height: 48, borderRadius: 14, backgroundColor: '#0284C7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#0284C7', shadowOpacity: 0.35, shadowRadius: 8, elevation: 3 },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // Audio Demo Card
  audioCard: { borderWidth: 1, borderColor: '#BAE6FD', backgroundColor: '#F0F9FF', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  audioPlay: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center' },
  audioTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  audioMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  audioBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 22 },
  audioBar: { width: 3.5, borderRadius: 2, backgroundColor: '#0284C7' },
});
