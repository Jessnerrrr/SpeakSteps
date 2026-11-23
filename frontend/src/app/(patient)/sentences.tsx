import { ListPagination, useListPagination } from '@/components/list-pagination';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ChildScreenFrame, childScreenColors as playColors } from '@/components/child-screen-frame';
import { useFonts } from 'expo-font';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import {
  BackHandler,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
} from 'react-native';
import { ChildBottomNav } from '@/components/child-bottom-nav';
import { PatientPressable } from '@/components/patient-pressable';
import { NotificationBellButton } from '@/components/notification-popover';
import { GrownUpCheckModal } from '@/components/grown-up-check-modal';
import { SignOutConfirmModal } from '@/components/sign-out-confirm-modal';
import { useAssignedActivities } from '@/data/assigned-activities';
import { practiceLevels } from '@/data/practice-levels';
import { practiceLevelIcons } from '@/components/adventure-icon';
import { BuddyStore } from '@/data/buddy-store';
import { usePatientLearning } from '@/components/patient/PatientLearningProvider';
import { getPracticeItems } from '@/services/user-api';
import type { Language } from '@/types/sentences';

const playLanguages: Language[] = ['English', 'Tagalog'];
const activitiesPerPage = 4;
type PracticeItem = Awaited<ReturnType<typeof getPracticeItems>>[number];

function ActivityPages<T>({ items, renderActivity }: {
  items: readonly T[];
  renderActivity: (item: T) => ReactNode;
}) {
  const pagination = useListPagination(items.length, activitiesPerPage, '');

  return (
    <>
      {items.slice(pagination.start, pagination.end).map(renderActivity)}
      <ListPagination {...pagination} total={items.length} noun="activities" />
    </>
  );
}

