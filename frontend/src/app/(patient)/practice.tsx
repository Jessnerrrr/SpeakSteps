import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

// FIXED IMPORTS: 2 levels up to reach src/types and src/components
import type { Position } from '../../types/sentences';
import { ChildBottomNav } from '../../components/child-bottom-nav';
import { createSubmission, getMyPatients, resolveAudioUrl, uploadAudioFile, type PatientSearchResult } from '@/services/user-api';

export default function PracticeScreen() {
  const params = useLocalSearchParams<{
    sentenceId: string;
    sound: string;
    syllable: string;
    stars: string;
    position: string;
    assignmentId?: string;
    practiceItemId?: string;
    patientId?: string;
    patientCode?: string;
    modelAudioUrl?: string | string[];
  }>();

  const position = (params.position ?? 'Initial') as Position;
  const sound = params.sound ?? '/s/';
  const syllable = params.syllable ?? 'sa';
  const modelAudioUrl = Array.isArray(params.modelAudioUrl) ? params.modelAudioUrl[0] : params.modelAudioUrl;
  const modelPlayer = useAudioPlayer(modelAudioUrl ? resolveAudioUrl(modelAudioUrl) : null);
  const modelPlayerStatus = useAudioPlayerStatus(modelPlayer);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [patient, setPatient] = useState<PatientSearchResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const recording = recorderState.isRecording;

  // Responsive Hooks
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  // FIXED FONT PATHS: 3 levels up to reach root assets folder
  const [fontsLoaded] = useFonts({
    SourGummy: require('../../../assets/SourGummy.ttf'),
  });
  
  useEffect(() => {
    let active = true;
    AudioModule.requestRecordingPermissionsAsync()
      .then(({ granted }) => {
        if (active) {
          setPermissionGranted(granted);
          if (!granted) setError('Microphone access is required to record practice.');
        }
      })
      .catch((permissionError: unknown) => {
        if (active) setError(permissionError instanceof Error ? permissionError.message : 'Could not request microphone access.');
      });
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true })
      .catch((modeError: unknown) => {
        if (active) setError(modeError instanceof Error ? modeError.message : 'Could not prepare audio recording.');
      });
    getMyPatients()
      .then((patients) => {
        if (!active) return;
        const selected = params.patientId
          ? patients.find((item) => item.id === params.patientId)
          : patients.find((item) => item.patientCode === params.patientCode) || patients[0];
        setPatient(selected || null);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load the child profile.');
      });
    return () => {
      active = false;
    };
  }, [params.patientCode, params.patientId]);

  if (!fontsLoaded) return null;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/sentences' as any);
    }
  };

  const toggleRecording = async () => {
    setError('');
    try {
      if (recording) {
        await recorder.stop();
        setRecordingUri(recorder.uri || null);
        return;
      }
      if (!permissionGranted) {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        setPermissionGranted(permission.granted);
        if (!permission.granted) {
          setError('Microphone access is required to record practice.');
          return;
        }
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordingUri(null);
      setUploadedAudioUrl(null);
    } catch (recordError) {
      setError(recordError instanceof Error ? recordError.message : 'Could not record this practice attempt.');
    }
  };

  const toggleModelPlayback = async () => {
    if (!modelAudioUrl) return;
    setError('');
    if (modelPlayerStatus.playing) {
      modelPlayer.pause();
      return;
    }
    try {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      if (modelPlayerStatus.didJustFinish) await modelPlayer.seekTo(0);
      modelPlayer.play();
    } catch (playError) {
      setError(playError instanceof Error ? playError.message : 'Could not play the SLP model audio.');
    }
  };

  const submitPractice = async () => {
    if (recording) {
      setError('Stop recording before submitting.');
      return;
    }
    if (!recordingUri) {
      setError('Record a practice attempt before submitting.');
      return;
    }
    if (!patient) {
      setError('No patient profile is available for this account.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const audioRecordingUrl = uploadedAudioUrl || await uploadAudioFile(recordingUri);
      if (!uploadedAudioUrl) setUploadedAudioUrl(audioRecordingUrl);
      await createSubmission({
        patientId: patient.id,
        patientCode: patient.patientCode,
        assignmentId: params.assignmentId,
        practiceItemId: params.practiceItemId,
        audioRecordingUrl,
        durationSeconds: Math.round(recorderState.durationMillis / 1000),
      });
      router.back();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit this practice attempt.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.headerContent, isTablet && styles.contentMax]}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Practice</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Centering Wrapper for tablet responsiveness */}
          <View style={[styles.centerWrapper, isTablet && styles.contentMax]}>
            
            {/* Sound Banner (Chirpy) */}
            <View style={styles.banner}>
              {/* FIXED IMAGE PATH (3 levels up) */}
              <Image
                source={require('../../../assets/images/bird-logo.gif')}
                style={styles.chirpy}
                contentFit="contain"
              />
              <View style={styles.bannerText}>
                <Text style={styles.bannerLabel}>Sounds · {position}</Text>
                <Text style={styles.bannerSound}>{sound} {syllable}</Text>
              </View>
            </View>

            {/* Video Card */}
            <View style={styles.videoCard}>
              <View style={styles.videoPlaceholder}>
                <Text style={styles.videoPlaceholderText}>▶</Text>
              </View>
              <Text style={styles.videoHint}>Watch the video how to say the word</Text>
              <TouchableOpacity
                style={styles.watchAgainBtn}
                activeOpacity={0.8}
                onPress={modelAudioUrl ? () => void toggleModelPlayback() : undefined}
                accessibilityLabel={modelAudioUrl ? 'Play or pause SLP model audio' : 'Watch again'}
              >
                <Text style={styles.watchAgainText}>
                  {modelAudioUrl
                    ? `${modelPlayerStatus.playing ? '❚❚  Pause' : '▶  Listen to'} SLP Model`
                    : '▶  Watch again'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Mic Section */}
            <View style={styles.micSection}>
              <TouchableOpacity
                style={[styles.micBtn, recording && styles.micBtnActive]}
                onPress={() => void toggleRecording()}
                activeOpacity={0.85}
              >
                {/* FIXED IMAGE PATH (3 levels up) */}
                <Image
                  source={require('../../../assets/images/mic.png')}
                  style={styles.micIconImg}
                  contentFit="contain"
                />
              </TouchableOpacity>
              <Text style={styles.micLabel}>Ask your child to say it</Text>
              <Text style={styles.micHint}>{recording ? 'Tap to stop recording' : 'Tap the mic to record your voice'}</Text>
              {recordingUri ? <Text style={styles.micHint}>Recording ready · {Math.round(recorderState.durationMillis / 1000)} sec</Text> : null}
            </View>

            {/* Submit Button */}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity disabled={saving} style={styles.submitBtn} activeOpacity={0.8} onPress={() => void submitPractice()}>
              <Text style={styles.submitText}>{saving ? 'Submitting…' : 'Submit'}</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>

        {/* Global Footer Navigation Component */}
        <View style={styles.footerContainer}>
          <ChildBottomNav activeTab="play" />
        </View>

      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  // Added wrappers for responsiveness
  centerWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  contentMax: {
    maxWidth: 760, 
    width: '100%',
    alignSelf: 'center'
  },

  header: {
    backgroundColor: '#0865AD',
    paddingTop: 55,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  backIcon: { color: '#fff', fontSize: 22, lineHeight: 26, fontWeight: 'bold', textAlign: 'center' },
  headerTitle: { fontFamily: 'SourGummy', color: '#fff', fontSize: 20 },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0865AD',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  chirpy: { width: 70, height: 70, marginRight: 16 },
  bannerText: { flex: 1 },
  bannerLabel: { fontFamily: 'SourGummy', color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  bannerSound: { fontFamily: 'SourGummy', color: '#fff', fontSize: 30, fontWeight: 'bold' },

  videoCard: {
    backgroundColor: '#fff',
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
    backgroundColor: '#E8F4FB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoPlaceholderText: { fontSize: 36, color: '#0865AD' },
  videoHint: {
    fontFamily: 'SourGummy',
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 14,
  },
  watchAgainBtn: {
    backgroundColor: '#FFB923',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  watchAgainText: { fontFamily: 'SourGummy', color: '#fff', fontSize: 18, fontWeight: 'bold' },

  micSection: { alignItems: 'center', marginTop: 24 },
  micBtn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F66540',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#F66540',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  micBtnActive: { backgroundColor: '#DE502C', transform: [{ scale: 0.95 }] },
  micIconImg: {
    width: 52,
    height: 52,
  },
  micLabel: {
    fontFamily: 'SourGummy',
    fontSize: 16,
    color: '#0865AD',
    fontWeight: 'bold',
    marginTop: 12,
  },
  micHint: {
    fontFamily: 'SourGummy',
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  error: {
    color: '#B42318',
    textAlign: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },

  submitBtn: {
    backgroundColor: '#0865AD',
    marginHorizontal: 40,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  submitText: { fontFamily: 'SourGummy', color: '#fff', fontSize: 20, fontWeight: 'bold' },
  
  footerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#CCE0F0',
  }
});