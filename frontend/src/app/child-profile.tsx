import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { ParentBottomNav } from '@/components/parent-bottom-nav';
import { ParentHeader } from '@/components/parent-header';
import { ChildProfile, ChildProfileStore, PRESET_CHILD_AVATARS } from '@/data/child-profile-store';

export default function ChildProfileScreen() {
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../assets/SourGummy-Bold.ttf'),
  });

  const [profile, setProfile] = useState<ChildProfile>(ChildProfileStore.getProfile());

  // Edit Modals State
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.fullName);
  const [nameError, setNameError] = useState('');

  const [isEditingAge, setIsEditingAge] = useState(false);
  const [tempAge, setTempAge] = useState(profile.age);

  const [isAvatarPickerVisible, setIsAvatarPickerVisible] = useState(false);

  // Synchronize with shared ChildProfileStore
  useEffect(() => {
    const unsubscribe = ChildProfileStore.subscribe((updatedProfile) => {
      setProfile(updatedProfile);
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

  const handleOpenNameEdit = () => {
    setTempName(profile.fullName);
    setNameError('');
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    const trimmed = tempName.trim();
    if (!trimmed) {
      setNameError('Please enter a valid name');
      return;
    }
    ChildProfileStore.updateProfile({ fullName: trimmed });
    setIsEditingName(false);
  };

  const handleOpenAgeEdit = () => {
    setTempAge(profile.age);
    setIsEditingAge(true);
  };

  const handleSaveAge = () => {
    if (tempAge >= 1 && tempAge <= 18) {
      ChildProfileStore.updateProfile({ age: tempAge });
    }
    setIsEditingAge(false);
  };

  const handlePickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        ChildProfileStore.updateProfile({ avatar: { uri: result.assets[0].uri } });
        setIsAvatarPickerVisible(false);
      }
    } catch (error) {
      console.log('Error selecting image from library:', error);
    }
  };

  const handleSelectPresetAvatar = (avatarSource: any) => {
    ChildProfileStore.updateProfile({ avatar: avatarSource });
    setIsAvatarPickerVisible(false);
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
              title="Child Profile"
              showBack={true}
              onBack={handleBack}
            />

            {/* SCROLLABLE MAIN CONTENT */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* =====================================================================
                  HERO PROFILE CARD (Sky-to-Cyan 3-Stop Gradient)
                  ===================================================================== */}
              <LinearGradient
                colors={['#106AB0', '#2A8AC8', '#4DB3E9']}
                locations={[0, 0.45, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.heroCard}
              >
                {/* Circular Avatar with Camera Badge */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.avatarWrapper}
                  onPress={() => setIsAvatarPickerVisible(true)}
                >
                  <Image
                    source={profile.avatar}
                    style={styles.heroAvatar}
                    contentFit="cover"
                  />
                  <View style={styles.cameraBadge}>
                    <Ionicons name="camera" size={14} color="#0D68AC" />
                  </View>
                </TouchableOpacity>

                {/* Child Full Name */}
                <Text style={styles.heroNameText}>{profile.fullName}</Text>

                {/* Child Age */}
                <Text style={styles.heroAgeText}>Age : {profile.age}</Text>
              </LinearGradient>

              {/* =====================================================================
                  EDITABLE FIELD 1: NAME CARD
                  ===================================================================== */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.fieldCard}
                onPress={handleOpenNameEdit}
              >
                <View style={styles.fieldInfo}>
                  <Text style={styles.fieldLabel}>Name</Text>
                  <Text style={styles.fieldValue}>{profile.fullName}</Text>
                </View>

                <View style={styles.editIconBadge}>
                  <Ionicons name="create-outline" size={24} color="#2A8AC8" />
                </View>
              </TouchableOpacity>

              {/* =====================================================================
                  EDITABLE FIELD 2: AGE CARD
                  ===================================================================== */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.fieldCard}
                onPress={handleOpenAgeEdit}
              >
                <View style={styles.fieldInfo}>
                  <Text style={styles.fieldLabel}>Age</Text>
                  <Text style={styles.fieldValue}>{profile.age}</Text>
                </View>

                <View style={styles.editIconBadge}>
                  <Ionicons name="create-outline" size={24} color="#2A8AC8" />
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* FIXED BOTTOM NAVIGATION BAR */}
            <ParentBottomNav activeTab="home" />
          </View>
        </ImageBackground>
      </SafeAreaView>

      {/* =========================================================================
          MODAL 1: EDIT CHILD'S NAME
          ========================================================================= */}
      <Modal
        visible={isEditingName}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditingName(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={() => setIsEditingName(false)}>
            <View style={styles.modalDimmedBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.dialogCard}>
            <View style={styles.dialogHeader}>
              <View style={styles.dialogIconBadge}>
                <Ionicons name="person" size={20} color="#0D68AC" />
              </View>
              <Text style={styles.dialogTitle}>Edit Child's Name</Text>
            </View>

            <Text style={styles.dialogSubtitle}>
              Update your child's name for both Parent and Child modes.
            </Text>

            <View style={[styles.inputContainer, nameError ? styles.inputErrorBorder : null]}>
              <TextInput
                value={tempName}
                onChangeText={(val) => {
                  setTempName(val);
                  if (nameError) setNameError('');
                }}
                placeholder="Enter child's full name"
                placeholderTextColor="#8FA7BA"
                style={styles.textInput}
                autoFocus
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
            </View>

            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

            <View style={styles.dialogActionRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                activeOpacity={0.7}
                onPress={() => setIsEditingName(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                activeOpacity={0.8}
                onPress={handleSaveName}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* =========================================================================
          MODAL 2: EDIT CHILD'S AGE
          ========================================================================= */}
      <Modal
        visible={isEditingAge}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditingAge(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setIsEditingAge(false)}>
            <View style={styles.modalDimmedBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.dialogCard}>
            <View style={styles.dialogHeader}>
              <View style={styles.dialogIconBadge}>
                <Ionicons name="calendar" size={20} color="#0D68AC" />
              </View>
              <Text style={styles.dialogTitle}>Edit Child's Age</Text>
            </View>

            <Text style={styles.dialogSubtitle}>
              Adjust your child's age to calibrate recommended activities.
            </Text>

            {/* Stepper Control */}
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={[styles.stepperButton, tempAge <= 1 && styles.stepperButtonDisabled]}
                activeOpacity={0.7}
                disabled={tempAge <= 1}
                onPress={() => setTempAge((prev) => Math.max(1, prev - 1))}
              >
                <Ionicons
                  name="remove"
                  size={26}
                  color={tempAge <= 1 ? '#B2C8DA' : '#0D68AC'}
                />
              </TouchableOpacity>

              <View style={styles.stepperValueContainer}>
                <Text style={styles.stepperNumber}>{tempAge}</Text>
                <Text style={styles.stepperUnitText}>years old</Text>
              </View>

              <TouchableOpacity
                style={[styles.stepperButton, tempAge >= 18 && styles.stepperButtonDisabled]}
                activeOpacity={0.7}
                disabled={tempAge >= 18}
                onPress={() => setTempAge((prev) => Math.min(18, prev + 1))}
              >
                <Ionicons
                  name="add"
                  size={26}
                  color={tempAge >= 18 ? '#B2C8DA' : '#0D68AC'}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.dialogActionRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                activeOpacity={0.7}
                onPress={() => setIsEditingAge(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                activeOpacity={0.8}
                onPress={handleSaveAge}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =========================================================================
          MODAL 3: AVATAR PICKER (Photos Library & Preset Avatars)
          ========================================================================= */}
      <Modal
        visible={isAvatarPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAvatarPickerVisible(false)}
      >
        <View style={styles.bottomSheetOverlay}>
          <TouchableWithoutFeedback onPress={() => setIsAvatarPickerVisible(false)}>
            <View style={styles.modalDimmedBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>Choose Profile Picture</Text>
            <Text style={styles.sheetSubtitle}>
              Select a photo from your gallery or choose a fun avatar below.
            </Text>

            {/* Option 1: Gallery Upload */}
            <TouchableOpacity
              style={styles.galleryButton}
              activeOpacity={0.8}
              onPress={handlePickFromLibrary}
            >
              <View style={styles.galleryIconWrapper}>
                <Ionicons name="images" size={22} color="#0D68AC" />
              </View>
              <View style={styles.galleryTextWrapper}>
                <Text style={styles.galleryButtonTitle}>Upload from Photos</Text>
                <Text style={styles.galleryButtonSub}>Pick a custom photo from your device</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#0D68AC" />
            </TouchableOpacity>

            <View style={styles.sheetDividerRow}>
              <View style={styles.sheetDividerLine} />
              <Text style={styles.sheetDividerText}>OR CHOOSE AN AVATAR</Text>
              <View style={styles.sheetDividerLine} />
            </View>

            {/* Option 2: Preset Avatars Grid */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsScroll}
            >
              {PRESET_CHILD_AVATARS.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={styles.presetItem}
                  activeOpacity={0.75}
                  onPress={() => handleSelectPresetAvatar(preset.image)}
                >
                  <Image source={preset.image} style={styles.presetAvatarImage} contentFit="cover" />
                  <Text style={styles.presetLabel} numberOfLines={1}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Close Sheet Button */}
            <TouchableOpacity
              style={styles.closeSheetButton}
              activeOpacity={0.7}
              onPress={() => setIsAvatarPickerVisible(false)}
            >
              <Text style={styles.closeSheetText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
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
    fontFamily: 'SourGummy-Bold',
    fontSize: 22,
    color: '#0D68AC',
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

  /* Scrollable Content */
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 14,
  },

  /* Hero Gradient Profile Card */
  heroCard: {
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0865AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 5,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  heroAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#A8D8F8',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D2E6F5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  heroNameText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  heroAgeText: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },

  /* Interactive Form Field Cards */
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: '#E2F0FA',
    shadowColor: '#0D68AC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 13,
    color: '#7C93A8',
    marginBottom: 2,
  },
  fieldValue: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 19,
    color: '#0D68AC',
  },
  editIconBadge: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F9FE',
  },

  /* Modal Dialogs */
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalDimmedBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 34, 58, 0.45)',
  },
  dialogCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#D4E8F8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  dialogIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8F4FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 20,
    color: '#0D68AC',
  },
  dialogSubtitle: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 13,
    color: '#7C93A8',
    marginBottom: 18,
    lineHeight: 18,
  },
  inputContainer: {
    backgroundColor: '#F4F9FD',
    borderWidth: 1.5,
    borderColor: '#C6DFFA',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputErrorBorder: {
    borderColor: '#FF5C5C',
    backgroundColor: '#FFF5F5',
  },
  textInput: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 17,
    color: '#0D68AC',
    padding: 0,
  },
  errorText: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 12,
    color: '#FF5C5C',
    marginTop: 6,
  },
  dialogActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D4E8F8',
    backgroundColor: '#F8FBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 15,
    color: '#7C93A8',
  },
  saveButton: {
    flex: 1.4,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#106AB0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#106AB0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  saveButtonText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },

  /* Stepper */
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F9FE',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#D4E8F8',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 24,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#C6DFFA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D68AC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  stepperButtonDisabled: {
    backgroundColor: '#F0F4F8',
    borderColor: '#E2EAF1',
  },
  stepperValueContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  stepperNumber: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 34,
    color: '#0D68AC',
  },
  stepperUnitText: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 13,
    color: '#7C93A8',
    marginTop: -2,
  },

  /* Bottom Sheet Avatar Picker */
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#D4E8F8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#D2E3F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 20,
    color: '#0D68AC',
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 13,
    color: '#7C93A8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F9FE',
    borderWidth: 1.5,
    borderColor: '#C6DFFA',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  galleryIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D2E6F5',
  },
  galleryTextWrapper: {
    flex: 1,
  },
  galleryButtonTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 15,
    color: '#0D68AC',
  },
  galleryButtonSub: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 12,
    color: '#7C93A8',
  },
  sheetDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  sheetDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E4EFF8',
  },
  sheetDividerText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 11,
    color: '#9BB4C7',
    letterSpacing: 0.8,
  },
  presetsScroll: {
    paddingVertical: 4,
    gap: 14,
  },
  presetItem: {
    alignItems: 'center',
    width: 68,
  },
  presetAvatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#C6DFFA',
    backgroundColor: '#EBF5FD',
    marginBottom: 6,
  },
  presetLabel: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 11,
    color: '#0D68AC',
    textAlign: 'center',
  },
  closeSheetButton: {
    marginTop: 20,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F3F9FE',
    borderWidth: 1.5,
    borderColor: '#D2E6F5',
    alignItems: 'center',
  },
  closeSheetText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 15,
    color: '#7C93A8',
  },
});
