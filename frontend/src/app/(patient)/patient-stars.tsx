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
  useWindowDimensions,
} from 'react-native';

// FIXED IMPORTS: 2 levels up to reach src/components and src/data
import { MOCK_STARS_DATA } from '../../data/stars-mock';
import { ChildBottomNav } from '../../components/child-bottom-nav';
import { GrownUpCheckModal } from '../../components/grown-up-check-modal';
import { SignOutConfirmModal } from '../../components/sign-out-confirm-modal';

export default function PatientStarsScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  // FIXED FONT PATHS: 3 levels up to reach root assets folder
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
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
        {/* FIXED IMAGE PATH: 3 levels up to reach root assets */}
        <ImageBackground source={require('../../../assets/images/split-bg.png')} style={styles.background} imageStyle={{ opacity: 0.25 }} resizeMode="cover">
          
          <View style={[styles.starsCard, isTablet && styles.starsCardTablet]}>
            <View style={styles.topHeader}>
              <Text style={styles.headerTitle}>My Stars</Text>
              <View style={styles.headerRightActions}>
                <TouchableOpacity style={styles.bellButton} activeOpacity={0.7} onPress={() => console.log('Notifications')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="notifications-outline" size={16} color="#F5A623" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuButton} activeOpacity={0.7} onPress={() => setIsMenuOpen(!isMenuOpen)}>
                  <Ionicons name={isMenuOpen ? 'close' : 'menu'} size={34} color="#0D68AC" />
                </TouchableOpacity>
              </View>
            </View>

            {isMenuOpen && (
              <>
                <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
                  <View style={styles.menuBackdrop} />
                </TouchableWithoutFeedback>

                <View style={styles.menuDropdownCard}>
                  <TouchableOpacity style={styles.menuItemRow} activeOpacity={0.8} onPress={() => { setIsMenuOpen(false); setIsGrownUpModalVisible(true); }}>
                    {/* FIXED IMAGE PATH */}
                    <Image source={require('../../../assets/images/parent-mode-icon.png')} style={styles.menuParentIcon} contentFit="cover" />
                    <Text style={styles.menuItemText}>Parent mode</Text>
                    <Ionicons name="chevron-forward" size={16} color="#F5A623" />
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />

                  <TouchableOpacity style={styles.menuItemRow} activeOpacity={0.8} onPress={() => { setIsMenuOpen(false); setIsSignOutModalVisible(true); }}>
                    <View style={styles.logoutIconBadge}>
                      <Ionicons name="log-out-outline" size={16} color="#FFFFFF" />
                    </View>
                    <Text style={styles.menuItemText}>Sign out</Text>
                    <Ionicons name="chevron-forward" size={16} color="#F5A623" />
                  </TouchableOpacity>
                </View>
              </>
            )}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <LinearGradient colors={['#106AB0', '#2A8AC8', '#4DB3E9']} locations={[0, 0.45, 1]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.collectingStarsCard}>
                <Text style={styles.collectingStarsTitle}>COLLECTING STARS</Text>
                <View style={styles.starNumberRow}>
                  <Text style={styles.starNumberText}>{data.totalStarsEarned}</Text>
                  {/* FIXED IMAGE PATH */}
                  <Image source={require('../../../assets/images/star-3d.png')} style={styles.starAssetImage} contentFit="contain" />
                </View>
                <View style={styles.capsuleProgressTrack}>
                  <View style={[styles.capsuleProgressFill, { width: `${Math.min(totalProgressPercentage, 100)}%` }]} />
                </View>
                <Text style={styles.encouragementSubtext}>{data.encouragementText}</Text>
              </LinearGradient>

              <View style={styles.motivationBannerRow}>
                {/* FIXED IMAGE PATH */}
                <Image source={require('../../../assets/images/trophy.png')} style={styles.trophyIconImage} contentFit="contain" />
                <Text style={styles.motivationBannerText}>Win stars by practicing!</Text>
              </View>

              <View style={styles.categoriesList}>
                {data.categories.map((cat) => {
                  const catPercentage = (cat.completed / cat.total) * 100;
                  return (
                    <View key={cat.id} style={styles.categoryCard}>
                      <View style={styles.categoryCardHeader}>
                        <View style={[styles.categoryBadge, { backgroundColor: cat.badgeBgColor }]}>
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
                      <View style={styles.categoryProgressTrack}>
                        <View style={[styles.categoryProgressFill, { width: `${Math.min(catPercentage, 100)}%` }]} />
                      </View>
                      <Text style={styles.categoryCounterText}>{cat.completed}/{cat.total} done</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            <ChildBottomNav activeTab="stars" />
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
  starsCard: { flex: 1, width: '100%', backgroundColor: '#E7F2FA', borderRadius: 36, overflow: 'hidden', borderWidth: 1.5, borderColor: '#C7DFEE', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 6 },
  
  // Tablet Responsive Constraint
  starsCardTablet: { maxWidth: 600, alignSelf: 'center' },
  
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, backgroundColor: '#E7F2FA' },
  headerTitle: { fontFamily: 'SourGummy-Bold', fontSize: 30, color: '#0D68AC', letterSpacing: -0.5 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellButton: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: '#FBD27C', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1.5 }, shadowOpacity: 0.08, shadowRadius: 2.5, elevation: 2 },
  menuButton: { padding: 2 },

  // Fixed absoluteFillObject TS Error
  menuBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.15)', zIndex: 30 },
  
  menuDropdownCard: { position: 'absolute', top: 66, right: 18, backgroundColor: '#FFFFFF', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 8, borderWidth: 1.5, borderColor: '#D4E7F5', zIndex: 40, minWidth: 190 },
  menuItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4, gap: 8 },
  menuParentIcon: { width: 26, height: 26, borderRadius: 13 },
  menuItemText: { flex: 1, fontFamily: 'SourGummy-Bold', fontSize: 13, color: '#0D68AC' },
  menuDivider: { height: 1, backgroundColor: '#EDF4F9', marginVertical: 4 },
  logoutIconBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#0D68AC', alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 16 },
  collectingStarsCard: { borderRadius: 22, paddingVertical: 18, paddingHorizontal: 20, alignItems: 'center', marginBottom: 14, shadowColor: '#0865AD', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 6, elevation: 5 },
  collectingStarsTitle: { fontFamily: 'SourGummy-Bold', fontSize: 20, color: '#FFFFFF', letterSpacing: 0.8, marginBottom: 6 },
  starNumberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10, gap: 3 },
  starNumberText: { fontFamily: 'SourGummy-Bold', fontSize: 44, color: '#FFFFFF' },
  starAssetImage: { width: 42, height: 42, marginTop: -2 },
  capsuleProgressTrack: { width: '100%', height: 18, backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', padding: 3, marginBottom: 8 },
  capsuleProgressFill: { height: '100%', backgroundColor: '#F5A623', borderRadius: 10 },
  encouragementSubtext: { fontFamily: 'SourGummy-Bold', fontSize: 13, color: '#FFFFFF', textShadowColor: 'rgba(0, 0, 0, 0.12)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },

  motivationBannerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 12, paddingHorizontal: 6, gap: 10 },
  trophyIconImage: { width: 32, height: 32 },
  motivationBannerText: { fontFamily: 'SourGummy-Bold', fontSize: 18, color: '#0D68AC' },

  categoriesList: { gap: 10, marginBottom: 6 },
  categoryCard: { backgroundColor: '#FFFFFF', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#C7DFEE', borderBottomWidth: 4, borderBottomColor: '#B6D7F2', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  categoryCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  categoryBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 2, elevation: 2 },
  categoryAaText: { fontFamily: 'SourGummy-Bold', fontSize: 14, color: '#FFFFFF' },
  categoryQuotesText: { fontSize: 13, color: '#FFFFFF', fontWeight: 'bold' },
  categoryTitle: { fontFamily: 'SourGummy-Bold', fontSize: 15, color: '#0D68AC', marginLeft: 10 },
  categoryProgressTrack: { width: '100%', height: 10, backgroundColor: '#D8ECFA', borderRadius: 6, overflow: 'hidden', marginBottom: 6 },
  categoryProgressFill: { height: '100%', backgroundColor: '#F5A623', borderRadius: 6 },
  categoryCounterText: { fontFamily: 'SourGummy-Medium', fontSize: 10, color: '#8FA5B8', marginLeft: 2 },
});