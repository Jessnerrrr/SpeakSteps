// =============================================================================
// THERAPIST DASHBOARD — All dashboard code in one file
// Replaces: therapist-homepage/pages, components, data, styles
// =============================================================================

import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TherapistShell } from '@/components/therapist/TherapistShell';
import { useTherapist } from '@/components/therapist/TherapistProvider';
import { PeopleIcon, PersonIcon } from '@/components/therapist/icons';
import type { TherapistRoute } from '@/navigation/therapistTabs';

// ─── Types ───────────────────────────────────────────────────────────────────

type StatTone = 'green' | 'alert' | 'primary' | 'orange';

type HomeStat = {
  id: string;
  value: string;
  label: string;
  badge: string;
  tone: StatTone;
  href: TherapistRoute;
};

export type Submission = {
  id: string;
  initials: string;
  name: string;
  detail: string;
  stage: string;
  progress: number;
  timestamp: string;
};

// ─── Data ────────────────────────────────────────────────────────────────────

const sampleStats: HomeStat[] = [
  { id: 'recordings', value: '4', label: 'Recordings to Review', badge: 'Pending', tone: 'green', href: '/therapist/reviews' },
  { id: 'follow-up', value: '3', label: 'Require Follow-up', badge: 'Alert', tone: 'alert', href: '/therapist/patients' },
  { id: 'submissions', value: '7', label: 'Submissions Received', badge: 'Today', tone: 'primary', href: '/therapist/reviews' },
  { id: 'overdue', value: '14', label: 'Overdue / Active Task', badge: 'Active', tone: 'orange', href: '/therapist/activities' },
];

