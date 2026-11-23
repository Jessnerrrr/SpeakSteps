import { assignmentAttribution, submitLearningAssignment, useLearningAssignments } from '@/data/learning-workflow';
import { usePracticeRecorder } from '@/components/use-practice-recorder';
import { PracticeStarCelebration } from '@/components/practice-star-celebration';
import { ChildProfileStore } from '@/data/child-profile-store';
import { sampleActivities, therapistPracticePrompts } from '@/Therapist-modules/therapist-activities/data/activityData';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState, useSyncExternalStore, type ComponentRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

// FIXED IMPORTS: 2 levels up to reach src/types and src/components
import type { AdventureCategory } from '../../data/patient-dashboard-mock';
import type { Position } from '../../types/sentences';
import { ChildBottomNav } from '../../components/child-bottom-nav';
import { ChildScreenFrame, childScreenColors } from '../../components/child-screen-frame';
import { submitPractice } from '../../data/practice-submissions';
import { BuddyStore } from '../../data/buddy-store';

export default function PracticeScreen() {
  const params = useLocalSearchParams<{
    sentenceId: string;
    sound: string;
    syllable: string;
    category: AdventureCategory['iconType'] | 'sound';
    activityId: string;
    linkedAssignment: string;
    catalogActivityId: string;
    position: string;
    language: string;
    level: string;
  }>();

  const [submissionError, setSubmissionError] = useState('');
  const [promptIndex, setPromptIndex] = useState(0);
  const audio = usePracticeRecorder(promptIndex);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const studentId = ChildProfileStore.getProfile().id;
  const assignments = useLearningAssignments();
  const assignment = params.linkedAssignment === 'true'
    ? assignments.find((item) => item.id === params.activityId && item.studentId === studentId)
    : undefined;
  const catalogActivity = sampleActivities.find((item) => item.id === params.catalogActivityId);
  const prompts = assignment?.prompts ?? (catalogActivity ? therapistPracticePrompts(catalogActivity) : []);
  const currentPrompt = prompts[promptIndex];
  const hasNextPrompt = promptIndex < prompts.length - 1;
  const instructions = assignment?.instructions ?? catalogActivity?.instructions;
  const guidance = (assignment?.guidance ?? catalogActivity?.guide)?.trim();
  const [submission, setSubmission] = useState<'earned' | 'repeat' | 'missing' | null>(null);
  const completed = submission === 'earned' || submission === 'repeat';
  const promptTotal = Math.max(1, prompts.length);
  const position = (params.position ?? 'Initial') as Position;
  const sound = params.sound ?? '/s/';
  const syllable = params.syllable ?? (params.level === 'Sound' ? '' : 'sa');
  const category = (assignment?.level ?? catalogActivity?.level ?? params.level) === 'Syllables'
    ? 'syllables' : params.category === 'sound' ? 'sounds' : params.category ?? 'sounds';
  const practiceContext = assignment ? 'Due ' + assignment.dueDate : params.activityId ? 'Assigned practice' : catalogActivity ? catalogActivity.language : params.level === 'Sound' ? 'Individual sound' : category === 'sounds' ? position : params.language ?? 'Play';
  const practiceId = params.activityId ? 'assigned:' + params.activityId : catalogActivity ? 'library:' + catalogActivity.id : params.sentenceId;
  const title = assignment?.title ?? catalogActivity?.title ?? [sound, syllable].filter(Boolean).join(' ');


  const buddy = useSyncExternalStore(BuddyStore.subscribe, BuddyStore.getActiveBuddy, BuddyStore.getActiveBuddy);

  // FIXED FONT PATHS: 3 levels up to reach root assets folder
  const [fontsLoaded] = useFonts({
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/sentences' as any);
    }
  };

  const goToPrompt = (index: number) => {
    audio.stopPlayback();
    setPromptIndex(index);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ChildScreenFrame>
        <LinearGradient colors={['#ECF8FF', '#DDEFFF', '#EDF8FF']} style={StyleSheet.absoluteFill} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Pressable onPress={handleBack} style={({ pressed }) => [styles.backBtn, pressed && styles.buttonPressed]} accessibilityRole="button" accessibilityLabel="Back">
              <Ionicons name="chevron-back" size={26} color="#0D68AC" />
            </Pressable>
            <Text accessibilityRole="header" style={styles.headerTitle}>Practice</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scrollContainer}
          contentContainerStyle={[styles.scrollContent, completed && styles.completionScroll]}
          showsVerticalScrollIndicator={false}
        >
          {completed ? (
            <Animated.View entering={FadeInDown.duration(280)} style={styles.completionShell}>
              <LinearGradient colors={['#FFFFFF', '#EDF8FF']} style={styles.completionCard}>
                <View style={styles.completionArt}>
                  <Image source={buddy.image} style={styles.completedBuddy} contentFit="contain" />
                  {submission === 'earned' ? <PracticeStarCelebration /> : (
                    <Animated.View entering={ZoomIn.duration(260)} style={styles.repeatBadge}>
                      <Ionicons name="checkmark" size={34} color="#0D68AC" />
                    </Animated.View>
                  )}
                </View>
                <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.completionCopy}>
                  <Text style={styles.completionTitle}>{submission === 'earned' ? 'You earned a star!' : 'Great practice!'}</Text>
                  <Text style={styles.completionActivity}>{title}</Text>
                  <Text style={styles.completionDetail}>{submission === 'earned'
                    ? 'Your new star is waiting in My Stars.'
                    : 'You already earned a star for this activity.'}</Text>
                </View>
                <View style={styles.completionSummary}>
                  <Ionicons name="checkmark-circle" size={19} color="#0D68AC" />
                  <Text style={styles.completionSummaryText}>{promptTotal} {promptTotal === 1 ? 'prompt' : 'prompts'} practiced</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={handleBack}
                  style={({ pressed }) => [styles.submitBtn, styles.completionAction, pressed && styles.buttonPressed]}>
                  <Text style={styles.submitText}>Done</Text>
                  <Ionicons name="chevron-forward" size={19} color="#FFFFFF" />
                </Pressable>
              </LinearGradient>
            </Animated.View>
          ) : (
          <View style={styles.centerWrapper}>

            <LinearGradient colors={['#FFFFFF', '#F4FAFF']} style={styles.banner}>
              <Image source={buddy.image} style={styles.buddyImage} contentFit="contain" />
              <View style={styles.bannerText}>
                <Text style={styles.bannerLabel}>{params.level ?? (category.charAt(0).toUpperCase() + category.slice(1))} · {practiceContext}</Text>
                <Text style={styles.bannerSound}>{title}</Text>
                {assignment && <Text style={styles.bannerLabel}>Assigned by {assignmentAttribution(assignment)}</Text>}
              </View>
            </LinearGradient>

            <View style={styles.videoCard}>
                <View style={styles.promptList}>
                  <View style={styles.promptHeading}>
                    <Text accessibilityLiveRegion="polite" style={styles.promptCount}>Prompt {promptIndex + 1} of {promptTotal}</Text>
                    {currentPrompt?.position && <Text style={styles.positionChip}>{currentPrompt.position}</Text>}
                  </View>
                  <View accessibilityRole="progressbar" accessibilityLabel="Practice progress"
                    accessibilityValue={{ min: 0, max: promptTotal, now: promptIndex + 1 }} style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${(promptIndex + 1) / promptTotal * 100}%` }]} />
                  </View>
                  <Animated.View key={promptIndex} entering={FadeInDown.duration(230)}>
                    <LinearGradient colors={['#09578F', '#1979BD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promptPanel}>
                      <View style={styles.promptGlow} />
                      <Ionicons name="sparkles" size={23} color="#FFDC87" style={styles.promptSpark} />
                      <View style={styles.promptIcon}>
                        <Ionicons name="chatbubble-ellipses" size={19} color="#FFFFFF" />
                      </View>
                      <Text style={styles.prompt}>{currentPrompt?.text ?? title}</Text>
                    </LinearGradient>
                  </Animated.View>
                  {instructions ? <Text style={styles.videoHint}>{instructions}</Text> : null}
                </View>
            </View>

            {guidance ? (
              <LinearGradient colors={['#FFF8E4', '#FFF0C6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.guidance}>
                <View style={styles.guidanceBadge}>
                  <Ionicons name="bulb" size={22} color="#915207" />
                </View>
                <View style={styles.guidanceCopy}>
                  <Text accessibilityRole="header" style={styles.guidanceTitle}>Therapist guidance</Text>
                  <Text style={styles.guidanceText}>{guidance}</Text>
                </View>
              </LinearGradient>
            ) : null}

              <View style={styles.micSection}>
                <View style={styles.recordRow}>
                <Pressable accessibilityRole="button" accessibilityLabel={audio.recording ? 'Stop recording' : audio.take ? 'Record again' : 'Record'}
                  disabled={audio.busy} onPress={() => void audio.record()}
                  style={({ pressed }) => [styles.micBtn, audio.recording && styles.micRecording, pressed && styles.buttonPressed]}>
                  <Ionicons name={audio.recording ? 'stop' : 'mic'} size={25} color="#FFFFFF" />
                </Pressable>
                <View style={styles.recordCopy}>
                  <Text accessibilityLiveRegion="polite" style={styles.micLabel}>{audio.recording ? 'Stop recording' : audio.take ? 'Record again' : 'Record your voice'}</Text>
                  <Text style={styles.micHint}>{audio.recording ? 'Say the prompt, then tap to stop.' : 'Record a take or practice out loud.'}</Text>
                </View>
                </View>
                {audio.take && !audio.recording && (
                  <Pressable accessibilityRole="button" onPress={() => void audio.listen()} disabled={audio.busy}
                    style={({ pressed }) => [styles.listenButton, pressed && styles.buttonPressed]}>
                    <Ionicons name={audio.playing ? 'pause' : 'play'} size={17} color="#0D68AC" />
                    <Text style={styles.previousPromptText}>{audio.playing ? 'Pause playback' : 'Listen to my recording'}</Text>
                  </Pressable>
                )}
                {audio.error ? <Text accessibilityRole="alert" style={styles.micHint}>{audio.error}</Text> : null}
              </View>
            {submissionError ? <Text accessibilityRole="alert" style={styles.rewardDetail}>{submissionError}</Text> : null}
            {submission === 'missing' ? <Text accessibilityRole="alert" style={styles.rewardDetail}>Choose a sound in Play to submit an activity.</Text> : null}
            <Pressable accessibilityRole="button" disabled={audio.recording || audio.busy}
              style={({ pressed }) => [styles.submitBtn, pressed && styles.buttonPressed, (audio.recording || audio.busy) && styles.submitDisabled]} onPress={() => {
              audio.stopPlayback();
              if (submission === 'missing') {
                router.replace('/sentences');
                return;
              }
              if (!practiceId) {
                setSubmission('missing');
                return;
              }
              if (hasNextPrompt) {
                goToPrompt(promptIndex + 1);
                return;
              }
              if (params.linkedAssignment === 'true' && !submitLearningAssignment(params.activityId, studentId)) {
                setSubmissionError('This assignment is no longer available for this student.');
                return;
              }
              setSubmissionError('');
              const earned = submitPractice({ id: practiceId, title, position: practiceContext, category });
              setSubmission(earned ? 'earned' : 'repeat');
              scrollRef.current?.scrollTo({ y: 0, animated: false });
            }}>
              <Text style={styles.submitText}>{submission === 'missing' ? 'Go to Play' : hasNextPrompt ? 'Next prompt' : 'Submit'}</Text>
              <Ionicons name={hasNextPrompt ? 'chevron-forward' : 'checkmark'} size={19} color="#FFFFFF" />
            </Pressable>
            {!submission && promptIndex > 0 && (
              <Pressable accessibilityRole="button" disabled={audio.recording || audio.busy} onPress={() => goToPrompt(promptIndex - 1)} style={({ pressed }) => [styles.previousPrompt, pressed && styles.buttonPressed]}>
                <Text style={styles.previousPromptText}>Previous prompt</Text>
              </Pressable>
            )}

          </View>
          )}
        </ScrollView>

        {/* Global Footer Navigation Component */}
        <ChildBottomNav activeTab="play" />

      </ChildScreenFrame>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  completionScroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 14 },
  completionShell: { width: '100%', paddingHorizontal: 16, alignItems: 'center' },
  completionCard: { width: '100%', maxWidth: 430, alignItems: 'center', padding: 16, gap: 12, borderRadius: 25, borderWidth: 1.5, borderBottomWidth: 4, borderColor: '#C0DFF4' },
  completionArt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 105 },
  completedBuddy: { width: 88, height: 88, flexShrink: 1 },
  repeatBadge: { width: 67, height: 67, marginHorizontal: 12, borderRadius: 23, backgroundColor: '#DCEEFC', alignItems: 'center', justifyContent: 'center' },
  completionCopy: { width: '100%', alignItems: 'center', gap: 4 },
  completionTitle: { fontFamily: 'SourGummy-Bold', color: '#0D68AC', fontSize: 28, textAlign: 'center' },
  completionActivity: { fontFamily: 'SourGummy-Bold', color: '#183B56', fontSize: 17, textAlign: 'center' },
  completionDetail: { fontFamily: 'SourGummy-Medium', color: '#435F77', fontSize: 15, textAlign: 'center' },
  completionSummary: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, gap: 6, borderRadius: 14, backgroundColor: '#DCEFFC' },
  completionSummaryText: { fontFamily: 'SourGummy-Bold', fontSize: 14, color: '#0D68AC' },
  completionAction: { width: '100%', marginHorizontal: 0, marginTop: 1, flexDirection: 'row', gap: 8 },

  // Added wrappers for responsiveness
  centerWrapper: {
    width: '100%',
    alignSelf: 'center',
  },

  header: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: childScreenColors.surface,
    borderWidth: 1,
    borderColor: '#C7DFEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: { fontFamily: 'SourGummy-Bold', color: '#0D68AC', fontSize: 26 },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderBottomWidth: 3,
    borderColor: '#C2DFF3',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 19,
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 11,
  },
  buddyImage: { width: 76, height: 76 },
  bannerText: { flex: 1 },
  bannerLabel: { fontFamily: 'SourGummy-Medium', color: '#436482', fontSize: 14 },
  bannerSound: { fontFamily: 'SourGummy-Bold', color: '#0967AD', fontSize: 23 },

  videoCard: {
    backgroundColor: childScreenColors.surface,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#CBE6F6',
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  promptList: { width: '100%', gap: 8 },
  promptCount: { color: '#146CAF', fontFamily: 'SourGummy-Bold', fontSize: 15 },
  promptHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7 },
  positionChip: { backgroundColor: '#E1F0FB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, color: '#0A5E9A', fontFamily: 'SourGummy-Bold', fontSize: 13 },
  progressTrack: { width: '100%', height: 7, borderRadius: 4, backgroundColor: '#E4EDF6', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: '#2496D9' },
  promptPanel: { borderRadius: 17, overflow: 'hidden', minHeight: 101, paddingHorizontal: 16, paddingVertical: 10, gap: 6, alignItems: 'center', justifyContent: 'center' },
  promptGlow: { position: 'absolute', width: 112, height: 112, left: -39, bottom: -65, borderRadius: 56, backgroundColor: '#FFFFFF18' },
  promptSpark: { position: 'absolute', right: 12, top: 11 },
  promptIcon: { width: 31, height: 31, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF2B' },
  previousPrompt: { minHeight: 44, marginHorizontal: 16, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  previousPromptText: { color: '#0D68AC', fontFamily: 'SourGummy-Bold', fontSize: 16 },
  guidance: { marginTop: 10, marginHorizontal: 16, padding: 11, borderRadius: 17, borderWidth: 1, borderBottomWidth: 3, borderColor: '#EFCD78', flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  guidanceBadge: { width: 35, height: 35, borderRadius: 12, backgroundColor: '#FFE099', alignItems: 'center', justifyContent: 'center' },
  guidanceCopy: { flex: 1, minWidth: 0, gap: 3 },
  guidanceTitle: { color: '#825115', fontFamily: 'SourGummy-Bold', fontSize: 17 },
  guidanceText: { color: '#503C26', fontFamily: 'SourGummy-Medium', fontSize: 15, lineHeight: 20 },
  prompt: { color: '#FFFFFF', fontFamily: 'SourGummy-Bold', fontSize: 25, textAlign: 'center' },
  videoHint: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 14,
    color: '#526779',
    textAlign: 'center',
  },
  micSection: { marginTop: 10, marginHorizontal: 16, padding: 10, gap: 7, borderRadius: 17, borderWidth: 1, borderBottomWidth: 3, borderColor: '#BFDFF4', backgroundColor: '#F7FCFF' },
  recordRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recordCopy: { flex: 1, minWidth: 0, gap: 2 },
  micRecording: { backgroundColor: '#B83E36' },
  listenButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#DAECF8' },
  submitDisabled: { opacity: 0.55 },
  micBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: childScreenColors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: childScreenColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  micLabel: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 16,
    color: '#0865AD',
  },
  micHint: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 14,
    color: '#526779',
  },

  submitBtn: {
    backgroundColor: '#116FB6',
    borderBottomWidth: 3,
    borderBottomColor: '#0A5291',
    marginHorizontal: 16,
    marginTop: 12,
    minHeight: 48,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  rewardDetail: { fontFamily: 'SourGummy-Medium', color: '#664F2E', fontSize: 13, lineHeight: 17 },
  submitText: { fontFamily: 'SourGummy-Bold', color: '#fff', fontSize: 20 },
  buttonPressed: { opacity: 0.83, transform: [{ scale: 0.97 }, { translateY: 2 }] },

});
