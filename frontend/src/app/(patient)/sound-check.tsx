import { CheckinHeader } from '../../components/CheckinHeader';
import React, { useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

const soundChecksData = [
  {
    step: 1,
    title: 'DOG',
    type: 'image',
    source: require('../../../assets/images/dog.png'),
  },
  {
    step: 2,
    title: 'MORE MILK',
    type: 'image',
    source: require('../../../assets/images/milk.png'),
  },
];

export default function SoundCheckScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isTablet = width > 600;
  const isShortScreen = height < 700;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    SourGummy: require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  if (!fontsLoaded && !fontError) return null;

  const activeCheck = soundChecksData[currentIndex] ?? soundChecksData[0];

  const cardMinHeight = isShortScreen
    ? Math.min(525, height * 0.74)
    : Math.min(635, height * 0.77);

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsRecording(false);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/speech-checkin-questions' as any);
    }
  };

  const handleSubmit = () => {
    if (currentIndex < soundChecksData.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsRecording(false);
    } else {
      router.push('/speech-checkin-result' as any);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      <ImageBackground
        source={require('../../../assets/images/landing-bg-pattern.png')}
        style={styles.background}
        imageStyle={{ opacity: 0.05 }}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.scrollContentTablet,
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Header Bar placed below the top pattern area, right above the card */}
          <CheckinHeader title="Say it!" onBack={handleBack} />

          {/* Main White Card */}
          <View
            style={[
              styles.card,
              { minHeight: cardMinHeight },
              isShortScreen && styles.cardCompact,
            ]}
          >
            {/* Target Image / Illustration Box */}
            <View
              style={[
                styles.imageBox,
                isShortScreen && styles.imageBoxCompact,
              ]}
            >
              {activeCheck.type === 'image' ? (
                <Image
                  source={activeCheck.source}
                  style={[
                    styles.dogAvatar,
                    isShortScreen && styles.dogAvatarCompact,
                  ]}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.emojiPlaceholder}>
                  {(activeCheck as any).emoji}
                </Text>
              )}
              <Text style={styles.cardWordTitle}>{activeCheck.title}</Text>
            </View>

            {/* Listen Button */}
            <TouchableOpacity
              style={styles.listenButton}
              activeOpacity={0.85}
              onPress={() => {}}
            >
              <View style={styles.listenContent}>
                <Image
                  source={require('../../../assets/images/volume.png')}
                  style={styles.volumeIcon}
                  resizeMode="contain"
                />
                <Text style={styles.listenButtonText}>Listen</Text>
              </View>
            </TouchableOpacity>

            {/* Microphone Recording Section */}
            <View style={styles.micContainer}>
              <TouchableOpacity
                style={[styles.micButton, isRecording && styles.micButtonActive]}
                activeOpacity={0.8}
                onPressIn={() => setIsRecording(true)}
                onPressOut={() => setIsRecording(false)}
              >
                <Image
                  source={require('../../../assets/images/mic.png')}
                  style={styles.micImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text style={styles.micSubtext}>
                Long press the mic to record your voice
              </Text>
              <Text style={styles.micPrompt}>Ask your child to say it</Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              activeOpacity={0.85}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#C4E1F0',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 5,
    paddingBottom: 50,
  },
  scrollContentTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#B0D5EC',
    width: '100%',
    borderRadius: 28,
    paddingVertical: 27,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
  },
  cardCompact: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 12,
  },
  imageBox: {
    width: '100%',
    minHeight: 215,
    maxHeight: 275,
    borderWidth: 2,
    borderColor: '#FEB723',
    borderStyle: 'dashed',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFAED',
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  imageBoxCompact: {
    minHeight: 162,
    maxHeight: 202,
    paddingVertical: 10,
  },
  dogAvatar: {
    width: 134,
    height: 134,
    marginBottom: 10,
  },
  dogAvatarCompact: {
    width: 98,
    height: 98,
    marginBottom: 6,
  },
  emojiPlaceholder: {
    fontSize: 66,
    marginBottom: 6,
  },
  cardWordTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 25,
    color: '#0C66AD',
    letterSpacing: 1.5,
  },
  listenButton: {
    backgroundColor: '#0C66AD',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 25,
    borderBottomWidth: 3,
    borderBottomColor: '#08477A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#08477A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  listenContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeIcon: {
    width: 24,
    height: 24,
    marginRight: 9,
  },
  listenButtonText: {
    fontFamily: 'SourGummy-Bold',
    color: '#FFFFFF',
    fontSize: 20,
  },
  micContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E74C3C',
    borderBottomWidth: 4,
    borderBottomColor: '#9E2A1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 9,
    shadowColor: '#5C160F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.34,
    shadowRadius: 7,
    elevation: 7,
  },
  micButtonActive: {
    backgroundColor: '#C0392B',
    borderBottomWidth: 1,
    transform: [{ scale: 0.95 }],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 2,
    elevation: 2,
  },
  micImage: {
    width: 49,
    height: 49,
  },
  micPrompt: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 18,
    color: '#0C66AD',
    marginTop: 4,
  },
  micSubtext: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 13.5,
    color: '#8A9BA8',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#FEB723',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 27,
    borderBottomWidth: 3,
    borderBottomColor: '#C98A06',
    alignItems: 'center',
    shadowColor: '#9E6B00',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 6,
    elevation: 6,
  },
  submitButtonText: {
    fontFamily: 'SourGummy-Bold',
    color: '#FFFFFF',
    fontSize: 20.5,
  },
});
