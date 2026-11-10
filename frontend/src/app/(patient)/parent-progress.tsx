import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
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

// CORRECTED RELATIVE PATHS
import { ParentBottomNav } from '../../components/parent-bottom-nav';
import { ParentHeader } from '../../components/parent-header';
import { ChildProfile, ChildProfileStore } from '../../data/child-profile-store';
import {
  CategoryProgress,
  INITIAL_PROGRESS_DATA,
  ProgressSummary,
} from '../../data/parent-progress-mock';

type FilterKey = 'overall' | 'Sounds' | 'Words' | 'Phrases' | 'Sentences';

export default function ParentProgressScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  // FIXED FONT PATHS: 3 levels up to reach root assets
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  const [childProfile, setChildProfile] = useState<ChildProfile>(ChildProfileStore.getProfile());
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const [selectedFilters, setSelectedFilters] = useState<Record<FilterKey, boolean>>({
    overall: true,
    Sounds: false,
    Words: false,
    Phrases: false,
    Sentences: false,
  });

  const [data] = useState<ProgressSummary>(INITIAL_PROGRESS_DATA);

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

  const handleToggleFilter = (key: FilterKey) => {
    if (key === 'overall') {
      setSelectedFilters({
        overall: true,
        Sounds: false,
        Words: false,
        Phrases: false,
        Sentences: false,
      });
    } else {
      const updated = {
        ...selectedFilters,
        overall: false,
        [key]: !selectedFilters[key],
      };

      const anySelected = (['Sounds', 'Words', 'Phrases', 'Sentences'] as FilterKey[]).some(
        (k) => updated[k]
      );
      if (!anySelected) {
        updated.overall = true;
      }

      setSelectedFilters(updated);
    }
  };

  const activeCategories: CategoryProgress[] = selectedFilters.overall
    ? data.categories
    : data.categories.filter((cat) => selectedFilters[cat.name as FilterKey]);

  const totalCompleted = selectedFilters.overall
    ? data.completed
    : activeCategories.reduce((sum, c) => sum + c.completedCount, 0);

  const totalPending = selectedFilters.overall
    ? data.pending
    : activeCategories.reduce((sum, c) => sum + c.pendingCount, 0);

  const totalAttempts = selectedFilters.overall
    ? data.practiceAttempts
    : activeCategories.reduce((sum, c) => sum + c.attempts, 0);

  const getFilterButtonLabel = () => {
    if (selectedFilters.overall) return 'Filters: Overall';
    const activeNames = (['Sounds', 'Words', 'Phrases', 'Sentences'] as FilterKey[]).filter(
      (k) => selectedFilters[k]
    );
    if (activeNames.length === 1) return `Filters: ${activeNames[0]}`;
    return `Filters: (${activeNames.length})`;
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        {/* FIXED IMAGE PATH */}
        <ImageBackground
          source={require('../../../assets/images/split-bg.png')}
          style={styles.background}
          imageStyle={{ opacity: 0.25 }}
          resizeMode="cover"
        >
          {/* Main Floating Container restricted by Tablet width */}
          <View style={[styles.mainContainer, isTablet && styles.mainContainerTablet]}>
            
            <ParentHeader
              title="Progress & History"
              showBack={true}
              onBack={handleBack}
            />

            <View style={styles.filterSection}>
              <TouchableOpacity
                style={styles.filterPillButton}
                activeOpacity={0.8}
                onPress={() => {
                  setIsFilterDropdownOpen(!isFilterDropdownOpen);
                }}
              >
                <View style={styles.filterIconLines}>
                  <View style={styles.filterLineTop} />
                  <View style={styles.filterLineMid} />
                  <View style={styles.filterLineBot} />
                </View>

                <Text style={styles.filterPillText}>{getFilterButtonLabel()}</Text>

                <View style={styles.filterChevronBadge}>
                  <Ionicons
                    name={isFilterDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={12}
                    color="#FFFFFF"
                  />
                </View>
              </TouchableOpacity>

              {isFilterDropdownOpen && (
                <>
                  <TouchableWithoutFeedback onPress={() => setIsFilterDropdownOpen(false)}>
                    <View style={styles.filterBackdrop} />
                  </TouchableWithoutFeedback>

                  <View style={styles.filterDropdownCard}>
                    <Text style={styles.filterDropdownTitle}>Filter Progress By:</Text>

                    <TouchableOpacity
                      style={styles.checkboxRow}
                      activeOpacity={0.75}
                      onPress={() => handleToggleFilter('overall')}
                    >
                      <Ionicons
                        name={selectedFilters.overall ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={selectedFilters.overall ? '#0D68AC' : '#8CA3B5'}
                      />
                      <Text style={[styles.checkboxLabel, selectedFilters.overall && styles.checkboxLabelActive]}>
                        Overall
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.checkboxDivider} />

                    <TouchableOpacity
                      style={styles.checkboxRow}
                      activeOpacity={0.75}
                      onPress={() => handleToggleFilter('Sounds')}
                    >
                      <Ionicons
                        name={selectedFilters.Sounds ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={selectedFilters.Sounds ? '#0D68AC' : '#8CA3B5'}
                      />
                      <Text style={[styles.checkboxLabel, selectedFilters.Sounds && styles.checkboxLabelActive]}>
                        Sounds
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.checkboxRow}
                      activeOpacity={0.75}
                      onPress={() => handleToggleFilter('Words')}
                    >
                      <Ionicons
                        name={selectedFilters.Words ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={selectedFilters.Words ? '#0D68AC' : '#8CA3B5'}
                      />
                      <Text style={[styles.checkboxLabel, selectedFilters.Words && styles.checkboxLabelActive]}>
                        Words
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.checkboxRow}
                      activeOpacity={0.75}
                      onPress={() => handleToggleFilter('Phrases')}
                    >
                      <Ionicons
                        name={selectedFilters.Phrases ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={selectedFilters.Phrases ? '#0D68AC' : '#8CA3B5'}
                      />
                      <Text style={[styles.checkboxLabel, selectedFilters.Phrases && styles.checkboxLabelActive]}>
                        Phrases
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.checkboxRow}
                      activeOpacity={0.75}
                      onPress={() => handleToggleFilter('Sentences')}
                    >
                      <Ionicons
                        name={selectedFilters.Sentences ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={selectedFilters.Sentences ? '#0D68AC' : '#8CA3B5'}
                      />
                      <Text style={[styles.checkboxLabel, selectedFilters.Sentences && styles.checkboxLabelActive]}>
                        Sentences
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.heroCardsRow}>
                <View style={styles.heroCard}>
                  <Text style={styles.heroCardNumber}>{totalCompleted}</Text>
                  <Text style={styles.heroCardTitle} numberOfLines={1} adjustsFontSizeToFit>
                    Completed
                  </Text>
                  <Text style={styles.heroCardSubtext}>{totalPending} pending</Text>
                </View>

                <View style={styles.heroCard}>
                  <Text style={styles.heroCardNumber}>{totalAttempts}</Text>
                  <Text style={styles.heroCardTitle} numberOfLines={1} adjustsFontSizeToFit>
                    Practice Attempts
                  </Text>
                  <Text style={styles.heroCardSubtext}>
                    {selectedFilters.overall ? 'all activities' : 'recorded attempts'}
                  </Text>
                </View>
              </View>

              <View style={styles.levelProgressSection}>
                <Text style={styles.levelProgressTitle}>Level Progress</Text>

                <View style={styles.levelProgressCard}>
                  {activeCategories.map((category) => {
                    const ratio = category.totalCount > 0 ? (category.completedCount / category.totalCount) : 0;
                    const fillPercent = ratio === 0 ? '0%' : `${Math.min(100, Math.round(ratio * 100))}%`;

                    return (
                      <View key={category.id} style={styles.categoryRow}>
                        <View style={styles.categoryHeader}>
                          <View style={[styles.categoryCircle, { backgroundColor: category.circleBg }]}>
                            {category.iconType === 'sounds' ? (
                              <Ionicons name="musical-notes" size={18} color="#FFFFFF" />
                            ) : category.iconType === 'words' ? (
                              <Text style={styles.categoryAaText}>Aa</Text>
                            ) : category.iconType === 'phrases' ? (
                              <Text style={styles.categoryQuotesText}>❝❞</Text>
                            ) : (
                              <Ionicons name="clipboard" size={17} color="#FFFFFF" />
                            )}
                          </View>
                          <Text style={styles.categoryName}>{category.name}</Text>
                          <Text style={styles.categoryRatio}>
                            {category.completedCount}/{category.totalCount}
                          </Text>
                        </View>
                        <View style={styles.progressTrackContainer}>
                          {category.completedCount > 0 && (
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  width: fillPercent as any,
                                  backgroundColor: category.barColor,
                                },
                              ]}
                            />
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={styles.therapistButton}
                activeOpacity={0.85}
                onPress={() => router.push('/parent-therapist-feedback' as any)}
                accessibilityRole="button"
                accessibilityLabel="View therapist feedback module"
              >
                <View style={styles.therapistIconWrapper}>
                  <Ionicons name="person" size={22} color="#0D68AC" />
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={13}
                    color="#0D68AC"
                    style={styles.therapistBubbleOverlay}
                  />
                </View>
                <Text style={styles.therapistButtonText}>Therapist Feedback</Text>
              </TouchableOpacity>
            </ScrollView>

            <ParentBottomNav activeTab="progress" />
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
  mainContainerTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
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

  /* Checkbox Filter Section */
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 6,
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

  /* Filter Checkbox Dropdown */
  filterBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 25,
  },
  filterDropdownCard: {
    position: 'absolute',
    top: 48,
    left: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#D4E7F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 35,
    minWidth: 195,
  },
  filterDropdownTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 12,
    color: '#7C93A8',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  checkboxLabel: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 14,
    color: '#4B6780',
  },
  checkboxLabelActive: {
    fontFamily: 'SourGummy-Bold',
    color: '#0D68AC',
  },
  checkboxDivider: {
    height: 1,
    backgroundColor: '#EDF4F9',
    marginVertical: 4,
  },

  /* Scrollable Content */
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
    gap: 14,
  },

  /* 1. Two Hero Cards (Side-by-side 50/50 Grid) */
  heroCardsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  heroCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#E2F0FA',
    shadowColor: '#0D68AC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
    minHeight: 138,
  },
  heroCardNumber: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 40,
    color: '#0D68AC',
    lineHeight: 44,
    textAlign: 'center',
    includeFontPadding: false,
  },
  heroCardTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 13,
    color: '#F5A623',
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 10,
    width: '100%',
    letterSpacing: 0.1,
    includeFontPadding: false,
  },
  heroCardSubtext: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 12,
    color: '#7C93A8',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 6,
    width: '100%',
    includeFontPadding: false,
  },

  /* 2. Level Progress Section */
  levelProgressSection: {
    marginTop: 2,
  },
  levelProgressTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 17,
    color: '#0D68AC',
    marginBottom: 8,
  },
  levelProgressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E2F0FA',
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#0D68AC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
    gap: 14,
  },
  categoryRow: {
    gap: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryAaText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  categoryQuotesText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  categoryName: {
    flex: 1,
    fontFamily: 'SourGummy-Bold',
    fontSize: 15,
    color: '#0D68AC',
  },
  categoryRatio: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 13,
    color: '#0D68AC',
  },
  progressTrackContainer: {
    height: 10,
    backgroundColor: '#F0F6FA',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#C8DEF0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },

  /* 3. Primary Action Button: "Therapist Feedback" */
  therapistButton: {
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
    marginBottom: 8,
    gap: 10,
  },
  therapistIconWrapper: {
    marginRight: 2,
    position: 'relative',
    width: 28,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  therapistBubbleOverlay: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  therapistButtonText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 18,
    color: '#0D68AC',
  },
});