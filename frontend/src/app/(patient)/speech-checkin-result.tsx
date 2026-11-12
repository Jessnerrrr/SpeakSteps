import React from 'react';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
} from 'react-native';

export default function SpeechCheckinResult() {
  const router = useRouter();

  // Responsive Hooks
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  // FIXED FONT PATHS (3 levels up)
  const [fontsLoaded] = useFonts({
    SourGummy: require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.screenContainer}>
      <StatusBar barStyle="dark-content" />

      <Stack.Screen options={{ headerShown: false }} />

      {/* FIXED IMAGE PATH (3 levels up) */}
      <ImageBackground
        source={require('../../../assets/images/landing-bg-pattern.png')}
        style={styles.background}
        imageStyle={{ opacity: 0.05 }}
        resizeMode="cover"
      >
        <View style={[styles.container, isTablet && styles.containerTablet]}>
          <View style={styles.card}>

            {/* Header */}
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                {/* FIXED IMAGE PATH (3 levels up) */}
                <Image
                  source={require('../../../assets/images/back.png')}
                  style={styles.backIcon}
                  contentFit="contain"
                />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Check-in Result</Text>
            </View>

            {/* Recommended Starting Point */}
            <View style={styles.levelCardWrapper}>
              <View style={styles.birdWrapper}>
                {/* FIXED IMAGE PATH (3 levels up) */}
                <Image
                  source={require('../../../assets/images/bird-logo.gif')}
                  style={styles.birdImage}
                  contentFit="contain"
                />
              </View>

              <LinearGradient
                colors={['#0C66AD', '#4FB5EA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.levelCard}
              >
                <Text style={styles.recommendedSub}>
                  Your recommended starting point
                </Text>

                <Text style={styles.levelTitle}>
                  Level 4 · Sentences
                </Text>

                <Text style={styles.levelDescription}>
                  Great job! Let's keep learning!
                </Text>
              </LinearGradient>
            </View>

            {/* Speech Development */}
            <View style={styles.developmentCard}>
              <Text style={styles.sectionTitle}>
                🌟 Speech Development
              </Text>

              <View style={styles.ageBadge}>
                <Text style={styles.ageText}>
                  Meeting expectations for age 5
                </Text>
              </View>

              <Text style={styles.description}>
                You're doing great! Keep practicing a little every day.
              </Text>
            </View>

            {/* What We Noticed */}
            <View style={styles.noticedCard}>
              <Text style={styles.noticedTitle}>
                👀 What We Noticed
              </Text>

              <View style={styles.noticedItem}>
                <Text style={styles.itemEmoji}>🐶</Text>
                <Text style={styles.itemText}>Dog</Text>

                <View style={styles.clearBadge}>
                  <Text style={styles.clearText}>✓ Clear!</Text>
                </View>
              </View>

              <View style={styles.noticedItem}>
                <Text style={styles.itemEmoji}>🥛</Text>
                <Text style={styles.itemText}>More milk</Text>

                <View style={styles.clearBadge}>
                  <Text style={styles.clearText}>✓ Clear!</Text>
                </View>
              </View>
            </View>

            {/* Main Goal */}
            <View style={styles.goalCard}>
              <Text style={styles.goalTitle}>
                🎯 Your Main Goal
              </Text>

              <Text style={styles.goalHighlight}>
                Speak more clearly!
              </Text>

              <Text style={styles.goalDescription}>
                This check-in is a friendly guide, not a diagnosis.
                Your therapist will review it and help you practice.
              </Text>
            </View>

            {/* Bottom Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.startButton}
                activeOpacity={0.85}
                // UPDATED ROUTE: Goes straight to patient play area
                onPress={() => router.replace('/sentences' as any)}
              >
                <Text style={styles.startButtonText}>
                  Start Practicing ▶
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneButton}
                activeOpacity={0.85}
                // UPDATED ROUTE: Goes straight to parent dashboard
                onPress={() => router.replace('/parent-dashboard' as any)}
              >
                <Text style={styles.doneButtonText}>Done ✓</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
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

  // Container
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 30,
    paddingBottom: 5,
  },
  
  // Tablet Responsive Constraint
  containerTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  // Main White Card
  card: {
    width: '100%',
    height: '90%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#B0D5EC',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 5,
    paddingBottom: 12,
    justifyContent: 'flex-start',
  },

  // Header
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    flexShrink: 0,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF6FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  backIcon: {
    width: 24,
    height: 24,
  },

  headerTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 23,
    color: '#0C66AD',
  },

  // Blue Card Wrapper
  levelCardWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 42,
    marginBottom: 14,
  },

  // Overlapping Bird
  birdWrapper: {
    width: 110,
    height: 110,
    position: 'absolute',
    top: -55,
    zIndex: 10,
    elevation: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  birdImage: {
    width: '100%',
    height: '100%',
  },

  // Blue Gradient Card
  levelCard: {
    width: '100%',
    minHeight: 145,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 58,
    paddingBottom: 16,
    paddingHorizontal: 14,
  },

  recommendedSub: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
  },

  levelTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  levelDescription: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 15,
    color: '#FFFFFF',
    marginTop: 4,
  },

  // Speech Development
  developmentCard: {
    width: '100%',
    backgroundColor: '#FFFAED',
    borderWidth: 1.5,
    borderColor: '#FEB723',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },

  sectionTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 18,
    color: '#E99A00',
    marginBottom: 6,
  },

  ageBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D8F0FF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },

  ageText: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 12,
    color: '#0C66AD',
  },

  description: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 14,
    color: '#444444',
    lineHeight: 19,
  },

  // What We Noticed
  noticedCard: {
    width: '100%',
    backgroundColor: '#F2F9FF',
    borderWidth: 1.5,
    borderColor: '#B0D5EC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },

  noticedTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 18,
    color: '#E99A00',
    marginBottom: 7,
  },

  noticedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },

  itemEmoji: {
    fontSize: 23,
    width: 36,
  },

  itemText: {
    flex: 1,
    fontFamily: 'SourGummy-Bold',
    fontSize: 17,
    color: '#0C66AD',
  },

  clearBadge: {
    backgroundColor: '#D7F2C5',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 68,
    alignItems: 'center',
  },

  clearText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 12,
    color: '#356B28',
  },

  // Main Goal
  goalCard: {
    width: '100%',
    backgroundColor: '#FFE9B8',
    borderWidth: 1,
    borderColor: '#FEB723',
    borderRadius: 16,
    padding: 12,
  },

  goalTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 17,
    color: '#A66A00',
    marginBottom: 3,
  },

  goalHighlight: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 21,
    color: '#0C66AD',
    marginBottom: 4,
  },

  goalDescription: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 12,
    lineHeight: 17,
    color: '#51452F',
  },

  // Bottom Buttons
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
    marginTop: 12,
  },

  startButton: {
    flex: 1,
    height: 46,
    backgroundColor: '#FEB723',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  startButtonText: {
    fontFamily: 'SourGummy-Bold',
    color: '#FFFFFF',
    fontSize: 15,
  },

  doneButton: {
    width: 82,
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#B0D5EC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  doneButtonText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 15,
    color: '#0C66AD',
  },
});