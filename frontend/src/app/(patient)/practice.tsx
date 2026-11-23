import { usePracticeRecorder } from '@/components/use-practice-recorder';
import { useAssignedActivities } from '@/data/assigned-activities';
import { usePatientLearning } from '@/components/patient/PatientLearningProvider';
import { AudioPlaybackButton } from '@/components/audio/AudioPlaybackButton';
import { createSubmission, getPracticeItems, uploadAudioFile } from '@/services/user-api';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, useSyncExternalStore, type ComponentRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native';

// FIXED IMPORTS: 2 levels up to reach src/types and src/components
import { ChildBottomNav } from '../../components/child-bottom-nav';
import { ChildScreenFrame, childScreenColors } from '../../components/child-screen-frame';
import { BuddyStore } from '../../data/buddy-store';
import type { AdventureCategory } from '../../data/patient-dashboard-mock';

type PracticeItem = Awaited<ReturnType<typeof getPracticeItems>>[number];

export default function PracticeScreen() {
  const params = useLocalSearchParams<{
    sentenceId: string;
    sound: string;
    syllable: string;
    category: AdventureCategory['iconType'] | 'sound';
    activityId: string;
    linkedAssignment: string;
    practiceItemId: string;
    position: string;
    language: string;
    level: string;
  }>();

  const [submissionError, setSubmissionError] = useState('');
  const [practiceItem, setPracticeItem] = useState<PracticeItem | null>(null);
  const [promptIndex, setPromptIndex] = useState(0);
  const audio = usePracticeRecorder(promptIndex);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const { patient, refresh } = usePatientLearning();
  const assignments = useAssignedActivities();
  const assignment = params.linkedAssignment === 'true'
    ? assignments.find((item) => item.id === params.activityId)
    : undefined;
  const prompts = assignment?.prompts ?? (practiceItem ? [{
    text: params.level === 'Sentences'
      ? practiceItem.sentenceText || practiceItem.syllable || practiceItem.sound
      : params.level === 'Syllables'
        ? practiceItem.syllable || practiceItem.sound
        : practiceItem.sound,
    position: practiceItem.position,
  }] : []);
  const currentPrompt = prompts[promptIndex];
  const hasNextPrompt = promptIndex < prompts.length - 1;
  const instructions = assignment?.description;
  const guidance = assignment?.guidance?.trim();
  const [submission, setSubmission] = useState<'earned' | 'repeat' | 'missing' | null>(null);
  const sound = params.sound ?? '/s/';
  const syllable = params.syllable ?? (params.level === 'Sound' ? '' : 'sa');
  const category = (assignment?.level ?? params.level) === 'Syllables'
    ? 'syllables' : params.category === 'sound' ? 'sounds' : params.category ?? 'sounds';
  const practiceContext = assignment
    ? assignment.dueDate ? 'Due ' + assignment.dueDate : 'Assigned practice'
    : practiceItem?.language ?? (params.level === 'Sound' ? 'Individual sound' : params.language ?? 'Play');
  const practiceId = assignment ? 'assigned:' + assignment.id : practiceItem ? 'library:' + practiceItem.id : params.sentenceId;
  const title = assignment?.title ?? practiceItem?.sentenceText ?? practiceItem?.syllable ?? [sound, syllable].filter(Boolean).join(' ');

  const buddy = useSyncExternalStore(BuddyStore.subscribe, BuddyStore.getActiveBuddy, BuddyStore.getActiveBuddy);

  useEffect(() => {
    if (!params.practiceItemId || assignment) return;
    let active = true;
    void getPracticeItems({ language: params.language }).then((items) => {
      if (active) setPracticeItem(items.find((item) => item.id === params.practiceItemId) ?? null);
    }).catch((loadError) => {
      if (active) setSubmissionError(loadError instanceof Error ? loadError.message : 'Could not load this practice item.');
    });
    return () => { active = false; };
  }, [assignment, params.language, params.practiceItemId]);

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

  const submitRecording = async () => {
    if (!audio.take) {
      setSubmissionError('Record your voice before submitting.');
      return;
    }
    if (!patient) {
      setSubmissionError('The patient profile could not be loaded. Please try again.');
      return;
    }
    if (params.linkedAssignment === 'true' && !assignment) {
      setSubmissionError('This assignment is no longer available for this student.');
      return;
    }
    if (!practiceItem && !assignment) {
      setSubmissionError('This practice activity is no longer available.');
      return;
    }
    setSubmissionError('');
    try {
      const audioRecordingUrl = await uploadAudioFile(audio.take);
      const saved = await createSubmission({
        patientId: patient.id,
        assignmentId: assignment?.id,
        practiceItemId: practiceItem?.id,
        audioRecordingUrl,
      });
      await refresh();
      setSubmission(saved.starsAwarded > 0 ? 'earned' : 'repeat');
    } catch (submitError) {
      setSubmissionError(submitError instanceof Error ? submitError.message : 'Could not submit this practice recording.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ChildScreenFrame>

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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Centering Wrapper for tablet responsiveness */}
          <View style={styles.centerWrapper}>

            <View style={styles.banner}>
              <Image source={buddy.image} style={styles.buddyImage} contentFit="contain" />
              <View style={styles.bannerText}>
                <Text style={styles.bannerLabel}>{params.level ?? (category.charAt(0).toUpperCase() + category.slice(1))} · {practiceContext}</Text>
                <Text style={styles.bannerSound}>{title}</Text>
              </View>
            </View>

            {(!submission || submission === 'missing') && <View style={styles.videoCard}>
              {currentPrompt ? (
                <View style={styles.promptList}>
                  <View accessibilityLiveRegion="polite" style={styles.promptList}>
                    <Text style={styles.promptCount}>Prompt {promptIndex + 1} of {prompts.length}{currentPrompt.position ? ' · ' + currentPrompt.position : ''}</Text>
                    <Text style={styles.prompt}>{currentPrompt.text}</Text>
                    <AudioPlaybackButton
                      audioUrl={assignment?.modelAudioUrls?.[promptIndex] ?? practiceItem?.sampleAudioUrl}
                      label="Listen to the example"
                      variant="inline"
                    />
                  </View>
                  {instructions ? <Text style={styles.videoHint}>{instructions}</Text> : null}
                </View>
              ) : (
                <>
                  <View style={styles.videoPlaceholder}>
                    <Ionicons name="play" size={34} color="#0D68AC" />
                  </View>
                  <Text style={styles.videoHint}>{instructions || 'A practice video is unavailable for this activity.'}</Text>
                  <View style={styles.watchAgainBtn}>
                    <Text style={styles.watchAgainText}>Say it out loud</Text>
                  </View>
                </>
              )}
              {guidance ? (
                <View style={styles.guidance}>
                  <Text style={styles.watchAgainText}>Therapist guidance</Text>
                  <Text style={styles.guidanceText}>{guidance}</Text>
                </View>
              ) : null}
            </View>}

            {submission && submission !== 'missing' ? (
              <View accessible accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.rewardCard}>
                <View style={styles.rewardIcon}>
                  <Image source={require('../../../assets/images/speaksteps_star_3d.gif')} style={styles.rewardStar} contentFit="contain" />
                </View>
                <View style={styles.rewardCopy}>
                  <Text style={styles.rewardTitle}>{submission === 'earned' ? 'You earned a star!' : 'Great practice!'}</Text>
                  <Text style={styles.rewardDetail}>{submission === 'earned'
                    ? 'Activity submitted. Your star is in My Stars.'
                    : 'You already earned a star for this activity.'}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.micSection}>
                <Pressable accessibilityRole="button" accessibilityLabel={audio.recording ? 'Stop recording' : audio.take ? 'Record again' : 'Record'}
                  disabled={audio.busy} onPress={() => void audio.record()}
                  style={({ pressed }) => [styles.micBtn, pressed && styles.buttonPressed, audio.recording && styles.micRecording]}>
                  <Image source={require('../../../assets/images/mic.png')} style={styles.micIconImg} contentFit="contain" />
                </Pressable>
                <Text accessibilityLiveRegion="polite" style={styles.micLabel}>{audio.recording ? 'Stop recording' : audio.take ? 'Record again' : 'Record your voice'}</Text>
                {audio.take && !audio.recording && (
                  <Pressable accessibilityRole="button" onPress={() => void audio.listen()} disabled={audio.busy}
                    style={({ pressed }) => [styles.listenButton, pressed && styles.buttonPressed]}>
                    <Ionicons name={audio.playing ? 'pause' : 'play'} size={17} color="#0D68AC" />
                    <Text style={styles.previousPromptText}>{audio.playing ? 'Pause playback' : 'Listen to my recording'}</Text>
                  </Pressable>
                )}
                <Text style={styles.micHint}>{audio.recording ? 'Say the prompt, then tap to stop.' : 'Record a take before submitting.'}</Text>
                {audio.error ? <Text accessibilityRole="alert" style={styles.micHint}>{audio.error}</Text> : null}
              </View>

            )}
            {submissionError ? <Text accessibilityRole="alert" style={styles.rewardDetail}>{submissionError}</Text> : null}
            {submission === 'missing' ? <Text accessibilityRole="alert" style={styles.rewardDetail}>Choose a sound in Play to submit an activity.</Text> : null}
            <Pressable accessibilityRole="button" disabled={audio.recording || audio.busy}
              style={({ pressed }) => [styles.submitBtn, submission && styles.rewardAction, pressed && styles.buttonPressed, (audio.recording || audio.busy) && styles.submitDisabled]} onPress={() => {
              audio.stopPlayback();
              if (submission === 'missing') {
                router.replace('/sentences');
                return;
              }
              if (submission) {
                handleBack();
                return;
              }
              if (!practiceId) {
                setSubmissionError('This practice activity is still loading. Please wait and try again.');
                return;
              }
              if (hasNextPrompt) {
                goToPrompt(promptIndex + 1);
                return;
              }
              void submitRecording();
            }}>
              <Text style={styles.submitText}>{submission === 'missing' ? 'Go to Play' : submission ? 'Done' : hasNextPrompt ? 'Next prompt' : 'Submit'}</Text>
            </Pressable>
            {!submission && promptIndex > 0 && (
              <Pressable accessibilityRole="button" disabled={audio.recording || audio.busy} onPress={() => goToPrompt(promptIndex - 1)} style={({ pressed }) => [styles.previousPrompt, pressed && styles.buttonPressed]}>
                <Text style={styles.previousPromptText}>Previous prompt</Text>
              </Pressable>
            )}

          </View>
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

  // Added wrappers for responsiveness
  centerWrapper: {
    width: '100%',
    alignSelf: 'center',
  },

  header: {
    backgroundColor: childScreenColors.canvas,
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
    borderColor: '#CBE6F6',
    backgroundColor: childScreenColors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buddyImage: { width: 70, height: 70, marginRight: 16 },
  bannerText: { flex: 1 },
  bannerLabel: { fontFamily: 'SourGummy-Medium', color: '#485569', fontSize: 14 },
  bannerSound: { fontFamily: 'SourGummy-Bold', color: '#183B56', fontSize: 30 },

  videoCard: {
    backgroundColor: childScreenColors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBE6F6',
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  videoPlaceholder: {
    width: 100,
    height: 80,
    backgroundColor: childScreenColors.canvas,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  promptList: { width: '100%', gap: 8 },
  promptCount: { color: '#436780', fontFamily: 'SourGummy-Medium', fontSize: 15, textAlign: 'center' },
  previousPrompt: { minHeight: 44, marginHorizontal: 16, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  previousPromptText: { color: '#0D68AC', fontFamily: 'SourGummy-Bold', fontSize: 16 },
  guidance: { width: '100%', marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: '#FFF4D9', gap: 4 },
  guidanceText: { color: '#183B56', fontFamily: 'SourGummy-Medium', fontSize: 16 },
  prompt: { backgroundColor: childScreenColors.canvas, borderRadius: 12, padding: 16, color: '#183B56', fontFamily: 'SourGummy-Bold', fontSize: 24, textAlign: 'center' },
  videoHint: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 14,
    color: '#526779',
    textAlign: 'center',
    marginBottom: 14,
  },
  watchAgainBtn: {
    backgroundColor: childScreenColors.canvas,
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    justifyContent: 'center',
  },
  watchAgainText: { fontFamily: 'SourGummy-Bold', color: '#0D68AC', fontSize: 18 },

  micSection: { alignItems: 'center', marginTop: 24 },
  micRecording: { backgroundColor: '#B83E36' },
  listenButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#DAECF8', marginTop: 8 },
  submitDisabled: { opacity: 0.55 },
  micBtn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: childScreenColors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: childScreenColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  micIconImg: {
    width: 52,
    height: 52,
  },
  micLabel: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 16,
    color: '#0865AD',
    marginTop: 12,
  },
  micHint: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 14,
    color: '#526779',
    textAlign: 'center',
    marginTop: 4,
  },

  submitBtn: {
    backgroundColor: childScreenColors.accent,
    marginHorizontal: 40,
    marginTop: 24,
    minHeight: 48,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  rewardCard: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 16, backgroundColor: '#FFF9EA', borderColor: '#EBD49C', borderWidth: 1, borderRadius: 14, padding: 10 },
  rewardIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  rewardStar: { width: 30, height: 30 },
  rewardCopy: { flex: 1, minWidth: 0 },
  rewardTitle: { fontFamily: 'SourGummy-Bold', color: '#65450C', fontSize: 16 },
  rewardDetail: { fontFamily: 'SourGummy-Medium', color: '#664F2E', fontSize: 13, lineHeight: 17 },
  rewardAction: { marginTop: 10, marginHorizontal: 16 },
  submitText: { fontFamily: 'SourGummy-Bold', color: '#fff', fontSize: 20 },
  buttonPressed: { opacity: 0.83, transform: [{ scale: 0.97 }, { translateY: 2 }] },

});
