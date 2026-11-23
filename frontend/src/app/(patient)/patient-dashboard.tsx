import { useAssignedActivities } from '@/data/assigned-activities';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import Svg, { Path } from 'react-native-svg';
import {
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';

// MOCK DATA IMPORT:
import { MOCK_PATIENT_DASHBOARD } from '@/data/patient-dashboard-mock';
import { PARTICIPATION_STARS, usePracticeSubmissions } from '@/data/practice-submissions';
import { BuddyStore, Buddy } from '@/data/buddy-store';
import { ChildActivityEmpty } from '@/components/child-activity-empty';
import { ChildProfileStore, ChildProfile } from '@/data/child-profile-store';
import { adventurePracticeLevels, practiceLevelIcons } from '@/components/adventure-icon';
import { ChildBottomNav } from '@/components/child-bottom-nav';
import { GrownUpCheckModal } from '@/components/grown-up-check-modal';
import { NotificationBellButton } from '@/components/notification-popover';
import { SignOutConfirmModal } from '@/components/sign-out-confirm-modal';

export default function PatientDashboardScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const mascotSize = width < 360 ? 100 : isTablet ? 126 : 116;

  // FIXED FONT PATHS: 3 levels up to reach root assets folder
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  const data = MOCK_PATIENT_DASHBOARD;
  const submissions = usePracticeSubmissions();
  const assignedPractice = useAssignedActivities().filter((activity) => activity.linked && !activity.submitted);
  const [isActivitiesOpen, setIsActivitiesOpen] = useState(false);
  const [activeBuddy, setActiveBuddy] = useState<Buddy>(BuddyStore.getActiveBuddy());
  const [childProfile, setChildProfile] = useState<ChildProfile>(ChildProfileStore.getProfile());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGrownUpModalVisible, setIsGrownUpModalVisible] = useState(false);
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);

  // Clean dialogue text without emoji
  const dialogueText = (activeBuddy?.dashboardSpeech || data?.activeBuddy?.speechBubbleText || '')
    .replace(/[\p{Extended_Pictographic}\uFE0F\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .trim();

  // FIXED TS ERROR: Added explicit : Buddy type
  useEffect(() => {
    const unsubscribe = BuddyStore.subscribe((updatedBuddy: Buddy) => {
      setActiveBuddy(updatedBuddy);
    });
    return unsubscribe;
  }, []);

  // Listen to child profile changes from Parent Mode
  useEffect(() => {
    const unsubscribe = ChildProfileStore.subscribe((updatedProfile: ChildProfile) => {
      setChildProfile(updatedProfile);
    });
    return unsubscribe;
  }, []);

  if (!fontsLoaded) return null;

  const progressPercentage =
    Math.min(100, (submissions.length / data.stepsProgress.totalActivities) * 100);

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
              </View>

              <View style={styles.headerRightActions}>
                <NotificationBellButton
                  audience="child"
                  onBeforeOpen={() => setIsMenuOpen(false)}
                />

                <Pressable accessibilityRole="button"
                  style={(state) => [styles.menuButton, styles.interactiveMotion, state.pressed ? styles.interactivePressed : 'hovered' in state && state.hovered && styles.interactiveHovered]}
                  onPress={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <Ionicons
                    name={isMenuOpen ? 'close' : 'menu'}
                    size={34}
                    color="#0D68AC"
                  />
                </Pressable>
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
                  <Pressable accessibilityRole="button"
                    style={(state) => [styles.menuItemRow, styles.interactiveMotion, state.pressed ? styles.interactivePressed : 'hovered' in state && state.hovered && styles.interactiveHovered]}
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
                  </Pressable>

                  {/* Soft Divider */}
                  <View style={styles.menuDivider} />

                  {/* Row 2: Sign out */}
                  <Pressable accessibilityRole="button"
                    style={(state) => [styles.menuItemRow, styles.interactiveMotion, state.pressed ? styles.interactivePressed : 'hovered' in state && state.hovered && styles.interactiveHovered]}
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
                  </Pressable>
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
                <Pressable
                  style={(state) => [styles.mascotContainer, { width: mascotSize, height: mascotSize }, styles.interactiveMotion, state.pressed ? styles.interactivePressed : 'hovered' in state && state.hovered && styles.interactiveHovered]}
                  onPress={() => router.push('/pick-buddy' as any)}
                  accessibilityRole="button"
                  accessibilityLabel={`${activeBuddy.name} buddy`}
                >
                  <Image
                    source={activeBuddy.image}
                    style={styles.mascotImage}
                    contentFit="contain"
                  />
                </Pressable>

                <Pressable
                  style={(state) => [styles.speechBubbleWrapper, styles.interactiveMotion, state.pressed ? styles.interactivePressed : 'hovered' in state && state.hovered && styles.interactiveHovered]}
                  onPress={() => router.push('/pick-buddy' as any)}
                  accessibilityRole="button"
                  accessibilityLabel="Buddy speech dialogue"
                >
                  <View style={styles.speechBubble}>
                    <View pointerEvents="none" style={styles.speechBubbleTailContainer}>
                      <Svg width={15} height={22} viewBox="0 0 15 22">
                        <Path d="M 15 2 Q 10 8 2 11 Q 10 14 15 20 Z" fill="#FFFFFF" />
                        <Path d="M 13 4 Q 9 8 2 11 Q 9 14 13 18" fill="none" stroke="#D4E7F6" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </View>

                    <Text style={styles.speechBubbleText}>
                      Hi, {childProfile.displayName}! {dialogueText}
                    </Text>
                  </View>
                </Pressable>
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
                  <Text style={styles.starNumberText}>{submissions.length * PARTICIPATION_STARS}</Text>
                  {/* FIXED IMAGE PATH (3 levels up) */}
                  <Image
                    source={require('../../../assets/images/speaksteps_star_3d.gif')}
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
                  {submissions.length} {submissions.length === 1 ? 'activity' : 'activities'} done
                </Text>
              </LinearGradient>

              {/* "MY ADVENTURE" STEPPER CONTAINER */}
              <View style={styles.adventureContainer}>
                <Text style={styles.adventureTitle}>My Adventure</Text>

                <View style={styles.stepperRow}>
                  {/* FIXED TS ERROR: Added explicit : any and : number types */}
                  {data.adventures.map((adv, index) => {
                    const isLast = index === data.adventures.length - 1;
                    return (
                      <View key={adv.id} style={styles.stepperItemWrapper}>
                        <View style={styles.stepperNodeRow}>
                          <Pressable
                            style={(state) => [styles.stepCircle, width < 380 && styles.stepCircleCompact, { backgroundColor: adv.bgColor }, styles.interactiveMotion, state.pressed ? styles.interactivePressed : 'hovered' in state && state.hovered && styles.interactiveHovered]}
                            accessibilityRole="button"
                            accessibilityLabel={adv.name}
                            onPress={() => router.push({ pathname: '/sentences', params: { level: adventurePracticeLevels[adv.iconType] } })}
                          >
                            <Ionicons name={practiceLevelIcons[adventurePracticeLevels[adv.iconType]]} size={width < 380 ? 22 : 26} color="#FFFFFF" />
                          </Pressable>

                          {!isLast && <View style={styles.stepConnectingLine} />}
                        </View>
                        <Text style={[styles.stepLabel, width < 380 && styles.stepLabelCompact]}>{adv.name}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* "CONTINUE PRACTICE ▶" BUTTON */}
              <Pressable accessibilityRole="button"
                style={(state) => [styles.continuePracticeBtn, styles.interactiveMotion, state.pressed ? styles.interactivePressed : 'hovered' in state && state.hovered && styles.interactiveHovered]}
                onPress={() => router.push('/sentences' as any)}
              >
                <Text style={styles.continuePracticeText}>Continue Practice</Text>
                <View style={styles.playArrowIcon}>
                  <Ionicons name="play" size={19} color="#0D68AC" />
                </View>
              </Pressable>

              {/* QUICK ACCESS CARDS */}
              <View style={styles.bottomCardsRow}>
                {/* My Activities Card */}
                <Pressable accessibilityRole="button"
                  style={(state) => [[styles.bottomCard, styles.activitiesCard], styles.interactiveMotion, state.pressed ? styles.interactivePressed : 'hovered' in state && state.hovered && styles.interactiveHovered]}
                  onPress={() => setIsActivitiesOpen(true)}
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
                    {assignedPractice.length > 0 ? assignedPractice.length + ' assigned' : submissions.length + ' submitted'}
                  </Text>
                </Pressable>

                {/* My Progress Card */}
                <Pressable accessibilityRole="button"
                  style={(state) => [[styles.bottomCard, styles.progressCard], styles.interactiveMotion, state.pressed ? styles.interactivePressed : 'hovered' in state && state.hovered && styles.interactiveHovered]}
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
                    {submissions.length * PARTICIPATION_STARS} earned
                  </Text>
                </Pressable>
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
        <Modal visible={isActivitiesOpen} transparent animationType="fade" onRequestClose={() => setIsActivitiesOpen(false)}>
          <View style={styles.activitiesBackdrop}>
            <View style={styles.activitiesDialog}>
              <View style={styles.activitiesHeader}>
                <Text style={styles.cardHeading}>My Activities</Text>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close activities" onPress={() => setIsActivitiesOpen(false)}>
                  <Ionicons name="close" size={28} color="#0D68AC" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.activitiesList}>
                                {assignedPractice.map((activity) => (
                  <Pressable key={activity.id} accessibilityRole="button" accessibilityLabel={'Practice ' + activity.title} style={styles.activityEntry} onPress={() => {
                    setIsActivitiesOpen(false);
                    router.push({ pathname: '/practice', params: {
                      activityId: activity.id, linkedAssignment: 'true', sound: activity.title,
                      syllable: '', category: activity.category.toLowerCase(),
                    } });
                  }}>
                    <Text style={styles.cardHeading}>{activity.title}</Text>
                    <Text style={styles.cardSubtext}>{activity.level}{activity.dueDate ? ' · Due ' + activity.dueDate : ''}</Text>
                  </Pressable>
                ))}
                {submissions.length === 0 && assignedPractice.length === 0 ? (
                  <ChildActivityEmpty buddy={activeBuddy} hint="Pick something fun to try in Play!" />
                ) : null}
                {submissions.map((activity) => (
                  <View key={activity.id} style={styles.activityEntry}>
                    <Text style={styles.cardHeading}>{activity.title}</Text>
                    <Text style={styles.cardSubtext}>{activity.position} · Submitted · {PARTICIPATION_STARS} star</Text>
                  </View>
                ))}
              </ScrollView>
              <Pressable accessibilityRole="button" style={(state) => [styles.activitiesPlay, styles.interactiveMotion, state.pressed ? styles.interactivePressed : 'hovered' in state && state.hovered && styles.interactiveHovered]} onPress={() => {
                setIsActivitiesOpen(false);
                router.push('/sentences' as any);
              }}>
                <Text style={styles.activitiesPlayText}>Go to Play</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        <SignOutConfirmModal
          visible={isSignOutModalVisible}
          onClose={() => setIsSignOutModalVisible(false)}
          onConfirm={() => {
            setIsSignOutModalVisible(false);
            if (router.canDismiss()) {
              router.dismissAll();
            }
            router.replace('/patient-login' as any);
          }}
        />
      </SafeAreaView >
    </>
  );
}

const styles = StyleSheet.create({
  interactiveMotion: { ...(Platform.OS === 'web' ? { cursor: 'pointer', transitionProperty: 'transform, opacity', transitionDuration: '140ms', transitionTimingFunction: 'ease-out' } : {}) },
  interactiveHovered: { transform: [{ translateY: -2 }, { scale: 1.02 }] },
  interactivePressed: { opacity: 0.88, transform: [{ translateY: 1 }, { scale: 0.97 }] },
  activitiesBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(16, 42, 64, 0.45)' },
  activitiesDialog: { width: '100%', maxWidth: 440, maxHeight: '85%', backgroundColor: '#FFFFFF', borderRadius: 22, padding: 20, gap: 14 },
  activitiesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activitiesList: { flexGrow: 0, flexShrink: 1 },
  activityEntry: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#D9EAF5' },
  activitiesPlay: { minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: '#0D68AC' },
  activitiesPlayText: { fontFamily: 'SourGummy-Bold', fontSize: 16, color: '#FFFFFF' },
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Dropdown Backdrop & Floating Menu Card */
  menuBackdrop: {
    ...StyleSheet.absoluteFill,
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
  mascotSpeechRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  mascotContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotImage: { width: '100%', height: '100%' },
  speechBubbleWrapper: { flex: 1, minWidth: 0, maxWidth: 300 },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    minHeight: 68,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#D4E7F6',
    shadowColor: '#0865AD',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    position: 'relative',
    overflow: 'visible',
    alignSelf: 'stretch',
  },
  speechBubbleTailContainer: {
    position: 'absolute',
    top: '50%',
    left: -13,
    marginTop: -11,
    width: 15,
    height: 22,
  },
  speechBubbleText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 15,
    color: '#0D68AC',
    lineHeight: 20,
    flexShrink: 1,
    flexWrap: 'wrap',
  },

  myStepsCard: { borderRadius: 22, paddingVertical: 18, paddingHorizontal: 20, alignItems: 'center', marginBottom: 14, shadowColor: '#0865AD', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 6, elevation: 5 },
  myStepsTitle: { fontFamily: 'SourGummy-Bold', fontSize: 24, color: '#FFFFFF', marginBottom: 4 },
  starNumberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10, gap: 3 },
  starNumberText: { fontFamily: 'SourGummy-Bold', fontSize: 44, color: '#FFFFFF' },
  starAssetImage: { width: 66, height: 65, marginTop: -2 },
  capsuleProgressTrack: { width: '100%', height: 18, backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', padding: 3, marginBottom: 8 },
  capsuleProgressFill: { height: '100%', backgroundColor: '#F5A623', borderRadius: 10 },
  myStepsSubtext: { fontFamily: 'SourGummy-Bold', fontSize: 13, color: '#FFFFFF', textShadowColor: 'rgba(0, 0, 0, 0.12)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },

  adventureContainer: { backgroundColor: '#FFFFFF', borderRadius: 22, paddingVertical: 16, paddingHorizontal: 16, marginBottom: 14, borderWidth: 1.5, borderColor: '#C7DFEE', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 5, elevation: 3 },
  adventureTitle: { fontFamily: 'SourGummy-Bold', fontSize: 20, color: '#0D68AC', textAlign: 'center', marginBottom: 14 },
  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 4 },
  stepperItemWrapper: { alignItems: 'center', flex: 1 },
  stepperNodeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  stepCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  stepCircleCompact: { width: 44, height: 44, borderRadius: 22 },

  stepQuotesText: { fontSize: 22, color: '#FFFFFF', fontWeight: 'bold' },
  stepConnectingLine: { position: 'absolute', right: -14, width: 28, height: 6, backgroundColor: '#B6D7F2', borderRadius: 3, zIndex: -1 },
  stepLabel: { fontFamily: 'SourGummy-Bold', fontSize: 12, color: '#0D68AC', marginTop: 8, textAlign: 'center' },
  stepLabelCompact: { fontSize: 11 },

  continuePracticeBtn: {
    minHeight: 70,
    backgroundColor: '#D9ECFA',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#AECFE8',
    borderBottomWidth: 6,
    borderBottomColor: '#83B2D6',
    shadowColor: '#0D68AC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.19,
    shadowRadius: 5,
    elevation: 5,
  },
  continuePracticeText: { fontFamily: 'SourGummy-Bold', fontSize: 20, color: '#0D68AC' },
  playArrowIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDF7FE' },

  bottomCardsRow: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  bottomCard: { flex: 1, borderRadius: 22, paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', borderWidth: 1.5, borderBottomWidth: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  activitiesCard: { backgroundColor: '#A0C6E8', borderColor: '#8AB7DF', borderBottomColor: '#6B9DC9' },
  progressCard: { backgroundColor: '#EFE0B6', borderColor: '#E6D4A0', borderBottomColor: '#CCA95B' },
  cardIconWrapper: { marginBottom: 8, height: 68, width: 68, justifyContent: 'center', alignItems: 'center' },
  cardImageIllustration: { width: 64, height: 64 },
  cardHeading: { fontFamily: 'SourGummy-Bold', fontSize: 16, color: '#000000', marginBottom: 2 },
  cardSubtext: { fontFamily: 'SourGummy-Medium', fontSize: 12, color: '#444444' },
});
