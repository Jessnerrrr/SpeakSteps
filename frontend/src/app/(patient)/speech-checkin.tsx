import React from 'react';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SpeechCheckInScreen() {
  const router = useRouter();

  // Responsive Hooks
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  // Font Paths
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.screenContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      <ImageBackground
        source={require('../../../assets/images/landing-bg-pattern.png')}
        style={styles.background}
        imageStyle={{ opacity: 0.05 }}
        resizeMode="cover"
      >
        <View style={[styles.container, isTablet && styles.containerTablet]}>
          {/* Main Card Wrapper positioned in the center */}
          <View style={styles.cardWrapper}>
            {/* Overlapping Bird Graphic */}
            <View style={styles.birdWrapper}>
              <Image
                source={require('../../../assets/images/bird-logo.gif')}
                style={styles.birdImage}
                contentFit="contain"
              />
            </View>

            {/* Top Blue Gradient Card */}
            <LinearGradient
              colors={['#0C66AD', '#4FB5EA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.topCard}
            >
              <Text style={styles.title}>Speech Check-in</Text>
              <Text style={styles.subtitle}>
                7 quick questions • 4 sound checks •{'\n'}speech delay screening
              </Text>
            </LinearGradient>
          </View>

          {/* Middle Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Why a check-in?</Text>
            <Text style={styles.infoText}>
              It helps us pick the right starting level for your child. A grown-up answers the questions and helps the child say the sounds.
            </Text>
          </View>

          {/* Bottom Start Button Connected to Questions */}
          <TouchableOpacity
            style={styles.startButton}
            activeOpacity={0.85}
            onPress={() => router.push('/speech-checkin-questions' as any)}
          >
            <Text style={styles.startButtonText}>Start Check-in</Text>
          </TouchableOpacity>
        </View>
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  containerTablet: {
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  cardWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 64,
  },
  birdWrapper: {
    width: 190,
    height: 190,
    position: 'absolute',
    top: -102,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  birdImage: {
    width: '100%',
    height: '100%',
  },
  topCard: {
    width: '100%',
    borderRadius: 36,
    paddingTop: 112,
    paddingBottom: 68,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 38,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 15,
    color: '#EAF4FC',
    textAlign: 'center',
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D0E6F5',
    width: '100%',
    borderRadius: 28,
    paddingVertical: 26,
    paddingHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  infoTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 18.5,
    color: '#FEB723',
    marginBottom: 10,
  },
  infoText: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 15.5,
    color: '#0C66AD',
    lineHeight: 23,
  },
  startButton: {
    backgroundColor: '#FEB723',
    width: '100%',
    paddingVertical: 21,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  startButtonText: {
    fontFamily: 'SourGummy-Bold',
    color: '#FFFFFF',
    fontSize: 20,
  },
});