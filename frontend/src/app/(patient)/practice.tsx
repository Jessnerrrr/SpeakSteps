import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSyncExternalStore } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native';

// FIXED IMPORTS: 2 levels up to reach src/types and src/components
import type { Position } from '../../types/sentences';
import { ChildBottomNav } from '../../components/child-bottom-nav';
import { ChildScreenFrame, childScreenColors } from '../../components/child-screen-frame';
import { BuddyStore } from '../../data/buddy-store';

export default function PracticeScreen() {
  const params = useLocalSearchParams<{
    sentenceId: string;
    sound: string;
    syllable: string;
    stars: string;
    position: string;
  }>();

  const position = (params.position ?? 'Initial') as Position;
  const sound = params.sound ?? '/s/';
  const syllable = params.syllable ?? 'sa';


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
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Centering Wrapper for tablet responsiveness */}
          <View style={styles.centerWrapper}>

            <View style={styles.banner}>
              <Image source={buddy.image} style={styles.buddyImage} contentFit="contain" />
              <View style={styles.bannerText}>
                <Text style={styles.bannerLabel}>Sounds · {position}</Text>
                <Text style={styles.bannerSound}>{sound} {syllable}</Text>
              </View>
            </View>

            <View style={styles.videoCard}>
              <View style={styles.videoPlaceholder}>
                <Ionicons name="play" size={34} color="#0D68AC" />
              </View>
              <Text style={styles.videoHint}>Watch how to say it.</Text>
              <Pressable accessibilityRole="button" style={({ pressed }) => [styles.watchAgainBtn, pressed && styles.buttonPressed]}>
                <Text style={styles.watchAgainText}>Watch again</Text>
              </Pressable>
            </View>

            <View style={styles.micSection}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Microphone"
                style={({ pressed }) => [styles.micBtn, pressed && styles.buttonPressed, pressed && styles.micBtnActive]}
              >
                <Image
                  source={require('../../../assets/images/mic.png')}
                  style={styles.micIconImg}
                  contentFit="contain"
                />
              </Pressable>
              <Text style={styles.micLabel}>Ask your child to say it</Text>
              <Text style={styles.micHint}>Long press the mic to record your voice</Text>
            </View>

            {/* Submit Button */}
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.submitBtn, pressed && styles.buttonPressed]} onPress={handleBack}>
              <Text style={styles.submitText}>Submit</Text>
            </Pressable>

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
  micBtnActive: { backgroundColor: '#A43829' },
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
  submitText: { fontFamily: 'SourGummy-Bold', color: '#fff', fontSize: 20 },
  buttonPressed: { opacity: 0.83, transform: [{ scale: 0.97 }, { translateY: 2 }] },

});
