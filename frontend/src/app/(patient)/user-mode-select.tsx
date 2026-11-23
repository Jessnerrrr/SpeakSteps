import { PatientPressable } from '@/components/patient-pressable';
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
  View,
  useWindowDimensions,
} from 'react-native';

import { ChildProfile, ChildProfileStore } from '../../data/child-profile-store';
import { GrownUpCheckModal } from '../../components/grown-up-check-modal';
import { SignOutConfirmModal } from '../../components/sign-out-confirm-modal';

export default function UserModeSelectScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  const [fontsLoaded] = useFonts({
    SourGummy: require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  const [childProfile, setChildProfile] = useState<ChildProfile>(ChildProfileStore.getProfile());
  const [isGrownUpModalVisible, setIsGrownUpModalVisible] = useState(false);
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = ChildProfileStore.subscribe((updated) => {
      setChildProfile(updated);
    });
    return unsubscribe;
  }, []);

  if (!fontsLoaded) return null;

  const handleSelectChildMode = () => {
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace('/patient-dashboard' as any);
  };

  const handleSelectParentMode = () => {
    setIsGrownUpModalVisible(false);
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace('/parent-dashboard' as any);
  };

  const handleConfirmSignOut = () => {
    setIsSignOutModalVisible(false);
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace('/patient-login' as any);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <ImageBackground
          source={require('../../../assets/images/split-bg.png')}
          style={styles.background}
          imageStyle={{ opacity: 0.28 }}
          resizeMode="cover"
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={[styles.mainWrapper, isTablet && styles.mainWrapperTablet]}>
              {/* =====================================================================
                  TOP HEADER ("Who is using?" Header)
                  ===================================================================== */}
              <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>Who is using?</Text>
                <Text style={styles.headerSubtitle}>Choose the mode you'll use.</Text>
              </View>

              {/* =====================================================================
                  MAIN FLOATING CARD CONTAINER
                  ===================================================================== */}
              <View style={styles.cardContainer}>
                {/* 1. CHILD MODE CARD (Soft Golden / Apricot) */}
                <PatientPressable
                  style={[styles.modeCard, styles.childCard]}
                  onPress={handleSelectChildMode}
                  accessibilityRole="button"
                  accessibilityLabel="Child Mode, Play and Practice"
                >
                  <View style={styles.avatarCircleChild}>
                    <Image
                      source={childProfile.avatar || require('../../../assets/images/child-avatar.png')}
                      style={styles.avatarImage}
                      contentFit="cover"
                    />
                  </View>

                  <Text style={styles.modeCardTitle}>Child Mode</Text>
                  <Text style={styles.modeCardSubtitle}>Play & Practice</Text>
                </PatientPressable>

                {/* 2. PARENT/GUARDIAN CARD (Soft Powder Blue) */}
                <PatientPressable
                  style={[styles.modeCard, styles.parentCard]}
                  onPress={() => setIsGrownUpModalVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Parent and Guardian Mode, Track practice and Monitor Children"
                >
                  <View style={styles.avatarCircleParent}>
                    <Image
                      source={require('../../../assets/images/parent-mode-icon.png')}
                      style={styles.avatarImage}
                      contentFit="cover"
                    />
                  </View>

                  <Text style={styles.modeCardTitle}>Parent/Guardian</Text>
                  <Text style={styles.modeCardSubtitle}>Track practice & Monitor Children</Text>
                </PatientPressable>
              </View>

              {/* =====================================================================
                  LOG OUT ACTION BUTTON
                  ===================================================================== */}
              <PatientPressable
                style={styles.logoutButton}
                onPress={() => setIsSignOutModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Log Out"
              >
                <Text style={styles.logoutButtonText}>Log Out</Text>
              </PatientPressable>
            </View>
          </ScrollView>

          <GrownUpCheckModal
            visible={isGrownUpModalVisible}
            onClose={() => setIsGrownUpModalVisible(false)}
            onSuccess={handleSelectParentMode}
          />
          <SignOutConfirmModal
            visible={isSignOutModalVisible}
            onConfirm={handleConfirmSignOut}
            onClose={() => setIsSignOutModalVisible(false)}
          />
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
  },
  mainWrapperTablet: {
    maxWidth: 460,
  },

  /* Header Block */
  headerRow: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 30,
    color: '#0D68AC',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  headerSubtitle: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 14,
    color: '#65829C',
    marginTop: 4,
  },

  /* Outer White Card Container */
  cardContainer: {
    backgroundColor: '#F3F9FE',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#CCE5F7',
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  /* Base Mode Card */
  modeCard: {
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  /* 1. Child Mode Card Colors */
  childCard: {
    backgroundColor: '#FFF2D6',
    borderColor: '#F6DA9C',
    borderBottomWidth: 4,
    borderBottomColor: '#ECC778',
    shadowColor: '#C4942A',
  },
  avatarCircleChild: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#6DB9ED',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },

  /* 2. Parent/Guardian Card Colors */
  parentCard: {
    backgroundColor: '#DDF0FF',
    borderColor: '#BEDDF7',
    borderBottomWidth: 4,
    borderBottomColor: '#9DC9EE',
    shadowColor: '#0D68AC',
  },
  avatarCircleParent: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#C8E6FE',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  modeCardTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 22,
    color: '#152538',
    marginTop: 14,
    textAlign: 'center',
  },
  modeCardSubtitle: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 13,
    color: '#657D94',
    marginTop: 3,
    textAlign: 'center',
  },

  /* Log Out Bottom Button */
  logoutButton: {
    backgroundColor: '#0D68AC',
    height: 52,
    borderRadius: 26,
    borderBottomWidth: 3.5,
    borderBottomColor: '#084877',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#0D68AC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  logoutButtonText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