export default function SentencesScreen() {
  const assignedActivities = useAssignedActivities().filter((item) => item.linked);
  const buddy = useSyncExternalStore(BuddyStore.subscribe, BuddyStore.getActiveBuddy, BuddyStore.getActiveBuddy);
  const { progress } = usePatientLearning();
  const submissions = progress?.recentSubmissions ?? [];
  const [practiceItems, setPracticeItems] = useState<PracticeItem[]>([]);
  const [practiceItemsError, setPracticeItemsError] = useState('');
  const [language, setLanguage] = useState<Language>('English');
  const params = useLocalSearchParams<{ category?: string; level?: string }>();
  const requestedLevel = params.level === 'Isolation' ? 'Sound' : params.level;
  const level = practiceLevels.find((option) => option === requestedLevel)
    ?? practiceLevels.find((option) => option.toLowerCase() === params.category)
    ?? 'Sound';
  const category = level === 'Sound' ? 'sounds' : level.toLowerCase();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGrownUpModalVisible, setIsGrownUpModalVisible] = useState(false);
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);

  useEffect(() => {
    let active = true;
    setPracticeItemsError('');
    void getPracticeItems({ language }).then((items) => {
      if (active) setPracticeItems(items);
    }).catch((loadError) => {
      if (active) setPracticeItemsError(loadError instanceof Error ? loadError.message : 'Could not load practice activities.');
    });
    return () => { active = false; };
  }, [language]);

  // FIXED FONT PATH: 3 levels up to reach root assets folder
  const [fontsLoaded] = useFonts({
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  // Handle back button: explicitly returns to the Child Dashboard (/patient-dashboard)
  const handleBack = () => {
    router.replace('/patient-dashboard' as any);
  };

  // Intercept hardware back button on Android so it safely remains in Child Mode
  useFocusEffect(useCallback(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );
    return () => subscription.remove();
  }, []));

  if (!fontsLoaded) return null;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ChildScreenFrame>
        <View style={styles.topHeader}>
          <Text accessibilityRole="header" style={styles.headerTitle}>Play</Text>

          <View style={styles.headerRightActions}>
            <NotificationBellButton
              audience="child"
              onBeforeOpen={() => setIsMenuOpen(false)}
            />

            <TouchableOpacity
              style={styles.menuButton}
              accessibilityRole="button"
              accessibilityLabel={isMenuOpen ? 'Close menu' : 'Open menu'}
              accessibilityState={{ expanded: isMenuOpen }}
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

        {isMenuOpen && (
          <>
            <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
              <View style={styles.menuBackdrop} />
            </TouchableWithoutFeedback>

            <View style={styles.menuDropdownCard}>
              <TouchableOpacity
                style={styles.menuItemRow}
                activeOpacity={0.8}
                onPress={() => {
                  setIsMenuOpen(false);
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

              <View style={styles.menuDivider} />

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
        <View style={styles.centerWrapper}>
          <ScrollView contentContainerStyle={styles.grid}>
              <View style={styles.contentHeader}>
                <View style={styles.playIntro}>
                  <View style={styles.introCopy}>
                    <Text accessibilityRole="header" style={styles.pageTitle}>Let’s practice!</Text>
                    <Text style={styles.introText}>Your buddy is ready!</Text>
                  </View>
                  <Image source={buddy.image} style={styles.introBuddy} contentFit="contain" />
                </View>
                <Text style={styles.controlLabel}>Language</Text>
                <View style={styles.languageRow}>
                  {playLanguages.map((option) => (
                    <PatientPressable key={option} accessibilityState={{ selected: option === language }}
                      onPress={() => setLanguage(option)} style={[styles.languageTab, option === language && styles.languageActive]}>
                      <Text style={[styles.categoryText, option === language && styles.languageActiveText]}>{option}</Text>
                    </PatientPressable>
                  ))}
                </View>
                <Text style={styles.controlLabel}>Practice level</Text>
                <View style={styles.categoryRow}>
                  {practiceLevels.map((option) => {
                    const selected = option === level;
                    return (
                      <PatientPressable key={option} accessibilityState={{ selected }} onPress={() => router.setParams({ level: option })} style={[styles.categoryTab, selected && styles.categoryTabActive]}>
                        <Ionicons name={practiceLevelIcons[option]} size={18} color={selected ? '#0865AD' : '#567F9A'} />
                        <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>{option}</Text>
                      </PatientPressable>
                    );
                  })}
                </View>
                {assignedActivities.some((item) => item.linked) && (
                  <View style={styles.librarySection}>
                    <Text style={styles.controlLabel}>Assigned to you</Text>
                    <ActivityPages items={assignedActivities} renderActivity={(item) => (
                      <PatientPressable key={item.id} accessibilityLabel={[item.title, item.level, item.submitted ? 'Submitted' : item.dueDate && 'Due ' + item.dueDate].filter(Boolean).join(', ')} style={styles.libraryCard}
                        onPress={() => router.push({ pathname: '/practice', params: { activityId: item.id, linkedAssignment: 'true', category: item.category.toLowerCase(), level: item.level } })}>
                        <View style={styles.soundBadge}><Ionicons name="clipboard" size={20} color="#0865AD" /></View>
                        <Text numberOfLines={1} style={styles.libraryTitle}>{item.title}</Text>
                        <Text numberOfLines={1} style={styles.libraryMeta}>{item.submitted ? 'Submitted' : item.dueDate ? 'Due ' + item.dueDate.slice(0, 5) : item.level}</Text>
                        <Ionicons name="chevron-forward" size={18} color="#0D68AC" />
                      </PatientPressable>
                    )} />
                  </View>
                )}
                <View style={styles.librarySection}>
                  <Text accessibilityRole="header" style={styles.sectionTitle}>Pick an activity</Text>
                  <ActivityPages key={language + ':' + level}
                    items={practiceItems} renderActivity={(item) => {
                    const earned = submissions.some((entry) => entry.practiceItemId === item.id);
                    const title = level === 'Sentences'
                      ? item.sentenceText || item.syllable || item.sound
                      : level === 'Syllables'
                        ? item.syllable || item.sound
                        : item.sound;
                    return <PatientPressable key={item.id} accessibilityLabel={title + (earned ? ', submitted' : '')} style={styles.libraryCard}
                      onPress={() => router.push({ pathname: '/practice', params: { practiceItemId: item.id, category, level, sound: item.sound, syllable: item.syllable, position: item.position, language: item.language } })}>
                      <View style={styles.soundBadge}><Text style={styles.soundText}>{item.sound}</Text></View>
                      <Text numberOfLines={1} style={styles.libraryTitle}>{title}</Text>
                      {earned && <Ionicons name="star" size={17} color="#AD6A09" />}
                      <View style={styles.playBadge}><Ionicons name="play" size={14} color="#0865AD" /></View>
                    </PatientPressable>;
                  }} />
                  {practiceItemsError ? <Text style={styles.libraryMeta}>{practiceItemsError}</Text> : null}
                  {!practiceItemsError && practiceItems.length === 0 ? <Text style={styles.libraryMeta}>No practice activities are available yet.</Text> : null}
                </View>
              </View>
          </ScrollView>
        </View>

        {/* Global Child Bottom Navigation Bar */}
        <ChildBottomNav activeTab="play" />
      </ChildScreenFrame>

      <GrownUpCheckModal
        visible={isGrownUpModalVisible}
        onClose={() => setIsGrownUpModalVisible(false)}
        onSuccess={() => {
          setIsGrownUpModalVisible(false);
          router.push('/parent-dashboard' as any);
        }}
      />

      <SignOutConfirmModal
        visible={isSignOutModalVisible}
        onClose={() => setIsSignOutModalVisible(false)}
        onConfirm={() => {
          setIsSignOutModalVisible(false);
          router.replace('/patient-login' as any);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  librarySection: { gap: 8 },
  libraryCard: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 9, borderRadius: 16, borderWidth: 1, borderBottomWidth: 2, borderColor: '#BBD9EC', backgroundColor: '#FFFFFF' },
  soundBadge: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#DFEFF9', alignItems: 'center', justifyContent: 'center' },
  soundText: { fontFamily: 'SourGummy-Bold', color: '#0865AD', fontSize: 18 },
  playBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EAF4FA', alignItems: 'center', justifyContent: 'center' },
  grid: { paddingHorizontal: 16, paddingBottom: 30 },
  libraryTitle: { flex: 1, minWidth: 0, fontFamily: 'SourGummy-Bold', fontSize: 16, color: '#183B56' },
  libraryMeta: { flexShrink: 1, maxWidth: '36%', color: '#436780', fontFamily: 'SourGummy-Medium', fontSize: 13 },
  // Tablet Responsive Constraint

  /* Top Header */
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: playColors.canvas,
  },
  headerTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 26,
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

  centerWrapper: { flex: 1 },
  contentHeader: {
    width: '100%',
    paddingTop: 12,
  },
  playIntro: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, backgroundColor: '#D5EAF7', paddingHorizontal: 14, paddingVertical: 8, marginBottom: 14 },
  introCopy: { flex: 1, minWidth: 0 },
  introBuddy: { width: 60, height: 60 },
  introText: { color: '#365F7C', fontFamily: 'SourGummy-Medium', fontSize: 15 },
  pageTitle: {
    color: '#0865AD',
    fontFamily: 'SourGummy-Bold',
    fontSize: 22,
    lineHeight: 28,
  },
  sectionTitle: { color: '#0865AD', fontFamily: 'SourGummy-Bold', fontSize: 19 },
  controlLabel: {
    color: '#0865AD',
    fontSize: 15,
    fontFamily: 'SourGummy-Bold',
    marginBottom: 6,
  },

  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  languageRow: { flexDirection: 'row', gap: 4, backgroundColor: '#D5EAF7', padding: 4, borderRadius: 13, marginBottom: 14 },
  languageTab: { flex: 1, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  categoryTab: { flexGrow: 1, minWidth: 84, minHeight: 44, flexDirection: 'row', gap: 4, borderWidth: 1, borderColor: '#D4E7F4', borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 5 },
  categoryTabActive: { backgroundColor: '#D5EAF7', borderColor: '#81B9DF' },
  languageActive: { backgroundColor: '#0865AD' },
  languageActiveText: { color: '#FFFFFF', fontFamily: 'SourGummy-Bold' },
  categoryText: { fontFamily: 'SourGummy-Medium', fontSize: 13, color: '#365F7C', textAlign: 'center' },
  categoryTextActive: { fontFamily: 'SourGummy-Bold', color: '#0865AD' },

});
