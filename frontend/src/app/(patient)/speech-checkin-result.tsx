import React, { useState } from 'react';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
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
  Modal,
} from 'react-native';

export default function SpeechCheckinResult() {
  const router = useRouter();
  const { role } = useLocalSearchParams();

  // State to control the custom alert modal
  const [showSetupAlert, setShowSetupAlert] = useState(false);

  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  const [fontsLoaded] = useFonts({
    SourGummy: require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  // Function to show the custom alert modal before routing
  const handleContinueToSetup = () => {
    setShowSetupAlert(true);
  };

  // Function to proceed to the setup screen when they click the modal button
  const proceedToSetup = () => {
    setShowSetupAlert(false);
    router.replace({
      pathname: '/totp-setup',
      params: { role: role }
    } as any);
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <ImageBackground
        source={require('../../../assets/images/landing-bg-pattern.png')}
        style={styles.background}
        imageStyle={{ opacity: 0.05 }}
        resizeMode="cover"
      >
        <View style={[styles.container, isTablet && styles.containerTablet]}>
          <View style={styles.card}>

            {/* HEADER */}
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Image
                  source={require('../../../assets/images/back.png')}
                  style={styles.backIcon}
                  contentFit="contain"
                />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>
                Check-in Result
              </Text>
            </View>

            {/* RECOMMENDED STARTING POINT */}
            <View style={styles.levelCardWrapper}>
              <LinearGradient
                colors={['#0C66AD', '#4FB5EA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.levelCard}
              >
                <View style={styles.birdWrapper}>
                  <Image
                    source={require('../../../assets/images/bird-logo.gif')}
                    style={styles.birdImage}
                    contentFit="contain"
                  />
                </View>

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

            {/* SPEECH DEVELOPMENT */}
            <View style={styles.developmentCard}>
              <Text style={styles.sectionTitle}>
                Speech Development
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

            {/* WHAT WE NOTICED */}
            <View style={styles.noticedCard}>
              <Text style={styles.noticedTitle}>
                What We Noticed
              </Text>

              <View style={styles.noticedItem}>
                <View style={styles.itemDot} />
                <Text style={styles.itemText}>Dog</Text>

                <View style={styles.clearBadge}>
                  <Text style={styles.clearText}>Clear</Text>
                </View>
              </View>

              <View style={styles.noticedItem}>
                <View style={styles.itemDot} />
                <Text style={styles.itemText}>More milk</Text>

                <View style={styles.clearBadge}>
                  <Text style={styles.clearText}>Clear</Text>
                </View>
              </View>
            </View>

            {/* MINIMAL MAIN GOAL */}
            <View style={styles.goalCard}>
              <Text style={styles.goalTitle}>
                Your Main Goal
              </Text>

              <Text style={styles.goalHighlight}>
                Speak more clearly
              </Text>

              <Text style={styles.goalDescription}>
                A friendly guide, not a diagnosis — your therapist will review and support practice.
              </Text>
            </View>

            {/* BUTTONS */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.doneButton}
                activeOpacity={0.85}
                onPress={() => router.replace('/sentences' as any)}
              >
                <Text style={styles.startButtonText}>
                  Start Practicing
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>

        {/* CUSTOM ALERT MODAL */}
        <Modal
          visible={showSetupAlert}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSetupAlert(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.alertModalBox}>
              <View style={styles.alertIconContainer}>
                <Text style={styles.alertIcon}>🔒</Text>
              </View>
              <Text style={styles.alertTitle}>Secure Your Account</Text>
              <Text style={styles.alertMessage}>
                Before you can access your dashboard, you need to set up your Time-based OTP (Authenticator App) to keep your account secure.
              </Text>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={proceedToSetup}
                activeOpacity={0.85}
                onPress={() => router.replace('/parent-dashboard' as any)}
              >
                <Text style={styles.doneButtonText}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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

  // CONTAINER
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 30,
    paddingBottom: 5,
  },

  containerTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  // WHITE CARD
  card: {
    width: '100%',
    height: '90%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#B0D5EC',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    justifyContent: 'flex-start',
  },

  // HEADER
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    flexShrink: 0,
  },

  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0C66AD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  backIcon: {
    width: 50,
    height: 40,
  },

  headerTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 23,
    color: '#0C66AD',
  },

  // BLUE CARD
  levelCardWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 42,
    marginBottom: 14,
  },

  levelCard: {
    width: '100%',
    minHeight: 145,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 58,
    paddingBottom: 16,
    paddingHorizontal: 14,
    position: 'relative',
  },

  // BIRD INSIDE BLUE CARD
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

  // SPEECH DEVELOPMENT
  developmentCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#B0D5EC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
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

  // WHAT WE NOTICED
  noticedCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#B0D5EC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
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
    marginBottom: 6,
  },

  itemDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4FB5EA',
    marginRight: 12,
  },

  itemText: {
    flex: 1,
    fontFamily: 'SourGummy-Bold',
    fontSize: 17,
    color: '#0C66AD',
  },

  clearBadge: {
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: '#B7DFC2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 60,
    alignItems: 'center',
  },

  clearText: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 12,
    color: '#2E6F40',
  },

  // MINIMAL MAIN GOAL
  goalCard: {
    width: '100%',
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#F3D58D',
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },

  goalTitle: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 12.5,
    color: '#9A6B13',
    marginBottom: 2,
  },

  goalHighlight: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 17.5,
    color: '#0C66AD',
    marginBottom: 3,
  },

  goalDescription: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 12,
    lineHeight: 16.5,
    color: '#6B7280',
  },

  // BUTTONS
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
    marginTop: 12,
  },

  doneButton: {
    flex: 1,
    height: 46,
    backgroundColor: '#FEB723',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#D99508',
  },

  doneButtonText: {
    fontFamily: 'SourGummy-Bold',
    color: '#FFFFFF',
    fontSize: 15,
  },

  // Custom Alert Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  alertModalBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#B0D5EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  alertIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF6FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertIcon: {
    fontSize: 32,
  },
  alertTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 22,
    color: '#0C66AD',
    textAlign: 'center',
    marginBottom: 12,
  },
  alertMessage: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 15,
    color: '#444444',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  alertButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#0C66AD',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertButtonText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});