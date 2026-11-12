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

  // FIXED FONT PATHS: Removed the /fonts/ folder segment
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.screenContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* FIXED IMAGE PATH: 3 levels up */}
      <ImageBackground
        source={require('../../../assets/images/landing-bg-pattern.png')}
        style={styles.background}
        imageStyle={{ opacity: 0.05 }}
        resizeMode="cover"
      >
        <View style={[styles.container, isTablet && styles.containerTablet]}>
          
          {/* Main Card Wrapper positioned in the upper section */}
          <View style={styles.cardWrapper}>
            
            {/* Overlapping Bird Graphic */}
            <View style={styles.birdWrapper}>
              {/* FIXED IMAGE PATH: 3 levels up */}
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 80,
  },
  // Added Tablet MaxWidth Constraint
  containerTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  cardWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 55,
  },
  birdWrapper: {
    width: 170,
    height: 170,
    position: 'absolute',
    top: -90,
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
    borderRadius: 32,
    paddingTop: 105,
    paddingBottom: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 34,
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 13.5,
    color: '#EAF4FC',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D0E6F5',
    width: '100%',
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  infoTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 16,
    color: '#FEB723',
    marginBottom: 8,
  },
  infoText: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 14,
    color: '#0C66AD',
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#FEB723',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 28,
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
    fontSize: 18,
  },
});