import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ImageBackground,
  Modal,
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
import { AssignedActivity, INITIAL_ASSIGNED_ACTIVITIES, TaskStore } from '@/data/parent-tasks-mock';

type FilterType = 'all' | 'pending' | 'completed';

export default function ParentTasksScreen() {
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../assets/SourGummy-Bold.ttf'),
  });

  const [childProfile, setChildProfile] = useState<ChildProfile>(ChildProfileStore.getProfile());
  const activities = TaskStore.getActivities();

  // Filter state
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

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
      router.push('/parent-dashboard' as any);
    }
  };

  // Filter items from live reactive TaskStore
  const filteredActivities = activities.filter((task) => {
    if (activeFilter === 'all') return true;
    return task.status === activeFilter;
  });

  const pendingCount = activities.filter((t) => t.status === 'pending').length;
  const completedCount = activities.filter((t) => t.status === 'completed').length;
  const allCount = activities.length;

  const getFilterLabel = () => {
    if (activeFilter === 'pending') return `Pending (${pendingCount})`;
    if (activeFilter === 'completed') return `Completed (${completedCount})`;
    return `All (${allCount})`;
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
              title="Assigned Activities"
              showBack={true}
              onBack={handleBack}
            />

            {/* =====================================================================
                FILTER BAR: [ ≡ Filters: All (6) ▾ ]
                ===================================================================== */}
            <View style={styles.filterSection}>
              <TouchableOpacity
                style={styles.filterPillButton}
                activeOpacity={0.8}
                onPress={() => {
                  setIsFilterDropdownOpen(!isFilterDropdownOpen);
                }}
              >
                {/* Orange Filter Lines Icon */}
                <View style={styles.filterIconLines}>
                  <View style={styles.filterLineTop} />
                  <View style={styles.filterLineMid} />
                  <View style={styles.filterLineBot} />
                </View>

                <Text style={styles.filterPillText}>{getFilterLabel()}</Text>

                {/* Orange Chevron Badge */}
                <View style={styles.filterChevronBadge}>
                  <Ionicons
                    name={isFilterDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={12}
                    color="#FFFFFF"
                  />
                </View>
              </TouchableOpacity>

              {/* Filter Options Dropdown Popover */}
              {isFilterDropdownOpen && (
                <>
                  <TouchableWithoutFeedback onPress={() => setIsFilterDropdownOpen(false)}>
                    <View style={styles.filterBackdrop} />
                  </TouchableWithoutFeedback>

                  <View style={styles.filterDropdownCard}>
                    {/* Option 1: All */}
                    <TouchableOpacity
                      style={[
                        styles.filterOptionRow,
                        activeFilter === 'all' && styles.filterOptionRowActive,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => {
                        setActiveFilter('all');
                        setIsFilterDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.filterOptionLabel,
                          activeFilter === 'all' && styles.filterOptionLabelActive,
                        ]}
                      >
                        All Activities
                      </Text>
                      <View style={styles.countPillNeutral}>
                        <Text style={styles.countPillTextNeutral}>{allCount}</Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.filterOptionDivider} />

                    {/* Option 2: Pending */}
                    <TouchableOpacity
                      style={[
                        styles.filterOptionRow,
                        activeFilter === 'pending' && styles.filterOptionRowActive,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => {
                        setActiveFilter('pending');
                        setIsFilterDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.filterOptionLabel,
                          activeFilter === 'pending' && styles.filterOptionLabelActive,
                        ]}
                      >
                        Pending
                      </Text>
                      <View style={styles.countPillPending}>
                        <Text style={styles.countPillTextPending}>{pendingCount}</Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.filterOptionDivider} />

                    {/* Option 3: Completed */}
                    <TouchableOpacity
                      style={[
                        styles.filterOptionRow,
                        activeFilter === 'completed' && styles.filterOptionRowActive,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => {
                        setActiveFilter('completed');
                        setIsFilterDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.filterOptionLabel,
                          activeFilter === 'completed' && styles.filterOptionLabelActive,
                        ]}
                      >
                        Completed
                      </Text>
                      <View style={styles.countPillCompleted}>
                        <Text style={styles.countPillTextCompleted}>{completedCount}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            {/* =====================================================================
                SCROLLABLE UNIFORM TASK CARDS LIST
                ===================================================================== */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {filteredActivities.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="checkbox-outline" size={48} color="#A0BED4" />
                  <Text style={styles.emptyTitle}>No Activities Found</Text>
                  <Text style={styles.emptySub}>
                    There are no {activeFilter} activities at the moment.
                  </Text>
                </View>
              ) : (
                filteredActivities.map((activity) => (
                  <TouchableOpacity
                    key={activity.id}
                    activeOpacity={0.8}
                    style={styles.taskCard}
                    onPress={() => {
                      TaskStore.setActiveTaskId(activity.id);
                      router.push({
                        pathname: '/parent-activity-details',
                        params: { id: activity.id },
                      } as any);
                    }}
                  >
                    {/* Left: Rounded Illustration Container */}
                    <View style={styles.thumbnailContainer}>
                      <Image
                        source={activity.thumbnail}
                        style={styles.thumbnailImage}
                        contentFit="contain"
                      />
                    </View>

                    {/* Middle: Title, Category/Level, Assignee */}
                    <View style={styles.taskInfoContainer}>
                      <Text style={styles.taskTitle}>{activity.title}</Text>
                      <Text style={styles.taskLevel}>{activity.level}</Text>
                      <Text style={styles.taskAssignee}>
                        Assigned : {activity.assignedBy}
                      </Text>
                    </View>

                    {/* Right: Uniform Status Badge */}
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
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* FIXED BOTTOM NAVIGATION BAR */}
            <ParentBottomNav activeTab="tasks" />
          </View>
        </ImageBackground>
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
    fontSize: 19,
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

  /* Filter Section */
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'relative',
    zIndex: 20,
  },
  filterPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2F0FA',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: '#0D68AC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterIconLines: {
    width: 14,
    height: 10,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  filterLineTop: {
    width: 14,
    height: 2,
    backgroundColor: '#F5A623',
    borderRadius: 1,
  },
  filterLineMid: {
    width: 10,
    height: 2,
    backgroundColor: '#F5A623',
    borderRadius: 1,
  },
  filterLineBot: {
    width: 6,
    height: 2,
    backgroundColor: '#F5A623',
    borderRadius: 1,
  },
  filterPillText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 14,
    color: '#0D68AC',
  },
  filterChevronBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Filter Popover */
  filterBackdrop: {
    ...StyleSheet.absoluteFill,
    zIndex: 25,
  },
  filterDropdownCard: {
    position: 'absolute',
    top: 48,
    left: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: '#D4E7F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 35,
    minWidth: 175,
  },
  filterOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  filterOptionRowActive: {
    backgroundColor: '#F0F7FD',
  },
  filterOptionLabel: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 13,
    color: '#4B6780',
  },
  filterOptionLabelActive: {
    fontFamily: 'SourGummy-Bold',
    color: '#0D68AC',
  },
  filterOptionDivider: {
    height: 1,
    backgroundColor: '#F0F5F9',
    marginVertical: 2,
  },
  countPillNeutral: {
    backgroundColor: '#E8F2FA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countPillTextNeutral: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 11,
    color: '#0D68AC',
  },
  countPillPending: {
    backgroundColor: '#FFEBEB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countPillTextPending: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 11,
    color: '#FF4D4D',
  },
  countPillCompleted: {
    backgroundColor: '#E5F9EF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countPillTextCompleted: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 11,
    color: '#27AE60',
  },

  /* Scrollable Content */
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 12,
  },

  /* Uniform Task Card (Flex Alignment Fixed) */
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#E2F0FA',
    shadowColor: '#0D68AC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  thumbnailContainer: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#A3BFD3',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: 46,
    height: 46,
  },
  taskInfoContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  taskTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 20,
    color: '#0D68AC',
    marginBottom: 2,
  },
  taskLevel: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 12,
    color: '#7C93A8',
    marginBottom: 2,
  },
  taskAssignee: {
    fontFamily: 'SourGummy',
    fontSize: 12,
    color: '#9BB4C7',
  },

  /* Status Badges */
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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

  /* Empty state */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 18,
    color: '#0D68AC',
    marginTop: 8,
  },
  emptySub: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 13,
    color: '#7C93A8',
    textAlign: 'center',
  },

  /* Modal Preview Dialog */
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 34, 58, 0.45)',
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingVertical: 24,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D4E8F8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  dialogCloseButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F8FC',
    borderWidth: 1,
    borderColor: '#D4E7F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogThumbnailWrapper: {
    width: 74,
    height: 74,
    borderRadius: 20,
    backgroundColor: '#A3BFD3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  dialogThumbnail: {
    width: 60,
    height: 60,
  },
  dialogTaskTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 24,
    color: '#0D68AC',
    marginBottom: 2,
  },
  dialogTaskLevel: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 13,
    color: '#7C93A8',
    marginBottom: 10,
  },
  dialogStatusPill: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 16,
  },
  dialogMetaBox: {
    width: '100%',
    backgroundColor: '#F5F9FD',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2F0FA',
    gap: 8,
    marginBottom: 18,
  },
  dialogMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dialogMetaLabel: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 13,
    color: '#7C93A8',
  },
  dialogMetaValue: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 13,
    color: '#0D68AC',
  },
  dialogDescriptionBox: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2F0FA',
  },
  dialogDescriptionText: {
    fontFamily: 'SourGummy-Regular',
    fontSize: 12,
    color: '#6B8299',
    lineHeight: 17,
  },
  dialogActionButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#106AB0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#106AB0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  dialogActionButtonText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

