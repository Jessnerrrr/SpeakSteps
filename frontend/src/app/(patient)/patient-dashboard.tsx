import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';

// FIXED IMPORTS: 2 levels up to reach src/data and src/components
import { MOCK_PATIENT_DASHBOARD } from '../../data/patient-dashboard-mock';
import { BuddyStore, Buddy } from '../../data/buddy-store';
import { ChildProfileStore, ChildProfile } from '../../data/child-profile-store';
import { ChildBottomNav } from '../../components/child-bottom-nav';
import { GrownUpCheckModal } from '../../components/grown-up-check-modal';
import { SignOutConfirmModal } from '../../components/sign-out-confirm-modal';

export default function PatientDashboardScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  // FIXED FONT PATHS: 3 levels up to reach root assets folder
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  const [data] = useState(MOCK_PATIENT_DASHBOARD);
  const [activeBuddy, setActiveBuddy] = useState<Buddy>(BuddyStore.getActiveBuddy());
  const [childProfile, setChildProfile] = useState<ChildProfile>(ChildProfileStore.getProfile());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGrownUpModalVisible, setIsGrownUpModalVisible] = useState(false);
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);

  // FIXED TS ERROR: Added explicit : Buddy type
  useEffect(() => {
    const unsubscribe = BuddyStore.subscribe((updatedBuddy: Buddy) => {
      setActiveBuddy(updatedBuddy);
    });
    return unsubscribe;
  }, []);

  // FIXED TS ERROR: Added explicit : ChildProfile type
  useEffect(() => {
    const unsubscribe = ChildProfileStore.subscribe((updatedProfile: ChildProfile) => {
      setChildProfile(updatedProfile);
    });
    return unsubscribe;
  }, []);

  if (!fontsLoaded) return null;

  const progressPercentage =
    (data.stepsProgress.completedActivities / data.stepsProgress.totalActivities) * 100;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safeArea}>
        {/* FIXED IMAGE PATH (3 levels up) */}
        <ImageBackground
          source={require('../../../assets/images/split-bg.png')}
          style={styles.background}
          imageStyle={{ opacity: 0.25 }}
          resizeMode="cover"
        >
          <View style={[styles.dashboardCard, isTablet && styles.dashboardCardTablet]}>
            {/* TOP HEADER */}
            <View style={styles.topHeader}>
              <View style={styles.greetingRow}>
                <Text style={styles.greetingText}>Hi, {childProfile.displayName}!</Text>
                <Text style={styles.waveEmoji}>{data.greetingEmoji}</Text>
              </View>

              <View style={styles.headerRightActions}>
                <TouchableOpacity
                  style={styles.bellButton}
                  activeOpacity={0.7}
                  onPress={() => console.log('Notifications')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="notifications-outline" size={16} color="#F5A623" />
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

            {/* =====================================================================
                CHILD MODE DROPDOWN MENU (Parent Mode & Sign Out)
                ===================================================================== */}
            {isMenuOpen && (
              <>
                <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
                  <View style={styles.menuBackdrop} />
                </TouchableWithoutFeedback>

                <View style={styles.menuDropdownCard}>
                  {/* Row 1: Parent mode */}
                  <TouchableOpacity
                    style={styles.menuItemRow}
                    activeOpacity={0.8}
                    onPress={() => {
                      setIsMenuOpen(false);
                      setIsGrownUpModalVisible(true);
                    }}
                  >
                    {/* FIXED IMAGE PATH (3 levels up) */}
                    <Image
                      source={require('../../../assets/images/parent-mode-icon.png')}
                      style={styles.menuParentIcon}
                      contentFit="cover"
                    />
                    <Text style={styles.menuItemText}>Parent mode</Text>
                    <Ionicons name="chevron-forward" size={16} color="#F5A623" />
                  </TouchableOpacity>

                  {/* Soft Divider */}
                  <View style={styles.menuDivider} />

                  {/* Row 2: Sign out */}
                  <TouchableOpacity
                    style={styles.menuItemRow}
                    activeOpacity={0.8}
                    onPress={() => {
                      setIsMenuOpen(false);
                      setIsSignOutModalVisible(true);
                    }}
                  >
                    <View style={styles.logoutIconBadge}>
                      <Ionicons name="log-out-outline" size={16} color="#FFFFFF" />
                    </View>
                    <Text style={styles.menuItemText}>Sign out</Text>
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
                  {/* FIXED IMAGE PATH (3 levels up) */}
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
                  {/* FIXED TS ERROR: Added explicit : any and : number types */}
                  {data.adventures.map((adv: any, index: number) => {
                    const isLast = index === data.adventures.length - 1;
                    return (
                      <View key={adv.id} style={styles.stepperItemWrapper}>
                        <View style={styles.stepperNodeRow}>
                          <TouchableOpacity
                            style={[styles.stepCircle, { backgroundColor: adv.bgColor }]}
                            activeOpacity={0.8}
                            onPress={() =>
                              router.push(
                                (adv.id === 'sentences' ? '/sentences' : '/practice') as any,
                              )
                            }
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
                onPress={() => router.push('/sentences' as any)}
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
                  onPress={() => router.push('/sentences' as any)}
                >
                  <View style={styles.cardIconWrapper}>
                    {/* FIXED IMAGE PATH (3 levels up) */}
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
                    {/* FIXED IMAGE PATH (3 levels up) */}
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

        {/* =========================================================================
            GROWN-UP CHECK MODAL (Password-Only Verification)
            ========================================================================= */}
        <GrownUpCheckModal
          visible={isGrownUpModalVisible}
          onClose={() => setIsGrownUpModalVisible(false)}
          onSuccess={() => {
            setIsGrownUpModalVisible(false);
            router.push('/parent-dashboard' as any);
          }}
        />

        {/* =========================================================================
            SIGN OUT CONFIRMATION MODAL (Cancel / Sign Out)
            ========================================================================= */}
        <SignOutConfirmModal
          visible={isSignOutModalVisible}
          onClose={() => setIsSignOutModalVisible(false)}
          onConfirm={() => {
            setIsSignOutModalVisible(false);
            router.replace('/patient-login' as any);
          }}
        />
      </SafeAreaView >
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#8CBFE6' },
  background: { flex: 1, backgroundColor: '#8CBFE6', paddingHorizontal: 10, paddingTop: 8, paddingBottom: 6 },
  dashboardCard: { flex: 1, backgroundColor: '#E7F2FA', borderRadius: 36, overflow: 'hidden', borderWidth: 1.5, borderColor: '#C7DFEE', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 6 },
  
  // Tablet Responsive Constraint
  dashboardCardTablet: { maxWidth: 600, alignSelf: 'center', width: '100%' },

  /* Top Header */
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#E7F2FA',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 30,
    color: '#0D68AC',
    letterSpacing: -0.5,
  },
  waveEmoji: {
    fontSize: 28,
    marginLeft: 6,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FBD27C',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 2.5,
    elevation: 2,
  },
  menuButton: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Dropdown Backdrop & Floating Menu Card */
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    zIndex: 30,
  },
  menuDropdownCard: {
    position: 'absolute',
    top: 66,
    right: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#D4E7F5',
    zIndex: 40,
    minWidth: 190,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 8,
  },
  menuParentIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  menuItemText: {
    flex: 1,
    fontFamily: 'SourGummy-Bold',
    fontSize: 13,
    color: '#0D68AC',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#EDF4F9',
    marginVertical: 4,
  },
  logoutIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0D68AC',
    alignItems: 'center',
    justifyContent: 'center',
  },

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