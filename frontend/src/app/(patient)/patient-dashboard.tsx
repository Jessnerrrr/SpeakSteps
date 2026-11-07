import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

// MOCK DATA IMPORT:
import { MOCK_PATIENT_DASHBOARD } from '@/data/patient-dashboard-mock';
import { BuddyStore, Buddy } from '@/data/buddy-store';
import { ChildBottomNav } from '@/components/child-bottom-nav';
import { authenticateMockUser } from '@/data/auth-mock';

export default function PatientDashboardScreen() {
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  const [data] = useState(MOCK_PATIENT_DASHBOARD);
  const [activeBuddy, setActiveBuddy] = useState<Buddy>(BuddyStore.getActiveBuddy());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGrownUpModalVisible, setIsGrownUpModalVisible] = useState(false);
  const [parentPassword, setParentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Listen to active buddy changes from "Pick My Buddy" screen
  useEffect(() => {
    const unsubscribe = BuddyStore.subscribe((updatedBuddy) => {
      setActiveBuddy(updatedBuddy);
    });
    return unsubscribe;
  }, []);

  const handleVerifyCredentials = () => {
    if (!parentPassword.trim()) {
      setAuthError('Please enter your parent password.');
      return;
    }
    const result = authenticateMockUser('parent@gmail.com', parentPassword);
    if (result.success || parentPassword === 'password123' || parentPassword === '123') {
      setAuthError('');
      setParentPassword('');
      setIsGrownUpModalVisible(false);
      router.push('/parent-dashboard' as any);
    } else {
      setAuthError('Incorrect password. Please try again.');
    }
  };

  const handleMathAnswer = (answer: number) => {
    if (answer === 18) {
      setAuthError('');
      setParentPassword('');
      setIsGrownUpModalVisible(false);
      router.push('/parent-dashboard' as any);
    } else {
      setAuthError('That is not quite right. Try again!');
    }
  };

  if (!fontsLoaded) return null;

  const progressPercentage =
    (data.stepsProgress.completedActivities / data.stepsProgress.totalActivities) * 100;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safeArea}>
        <ImageBackground
          source={require('../../../assets/images/split-bg.png')}
          style={styles.background}
          imageStyle={{ opacity: 0.25 }}
          resizeMode="cover"
        >
          <View style={styles.dashboardCard}>
            {/* TOP HEADER */}
            <View style={styles.topHeader}>
              <View style={styles.greetingRow}>
                <Text style={styles.greetingText}>Hi, {data.childName}</Text>
                <Text style={styles.waveEmoji}>{data.greetingEmoji}</Text>
              </View>

              <View style={styles.headerRightActions}>
                <TouchableOpacity
                  style={styles.bellButton}
                  activeOpacity={0.7}
                  onPress={() => console.log('Notifications')}
                >
                  <Ionicons name="notifications-outline" size={20} color="#F5A623" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuButton}
                  activeOpacity={0.7}
                  onPress={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <Ionicons
                    name={isMenuOpen ? 'close' : 'menu'}
                    size={34}
                    color="#0D68AC"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* PARENT MODE DROPDOWN PILL */}
            {isMenuOpen && (
              <>
                <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
                  <View style={styles.menuBackdrop} />
                </TouchableWithoutFeedback>

                <View style={styles.menuDropdownPill}>
                  <TouchableOpacity
                    style={styles.menuDropdownItem}
                    activeOpacity={0.8}
                    onPress={() => {
                      setIsMenuOpen(false);
                      setAuthError('');
                      setParentPassword('');
                      setIsGrownUpModalVisible(true);
                    }}
                  >
                    <Image
                      source={require('../../../assets/images/parent-mode-icon.png')}
                      style={styles.menuParentIcon}
                      contentFit="cover"
                    />
                    <Text style={styles.menuItemText}>Parent mode</Text>
                    <Ionicons name="chevron-forward" size={16} color="#F5A623" />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* SCROLLABLE MAIN CONTENT */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* MASCOT & SPEECH BUBBLE ROW */}
              <View style={styles.mascotSpeechRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.mascotContainer}
                  onPress={() => router.push('/pick-buddy' as any)}
                >
                  <Image
                    source={activeBuddy.image}
                    style={[
                      styles.mascotImage,
                      activeBuddy.id !== 'chirpy' && styles.mascotImageOther,
                    ]}
                    contentFit="contain"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.speechBubble}
                  onPress={() => router.push('/pick-buddy' as any)}
                >
                  <Text style={styles.speechBubbleText}>
                    {activeBuddy.dashboardSpeech}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* "MY STEPS" CARD */}
              <LinearGradient
                colors={['#106AB0', '#2A8AC8', '#4DB3E9']}
                locations={[0, 0.45, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.myStepsCard}
              >
                <Text style={styles.myStepsTitle}>My Steps</Text>

                <View style={styles.starNumberRow}>
                  <Text style={styles.starNumberText}>{data.stepsProgress.earnedStars}</Text>
                  <Image
                    source={require('../../../assets/images/star-3d.png')}
                    style={styles.starAssetImage}
                    contentFit="contain"
                  />
                </View>

                <View style={styles.capsuleProgressTrack}>
                  <View
                    style={[
                      styles.capsuleProgressFill,
                      { width: `${Math.min(progressPercentage, 100)}%` },
                    ]}
                  />
                </View>

                <Text style={styles.myStepsSubtext}>
                  {data.stepsProgress.completedActivities} of {data.stepsProgress.totalActivities} activities done
                </Text>
              </LinearGradient>

              {/* "MY ADVENTURE" STEPPER CONTAINER */}
              <View style={styles.adventureContainer}>
                <Text style={styles.adventureTitle}>My Adventure</Text>

                <View style={styles.stepperRow}>
                  {data.adventures.map((adv, index) => {
                    const isLast = index === data.adventures.length - 1;
                    return (
                      <View key={adv.id} style={styles.stepperItemWrapper}>
                        <View style={styles.stepperNodeRow}>
                          <TouchableOpacity
                            style={[styles.stepCircle, { backgroundColor: adv.bgColor }]}
                            activeOpacity={0.8}
                            onPress={() => router.push('/practice' as any)}
                          >
                            {adv.iconType === 'sounds' ? (
                              <Ionicons name="musical-notes" size={26} color="#FFFFFF" />
                            ) : adv.iconType === 'words' ? (
                              <Text style={styles.stepAaText}>Aa</Text>
                            ) : adv.iconType === 'phrases' ? (
                              <Text style={styles.stepQuotesText}>❝❞</Text>
                            ) : (
                              <Ionicons name="clipboard" size={24} color="#FFFFFF" />
                            )}
                          </TouchableOpacity>

                          {!isLast && <View style={styles.stepConnectingLine} />}
                        </View>
                        <Text style={styles.stepLabel}>{adv.name}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* "CONTINUE PRACTICE ▶" BUTTON */}
              <TouchableOpacity
                style={styles.continuePracticeBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/practice' as any)}
              >
                <Text style={styles.continuePracticeText}>Continue Practice</Text>
                <View style={styles.playArrowIcon}>
                  <Ionicons name="play" size={26} color="#0D68AC" />
                </View>
              </TouchableOpacity>

              {/* QUICK ACCESS CARDS */}
              <View style={styles.bottomCardsRow}>
                {/* My Activities Card */}
                <TouchableOpacity
                  style={[styles.bottomCard, styles.activitiesCard]}
                  activeOpacity={0.85}
                  onPress={() => router.push('/practice' as any)}
                >
                  <View style={styles.cardIconWrapper}>
                    <Image
                      source={require('../../../assets/images/trophy.png')}
                      style={styles.cardImageIllustration}
                      contentFit="contain"
                    />
                  </View>
                  <Text style={styles.cardHeading}>My Activities</Text>
                  <Text style={styles.cardSubtext}>
                    {data.quickActions.activitiesCount} assigned
                  </Text>
                </TouchableOpacity>

                {/* My Progress Card */}
                <TouchableOpacity
                  style={[styles.bottomCard, styles.progressCard]}
                  activeOpacity={0.85}
                  onPress={() => router.push('/patient-stars' as any)}
                >
                  <View style={styles.cardIconWrapper}>
                    <Image
                      source={require('../../../assets/images/medal.png')}
                      style={styles.cardImageIllustration}
                      contentFit="contain"
                    />
                  </View>
                  <Text style={styles.cardHeading}>My Progress</Text>
                  <Text style={styles.cardSubtext}>
                    {data.quickActions.starsSummaryText}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* INTEGRATED BOTTOM TAB BAR */}
            <ChildBottomNav activeTab="home" />
          </View>
        </ImageBackground>

        {/* GROWN-UP CHECK MODAL */}
        <Modal
          visible={isGrownUpModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setIsGrownUpModalVisible(false);
            setAuthError('');
            setParentPassword('');
          }}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalKeyboardAvoid}
            >
              <View style={styles.grownUpModalCard}>
                <Text style={styles.modalTitle}>Grown-up check</Text>
                <Text style={styles.modalQuestion}>What is 15 + 3?</Text>

                <View style={styles.mathOptionsGrid}>
                  {[16, 19, 18, 11].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={styles.mathOptionButton}
                      activeOpacity={0.8}
                      onPress={() => handleMathAnswer(num)}
                    >
                      <Text style={styles.mathOptionText}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.credentialDividerRow}>
                  <View style={styles.credDividerLine} />
                  <Text style={styles.credDividerText}>or parent password</Text>
                  <View style={styles.credDividerLine} />
                </View>

                {/* PASSWORD INPUT (Arrow Button Removed) */}
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={styles.modalPasswordInput}
                    placeholder="Enter parent password"
                    placeholderTextColor="#9AAFC0"
                    secureTextEntry={!showPassword}
                    value={parentPassword}
                    onChangeText={(t) => {
                      setParentPassword(t);
                      if (authError) setAuthError('');
                    }}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.modalEyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#0D68AC"
                    />
                  </TouchableOpacity>
                </View>

                {authError ? (
                  <Text style={styles.modalErrorText}>{authError}</Text>
                ) : null}

                {/* NEW "CONTINUE" BUTTON */}
                <TouchableOpacity
                  style={styles.modalContinueButton}
                  activeOpacity={0.85}
                  onPress={handleVerifyCredentials}
                >
                  <Text style={styles.modalContinueButtonText}>Continue</Text>
                </TouchableOpacity>

                {/* RE-STYLED "CANCEL" BUTTON (Secondary Style) */}
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  activeOpacity={0.85}
                  onPress={() => {
                    setIsGrownUpModalVisible(false);
                    setAuthError('');
                    setParentPassword('');
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#8CBFE6' },
  background: { flex: 1, backgroundColor: '#8CBFE6', paddingHorizontal: 10, paddingTop: 8, paddingBottom: 6 },
  dashboardCard: { flex: 1, backgroundColor: '#E7F2FA', borderRadius: 36, overflow: 'hidden', borderWidth: 1.5, borderColor: '#C7DFEE', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 6 },
  
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, backgroundColor: '#E7F2FA' },
  greetingRow: { flexDirection: 'row', alignItems: 'center' },
  greetingText: { fontFamily: 'SourGummy-Bold', fontSize: 30, color: '#0D68AC', letterSpacing: -0.5 },
  waveEmoji: { fontSize: 28, marginLeft: 6 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#FBD27C', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  menuButton: { padding: 2, justifyContent: 'center', alignItems: 'center' },

  menuBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.15)', zIndex: 30 },
  menuDropdownPill: { position: 'absolute', top: 66, right: 18, backgroundColor: '#FFFFFF', borderRadius: 20, paddingVertical: 7, paddingHorizontal: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8, borderWidth: 1.5, borderColor: '#D4E7F5', zIndex: 40 },
  menuDropdownItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuParentIcon: { width: 28, height: 28, borderRadius: 14 },
  menuItemText: { fontFamily: 'SourGummy-Bold', fontSize: 14, color: '#0D68AC' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modalKeyboardAvoid: { width: '100%', alignItems: 'center' },
  grownUpModalCard: { width: '100%', maxWidth: 350, backgroundColor: '#FFFFFF', borderRadius: 32, paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 10, borderWidth: 1.5, borderColor: '#C7DFEE' },
  modalTitle: { fontFamily: 'SourGummy-Bold', fontSize: 24, color: '#0D68AC', textAlign: 'center', marginBottom: 4 },
  modalQuestion: { fontFamily: 'SourGummy-Bold', fontSize: 18, color: '#0D68AC', textAlign: 'center', marginBottom: 16 },
  mathOptionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', gap: 12, marginBottom: 14 },
  mathOptionButton: { width: '47%', height: 52, borderRadius: 18, borderWidth: 2, borderColor: '#CBE0EF', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  mathOptionText: { fontFamily: 'SourGummy-Bold', fontSize: 22, color: '#0D68AC' },
  credentialDividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 10, gap: 8 },
  credDividerLine: { flex: 1, height: 1, backgroundColor: '#E0EEF7' },
  credDividerText: { fontFamily: 'SourGummy-Medium', fontSize: 11, color: '#8BA4B8' },
  
  passwordInputWrapper: { flexDirection: 'row', alignItems: 'center', width: '100%', height: 46, backgroundColor: '#F5F9FD', borderRadius: 14, borderWidth: 1.5, borderColor: '#CBE0EF', paddingHorizontal: 12, marginBottom: 6 },
  modalPasswordInput: { flex: 1, fontFamily: 'SourGummy', fontSize: 13, color: '#0D68AC', paddingVertical: 4 },
  modalEyeButton: { padding: 6 },
  modalErrorText: { fontFamily: 'SourGummy-Medium', fontSize: 12, color: '#E74C3C', textAlign: 'center', marginBottom: 8 },
  
  /* NEW BUTTON STYLES */
  modalContinueButton: { width: '100%', height: 48, backgroundColor: '#0865AD', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginTop: 12, shadowColor: '#084878', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3 },
  modalContinueButtonText: { fontFamily: 'SourGummy-Bold', fontSize: 16, color: '#FFFFFF' },
  
  modalCancelButton: { width: '100%', height: 48, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E0EEF7', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  modalCancelButtonText: { fontFamily: 'SourGummy-Bold', fontSize: 16, color: '#8BA4B8' },

  scrollContent: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 16 },
  mascotSpeechRow: { flexDirection: 'row', alignItems: 'center', marginBottom: -16, zIndex: 10 },
  mascotContainer: { position: 'relative', marginRight: 10, marginLeft: 4, width: 82, height: 82, justifyContent: 'flex-end', alignItems: 'center', overflow: 'visible' },
  mascotImage: { width: 82, height: 82 },
  mascotImageOther: { transform: [{ scale: 1.22 }], marginBottom: -4 },
  speechBubble: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#D4E7F6', shadowColor: '#0865AD', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  speechBubbleText: { fontFamily: 'SourGummy-Bold', fontSize: 13, color: '#0D68AC', lineHeight: 18 },

  myStepsCard: { borderRadius: 22, paddingVertical: 18, paddingHorizontal: 20, alignItems: 'center', marginBottom: 14, shadowColor: '#0865AD', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 6, elevation: 5 },
  myStepsTitle: { fontFamily: 'SourGummy-Bold', fontSize: 24, color: '#FFFFFF', marginBottom: 4 },
  starNumberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10, gap: 3 },
  starNumberText: { fontFamily: 'SourGummy-Bold', fontSize: 44, color: '#FFFFFF' },
  starAssetImage: { width: 42, height: 42, marginTop: -2 },
  capsuleProgressTrack: { width: '100%', height: 18, backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', padding: 3, marginBottom: 8 },
  capsuleProgressFill: { height: '100%', backgroundColor: '#F5A623', borderRadius: 10 },
  myStepsSubtext: { fontFamily: 'SourGummy-Bold', fontSize: 13, color: '#FFFFFF', textShadowColor: 'rgba(0, 0, 0, 0.12)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },

  adventureContainer: { backgroundColor: '#FFFFFF', borderRadius: 22, paddingVertical: 16, paddingHorizontal: 16, marginBottom: 14, borderWidth: 1.5, borderColor: '#C7DFEE', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 5, elevation: 3 },
  adventureTitle: { fontFamily: 'SourGummy-Bold', fontSize: 20, color: '#0D68AC', textAlign: 'center', marginBottom: 14 },
  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 4 },
  stepperItemWrapper: { alignItems: 'center', flex: 1 },
  stepperNodeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  stepCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  stepAaText: { fontFamily: 'SourGummy-Bold', fontSize: 22, color: '#FFFFFF' },
  stepQuotesText: { fontSize: 22, color: '#FFFFFF', fontWeight: 'bold' },
  stepConnectingLine: { position: 'absolute', right: -14, width: 28, height: 6, backgroundColor: '#B6D7F2', borderRadius: 3, zIndex: -1 },
  stepLabel: { fontFamily: 'SourGummy-Bold', fontSize: 12, color: '#0D68AC', marginTop: 8 },

  continuePracticeBtn: { backgroundColor: '#F5A623', borderRadius: 28, paddingVertical: 15, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderBottomWidth: 5, borderBottomColor: '#C47B09', shadowColor: '#C47B09', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 5, elevation: 4 },
  continuePracticeText: { fontFamily: 'SourGummy-Bold', fontSize: 21, color: '#FFFFFF', marginRight: 10, textShadowColor: 'rgba(0,0,0,0.15)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  playArrowIcon: { marginLeft: 2 },

  bottomCardsRow: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  bottomCard: { flex: 1, borderRadius: 22, paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', borderWidth: 1.5, borderBottomWidth: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  activitiesCard: { backgroundColor: '#A0C6E8', borderColor: '#8AB7DF', borderBottomColor: '#6B9DC9' },
  progressCard: { backgroundColor: '#EFE0B6', borderColor: '#E6D4A0', borderBottomColor: '#CCA95B' },
  cardIconWrapper: { marginBottom: 8, height: 56, width: 56, justifyContent: 'center', alignItems: 'center' },
  cardImageIllustration: { width: 54, height: 54 },
  cardHeading: { fontFamily: 'SourGummy-Bold', fontSize: 16, color: '#000000', marginBottom: 2 },
  cardSubtext: { fontFamily: 'SourGummy-Medium', fontSize: 12, color: '#444444' },
});