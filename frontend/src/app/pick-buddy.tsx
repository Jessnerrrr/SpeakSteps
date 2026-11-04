import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { BUDDY_ROSTER, BuddyStore, Buddy } from '@/data/buddy-store';
import { ChildBottomNav } from '@/components/child-bottom-nav';

export default function PickBuddyScreen() {
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../assets/fonts/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../assets/fonts/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../assets/fonts/SourGummy-Bold.ttf'),
  });

  const [activeBuddy, setActiveBuddy] = useState<Buddy>(BuddyStore.getActiveBuddy());

  useEffect(() => {
    const unsubscribe = BuddyStore.subscribe((updatedBuddy) => {
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
        <ImageBackground
          source={require('../../assets/images/split-bg.png')}
          style={styles.background}
          imageStyle={{ opacity: 0.25 }}
          resizeMode="cover"
        >
          {/* =========================================================================
              FLOATING MAIN BUDDY CARD CONTAINER (White sheet with soft blue tint)
              ========================================================================= */}
          <View style={styles.buddyCardContainer}>
            {/* TOP HEADER: "Pick my buddy", BELL & HAMBURGER */}
            <View style={styles.topHeader}>
              <Text style={styles.headerTitle}>Pick my buddy</Text>

              <View style={styles.headerRightActions}>
                {/* Notification Bell Circle */}
                <TouchableOpacity
                  style={styles.bellButton}
                  activeOpacity={0.7}
                  onPress={() => console.log('Notifications')}
                >
                  <Ionicons name="notifications-outline" size={20} color="#F5A623" />
                </TouchableOpacity>

                {/* Triple Bar Hamburger Menu */}
                <TouchableOpacity
                  style={styles.menuButton}
                  activeOpacity={0.7}
                  onPress={() => console.log('Menu')}
                >
                  <Ionicons name="menu" size={34} color="#0D68AC" />
                </TouchableOpacity>
              </View>
            </View>

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
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#FBD27C',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
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
    width: '48%',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderBottomWidth: 5, // 3D depth border
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
});

