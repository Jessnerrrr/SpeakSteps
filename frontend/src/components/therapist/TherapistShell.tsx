import { StatusBar } from 'expo-status-bar';
import { useState, useMemo, useEffect } from 'react';
import { useWindowDimensions, View, Modal, Pressable, Text, TouchableOpacity, ScrollView, TextInput, Switch, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { clearSession } from '@/services/user-api';

import { BottomNav } from '@/components/therapist/BottomNav';
import { useTherapist } from '@/components/therapist/TherapistProvider';
import { AddPatientModal } from '@/Therapist-modules/therapist-patients/components/AddPatientModal';
import type { TherapistTab } from '@/navigation/therapistTabs';
import type { ReactNode } from 'react';

// ==========================================
// --- Mock Data & Theme Setup ---
// ==========================================
const INITIAL_NOTIFICATIONS = [
  { id: 'notif-1', name: 'Khyll', action: 'submitted an audio recording', detail: '/r/ Isolated Sounds (Target: 35% accuracy)', time: '5m ago', unread: true },
  { id: 'notif-2', name: 'Angelica', action: 'completed Sentences practice', detail: 'Achieved 80% accuracy score on Sibilant /s/ targets', time: '1h ago', unread: true },
  { id: 'notif-3', name: 'Jhonas', action: 'submitted Syllables home practice', detail: '15/20 correct trials recorded by parent', time: '3h ago', unread: true },
  { id: 'notif-4', name: 'Mcgravy', action: 'completed Phrases practice', detail: 'Achieved 75% accuracy rate', time: 'Today at 09:09 AM', unread: false },
];

const getThemeColors = (isDark: boolean) => ({
  isDark,
  bg: isDark ? '#0B1120' : '#FFFFFF',
  bgSecondary: isDark ? '#0F172A' : '#F8FAFC',
  card: isDark ? '#1E293B' : '#FFFFFF',
  cardSubtle: isDark ? '#0F172A' : '#F8FAFC',
  border: isDark ? '#334155' : '#E2E8F0',
  borderLight: isDark ? '#1E293B' : '#F1F5F9',
  text: isDark ? '#F8FAFC' : '#1E293B',
  textSub: isDark ? '#94A3B8' : '#64748B',
  textMuted: isDark ? '#64748B' : '#94A3B8',
  heading: isDark ? '#38BDF8' : '#0369A1',
  primary: '#0284C7',
  hamburger: isDark ? '#F8FAFC' : '#1E293B',
  inputText: isDark ? '#F8FAFC' : '#1E293B',
  segmentBg: isDark ? '#0B1120' : '#FFFFFF',
  logoutBtnBg: isDark ? '#334155' : '#CBD5E1',
  logoutBtnText: isDark ? '#F8FAFC' : '#1E293B',
  divider: isDark ? '#334155' : '#F1F5F9',
  modalOverlay: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(15, 23, 42, 0.65)',
  menuOverlay: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(15, 23, 42, 0.25)',
  switchTrackFalse: isDark ? '#334155' : '#CBD5E1',
  switchTrackTrue: isDark ? '#38BDF8' : '#1E293B',
  switchThumbOn: '#FFFFFF',
  switchThumbOff: isDark ? '#94A3B8' : '#FFFFFF',
});

// ==========================================
// --- Main Component ---
// ==========================================
export function TherapistShell({ active, children }: { active: TherapistTab; children: ReactNode }) {
  // Grab global theme state directly from Provider
  const { isDark, themeMode, setThemeMode, addPatientOpen, profile, updateProfile, updatePassword } = useTherapist();
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const columnWidth = Math.min(width, wide ? 520 : width);

  // Theme Resolution
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Modal States
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  
  const [notificationsFilter, setNotificationsFilter] = useState<'All' | 'Unread'>('All');
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile Form State (Prefilled with TherapistProvider Profile)
  const therapistProfile = {
    name: profile.fullName || 'Therapist',
    title: profile.role,
    license: profile.license,
    clinic: profile.clinic,
    contact: profile.contact,
    email: profile.email,
  };
  const [editProfileForm, setEditProfileForm] = useState({ ...therapistProfile });
  useEffect(() => {
    setEditProfileForm({ ...therapistProfile });
  }, [profile]);

  // Settings State (Toggles)
  const [newRecordingsToggle, setNewRecordingsToggle] = useState(true);
  const [followUpAlertsToggle, setFollowUpAlertsToggle] = useState(true);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Handlers
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        fullName: editProfileForm.name.trim(),
        role: editProfileForm.title.trim(),
        license: editProfileForm.license.trim(),
        clinic: editProfileForm.clinic.trim(),
        contact: editProfileForm.contact.trim(),
      });
      setShowEditProfileModal(false);
      triggerToast('Profile updated successfully!');
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Could not save your therapist profile.');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return triggerToast('Fill out all fields.');
    if (newPassword !== confirmPassword) return triggerToast('New passwords do not match.');
    const error = await updatePassword(currentPassword, newPassword);
    if (error) return triggerToast(error);
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setShowChangePasswordModal(false);
    triggerToast('Password changed successfully!');
  };

  const handleLogout = async () => {
    try {
      await clearSession();
      setShowLogoutConfirm(false);
      setShowMenu(false);
      setShowSettingsModal(false);
      router.replace('/therapist-login' as any);
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Could not clear your session. Please try again.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: wide ? '#E2E8F0' : colors.bg, alignItems: 'center' }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1, width: columnWidth, backgroundColor: colors.bgSecondary, position: 'relative' }}>
        
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* ==========================================
              --- NEW TOP HEADER ---
              ========================================== */}
          <View style={[styles.topHeader, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => {
                setShowNotificationsDropdown(false);
                setShowMenu(!showMenu);
              }}
            >
              <Svg width="22" height="18" viewBox="0 0 24 18" fill="none">
                <Path d="M1 1.5H23M1 9H23M1 16.5H23" stroke={colors.hamburger} strokeWidth="2.5" strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>

            <Text style={[styles.appTitle, { color: isDark ? '#38BDF8' : '#0284C7' }]}>SpeakSteps</Text>

            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => {
                setShowMenu(false);
                setShowNotificationsDropdown(!showNotificationsDropdown);
              }}
            >
              <View>
                <Svg width="22" height="24" viewBox="0 0 24 24" fill="none">
                  <Path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8Z" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <Path d="M13.73 21A2 2 0 0 1 10.27 21" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                {notifications.some((n) => n.unread) && <View style={styles.notificationDot} />}
              </View>
            </TouchableOpacity>
          </View>

          {/* PAGE CONTENT (Injected) */}
          <View style={{ flex: 1 }}>
            {children}
          </View>

          {/* BOTTOM NAVIGATION (Existing) */}
          <BottomNav active={active} />
        </SafeAreaView>

        {/* ==========================================
            --- HAMBURGER DROPDOWN MENU ---
            ========================================== */}
        {showMenu && (
          <Modal transparent animationType="fade" visible={showMenu} onRequestClose={() => setShowMenu(false)}>
            <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
              <View style={styles.menuDropdownContainer}>
                <TouchableOpacity
                  style={styles.menuUserHeader}
                  activeOpacity={0.8}
                  onPress={() => { setShowMenu(false); setShowProfileModal(true); }}
                >
                  <View style={styles.menuAvatarCircle}>
                    <Text style={styles.menuAvatarText}>{therapistProfile.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.menuUserName} numberOfLines={1}>{therapistProfile.name}</Text>
                    <Text style={styles.menuUserRole} numberOfLines={1}>{therapistProfile.title}</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.menuSectionDivider} />

                <TouchableOpacity
                  style={styles.menuOptionRow}
                  activeOpacity={0.7}
                  onPress={() => { setShowMenu(false); setShowProfileModal(true); }}
                >
                  <View style={styles.menuIconCircle}>
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <Circle cx="12" cy="8" r="4" stroke="#0284C7" strokeWidth="2" />
                      <Path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
                    </Svg>
                  </View>
                  <Text style={styles.menuOptionLabel}>Profile</Text>
                  <Text style={styles.menuOptionChevron}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuOptionRow}
                  activeOpacity={0.7}
                  onPress={() => { setShowMenu(false); setShowSettingsModal(true); }}
                >
                  <View style={styles.menuIconCircle}>
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <Circle cx="12" cy="12" r="3" stroke="#0284C7" strokeWidth="2" />
                      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="#0284C7" strokeWidth="2" />
                    </Svg>
                  </View>
                  <Text style={styles.menuOptionLabel}>Settings</Text>
                  <Text style={styles.menuOptionChevron}>›</Text>
                </TouchableOpacity>

                <View style={styles.menuSectionDivider} />

                <TouchableOpacity
                  style={styles.menuOptionRow}
                  activeOpacity={0.7}
                  onPress={() => { setShowMenu(false); setShowLogoutConfirm(true); }}
                >
                  <View style={[styles.menuIconCircle, { backgroundColor: '#FEE2E2' }]}>
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M16 17l5-5-5-5" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M21 12H9" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                  <Text style={[styles.menuOptionLabel, { color: '#DC2626', fontWeight: '700' }]}>Logout</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>
        )}

        {/* ==========================================
            --- NOTIFICATIONS POPOVER ---
            ========================================== */}
        {showNotificationsDropdown && (
          <Modal transparent animationType="fade" visible={showNotificationsDropdown} onRequestClose={() => setShowNotificationsDropdown(false)}>
            <Pressable style={styles.menuOverlay} onPress={() => setShowNotificationsDropdown(false)}>
              <View style={styles.notifDropdownContainer}>
                <View style={styles.notifDropdownHeaderRow}>
                  <Text style={styles.notifDropdownTitle}>Notifications</Text>
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity style={[styles.notifPill, notificationsFilter === 'All' && styles.notifPillActive]} onPress={() => setNotificationsFilter('All')}>
                      <Text style={[styles.notifPillText, notificationsFilter === 'All' && styles.notifPillTextActive]}>All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.notifPill, notificationsFilter === 'Unread' && styles.notifPillActive]} onPress={() => setNotificationsFilter('Unread')}>
                      <Text style={[styles.notifPillText, notificationsFilter === 'Unread' && styles.notifPillTextActive]}>Unread</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                  {notifications.filter((item) => (notificationsFilter === 'Unread' ? item.unread : true)).map((item) => (
                    <View key={item.id} style={styles.notifItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.notifItemTitle}><Text style={{ fontWeight: '700' }}>{item.name} </Text>{item.action}</Text>
                        <Text style={styles.notifItemDetail}>{item.detail}</Text>
                      </View>
                      <Text style={styles.notifItemTime}>{item.time}</Text>
                    </View>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.markAllReadBtn} onPress={() => {
                  setNotifications(notifications.map(n => ({ ...n, unread: false })));
                  triggerToast('Marked as read');
                }}>
                  <Text style={styles.markAllReadBtnText}>Mark All as Read</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>
        )}

        {/* ==========================================
            --- SETTINGS MODAL ---
            ========================================== */}
        <Modal visible={showSettingsModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSettingsModal(false)}>
          <SafeAreaView style={styles.settingsModalContainer} edges={['top']}>
            <View style={styles.settingsTopBar}>
              <Text style={styles.settingsNavTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.settingsScrollContent}>
              <View style={styles.settingsProfileHeaderRow}>
                <View style={styles.settingsAvatarCircle}><Text style={styles.settingsAvatarLetter}>{therapistProfile.name.charAt(0)}</Text></View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.settingsDoctorName}>{therapistProfile.name}</Text>
                  <Text style={styles.settingsDoctorRole}>{therapistProfile.title}</Text>
                  <Text style={styles.settingsLicenseText}>License: {therapistProfile.license}</Text>
                </View>
              </View>

              <Text style={styles.settingsSectionTitle}>Account</Text>
              <View style={styles.settingsCard}>
                <TouchableOpacity style={styles.settingsCardRow} onPress={() => { setEditProfileForm({ ...therapistProfile }); setShowEditProfileModal(true); }}>
                  <View style={{ flex: 1 }}><Text style={styles.settingsRowTitle}>Edit Profile</Text><Text style={styles.settingsRowSub}>Name, clinic, contact</Text></View>
                  <Text style={styles.settingsChevron}>›</Text>
                </TouchableOpacity>
                <View style={styles.settingsRowDivider} />
                <View style={styles.settingsCardRow}><View style={{ flex: 1 }}><Text style={styles.settingsRowTitle}>Clinic</Text><Text style={styles.settingsRowSub}>{therapistProfile.clinic}</Text></View></View>
                <View style={styles.settingsRowDivider} />
                <TouchableOpacity style={styles.settingsCardRow} onPress={() => setShowChangePasswordModal(true)}>
                  <View style={{ flex: 1 }}><Text style={styles.settingsRowTitle}>Change Password</Text></View>
                  <Text style={styles.settingsChevron}>›</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.settingsSectionTitle}>Notifications</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingsCardRow}>
                  <View style={{ flex: 1, marginRight: 10 }}><Text style={styles.settingsRowTitle}>New Recordings</Text><Text style={styles.settingsRowSub}>When a child submits</Text></View>
                  <Switch value={newRecordingsToggle} onValueChange={setNewRecordingsToggle} trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }} thumbColor={newRecordingsToggle ? colors.switchThumbOn : colors.switchThumbOff} />
                </View>
              </View>

              <Text style={styles.settingsSectionTitle}>Appearance</Text>
              <View style={styles.settingsCard}>
                <View style={styles.themeRow}>
                  <Text style={styles.settingsRowTitle}>Theme</Text>
                  <View style={styles.themeSegmentControl}>
                    {(['auto', 'light', 'dark'] as const).map((mode) => (
                      <TouchableOpacity 
                        key={mode} 
                        style={[styles.themeSegmentBtn, themeMode === mode && styles.themeSegmentBtnActive]} 
                        onPress={() => {
                          setThemeMode(mode);
                          triggerToast(`${mode.charAt(0).toUpperCase() + mode.slice(1)} theme enabled`);
                        }}
                      >
                        <Text style={[styles.themeSegmentText, themeMode === mode && styles.themeSegmentTextActive]}>
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.settingsLogoutButton} activeOpacity={0.8} onPress={() => setShowLogoutConfirm(true)}>
                <Text style={styles.settingsLogoutButtonText}>Log Out</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* ==========================================
            --- PROFILE / EDIT MODALS ---
            ========================================== */}
        <Modal visible={showProfileModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowProfileModal(false)}>
          <SafeAreaView style={styles.settingsModalContainer} edges={['top']}>
            <View style={styles.settingsTopBar}>
              <Text style={styles.settingsNavTitle}>Therapist Profile</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)} style={styles.closeButton}><Text style={styles.closeButtonText}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.settingsScrollContent}>
              <View style={styles.profileHeroCard}>
                <View style={styles.profileBigAvatarCircle}><Text style={styles.profileBigAvatarLetter}>{therapistProfile.name.charAt(0)}</Text></View>
                <Text style={styles.profileHeroName}>{therapistProfile.name}</Text>
                <Text style={styles.profileHeroRole}>{therapistProfile.title}</Text>
                <View style={styles.licenseBadge}><Text style={styles.licenseBadgeText}>{therapistProfile.license}</Text></View>
              </View>
              <Text style={styles.settingsSectionTitle}>Clinical Credentials</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingsCardRow}><View><Text style={styles.settingsRowSub}>Clinic Organization</Text><Text style={styles.settingsRowTitle}>{therapistProfile.clinic}</Text></View></View>
                <View style={styles.settingsRowDivider} />
                <View style={styles.settingsCardRow}><View><Text style={styles.settingsRowSub}>Email</Text><Text style={styles.settingsRowTitle}>{therapistProfile.email}</Text></View></View>
              </View>
              <View style={styles.previewActionsRow}>
                <TouchableOpacity style={styles.outlineBtn} onPress={() => { setEditProfileForm({ ...therapistProfile }); setShowEditProfileModal(true); }}><Text style={styles.outlineBtnText}>Edit Profile</Text></TouchableOpacity>
                <TouchableOpacity style={styles.solidBlueBtn} onPress={() => { setShowProfileModal(false); setShowSettingsModal(true); }}><Text style={styles.solidBlueBtnText}>Go to Settings ›</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        <Modal visible={showEditProfileModal} animationType="fade" transparent onRequestClose={() => setShowEditProfileModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitleText}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setShowEditProfileModal(false)} style={styles.closeButton}><Text style={styles.closeButtonText}>✕</Text></TouchableOpacity>
              </View>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput style={styles.formInput} value={editProfileForm.name} onChangeText={(t) => setEditProfileForm({ ...editProfileForm, name: t })} />
              <Text style={styles.formLabel}>Professional Title</Text>
              <TextInput style={styles.formInput} value={editProfileForm.title} onChangeText={(t) => setEditProfileForm({ ...editProfileForm, title: t })} />
              <Text style={styles.formLabel}>License</Text>
              <TextInput style={styles.formInput} value={editProfileForm.license} onChangeText={(t) => setEditProfileForm({ ...editProfileForm, license: t })} />
              <Text style={styles.formLabel}>Clinic</Text>
              <TextInput style={styles.formInput} value={editProfileForm.clinic} onChangeText={(t) => setEditProfileForm({ ...editProfileForm, clinic: t })} />
              <Text style={styles.formLabel}>Contact</Text>
              <TextInput style={styles.formInput} value={editProfileForm.contact} onChangeText={(t) => setEditProfileForm({ ...editProfileForm, contact: t })} keyboardType="phone-pad" />
              <View style={[styles.previewActionsRow, { marginTop: 12 }]}>
                <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowEditProfileModal(false)}><Text style={styles.outlineBtnText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.solidBlueBtn} onPress={handleSaveProfile}><Text style={styles.solidBlueBtnText}>Save</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ==========================================
            --- LOGOUT CONFIRM & OTHER UTILITIES ---
            ========================================== */}
        <Modal visible={showLogoutConfirm} animationType="fade" transparent onRequestClose={() => setShowLogoutConfirm(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxWidth: 360, alignItems: 'center' }]}>
              <View style={[styles.menuIconCircle, { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FEE2E2', marginBottom: 12 }]}>
                <Svg width="26" height="26" viewBox="0 0 24 24" fill="none"><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><Path d="M16 17l5-5-5-5" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><Path d="M21 12H9" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
              </View>
              <Text style={[styles.modalPatientName, { fontSize: 18, marginBottom: 6 }]}>Log Out of SpeakSteps?</Text>
              <Text style={styles.subtextSmall}>You will need to sign back in with your credentials.</Text>
              <View style={[styles.previewActionsRow, { width: '100%' }]}>
                <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowLogoutConfirm(false)}><Text style={styles.outlineBtnText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.solidBlueBtn, { backgroundColor: '#DC2626' }]} onPress={handleLogout}><Text style={styles.solidBlueBtnText}>Log Out</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Global Toast Feedback Banner */}
        {toastMessage && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        {/* Original Modals untouched */}
        {addPatientOpen ? <AddPatientModal /> : null}

      </View>
    </View>
  );
}

