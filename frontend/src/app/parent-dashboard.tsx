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
} from 'react-native';

import { ParentBottomNav } from '@/components/parent-bottom-nav';
import { ParentHeader } from '@/components/parent-header';
import { ChildProfile, ChildProfileStore } from '@/data/child-profile-store';
import { AssignedActivity, TaskStore } from '@/data/parent-tasks-mock';

export default function ParentDashboardScreen() {
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../assets/SourGummy-Bold.ttf'),
  });

  const [childProfile, setChildProfile] = useState<ChildProfile>(ChildProfileStore.getProfile());
  const activities = TaskStore.getActivities();

  // Subscribe to live child profile updates
  useEffect(() => {
    const unsubscribe = ChildProfileStore.subscribe((updatedProfile) => {
      setChildProfile(updatedProfile);
    });
    return unsubscribe;
  }, []);

  if (!fontsLoaded) return null;

  const totalActivities = activities.length;
  const completedActivities = activities.filter((t) => t.status === 'completed').length;
  const pendingActivities = activities.filter((t) => t.status === 'pending').length;
  const totalAttempts = activities.reduce((sum, t) => sum + (t.attempts || 0), 0);
  const progressPercentage = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

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
              FLOATING MAIN PARENT DASHBOARD CARD CONTAINER
              ========================================================================= */}
          <View style={styles.parentCardContainer}>
            {/* UNIFIED PARENT HEADER & PROTECTED MENU */}
            <ParentHeader
              title="Parent / Guardian"
              showBack={false}
            />

            {/* SCROLLABLE MAIN CONTENT */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* =====================================================================
                  "MIA'S PROGRESS" HERO CARD (Exact 3-Stop Sky-to-Cyan Gradient)
                  ===================================================================== */}
              <LinearGradient
                colors={['#106AB0', '#2A8AC8', '#4DB3E9']}
                locations={[0, 0.45, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.progressHeroCard}
              >
                <Text style={styles.heroTitle}>{childProfile.displayName}'s Progress</Text>

                {/* Stars earned badge */}
                <View style={styles.starRow}>
                  <Text style={styles.starCountText}>{completedActivities}</Text>
                  <Image
                    source={require('../../assets/images/star-3d.png')}
                    style={styles.starIcon}
                    contentFit="contain"
                  />
                </View>

                {/* Progress Track */}
                <View style={styles.progressTrackContainer}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progressPercentage}%` },
                    ]}
                  />
                </View>

                {/* Subtext info */}
                <Text style={styles.heroSubText}>
                  {completedActivities} of {totalActivities} activities done | {totalAttempts} Attempts
                </Text>
              </LinearGradient>

              {/* =====================================================================
                  TWO QUICK ACTION CARDS (50/50 Side-by-Side Grid)
                  ===================================================================== */}
              <View style={styles.twoColumnGrid}>
                {/* Child Profile Card */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.childProfileCard}
                  onPress={() => router.push('/child-profile' as any)}
                >
                  <Image
                    source={childProfile.avatar}
                    style={styles.childProfileAvatar}
                    contentFit="cover"
                  />
                  <Text style={styles.cardTitle}>Child Profile</Text>
                  <Text style={styles.cardSubText}>{childProfile.fullName}</Text>
                </TouchableOpacity>

                {/* Assigned Activities Card */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.assignedCard}
                  onPress={() => router.push('/parent-tasks' as any)}
                >
                  <View style={styles.assignedIconBadge}>
                    <Ionicons name="list" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.cardTitle}>Assigned</Text>
                  <Text style={styles.cardSubText}>{pendingActivities} Pending</Text>
                </TouchableOpacity>
              </View>

              {/* =====================================================================
                  PROGRESS REPORT BANNER (Mint Green Theme)
                  ===================================================================== */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.progressReportBanner}
                onPress={() => router.push('/parent-progress' as any)}
              >
                <View style={styles.progressReportIconBadge}>
                  <Ionicons name="file-tray-full" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.progressReportTextWrapper}>
                  <Text style={styles.progressReportTitle}>Progress</Text>
                  <Text style={styles.progressReportSubtitle}>
                    View {childProfile.displayName}'s progress report
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#3EA88A" />
              </TouchableOpacity>

              {/* =====================================================================
                  THERAPIST FEEDBACK CARD (White card with empty state text)
                  ===================================================================== */}
              <View style={styles.therapistFeedbackCard}>
                <View style={styles.therapistHeaderRow}>
                  <View style={styles.therapistIconWrapper}>
                    <Ionicons name="chatbubbles" size={22} color="#F5A623" />
                  </View>
                  <Text style={styles.therapistTitle}>Therapist Feedback</Text>
                </View>

                <View style={styles.therapistBodyBox}>
                  <Text style={styles.therapistBodyText}>
                    No feedback yet. Your therapist's comments will show up here as
                    soon as they review a recording.
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* INTEGRATED BOTTOM TAB BAR (Parent 3-Tab Bar) */}
            <ParentBottomNav activeTab="home" />
          </View>
        </ImageBackground>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#8CBFE6',
  },
  background: {
    flex: 1,
    backgroundColor: '#8CBFE6',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
  },

  /* White / Soft Blue Floating Card */
  parentCardContainer: {
    flex: 1,
    backgroundColor: '#E7F2FA',
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#C7DFEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    position: 'relative',
  },

  /* Top Header */
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#E7F2FA',
    zIndex: 20,
  },
  headerTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 24,
    color: '#0D68AC',
    letterSpacing: -0.3,
    flexShrink: 1,
    marginRight: 10,
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
    paddingTop: 8,
    paddingBottom: 20,
    gap: 14,
  },

  /* Hero Gradient Card */
  progressHeroCard: {
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 18,
    shadowColor: '#0865AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 5,
  },
  heroTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 12,
  },
  starCountText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 38,
    color: '#FFFFFF',
  },
  starIcon: {
    width: 34,
    height: 34,
  },
  progressTrackContainer: {
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F5A623',
    borderRadius: 6,
  },
  heroSubText: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  /* Two Column Grid */
  twoColumnGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  childProfileCard: {
    flex: 1,
    backgroundColor: '#DFF2FD',
    borderColor: '#BEE0F8',
    borderBottomColor: '#A5D2F2',
    borderRadius: 20,
    borderWidth: 2,
    borderBottomWidth: 5,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  childProfileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginBottom: 6,
  },
  assignedCard: {
    flex: 1,
    backgroundColor: '#FEF3D6',
    borderColor: '#FDE5A9',
    borderBottomColor: '#FAD77C',
    borderRadius: 20,
    borderWidth: 2,
    borderBottomWidth: 5,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  assignedIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0D68AC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 14,
    color: '#0D68AC',
    textAlign: 'center',
  },
  cardSubText: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 11,
    color: '#7A96A8',
    marginTop: 2,
    textAlign: 'center',
  },

  /* Progress Report Banner */
  progressReportBanner: {
    backgroundColor: '#E6F9F3',
    borderColor: '#C6F0E3',
    borderBottomColor: '#A5E6D2',
    borderRadius: 20,
    borderWidth: 2,
    borderBottomWidth: 5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  progressReportIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#0D68AC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  progressReportTextWrapper: {
    flex: 1,
  },
  progressReportTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 16,
    color: '#0D68AC',
  },
  progressReportSubtitle: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 11,
    color: '#5E8E83',
    marginTop: 1,
  },

  /* Therapist Feedback Card */
  therapistFeedbackCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D4E7F5',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  therapistHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  therapistIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  therapistTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 16,
    color: '#0D68AC',
  },
  therapistBodyBox: {
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  therapistBodyText: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 13,
    color: '#8B9EAD',
    lineHeight: 19,
    textAlign: 'center',
  },
});
