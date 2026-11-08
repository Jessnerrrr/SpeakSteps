import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { ParentBottomNav } from '@/components/parent-bottom-nav';
import { ParentHeader } from '@/components/parent-header';
import { ChildModeConfirmModal } from '@/components/child-mode-confirm-modal';
import { ChildProfile, ChildProfileStore } from '@/data/child-profile-store';
import { AssignedActivity, getActivityById, TaskStore } from '@/data/parent-tasks-mock';

export default function ParentActivityDetailsScreen() {
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../assets/SourGummy-Bold.ttf'),
  });

  const params = useLocalSearchParams<{ id?: string }>();
  const [childProfile, setChildProfile] = useState<ChildProfile>(ChildProfileStore.getProfile());
  const [isChildModeModalVisible, setIsChildModeModalVisible] = useState(false);

  // Retrieve static activity from ID parameter or TaskStore
  const activity: AssignedActivity = getActivityById(params.id || TaskStore.getActiveTaskId());

  // Subscribe to live child profile updates
  useEffect(() => {
    const unsubscribe = ChildProfileStore.subscribe((updated) => {
      setChildProfile(updated);
    });
    return unsubscribe;
  }, []);

  if (!fontsLoaded) return null;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/parent-tasks' as any);
    }
  };

  // Static placeholder: left static so video player can be connected later
  const handleListenOrWatch = () => {};

  // Help Child to Practice: Triggers Child Mode confirmation modal
  const handleHelpChildToPractice = () => {
    setIsChildModeModalVisible(true);
  };

  const handleConfirmChildPractice = () => {
    setIsChildModeModalVisible(false);
    router.push({
      pathname: '/sentences',
      params: {
        activityId: activity?.id,
        sound: activity?.title,
        level: activity?.level,
      },
    } as any);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safeArea}>
        {/* =========================================================================
            OUTER WATERMARKED LIGHT BLUE CANVAS
            ========================================================================= */}
        <ImageBackground
          source={require('../../assets/images/split-bg.png')}
          style={styles.background}
          imageStyle={{ opacity: 0.25 }}
          resizeMode="cover"
        >
          {/* =========================================================================
              FLOATING MAIN PARENT CONTAINER
              ========================================================================= */}
          <View style={styles.mainContainer}>
            {/* UNIFIED PARENT HEADER & PROTECTED MENU */}
            <ParentHeader
              title="Activity Details"
              showBack={true}
              onBack={handleBack}
            />

            {/* SCROLLABLE MAIN CONTENT */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* =====================================================================
                  1. ACTIVITY HERO CARD (Reference Section 1)
                  ===================================================================== */}
              <View style={styles.heroCard}>
                {/* Top Badge Row */}
                <View style={styles.heroTopRow}>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelBadgeText}>{activity.level}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      activity.status === 'completed'
                        ? styles.statusBadgeCompleted
                        : styles.statusBadgePending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        activity.status === 'completed'
                          ? styles.statusTextCompleted
                          : styles.statusTextPending,
                      ]}
                    >
                      {activity.status === 'completed' ? 'Completed' : 'Pending'}
                    </Text>
                  </View>
                </View>

                {/* Centered Graphic Badge */}
                <View style={styles.illustrationWrapper}>
                  <Image
                    source={activity.thumbnail}
                    style={styles.illustrationImage}
                    contentFit="contain"
                  />
                </View>

                {/* Assignee Subtitle */}
                <Text style={styles.assigneeText}>
                  Assigned: {activity.assignedBy}
                </Text>

                {/* "Listen or Watch" Action Button */}
                <TouchableOpacity
                  style={styles.listenWatchButton}
                  activeOpacity={0.85}
                  onPress={handleListenOrWatch}
                >
                  <View style={styles.playIconCircle}>
                    <Ionicons name="play" size={13} color="#FFFFFF" />
                  </View>
                  <Text style={styles.listenWatchButtonText}>Listen or Watch</Text>
                </TouchableOpacity>
              </View>

              {/* =====================================================================
                  2. THREE METRIC / STAT CARDS ROW (Reference Section 2)
                  ===================================================================== */}
              <View style={styles.metricsRow}>
                {/* Attempts */}
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{activity.attempts ?? 0}</Text>
                  <Text style={styles.metricLabel}>Attempts</Text>
                </View>

                {/* Best Score */}
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{activity.bestScore ?? '—'}</Text>
                  <Text style={styles.metricLabel}>Best Score</Text>
                </View>

                {/* Stars */}
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{activity.stars ?? '—'}</Text>
                  <Text style={styles.metricLabel}>Stars</Text>
                </View>
              </View>

              {/* =====================================================================
                  3. "HOW TO PRACTICE" SECTION (Reference Section 3)
                  ===================================================================== */}
              <View style={styles.practiceSection}>
                <Text style={styles.practiceSectionTitle}>How to Practice</Text>

                <View style={styles.practiceStepsRow}>
                  {/* Step 1: Listen */}
                  <View style={styles.stepCard}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <View style={styles.stepIconBox}>
                      <Ionicons name="ear-outline" size={28} color="#0D68AC" />
                    </View>
                    <Text style={styles.stepLabel}>Listen</Text>
                  </View>

                  <Ionicons
                    name="caret-forward"
                    size={12}
                    color="#F5A623"
                    style={styles.stepConnector}
                  />

                  {/* Step 2: Watch */}
                  <View style={styles.stepCard}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <View style={styles.stepIconBox}>
                      <Ionicons name="tv-outline" size={28} color="#0D68AC" />
                    </View>
                    <Text style={styles.stepLabel}>Watch</Text>
                  </View>

                  <Ionicons
                    name="caret-forward"
                    size={12}
                    color="#F5A623"
                    style={styles.stepConnector}
                  />

                  {/* Step 3: Say it! */}
                  <View style={styles.stepCard}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <View style={styles.stepIconBox}>
                      <Ionicons name="mic-outline" size={28} color="#0D68AC" />
                    </View>
                    <Text style={styles.stepLabel}>Say it!</Text>
                  </View>

                  <Ionicons
                    name="caret-forward"
                    size={12}
                    color="#F5A623"
                    style={styles.stepConnector}
                  />

                  {/* Step 4: Get Stars */}
                  <View style={styles.stepCard}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>4</Text>
                    </View>
                    <View style={styles.stepIconBox}>
                      <Ionicons name="star-outline" size={28} color="#0D68AC" />
                    </View>
                    <Text style={styles.stepLabel}>Get Stars</Text>
                  </View>
                </View>
              </View>

              {/* =====================================================================
                  4. "HELP CHILD TO PRACTICE" PRIMARY CTA BUTTON (Reference Section 4)
                  ===================================================================== */}
              <TouchableOpacity
                style={styles.helpButton}
                activeOpacity={0.85}
                onPress={handleHelpChildToPractice}
              >
                <View style={styles.parentAvatarBadge}>
                  <Image
                    source={require('../../assets/images/parent-mode-icon.png')}
                    style={styles.parentAvatarImage}
                    contentFit="cover"
                  />
                </View>
                <Text style={styles.helpButtonText}>Help Child to Practice</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* FIXED BOTTOM NAVIGATION BAR */}
            <ParentBottomNav activeTab="tasks" />
          </View>
        </ImageBackground>

        {/* Child Mode Practice Confirmation Modal */}
        <ChildModeConfirmModal
          visible={isChildModeModalVisible}
          mode="practice"
          onClose={() => setIsChildModeModalVisible(false)}
          onConfirm={handleConfirmChildPractice}
          childName={childProfile.displayName}
          activityTitle={activity?.title}
          activityLevel={activity?.level}
          activityThumbnail={activity?.thumbnail}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#CCE5F6',
  },
  background: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: '#F3F9FE',
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#D2E6F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },

  /* Top Header */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D2E6F5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'SourGummy-Bold',
    fontSize: 20,
    color: '#0D68AC',
    textAlign: 'center',
    marginLeft: 14,
    marginRight: 6,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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

  /* Dropdown Backdrop & Floating Menu */
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
    minWidth: 200,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 8,
  },
  menuChildAvatar: {
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

  /* Scrollable Content */
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 12,
  },

  /* 1. Hero Card */
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#E2F0FA',
    shadowColor: '#0D68AC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
    alignItems: 'center',
  },
  heroTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  levelBadge: {
    backgroundColor: '#0D68AC',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusBadgePending: {
    backgroundColor: '#FFD9D9',
  },
  statusBadgeCompleted: {
    backgroundColor: '#D7F5E8',
  },
  statusBadgeText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 12,
  },
  statusTextPending: {
    color: '#FF4D4D',
  },
  statusTextCompleted: {
    color: '#27AE60',
  },
  illustrationWrapper: {
    width: 88,
    height: 88,
    borderRadius: 20,
    backgroundColor: '#A3BFD3',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  illustrationImage: {
    width: 70,
    height: 70,
  },
  assigneeText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 14,
    color: '#0D68AC',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  listenWatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5A623',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 22,
    gap: 8,
    shadowColor: '#C47700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  playIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0D68AC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  listenWatchButtonText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },

  /* 2. Metrics Row */
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2F0FA',
    shadowColor: '#0D68AC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricValue: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 32,
    color: '#0D68AC',
    lineHeight: 38,
  },
  metricLabel: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 12,
    color: '#7C93A8',
    marginTop: 2,
  },

  /* 3. "How to Practice" Section */
  practiceSection: {
    marginTop: 2,
  },
  practiceSectionTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 17,
    color: '#0D68AC',
    marginBottom: 10,
  },
  practiceStepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#99C4E2',
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 74,
    shadowColor: '#0D68AC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  stepNumberBadge: {
    position: 'absolute',
    top: -6,
    left: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 5,
  },
  stepNumberText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  stepIconBox: {
    marginBottom: 4,
  },
  stepLabel: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 11,
    color: '#0D68AC',
    textAlign: 'center',
  },
  stepConnector: {
    marginHorizontal: 2,
  },

  /* 4. Primary CTA Button: "Help Child to Practice" */
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5A623',
    borderRadius: 28,
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#E09015',
    shadowColor: '#C47700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
    marginTop: 4,
    marginBottom: 6,
    gap: 10,
  },
  parentAvatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFE3A8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  parentAvatarImage: {
    width: 32,
    height: 32,
  },
  helpButtonText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 17,
    color: '#064878',
  },
});