// ==========================================
// --- STYLESHEET ---
// ==========================================
function createStyles(colors: ReturnType<typeof getThemeColors>) {
  return StyleSheet.create({
    topHeader: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
    iconButton: { padding: 8 },
    appTitle: { fontFamily: 'SourGummy-Bold', fontSize: 22 },
    notificationDot: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
    
    menuOverlay: { flex: 1, backgroundColor: colors.menuOverlay },
    menuDropdownContainer: { position: 'absolute', top: Platform.OS === 'android' ? 76 : 52, left: 14, width: 250, backgroundColor: colors.card, borderRadius: 16, padding: 10, shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 8, borderWidth: 1, borderColor: colors.border },
    menuUserHeader: { flexDirection: 'row', alignItems: 'center', padding: 6, borderRadius: 10 },
    menuAvatarCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.isDark ? '#082F49' : '#E0F2FE', justifyContent: 'center', alignItems: 'center' },
    menuAvatarText: { fontSize: 16, fontWeight: '800', color: colors.isDark ? '#38BDF8' : '#0284C7' },
    menuUserName: { fontSize: 13, fontWeight: '700', color: colors.text },
    menuUserRole: { fontSize: 11, color: colors.textSub },
    menuSectionDivider: { height: 1, backgroundColor: colors.divider, marginVertical: 6 },
    menuOptionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10 },
    menuIconCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.isDark ? '#0F172A' : '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    menuOptionLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
    menuOptionChevron: { fontSize: 16, color: colors.textMuted, fontWeight: '700' },

    notifDropdownContainer: { position: 'absolute', top: Platform.OS === 'android' ? 76 : 52, right: 14, width: 320, backgroundColor: colors.card, borderRadius: 18, padding: 14, shadowColor: '#000', shadowOpacity: 0.14, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 8, borderWidth: 1, borderColor: colors.border },
    notifDropdownHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    notifDropdownTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    notifPill: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginLeft: 6, backgroundColor: colors.card },
    notifPillActive: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
    notifPillText: { fontSize: 11, color: colors.textSub, fontWeight: '600' },
    notifPillTextActive: { color: '#FFFFFF', fontWeight: '700' },
    notifItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    notifItemTitle: { fontSize: 12, color: colors.text, marginBottom: 2, lineHeight: 16 },
    notifItemDetail: { fontSize: 11, color: colors.textSub, lineHeight: 15 },
    notifItemTime: { fontSize: 10, color: colors.textMuted, marginLeft: 8, fontWeight: '500' },
    markAllReadBtn: { marginTop: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.card },
    markAllReadBtnText: { fontSize: 11, color: colors.textSub, fontWeight: '600' },

    settingsModalContainer: { flex: 1, backgroundColor: colors.bgSecondary },
    settingsTopBar: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    settingsNavTitle: { fontFamily: 'SourGummy-Bold', fontSize: 18, color: colors.heading },
    settingsScrollContent: { padding: 16, paddingBottom: 40 },
    settingsProfileHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 6 },
    settingsAvatarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.isDark ? '#082F49' : '#CFE4F6', justifyContent: 'center', alignItems: 'center' },
    settingsAvatarLetter: { fontFamily: 'SourGummy-Bold', fontSize: 28, color: colors.isDark ? '#38BDF8' : '#0284C7' },
    settingsDoctorName: { fontFamily: 'SourGummy-Bold', fontSize: 16, color: colors.heading, marginBottom: 2 },
    settingsDoctorRole: { fontSize: 12, fontWeight: '600', color: colors.text, marginBottom: 2 },
    settingsLicenseText: { fontSize: 11, color: colors.textMuted },
    settingsSectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8, marginTop: 12 },
    settingsCard: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 12 },
    settingsCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
    settingsRowDivider: { height: 1, backgroundColor: colors.divider, marginHorizontal: 16 },
    settingsRowTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 2 },
    settingsRowSub: { fontSize: 12, color: colors.textSub },
    settingsChevron: { fontSize: 16, color: colors.textMuted, fontWeight: '700' },
    themeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    themeSegmentControl: { flexDirection: 'row', backgroundColor: colors.segmentBg, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 3 },
    themeSegmentBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 16 },
    themeSegmentBtnActive: { backgroundColor: '#38BDF8' },
    themeSegmentText: { fontSize: 12, color: colors.textSub, fontWeight: '600' },
    themeSegmentTextActive: { color: '#FFFFFF', fontWeight: '700' },
    settingsLogoutButton: { backgroundColor: colors.logoutBtnBg, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24, marginBottom: 10 },
    settingsLogoutButtonText: { fontSize: 14, fontWeight: '700', color: colors.logoutBtnText },

    profileHeroCard: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 20, alignItems: 'center', marginBottom: 14 },
    profileBigAvatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.isDark ? '#082F49' : '#CFE4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    profileBigAvatarLetter: { fontFamily: 'SourGummy-Bold', fontSize: 34, color: colors.isDark ? '#38BDF8' : '#0284C7' },
    profileHeroName: { fontFamily: 'SourGummy-Bold', fontSize: 18, color: colors.heading, marginBottom: 2 },
    profileHeroRole: { fontSize: 13, color: colors.text, fontWeight: '600', marginBottom: 6 },
    licenseBadge: { backgroundColor: colors.cardSubtle, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    licenseBadgeText: { fontSize: 11, color: colors.isDark ? '#38BDF8' : '#0284C7', fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: colors.modalOverlay, justifyContent: 'center', padding: 16 },
    modalContent: { backgroundColor: colors.card, borderRadius: 20, padding: 18, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 8 },
    modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    modalTitleText: { fontFamily: 'SourGummy-Bold', fontSize: 16, color: colors.heading },
    modalPatientName: { fontSize: 15, fontWeight: '700', color: colors.text },
    closeButton: { padding: 6 },
    closeButtonText: { fontSize: 18, color: colors.textSub, fontWeight: '700' },
    formLabel: { fontSize: 12, fontWeight: '700', color: colors.text, marginTop: 10, marginBottom: 4 },
    formInput: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: colors.inputText, marginBottom: 8 },
    previewActionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
    outlineBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.isDark ? '#38BDF8' : '#0284C7', justifyContent: 'center', alignItems: 'center', marginRight: 8, backgroundColor: colors.card },
    outlineBtnText: { fontSize: 13, fontWeight: '700', color: colors.isDark ? '#38BDF8' : '#0284C7' },
    solidBlueBtn: { flex: 1, height: 44, borderRadius: 12, backgroundColor: '#0284C7', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
    solidBlueBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
    subtextSmall: { fontSize: 11, color: colors.textSub, textAlign: 'center', marginBottom: 20 },

    toastContainer: { position: 'absolute', bottom: 75, alignSelf: 'center', backgroundColor: '#0284C7', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
    toastText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  });
}