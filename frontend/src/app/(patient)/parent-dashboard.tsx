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

// Switched to relative paths to fix module resolution errors
import { ParentBottomNav } from '../../components/parent-bottom-nav';
import { ParentHeader } from '../../components/parent-header';
import { ChildProfile, ChildProfileStore } from '../../data/child-profile-store';
import { AssignedActivity, TaskStore } from '../../data/parent-tasks-mock';
import { GrownUpCheckModal } from '../../components/grown-up-check-modal';
import { SignOutConfirmModal } from '../../components/sign-out-confirm-modal';

export default function ParentDashboardScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../assets/SourGummy-Bold.ttf'),
  });

  const [childProfile, setChildProfile] = useState<ChildProfile>(ChildProfileStore.getProfile());
  const activities = TaskStore.getActivities();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGrownUpModalVisible, setIsGrownUpModalVisible] = useState(false);
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);

  // Added explicit ChildProfile typing to fix ts(7006)
  useEffect(() => {
    const unsubscribe = ChildProfileStore.subscribe((updatedProfile: ChildProfile) => {
      setChildProfile(updatedProfile);
    });
    return unsubscribe;
  }, []);

  if (!fontsLoaded) return null;

  const totalActivities = activities.length;
  
  // Added explicit AssignedActivity typing to fix ts(7006) implicit 'any' errors
  const completedActivities = activities.filter((t: AssignedActivity) => t.status === 'completed').length;
  const pendingActivities = activities.filter((t: AssignedActivity) => t.status === 'pending').length;
  const totalAttempts = activities.reduce((sum: number, t: AssignedActivity) => sum + (t.attempts || 0), 0);
  const progressPercentage = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <ImageBackground
          source={require('../../assets/images/split-bg.png')}
          style={styles.background}
          imageStyle={{ opacity: 0.25 }}
          resizeMode="cover"
        >
          <View style={[styles.parentCardContainer, isTablet && styles.parentCardTablet]}>
            <ParentHeader title="Parent / Guardian" showBack={false} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <LinearGradient
                colors={['#106AB0', '#2A8AC8', '#4DB3E9']}
                locations={[0, 0.45, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.progressHeroCard}
              >
                <Text style={styles.heroTitle}>{childProfile.displayName}'s Progress</Text>
                <View style={styles.starRow}>
                  <Text style={styles.starCountText}>{completedActivities}</Text>
                  <Image source={require('../../assets/images/star-3d.png')} style={styles.starIcon} contentFit="contain" />
                </View>
                <View style={styles.progressTrackContainer}>
                  <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
                </View>
                <Text style={styles.heroSubText}>
                  {completedActivities} of {totalActivities} activities done | {totalAttempts} Attempts
                </Text>
              </LinearGradient>

              <View style={styles.twoColumnGrid}>
                <TouchableOpacity activeOpacity={0.85} style={styles.childProfileCard} onPress={() => router.push('/child-profile' as any)}>
                  <Image source={childProfile.avatar} style={styles.childProfileAvatar} contentFit="cover" />
                  <Text style={styles.cardTitle}>Child Profile</Text>
                  <Text style={styles.cardSubText}>{childProfile.fullName}</Text>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.85} style={styles.assignedCard} onPress={() => router.push('/parent-tasks' as any)}>
                  <View style={styles.assignedIconBadge}>
                    <Ionicons name="list" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.cardTitle}>Assigned</Text>
                  <Text style={styles.cardSubText}>{pendingActivities} Pending</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity activeOpacity={0.85} style={styles.progressReportBanner} onPress={() => router.push('/parent-progress' as any)}>
                <View style={styles.progressReportIconBadge}>
                  <Ionicons name="file-tray-full" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.progressReportTextWrapper}>
                  <Text style={styles.progressReportTitle}>Progress</Text>
                  <Text style={styles.progressReportSubtitle}>View {childProfile.displayName}'s progress report</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#3EA88A" />
              </TouchableOpacity>

              <View style={styles.therapistFeedbackCard}>
                <View style={styles.therapistHeaderRow}>
                  <View style={styles.therapistIconWrapper}>
                    <Ionicons name="chatbubbles" size={22} color="#F5A623" />
                  </View>
                  <Text style={styles.therapistTitle}>Therapist Feedback</Text>
                </View>
                <View style={styles.therapistBodyBox}>
                  <Text style={styles.therapistBodyText}>
                    No feedback yet. Your therapist's comments will show up here as soon as they review a recording.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <ParentBottomNav activeTab="home" />
          </View>
        </ImageBackground>

        <GrownUpCheckModal visible={isGrownUpModalVisible} onClose={() => setIsGrownUpModalVisible(false)} onSuccess={() => { setIsGrownUpModalVisible(false); router.push('/parent-dashboard' as any); }} />
        <SignOutConfirmModal visible={isSignOutModalVisible} onClose={() => setIsSignOutModalVisible(false)} onConfirm={() => { setIsSignOutModalVisible(false); router.replace('/patient-login' as any); }} />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#8CBFE6' },
  background: { flex: 1, backgroundColor: '#8CBFE6', paddingHorizontal: 10, paddingTop: 8, paddingBottom: 6 },
  parentCardContainer: { flex: 1, width: '100%', backgroundColor: '#E7F2FA', borderRadius: 36, overflow: 'hidden', borderWidth: 1.5, borderColor: '#C7DFEE', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 6, position: 'relative' },
  parentCardTablet: { maxWidth: 600, alignSelf: 'center' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20, gap: 14 },
  
  progressHeroCard: { borderRadius: 22, paddingVertical: 18, paddingHorizontal: 18, shadowColor: '#0865AD', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 6, elevation: 5 },
  heroTitle: { fontFamily: 'SourGummy-Bold', fontSize: 22, color: '#FFFFFF', textAlign: 'center', marginBottom: 6 },
  starRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 12 },
  starCountText: { fontFamily: 'SourGummy-Bold', fontSize: 38, color: '#FFFFFF' },
  starIcon: { width: 34, height: 34 },
  progressTrackContainer: { height: 12, backgroundColor: '#FFFFFF', borderRadius: 6, overflow: 'hidden', marginBottom: 10 },
  progressBarFill: { height: '100%', backgroundColor: '#F5A623', borderRadius: 6 },
  heroSubText: { fontFamily: 'SourGummy-Medium', fontSize: 12, color: '#FFFFFF', textAlign: 'center' },

  twoColumnGrid: { flexDirection: 'row', gap: 12 },
  childProfileCard: { flex: 1, backgroundColor: '#DFF2FD', borderColor: '#BEE0F8', borderBottomColor: '#A5D2F2', borderRadius: 20, borderWidth: 2, borderBottomWidth: 5, paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  childProfileAvatar: { width: 52, height: 52, borderRadius: 26, marginBottom: 6 },
  assignedCard: { flex: 1, backgroundColor: '#FEF3D6', borderColor: '#FDE5A9', borderBottomColor: '#FAD77C', borderRadius: 20, borderWidth: 2, borderBottomWidth: 5, paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  assignedIconBadge: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#0D68AC', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  cardTitle: { fontFamily: 'SourGummy-Bold', fontSize: 14, color: '#0D68AC', textAlign: 'center' },
  cardSubText: { fontFamily: 'SourGummy-Medium', fontSize: 11, color: '#7A96A8', marginTop: 2, textAlign: 'center' },

  progressReportBanner: { backgroundColor: '#E6F9F3', borderColor: '#C6F0E3', borderBottomColor: '#A5E6D2', borderRadius: 20, borderWidth: 2, borderBottomWidth: 5, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  progressReportIconBadge: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#0D68AC', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  progressReportTextWrapper: { flex: 1 },
  progressReportTitle: { fontFamily: 'SourGummy-Bold', fontSize: 16, color: '#0D68AC' },
  progressReportSubtitle: { fontFamily: 'SourGummy-Medium', fontSize: 11, color: '#5E8E83', marginTop: 1 },

  therapistFeedbackCard: { backgroundColor: '#FFFFFF', borderColor: '#D4E7F5', borderRadius: 20, borderWidth: 1.5, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  therapistHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  therapistIconWrapper: { alignItems: 'center', justifyContent: 'center' },
  therapistTitle: { fontFamily: 'SourGummy-Bold', fontSize: 16, color: '#0D68AC' },
  therapistBodyBox: { paddingHorizontal: 10, paddingVertical: 14 },
  therapistBodyText: { fontFamily: 'SourGummy-Medium', fontSize: 13, color: '#8B9EAD', lineHeight: 19, textAlign: 'center' },
});