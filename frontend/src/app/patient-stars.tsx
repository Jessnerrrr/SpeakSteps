import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
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

// MOCK DATA IMPORT:
// When ready for backend integration, replace MOCK_STARS_DATA with your API response hook
import { MOCK_STARS_DATA } from '@/data/stars-mock';
import { ChildBottomNav } from '@/components/child-bottom-nav';
import { GrownUpCheckModal } from '@/components/grown-up-check-modal';
import { SignOutConfirmModal } from '@/components/sign-out-confirm-modal';

export default function PatientStarsScreen() {
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../assets/SourGummy-Bold.ttf'),
  });

  const [data] = useState(MOCK_STARS_DATA);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGrownUpModalVisible, setIsGrownUpModalVisible] = useState(false);
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);

  if (!fontsLoaded) return null;

  const totalProgressPercentage =
    (data.totalActivitiesCompleted / data.totalActivitiesTarget) * 100;

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
              FLOATING MAIN STARS CARD CONTAINER (White sheet with soft blue tint)
              ========================================================================= */}
          <View style={styles.starsCard}>
            {/* TOP HEADER: "My Stars", BELL & HAMBURGER */}
            <View style={styles.topHeader}>
              <Text style={styles.headerTitle}>My Stars</Text>

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
                    <Image
                      source={require('../../assets/images/parent-mode-icon.png')}
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
                  "COLLECTING STARS" HERO CARD (Exact Reference Gradient: #106AB0 -> #4DB3E9)
                  ===================================================================== */}
              <LinearGradient
                colors={['#106AB0', '#2A8AC8', '#4DB3E9']}
                locations={[0, 0.45, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.collectingStarsCard}
              >
                <Text style={styles.collectingStarsTitle}>COLLECTING STARS</Text>

                {/* Star Count Row: Number + 3D Gold Star (tightened spacing) */}
                <View style={styles.starNumberRow}>
                  <Text style={styles.starNumberText}>{data.totalStarsEarned}</Text>
                  <Image
                    source={require('../../assets/images/star-3d.png')}
                    style={styles.starAssetImage}
                    contentFit="contain"
                  />
                </View>

                {/* Capsule Progress Bar Track */}
                <View style={styles.capsuleProgressTrack}>
                  <View
                    style={[
                      styles.capsuleProgressFill,
                      { width: `${Math.min(totalProgressPercentage, 100)}%` },
                    ]}
                  />
                </View>

                {/* Encouragement Subtitle */}
                <Text style={styles.encouragementSubtext}>
                  {data.encouragementText}
                </Text>
              </LinearGradient>

              {/* =====================================================================
                  MOTIVATIONAL BANNER ROW: Trophy + "Win stars by practicing!"
                  ===================================================================== */}
              <View style={styles.motivationBannerRow}>
                <Image
                  source={require('../../assets/images/trophy.png')}
                  style={styles.trophyIconImage}
                  contentFit="contain"
                />
                <Text style={styles.motivationBannerText}>
                  Win stars by practicing!
                </Text>
              </View>

              {/* =====================================================================
                  CATEGORIZED PROGRESS CARDS (Sounds, Words, Phrases, Sentences)
                  Uniform height, aligned icon badges, progress bars and counters
                  ===================================================================== */}
              <View style={styles.categoriesList}>
                {data.categories.map((cat) => {
                  const catPercentage = (cat.completed / cat.total) * 100;
                  return (
                    <View key={cat.id} style={styles.categoryCard}>
                      {/* Top Row: Icon Badge + Category Title */}
                      <View style={styles.categoryCardHeader}>
                        <View
                          style={[
                            styles.categoryBadge,
                            { backgroundColor: cat.badgeBgColor },
                          ]}
                        >
                          {cat.iconType === 'sounds' ? (
                            <Ionicons name="musical-notes" size={16} color="#FFFFFF" />
                          ) : cat.iconType === 'words' ? (
                            <Text style={styles.categoryAaText}>Aa</Text>
                          ) : cat.iconType === 'phrases' ? (
                            <Text style={styles.categoryQuotesText}>❝❞</Text>
                          ) : (
                            <Ionicons name="clipboard" size={15} color="#FFFFFF" />
                          )}
                        </View>
                        <Text style={styles.categoryTitle}>{cat.title}</Text>
                      </View>

                      {/* Middle Progress Track */}
                      <View style={styles.categoryProgressTrack}>
                        <View
                          style={[
                            styles.categoryProgressFill,
                            { width: `${Math.min(catPercentage, 100)}%` },
                          ]}
                        />
                      </View>

                      {/* Bottom Micro-Caption */}
                      <Text style={styles.categoryCounterText}>
                        {cat.completed}/{cat.total} done
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            {/* INTEGRATED BOTTOM TAB BAR (Stars Tab Active) */}
            <ChildBottomNav activeTab="stars" />
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

  /* White Stars Outer Floating Card */
  starsCard: {
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
    fontSize: 30,
    color: '#0D68AC',
    letterSpacing: -0.5,
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

  /* "COLLECTING STARS" Hero Card (Exact Sky-to-Cyan Gradient) */
  collectingStarsCard: {
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#0865AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 5,
  },
  collectingStarsTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  starNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 3, // Tightened gap between number and 3D star
  },
  starNumberText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 44,
    color: '#FFFFFF',
  },
  starAssetImage: {
    width: 42,
    height: 42,
    marginTop: -2,
  },
  capsuleProgressTrack: {
    width: '100%',
    height: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 3,
    marginBottom: 8,
  },
  capsuleProgressFill: {
    height: '100%',
    backgroundColor: '#F5A623',
    borderRadius: 10,
  },
  encouragementSubtext: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 13,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.12)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  /* Motivational Banner Row */
  motivationBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    paddingHorizontal: 6,
    gap: 10,
  },
  trophyIconImage: {
    width: 32,
    height: 32,
  },
  motivationBannerText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 18,
    color: '#0D68AC',
  },

  /* Categories Card List */
  categoriesList: {
    gap: 10,
    marginBottom: 6,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#C7DFEE',
    borderBottomWidth: 4, // 3D depth border
    borderBottomColor: '#B6D7F2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryAaText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  categoryQuotesText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  categoryTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 15,
    color: '#0D68AC',
    marginLeft: 10,
  },
  categoryProgressTrack: {
    width: '100%',
    height: 10,
    backgroundColor: '#D8ECFA',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  categoryProgressFill: {
    height: '100%',
    backgroundColor: '#F5A623',
    borderRadius: 6,
  },
  categoryCounterText: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 10,
    color: '#8FA5B8',
    marginLeft: 2,
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
});