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

// FIXED IMPORTS: Changed absolute aliases to relative paths (2 levels up)
import { BUDDY_ROSTER, BuddyStore, Buddy } from '../../data/buddy-store';
import { ChildBottomNav } from '../../components/child-bottom-nav';
import { GrownUpCheckModal } from '../../components/grown-up-check-modal';
import { SignOutConfirmModal } from '../../components/sign-out-confirm-modal';
import { ChildProfileStore, ChildProfile } from '../../data/child-profile-store'; // Adding this since it was imported in the original code

export default function PickBuddyScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  // FIXED FONT PATHS: 3 levels up to reach root assets folder
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  const [activeBuddy, setActiveBuddy] = useState<Buddy>(BuddyStore.getActiveBuddy());
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

  if (!fontsLoaded) return null;

  const buddyList = Object.values(BUDDY_ROSTER);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safeArea}>
        {/* =========================================================================
            OUTER WATERMARKED LIGHT BLUE CANVAS
            ========================================================================= */}
        {/* FIXED IMAGE PATH (3 levels up) */}
        <ImageBackground
          source={require('../../../assets/images/split-bg.png')}
          style={styles.background}
          imageStyle={{ opacity: 0.25 }}
          resizeMode="cover"
        >
          {/* =========================================================================
              FLOATING MAIN BUDDY CARD CONTAINER (Responsive Max Width)
              ========================================================================= */}
          <View style={[styles.buddyCardContainer, isTablet && styles.buddyCardTablet]}>
            {/* TOP HEADER: "Pick my buddy", BELL & HAMBURGER */}
            <View style={styles.topHeader}>
              <Text style={styles.headerTitle}>Pick my buddy</Text>

              <View style={styles.headerRightActions}>
                {/* Notification Bell Circle */}
                <TouchableOpacity
                  style={styles.bellButton}
                  activeOpacity={0.7}
                  onPress={() => console.log('Notifications')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="notifications-outline" size={16} color="#F5A623" />
                </TouchableOpacity>

                {/* Triple Bar Hamburger / Close Menu Button */}
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
              {/* =====================================================================
                  ACTIVE BUDDY SPOTLIGHT HERO CARD (Exact 3-Stop Sky-to-Cyan Gradient)
                  ===================================================================== */}
              <LinearGradient
                colors={['#106AB0', '#2A8AC8', '#4DB3E9']}
                locations={[0, 0.45, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.spotlightCard}
              >
                {/* Character Spotlight Illustration */}
                <View style={styles.spotlightImageContainer}>
                  <Image
                    source={activeBuddy.image}
                    style={[
                      styles.spotlightImage,
                      activeBuddy.id !== 'chirpy' && styles.spotlightImageOther,
                    ]}
                    contentFit="contain"
                  />
                </View>

                {/* Character Greeting Headline */}
                <Text style={styles.spotlightGreetingText}>
                  {activeBuddy.spotlightGreeting}
                </Text>

                {/* Speech Bubble Callout Button */}
                <View style={styles.speechBubbleWrapper}>
                  <View style={styles.speechBubbleArrow} />
                  <View style={styles.speechBubbleCallout}>
                    <Text style={styles.speechBubbleCalloutText}>
                      {activeBuddy.spotlightCta}
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              {/* =====================================================================
                  2 x 3 ANIMAL BUDDY SELECTION GRID
                  ===================================================================== */}
              <View style={styles.buddyGrid}>
                {buddyList.map((buddy) => {
                  const isSelected = activeBuddy.id === buddy.id;
                  return (
                    <TouchableOpacity
                      key={buddy.id}
                      activeOpacity={0.85}
                      style={[
                        styles.buddyTile,
                        {
                          backgroundColor: buddy.cardBgColor,
                          borderColor: isSelected ? '#0D68AC' : buddy.cardBorderColor,
                          borderBottomColor: isSelected ? '#084878' : buddy.cardDepthColor,
                        },
                        isSelected && styles.buddyTileSelected,
                      ]}
                      onPress={() => BuddyStore.setActiveBuddy(buddy.id)}
                    >
                      {/* Selection Checkmark Badge */}
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        </View>
                      )}

                      {/* Character Artwork Thumbnail */}
                      <View style={styles.tileImageWrapper}>
                        <Image
                          source={buddy.image}
                          style={[
                            styles.tileImage,
                            buddy.id !== 'chirpy' && styles.tileImageOther,
                          ]}
                          contentFit="contain"
                        />
                      </View>

                      {/* Buddy Name & Species */}
                      <Text
                        style={[
                          styles.tileNameText,
                          isSelected && styles.tileNameTextSelected,
                        ]}
                      >
                        {buddy.name}
                      </Text>
                      <Text style={styles.tileSpeciesText}>{buddy.species}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* INTEGRATED BOTTOM TAB BAR (Buddy Tab Active) */}
            <ChildBottomNav activeTab="buddy" />
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

  /* White Buddy Outer Floating Card */
  buddyCardContainer: {
    flex: 1,
    width: '100%',
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
  },
  /* Responsive Constraint for Tablets */
  buddyCardTablet: {
    maxWidth: 600,
    alignSelf: 'center',
  },

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
  headerTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 24,
    color: '#0D68AC',
    letterSpacing: -0.3,
    flexShrink: 1,
    marginRight: 14,
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
  },

  /* Main Scroll Content */
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 16,
  },

  /* Spotlight Hero Card */
  spotlightCard: {
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0865AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 5,
  },
  spotlightImageContainer: {
    width: 120,
    height: 105,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  spotlightImage: {
    width: '100%',
    height: '100%',
  },
  spotlightImageOther: {
    transform: [{ scale: 1.22 }],
  },
  spotlightGreetingText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  speechBubbleWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  speechBubbleArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
    marginBottom: -1,
    zIndex: 2,
  },
  speechBubbleCallout: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  speechBubbleCalloutText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 14,
    color: '#0D68AC',
    textAlign: 'center',
  },

  /* 2 x 3 Buddy Selection Grid */
  buddyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  buddyTile: {
    width: '48%', // Automatically scales based on container width
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderBottomWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  buddyTileSelected: {
    borderWidth: 3,
    borderBottomWidth: 6,
    shadowColor: '#0865AD',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#0D68AC',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 5,
  },
  tileImageWrapper: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'visible',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileImageOther: {
    transform: [{ scale: 1.20 }],
  },
  tileNameText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 14,
    color: '#0D68AC',
    letterSpacing: 0.5,
  },
  tileNameTextSelected: {
    color: '#084878',
  },
  tileSpeciesText: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 10,
    color: '#7C8B9E',
    marginTop: 1,
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
});