const sampleSubmissions: Submission[] = [
  { id: 'khyl', initials: 'KS', name: 'Khyl Shervin Sude', detail: '8 yrs old · Tagalog · /r/ Target', stage: 'Stage: Isolated Sounds', progress: 0.35, timestamp: 'Today at 11:12 AM' },
  { id: 'angelica', initials: 'A', name: 'Angelica Vega', detail: '7 yrs old · Tagalog & English · All Target · Sentences', stage: 'Stage: Sentences', progress: 0.8, timestamp: 'Today at 08:09 AM' },
  { id: 'jhonas', initials: 'J', name: 'Jhonas Elsisura', detail: '6 yrs old · English · /l/ Target · Syllables', stage: 'Stage: Syllables', progress: 0.45, timestamp: 'Yesterday at 09:09 AM' },
  { id: 'mcgravy', initials: 'M', name: 'Mcgravy Ameer Jr.', detail: '9 yrs old · Tagalog · /r/ Target · Phrases', stage: 'Stage: Phrases', progress: 0.75, timestamp: 'October 25, 2026 at 09:09 AM' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function greetingName(fullName: string) {
  const withoutCredentials = fullName.split(',')[0]?.trim() || fullName;
  const parts = withoutCredentials.split(/\s+/).filter(Boolean);
  const last = parts[parts.length - 1] || 'Andres';
  if (/^dr\.?$/i.test(parts[0] || '')) return `Dr. ${last}`;
  return withoutCredentials;
}

function formatHomeDate(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function timeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function toneColor(tone: StatTone, palette: { green: string; alert: string; primary: string; orange: string }) {
  if (tone === 'green') return palette.green;
  if (tone === 'alert') return palette.alert;
  if (tone === 'orange') return palette.orange;
  return palette.primary;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function QuickActions({ onAssign, onAddPatient }: { onAssign: () => void; onAddPatient: () => void }) {
  const { palette } = useTherapist();
  return (
    <View style={styles.quickRow}>
      <Pressable
        accessibilityRole="button"
        onPress={onAssign}
        style={({ pressed }) => [styles.quickButton, { backgroundColor: palette.primarySoft, opacity: pressed ? 0.8 : 1 }]}
      >
        <PersonIcon color={palette.primaryText} size={18} />
        <Text style={[styles.quickLabel, { color: palette.primaryText }]}>Assign Activity</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onAddPatient}
        style={({ pressed }) => [styles.quickButton, { backgroundColor: palette.greenSoft, opacity: pressed ? 0.8 : 1 }]}
      >
        <PeopleIcon color={palette.greenText} />
        <Text style={[styles.quickLabel, { color: palette.greenText }]}>Add Patient</Text>
      </Pressable>
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
      style={({ pressed }) => [styles.statCard, { backgroundColor: palette.card, shadowColor: palette.shadow, opacity: pressed ? 0.9 : 1 }]}
    >
      <View style={styles.statTop}>
        <Text style={[styles.statValue, { color: tone }]}>{item.value}</Text>
        <View style={[styles.statBadge, { backgroundColor: tone }]}>
          <Text style={styles.statBadgeText}>{item.badge}</Text>
        </View>
      </View>
      <Text style={[styles.statLabel, { color: palette.muted }]}>{item.label}</Text>
    </Pressable>
  );
}

function StatGrid() {
  return (
    <View style={styles.statGrid}>
      <View style={styles.statRow}>
        <StatCard item={sampleStats[0]} />
        <StatCard item={sampleStats[1]} />
      </View>
      <View style={styles.statRow}>
        <StatCard item={sampleStats[2]} />
        <StatCard item={sampleStats[3]} />
      </View>
    </View>
  );
}

function RecentSubmissions({ onViewAll, onOpen }: { onViewAll: () => void; onOpen: (s: Submission) => void }) {
  const { palette } = useTherapist();
  return (
    <View style={[styles.recentPanel, { backgroundColor: palette.recent }]}>
      <View style={styles.recentHeader}>
        <Text style={[styles.recentTitle, { color: palette.primary }]}>Recent Submission</Text>
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
          style={({ pressed }) => [styles.recentCard, { backgroundColor: palette.card, opacity: pressed ? 0.92 : 1 }]}
        >
          <View style={styles.recentIdentity}>
            <View style={styles.recentAvatar}>
              <Text style={styles.recentInitials}>{item.initials}</Text>
            </View>
            <View style={styles.recentCopy}>
              <View style={styles.recentNameRow}>
                <Text style={[styles.recentName, { color: palette.text }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.recentTime, { color: palette.faint }]}>{item.timestamp}</Text>
              </View>
              <Text style={[styles.recentDetail, { color: palette.muted }]}>{item.detail}</Text>
              <Text style={[styles.recentStage, { color: palette.faint }]}>{item.stage}</Text>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TherapistDashboard() {
  const { palette, profile, notificationsOpen, setAddPatientOpen } = useTherapist();
  const openReviews = (_submission?: Submission) => {
    router.push('/therapist/reviews' as never);
  };

  return (
    <TherapistShell active="home">
      <ScrollView
        scrollEnabled={!notificationsOpen}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.date, { color: palette.faint }]}>{formatHomeDate(new Date())}</Text>
        <Text style={[styles.greeting, { color: palette.primary }]}>
          {timeGreeting()}, {greetingName(profile.fullName)}
        </Text>
        <Text style={[styles.subtitle, { color: palette.muted }]}>Here&apos;s what needs your attention today.</Text>
        <View style={styles.block}>
          <QuickActions
            onAssign={() => router.push('/therapist/activities/assign?id=ready-set-r' as never)}
            onAddPatient={() => setAddPatientOpen(true)}
          />
        </View>
        <View style={styles.block}>
          <StatGrid />
        </View>
        <RecentSubmissions onViewAll={openReviews} onOpen={openReviews} />
      </ScrollView>
    </TherapistShell>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 20 },
  date: { fontSize: 13, marginBottom: 4 },
  greeting: { fontSize: 26, lineHeight: 32, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 4, marginBottom: 16 },
  block: { marginBottom: 14 },

  // Quick Actions
  quickRow: { flexDirection: 'row', gap: 10 },
  quickButton: { flex: 1, minHeight: 42, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10 },
  quickLabel: { fontSize: 13, fontWeight: '700' },

  // Stat Grid
  statGrid: { gap: 12 },
  statRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, minHeight: 108, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, justifyContent: 'space-between', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  statTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 },
  statValue: { fontSize: 28, fontWeight: '700', lineHeight: 32 },
  statBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  statLabel: { fontSize: 13, lineHeight: 17, fontWeight: '500' },

  // Recent Submissions
  recentPanel: { borderRadius: 18, padding: 12, gap: 10 },
  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 2 },
  recentTitle: { fontSize: 16, fontWeight: '700' },
  viewAll: { fontSize: 13, fontWeight: '600' },
  recentCard: { borderRadius: 14, padding: 12 },
  recentIdentity: { flexDirection: 'row', gap: 10 },
  recentAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E7EDF2' },
  recentInitials: { color: '#7B8B9C', fontSize: 12, fontWeight: '700' },
  recentCopy: { flex: 1, gap: 4 },
  recentNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentName: { fontSize: 13, fontWeight: '700', flex: 1, marginRight: 8 },
  recentTime: { fontSize: 11 },
  recentDetail: { fontSize: 12 },
  recentStage: { fontSize: 11 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  track: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: '#0284C7', borderRadius: 2 },
  percent: { fontSize: 11, color: '#8B9AAB', fontWeight: '600', minWidth: 28 },
});
