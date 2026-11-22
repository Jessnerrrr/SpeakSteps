import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ChildScreenFrame, childScreenColors as playColors } from '@/components/child-screen-frame';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  BackHandler,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { ChildBottomNav } from '@/components/child-bottom-nav';
import { NotificationBellButton } from '@/components/notification-popover';
import { GrownUpCheckModal } from '@/components/grown-up-check-modal';
import { SignOutConfirmModal } from '@/components/sign-out-confirm-modal';
import { sentences } from '@/data/sentences';
import type { Language, Position, Sentence } from '@/types/sentences';
import { POSITIONS } from '@/types/sentences';


// ─── Language Toggle ──────────────────────────────────────────────────────────
function LanguageToggle({
  value,
  onChange,
}: {
  value: Language;
  onChange: (l: Language) => void;
}) {
  const langs: Language[] = ['English', 'Tagalog'];
  return (
    <View style={styles.toggleRow}>
      {langs.map((l) => (
        <TouchableOpacity
          key={l}
          style={[styles.toggleBtn, value === l && styles.toggleBtnActive]}
          onPress={() => onChange(l)}
        >
          <Text style={[styles.toggleText, value === l && styles.toggleTextActive]}>
            {l}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Position Tabs ────────────────────────────────────────────────────────────
function PositionTabs({
  value,
  onChange,
}: {
  value: Position;
  onChange: (p: Position) => void;
}) {
  return (
    <View style={styles.tabRow}>
      {POSITIONS.map((p) => (
        <TouchableOpacity
          key={p}
          style={[styles.tab, value === p && styles.tabActive]}
          onPress={() => onChange(p)}
        >
          <Text style={[styles.tabText, value === p && styles.tabTextActive]}>
            {p}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ stars }: { stars: 0 | 1 | 2 | 3 }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3].map((i) => (
        <Ionicons key={i} name={i <= stars ? 'star' : 'star-outline'} size={17} color={i <= stars ? '#C58216' : '#527A96'} />
      ))}
    </View>
  );
}

// ─── Sentence Card ────────────────────────────────────────────────────────────
function SentenceCard({
  sentence,
  onSelect,
}: {
  sentence: Sentence;
  onSelect: (s: Sentence) => void;
}) {
  const scale = useSharedValue(1);
  const motion = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.cardSlot, motion]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Practice ${sentence.sound}, ${sentence.syllable}, ${sentence.stars} out of 3 stars`}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPressIn={() => { scale.value = withTiming(0.96, { duration: 70 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 16, stiffness: 320 }); }}
        onPress={() => onSelect(sentence)}
      >
        <View style={styles.cardInner}>
          <Text style={styles.cardSound}>{sentence.sound}</Text>
          <Text style={styles.cardSyllable}>{sentence.syllable}</Text>
        </View>
        <View style={styles.cardFooter}>
          <StarRating stars={sentence.stars} />
          <View style={styles.cardPlay}>
            <Ionicons name="play" size={15} color={playColors.accent} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SentencesScreen() {
  const [language, setLanguage] = useState<Language>('English');
  const [position, setPosition] = useState<Position>('Initial');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGrownUpModalVisible, setIsGrownUpModalVisible] = useState(false);
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);

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
  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) return null;

  const items = sentences[language][position];

  const handleSelect = (sentence: Sentence) => {
    router.push({
      pathname: '/practice',
      params: {
        sentenceId: sentence.id,
        sound: sentence.sound,
        syllable: sentence.syllable,
        stars: sentence.stars,
        position,
      },
    } as any);
  };

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
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.gridRow}
            ListHeaderComponent={
              <View style={styles.contentHeader}>
                <Text accessibilityRole="header" style={styles.pageTitle}>Pick a sound to practice</Text>
                <Text style={styles.controlLabel}>Language</Text>
                <LanguageToggle value={language} onChange={setLanguage} />
                <Text style={styles.controlLabel}>Sound position</Text>
                <PositionTabs value={position} onChange={setPosition} />
              </View>
            }
            renderItem={({ item }) => (
              <SentenceCard sentence={item} onSelect={handleSelect} />
            )}
          />
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
  pageTitle: {
    color: '#0865AD',
    fontFamily: 'SourGummy-Bold',
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 16,
  },
  controlLabel: {
    color: '#0865AD',
    fontSize: 15,
    fontFamily: 'SourGummy-Bold',
    marginBottom: 6,
  },

  toggleRow: {
    flexDirection: 'row',
    backgroundColor: playColors.surface,
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  toggleBtn: { flex: 1, minHeight: 44, paddingVertical: 8, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  toggleBtnActive: { backgroundColor: playColors.accent },
  toggleText: { fontFamily: 'SourGummy-Bold', color: playColors.accent, fontSize: 16 },
  toggleTextActive: { color: playColors.surface },

  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  tab: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: playColors.surface,
  },
  tabActive: { backgroundColor: playColors.accent },
  tabText: { fontFamily: 'SourGummy-Bold', color: playColors.accent, fontSize: 15 },
  tabTextActive: { color: playColors.surface },

  grid: { paddingHorizontal: 16, paddingBottom: 30 },
  gridRow: { gap: 12, marginBottom: 12 },

  cardSlot: { flex: 1, maxWidth: '50%' },
  card: {
    flex: 1,
    backgroundColor: playColors.surface,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBE6F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
  },
  cardPressed: { backgroundColor: '#EDF7FE' },
  cardInner: { marginBottom: 12 },
  cardSound: { fontFamily: 'SourGummy-Bold', fontSize: 32, lineHeight: 38, color: playColors.accent },
  cardSyllable: { fontFamily: 'SourGummy-Medium', fontSize: 18, lineHeight: 23, color: '#465D70' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 },
  cardPlay: { width: 30, height: 30, borderRadius: 10, backgroundColor: playColors.canvas, alignItems: 'center', justifyContent: 'center' },
  starRow: { flexDirection: 'row', gap: 2 },
});
