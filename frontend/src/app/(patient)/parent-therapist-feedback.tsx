import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Image,
  SafeAreaView,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';

// FIXED IMPORTS: Using relative paths instead of @/
import { ParentBottomNav } from '../../components/parent-bottom-nav';
import { ParentHeader } from '../../components/parent-header';
import {
  MOCK_FEEDBACK_ITEMS,
  TherapistFeedbackItem,
} from '../../data/parent-progress-mock';

type FilterCategory = 'All' | 'Sounds' | 'Words' | 'Phrases' | 'Sentences';

interface TherapistAvatarProps {
  imageUri?: any;
  size?: number;
  style?: any;
}

export function TherapistAvatarPlaceholder({
  imageUri,
  size = 56,
  style,
}: TherapistAvatarProps) {
  if (imageUri) {
    return (
      <Image
        source={typeof imageUri === 'string' ? { uri: imageUri } : imageUri}
        style={[
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.28),
          },
          style,
        ]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.avatarPlaceholder,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.28),
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Therapist profile placeholder"
    >
      <Ionicons name="person" size={Math.round(size * 0.52)} color="#FFFFFF" />
    </View>
  );
}

export default function ParentTherapistFeedbackScreen() {
  const router = useRouter();

  // Responsive Hooks
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../assets/SourGummy-Bold.ttf'),
  });

  const [activeFilter, setActiveFilter] = useState<FilterCategory>('All');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const [selectedFeedback, setSelectedFeedback] = useState<TherapistFeedbackItem | null>(null);

  const filteredFeedback = useMemo(() => {
    if (activeFilter === 'All') return MOCK_FEEDBACK_ITEMS;
    return MOCK_FEEDBACK_ITEMS.filter((item) => item.category === activeFilter);
  }, [activeFilter]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/parent-progress' as any);
    }
  };

  if (!fontsLoaded) return null;

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
          {/* Main Floating Container with Tablet Max Width Constraint */}
          <View style={[styles.mainContainer, isTablet && styles.mainContainerTablet]}>
            <ParentHeader
              title="Therapist Feedback"
              showBack={true}
              onBack={handleBack}
            />

            <View style={styles.filterSection}>
              <TouchableOpacity
                style={styles.filterPillButton}
                activeOpacity={0.8}
                onPress={() => setIsFilterDropdownOpen((prev) => !prev)}
              >
                <Ionicons name="options-outline" size={16} color="#0D68AC" />
                <Text style={styles.filterButtonText}>
                  {activeFilter === 'All' ? 'Filters' : `Filters: ${activeFilter}`}
                </Text>
                <View style={styles.filterChevronBadge}>
                  <Ionicons
                    name={isFilterDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={13}
                    color="#FFFFFF"
                  />
                </View>
              </TouchableOpacity>

              {isFilterDropdownOpen && (
                <View style={styles.filterDropdownPopover}>
                  {(['All', 'Sounds', 'Words', 'Phrases', 'Sentences'] as FilterCategory[]).map(
                    (cat) => {
                      const isSelected = activeFilter === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={styles.filterOptionRow}
                          activeOpacity={0.7}
                          onPress={() => {
                            setActiveFilter(cat);
                            setIsFilterDropdownOpen(false);
                          }}
                        >
                          <Ionicons
                            name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                            size={18}
                            color={isSelected ? '#0D68AC' : '#98BDDA'}
                          />
                          <Text
                            style={[
                              styles.filterOptionLabel,
                              isSelected && styles.filterOptionLabelActive,
                            ]}
                          >
                            {cat === 'All' ? 'All Feedback' : cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {filteredFeedback.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="chatbubbles-outline" size={48} color="#98BDDA" />
                  <Text style={styles.emptyStateTitle}>No Feedback Yet</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Feedback for this category will appear here after sessions.
                  </Text>
                </View>
              ) : (
                filteredFeedback.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.feedbackCard}
                    activeOpacity={0.8}
                    onPress={() => setSelectedFeedback(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`View feedback from ${item.therapistName}`}
                  >
                    <TherapistAvatarPlaceholder
                      imageUri={item.avatarImage}
                      size={54}
                    />

                    <View style={styles.cardInfo}>
                      <Text style={styles.therapistName} numberOfLines={1}>
                        {item.therapistName}
                      </Text>
                      <Text style={styles.feedbackDate}>{item.date}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.viewButton}
                      activeOpacity={0.85}
                      onPress={() => setSelectedFeedback(item)}
                    >
                      <Text style={styles.viewButtonText}>View</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <ParentBottomNav activeTab="progress" />
          </View>
        </ImageBackground>

        {/* FEEDBACK MODAL */}
        <Modal
          visible={!!selectedFeedback}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedFeedback(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedFeedback(null)}>
            <Pressable style={styles.modalDialogCard} onPress={(e) => e.stopPropagation()}>
              {selectedFeedback && (
                <>
                  <View style={styles.modalHeader}>
                    <TherapistAvatarPlaceholder imageUri={selectedFeedback.avatarImage} size={50} />

                    <View style={styles.modalHeaderInfo}>
                      <Text style={styles.modalTherapistName}>
                        {selectedFeedback.therapistName}
                      </Text>
                      <Text style={styles.modalSpecialty}>
                        {selectedFeedback.specialty || 'Speech-Language Pathologist'}
                      </Text>
                      <View style={styles.modalCategoryBadge}>
                        <Text style={styles.modalCategoryText}>
                          {selectedFeedback.category}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      activeOpacity={0.7}
                      onPress={() => setSelectedFeedback(null)}
                    >
                      <Ionicons name="close" size={20} color="#0D68AC" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalDivider} />

                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollBody}>
                    <View style={styles.modalDateRow}>
                      <Ionicons name="calendar-outline" size={14} color="#7C93A8" />
                      <Text style={styles.modalDateText}>
                        {selectedFeedback.displayDate || selectedFeedback.date}
                      </Text>
                    </View>

                    <Text style={styles.modalTopicTitle}>{selectedFeedback.title}</Text>

                    <View style={styles.sectionHeadingRow}>
                      <Ionicons name="chatbubbles" size={16} color="#0D68AC" />
                      <Text style={styles.sectionHeading}>Therapist Observations</Text>
                    </View>
                    <View style={styles.observationBox}>
                      <Text style={styles.observationText}>{selectedFeedback.comments}</Text>
                    </View>

                    {selectedFeedback.recommendations && (
                      <>
                        <View style={styles.sectionHeadingRow}>
                          <Ionicons name="bulb" size={16} color="#F5A623" />
                          <Text style={styles.sectionHeading}>Recommended Home Practice</Text>
                        </View>
                        <View style={styles.recommendationBox}>
                          <Text style={styles.recommendationText}>{selectedFeedback.recommendations}</Text>
                        </View>
                      </>
                    )}
                  </ScrollView>

                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={styles.closeModalPill}
                      activeOpacity={0.85}
                      onPress={() => setSelectedFeedback(null)}
                    >
                      <Text style={styles.closeModalPillText}>Close Feedback</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#C5E2F7',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mainContainer: {
    flex: 1,
    marginHorizontal: 12,
    marginVertical: 10,
    backgroundColor: '#EEF7FC',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#A0D2F3',
    overflow: 'hidden',
    shadowColor: '#0D68AC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  mainContainerTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 20,
  },
  filterPillButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E2F0FA',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 6,
    gap: 8,
    shadowColor: '#0D68AC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 13,
    color: '#0D68AC',
    includeFontPadding: false,
  },
  filterChevronBadge: {
    width: 26,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDropdownPopover: {
    position: 'absolute',
    top: 40,
    left: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2F0FA',
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: 190,
    shadowColor: '#0D68AC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 30,
    gap: 6,
  },
  filterOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  filterOptionLabel: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 13,
    color: '#4B6780',
    includeFontPadding: false,
  },
  filterOptionLabelActive: {
    fontFamily: 'SourGummy-Bold',
    color: '#0D68AC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 12,
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2F0FA',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#0D68AC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  avatarPlaceholder: {
    backgroundColor: '#98BDDA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  therapistName: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 16,
    color: '#0D68AC',
    lineHeight: 20,
    includeFontPadding: false,
  },
  feedbackDate: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 12,
    color: '#7C93A8',
    marginTop: 4,
    includeFontPadding: false,
  },
  viewButton: {
    backgroundColor: '#F5A623',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
    elevation: 2,
  },
  viewButtonText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 13,
    color: '#0D68AC',
    includeFontPadding: false,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyStateTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 18,
    color: '#0D68AC',
  },
  emptyStateSubtitle: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 13,
    color: '#7C93A8',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 104, 172, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalDialogCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#E2F0FA',
    padding: 20,
    shadowColor: '#0D68AC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalHeaderInfo: {
    flex: 1,
  },
  modalTherapistName: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 18,
    color: '#0D68AC',
    includeFontPadding: false,
  },
  modalSpecialty: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 12,
    color: '#7C93A8',
    marginTop: 2,
    includeFontPadding: false,
  },
  modalCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF4FC',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  modalCategoryText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 11,
    color: '#0D68AC',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F9FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2F0FA',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#EDF4F9',
    marginVertical: 14,
  },
  modalScrollBody: {
    paddingBottom: 10,
  },
  modalDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  modalDateText: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 12,
    color: '#7C93A8',
  },
  modalTopicTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 16,
    color: '#0D68AC',
    marginBottom: 14,
    includeFontPadding: false,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sectionHeading: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 13,
    color: '#0D68AC',
    includeFontPadding: false,
  },
  observationBox: {
    backgroundColor: '#F3F9FD',
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#0D68AC',
    padding: 12,
    marginBottom: 14,
  },
  observationText: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 13,
    color: '#33506B',
    lineHeight: 18,
  },
  recommendationBox: {
    backgroundColor: '#FFF9ED',
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#F5A623',
    padding: 12,
    marginBottom: 14,
  },
  recommendationText: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 13,
    color: '#6E4E0A',
    lineHeight: 18,
  },
  modalFooter: {
    paddingTop: 8,
  },
  closeModalPill: {
    backgroundColor: '#F5A623',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 2,
  },
  closeModalPillText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 14,
    color: '#0D68AC',
    includeFontPadding: false,
  },
});