import { SessionRevokeWarning } from '@/components/session-revoke-warning';
import { ProfileEditWarning } from '@/components/profile-edit-warning';
import { CENTER_NAME } from '@/data/center-name';
import { StatusBar } from 'expo-status-bar';
import { useState, useMemo } from 'react';
import {
  useWindowDimensions,
  View,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Bell,
  SunMoon,
  Lock,
  ShieldCheck,
  LogOut,
  Camera,
  X,
} from 'lucide-react-native';

import { BottomNav } from '@/components/therapist/BottomNav';
import { useTherapist } from '@/components/therapist/TherapistProvider';
import { BellIcon } from '@/components/therapist/icons';
import type { TherapistTab } from '@/navigation/therapistTabs';
import type { ReactNode } from 'react';

// ==========================================
// --- Mock Data & Theme Setup ---
// ==========================================
const INITIAL_NOTIFICATIONS = [
  { id: 'notif-1', name: 'Khyll', action: 'submitted an audio recording', detail: '/r/ Sound (Target: 35% accuracy)', time: '5m ago', unread: true },
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
  const { isDark, themeMode, setThemeMode, actionNotice, profile, updateProfile } = useTherapist();
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const columnWidth = Math.min(width, wide ? 520 : width);

  // Theme Resolution
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Modal States
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [profileOpenedFromSettings, setProfileOpenedFromSettings] = useState(false);
  
  const [notificationsFilter, setNotificationsFilter] = useState<'All' | 'Unread'>('All');
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const therapistProfile = {
    ...profile,
    name: profile.fullName.replace(/,\s*SLP-CCC$/, ''),
    credentials: 'SLP-CCC',
    title: profile.role,
  };
  const [editProfileForm, setEditProfileForm] = useState({ ...therapistProfile });

  // Settings State (Screenshot 2 Toggles)
  const [newRecordingsToggle, setNewRecordingsToggle] = useState(true);
  const [followUpAlertsToggle, setFollowUpAlertsToggle] = useState(true);
  const [readyToLevelUpToggle, setReadyToLevelUpToggle] = useState(false);
  const [missedExercisesToggle, setMissedExercisesToggle] = useState(true);
  const [twoFactorAuthToggle, setTwoFactorAuthToggle] = useState(true);

  // Active Sessions (Screenshot 2 Sessions)
  const [sessionToRevoke, setSessionToRevoke] = useState<{ id: string; device: string } | null>(null);
  const [sessionNotice, setSessionNotice] = useState('');
  const [activeSessions, setActiveSessions] = useState([
    { id: '1', device: 'Redmi 15', isCurrent: true, location: 'Quezon City', lastActive: 'Active now' },
    { id: '2', device: 'Samsung Galaxy Tab S9 FE', isCurrent: false, location: 'Android App', lastActive: 'Yesterday' },
    { id: '3', device: 'Samsung Galaxy S24', isCurrent: false, location: 'Chrome', lastActive: 'Nov 10' },
  ]);

  // Handlers
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePickPhoto = async () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setEditProfileForm((prev) => ({ ...prev, photoUri: url }));
      };
      input.click();
    } else {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });
        if (!result.canceled && result.assets[0]?.uri) {
          setEditProfileForm((prev) => ({ ...prev, photoUri: result.assets[0].uri }));
        }
      } catch (e) {}
    }
  };

  const handleRevokeSession = (id: string) => {
    setActiveSessions((current) => current.filter((s) => s.id !== id));
    setSessionNotice('Session revoked successfully.');
  };

  const openProfile = () => {
    setEditProfileForm({ ...therapistProfile });
    setEditingProfile(false);
    setShowProfileModal(true);
  };

  const startProfileEditing = () => {
    setEditProfileForm({ ...therapistProfile });
    setEditingProfile(true);
  };

  const handleSaveProfile = () => {
    if (!editingProfile) return;
    const name = editProfileForm.name.trim();
    if (!name) {
      triggerToast('Full name is required.');
      return;
    }
    if (!editProfileForm.email.trim() || !editProfileForm.email.includes('@')) {
      triggerToast('Please provide a valid email address.');
      return;
    }
    if (!editProfileForm.contact.trim()) {
      triggerToast('Please provide a contact number.');
      return;
    }
    updateProfile({
      fullName: name + ', ' + editProfileForm.credentials,
      role: editProfileForm.title.trim(),
      contact: editProfileForm.contact.trim(),
      photoUri: editProfileForm.photoUri,
    });
    setShowProfileModal(false);
    triggerToast('Credentials saved successfully!');
    if (profileOpenedFromSettings) {
      setShowSettingsModal(true);
      setProfileOpenedFromSettings(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    setShowMenu(false);
    setShowSettingsModal(false);
    triggerToast('Logged out successfully.');
    router.replace('/login' as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: wide ? '#E2E8F0' : colors.bg, alignItems: 'center' }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1, width: columnWidth, backgroundColor: colors.bgSecondary, position: 'relative' }}>
        
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* ==========================================
              --- TOP HEADER ---
              ========================================== */}
          <View style={[styles.topHeader, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Open menu"
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => {
                setShowNotificationsDropdown(false);
                setShowMenu(!showMenu);
              }}
            >
              <Svg width="26" height="20" viewBox="0 0 26 20" fill="none">
                <Path d="M1 2.5H25M1 10H25M1 17.5H25" stroke={colors.hamburger} strokeWidth="2.8" strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => {
                setShowMenu(false);
                setShowNotificationsDropdown(!showNotificationsDropdown);
              }}
            >
              <BellIcon color="#0284C7" size={26} alert={notifications.some((n) => n.unread)} />
            </TouchableOpacity>
          </View>

          {/* PAGE CONTENT (Injected) */}
          <View style={{ flex: 1 }}>
            {children}
          </View>

          {/* BOTTOM NAVIGATION */}
          <BottomNav active={active} />
        </SafeAreaView>

        {/* ==========================================
            --- HAMBURGER DROPDOWN MENU ---
            ========================================== */}
        {showMenu && (
          <Modal transparent animationType="fade" visible={showMenu} onRequestClose={() => setShowMenu(false)}>
            <Pressable style={[styles.menuOverlay, { alignItems: 'center' }]} onPress={() => setShowMenu(false)}>
              <View style={{ width: columnWidth, position: 'relative' }}>
                <Pressable style={styles.menuDropdownContainer} onPress={(e) => e?.stopPropagation?.()}>
                  <TouchableOpacity
                    style={styles.menuUserHeader}
                    activeOpacity={0.8}
                    onPress={() => {
                      setProfileOpenedFromSettings(false);
                      setShowMenu(false);
                      openProfile();
                    }}
                  >
                    <View style={styles.menuAvatarCircle}>
                      {therapistProfile.photoUri ? (
                        <Image source={{ uri: therapistProfile.photoUri }} style={{ width: 38, height: 38, borderRadius: 19 }} />
                      ) : (
                        <Text style={styles.menuAvatarText}>{therapistProfile.name.charAt(0)}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.menuUserName} numberOfLines={1}>{therapistProfile.fullName}</Text>
                      <Text style={styles.menuUserRole} numberOfLines={1}>{therapistProfile.title}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.menuSectionDivider} />

                  <TouchableOpacity
                    style={styles.menuOptionRow}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="View profile and credentials"
                    onPress={() => {
                      setProfileOpenedFromSettings(false);
                      setShowMenu(false);
                      openProfile();
                    }}
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
                    onPress={() => {
                      setShowMenu(false);
                      setShowSettingsModal(true);
                    }}
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
                </Pressable>
              </View>
            </Pressable>
          </Modal>
        )}

        {/* ==========================================
            --- NOTIFICATIONS POPOVER ---
            ========================================== */}
        {showNotificationsDropdown && (
          <Modal transparent animationType="fade" visible={showNotificationsDropdown} onRequestClose={() => setShowNotificationsDropdown(false)}>
            <Pressable style={[styles.menuOverlay, { alignItems: 'center' }]} onPress={() => setShowNotificationsDropdown(false)}>
              <View style={{ width: columnWidth, position: 'relative' }}>
                <Pressable style={styles.notifDropdownContainer} onPress={(e) => e?.stopPropagation?.()}>
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
                </Pressable>
              </View>
            </Pressable>
          </Modal>
        )}

        {/* ==========================================
            --- SETTINGS MODAL (Screenshot 2) ---
            ========================================== */}
        <Modal
          visible={showSettingsModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => sessionToRevoke ? setSessionToRevoke(null) : setShowSettingsModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: wide ? '#E2E8F0' : colors.bgSecondary, alignItems: 'center' }}>
            <View style={{ flex: 1, width: columnWidth, backgroundColor: colors.bgSecondary }}>
              <SafeAreaView style={[styles.settingsModalContainer, { backgroundColor: colors.bgSecondary }]} edges={['top']}>
            {/* Header Row */}
            <View style={styles.newHeaderRow}>
              <TouchableOpacity
                onPress={() => setShowSettingsModal(false)}
                style={styles.newBackButton}
                accessibilityLabel="Back"
              >
                <ChevronLeft size={22} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.newHeaderTitle}>Settings</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.settingsScrollContent}>
              {/* Top Profile Card */}
              <TouchableOpacity
                style={styles.newProfileCard}
                activeOpacity={0.8}
                onPress={() => {
                  setProfileOpenedFromSettings(true);
                  setShowSettingsModal(false);
                  openProfile();
                }}
              >
                <View style={styles.newProfileAvatar}>
                  {therapistProfile.photoUri ? (
                    <Image source={{ uri: therapistProfile.photoUri }} style={styles.newProfileAvatarImg} />
                  ) : (
                    <Text style={styles.newProfileAvatarText}>A</Text>
                  )}
                </View>
                <View style={styles.newProfileInfo}>
                  <View style={styles.newProfileNameRow}>
                    <Text style={styles.newProfileName}>{therapistProfile.fullName}</Text>
                    <View style={styles.newVerifiedBadge}>
                      <Check size={10} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  </View>
                  <Text style={styles.newProfileSubtitle}>
                    {therapistProfile.license} {therapistProfile.title}
                  </Text>
                  <Text style={styles.newProfileHint}>Tap to edit credentials</Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Notifications Section */}
              <View style={styles.newSectionHeader}>
                <Bell size={18} color={colors.text} />
                <Text style={styles.newSectionTitle}>Notifications</Text>
              </View>
              <View style={styles.newCard}>
                <View style={styles.newToggleRow}>
                  <View style={styles.newToggleRowCopy}>
                    <Text style={styles.newRowTitle}>New Recordings</Text>
                    <Text style={styles.newRowSubtitle}>When a child or parent submits</Text>
                  </View>
                  <Switch
                    value={newRecordingsToggle}
                    onValueChange={(val) => {
                      setNewRecordingsToggle(val);
                      triggerToast(`New recordings alerts ${val ? 'enabled' : 'disabled'}`);
                    }}
                    trackColor={{ false: colors.isDark ? '#334155' : '#CBD5E1', true: '#22C55E' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.newDivider} />

                <View style={styles.newToggleRow}>
                  <View style={styles.newToggleRowCopy}>
                    <Text style={styles.newRowTitle}>Follow-Up Alerts</Text>
                    <Text style={styles.newRowSubtitle}>Students who need practice follow-up</Text>
                  </View>
                  <Switch
                    value={followUpAlertsToggle}
                    onValueChange={(val) => {
                      setFollowUpAlertsToggle(val);
                      triggerToast(`Follow-up alerts ${val ? 'enabled' : 'disabled'}`);
                    }}
                    trackColor={{ false: colors.isDark ? '#334155' : '#CBD5E1', true: '#22C55E' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.newDivider} />

                <View style={styles.newToggleRow}>
                  <View style={styles.newToggleRowCopy}>
                    <Text style={styles.newRowTitle}>Ready to level up</Text>
                    <Text style={styles.newRowSubtitle}>A child reaches your threshold</Text>
                  </View>
                  <Switch
                    value={readyToLevelUpToggle}
                    onValueChange={(val) => {
                      setReadyToLevelUpToggle(val);
                      triggerToast(`Level up alerts ${val ? 'enabled' : 'disabled'}`);
                    }}
                    trackColor={{ false: colors.isDark ? '#334155' : '#CBD5E1', true: '#22C55E' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.newDivider} />

                <View style={styles.newToggleRow}>
                  <View style={styles.newToggleRowCopy}>
                    <Text style={styles.newRowTitle}>Missed Exercises</Text>
                    <Text style={styles.newRowSubtitle}>Alert after 3 consecutive missed practice days</Text>
                  </View>
                  <Switch
                    value={missedExercisesToggle}
                    onValueChange={(val) => {
                      setMissedExercisesToggle(val);
                      triggerToast(`Missed exercises alerts ${val ? 'enabled' : 'disabled'}`);
                    }}
                    trackColor={{ false: colors.isDark ? '#334155' : '#CBD5E1', true: '#22C55E' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {/* Appearance Section */}
              <View style={styles.newSectionHeader}>
                <Text style={styles.newSectionTitle}>Appearance</Text>
              </View>
              <View style={styles.newCard}>
                <View style={styles.newThemeRow}>
                  <View style={styles.newThemeLeft}>
                    <SunMoon size={18} color={colors.text} />
                    <Text style={styles.newRowTitle}>Theme</Text>
                  </View>
                  <View style={styles.newThemeSegmentControl}>
                    {(['light', 'dark'] as const).map((mode) => (
                      <TouchableOpacity
                        key={mode}
                        style={[
                          styles.newThemeSegmentBtn,
                          themeMode === mode && styles.newThemeSegmentBtnActive,
                        ]}
                        onPress={() => {
                          setThemeMode(mode);
                          triggerToast(
                            `${mode.charAt(0).toUpperCase() + mode.slice(1)} theme enabled`
                          );
                        }}
                      >
                        <Text
                          style={[
                            styles.newThemeSegmentText,
                            themeMode === mode && styles.newThemeSegmentTextActive,
                          ]}
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Privacy & Security Section */}
              <View style={styles.newSectionHeader}>
                <Lock size={18} color={colors.text} />
                <Text style={styles.newSectionTitle}>Privacy & Security</Text>
              </View>
              <View style={styles.newCard}>
                <View style={styles.newToggleRow}>
                  <View style={styles.newShieldIcon}>
                    <ShieldCheck size={26} color="#22C55E" />
                  </View>
                  <View style={styles.newToggleRowCopy}>
                    <Text style={styles.newRowTitle}>Two-Factor Authentication</Text>
                    <Text style={styles.newRowSubtitle}>Required for pediatric audio playback</Text>
                  </View>
                  <Switch
                    value={twoFactorAuthToggle}
                    onValueChange={(val) => {
                      setTwoFactorAuthToggle(val);
                      triggerToast(`Two-factor authentication ${val ? 'enabled' : 'disabled'}`);
                    }}
                    trackColor={{ false: colors.isDark ? '#334155' : '#CBD5E1', true: '#22C55E' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              <Text style={styles.newSubSectionTitle}>Active Mobile Session</Text>
              <View style={styles.newCard}>
                {activeSessions.map((session, index) => (
                  <View key={session.id}>
                    <View style={styles.newSessionRow}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.newRowTitle}>{session.device}</Text>
                          {session.isCurrent ? (
                            <View style={styles.newThisDeviceBadge}>
                              <Text style={styles.newThisDeviceText}>This Device</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.newRowSubtitle}>{session.location} • {session.lastActive}</Text>
                      </View>
                      {!session.isCurrent ? (
                        <TouchableOpacity
                          accessibilityRole="button"
                        onPress={() => { setSessionNotice(''); setSessionToRevoke(session); }}
                          style={styles.newRevokeBtn}
                        >
                          <Text style={styles.newRevokeBtnText}>Revoke</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    {index < activeSessions.length - 1 ? <View style={styles.newDivider} /> : null}
                  </View>
                ))}
              </View>

              {sessionNotice ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.newRowSubtitle, { marginTop: 6 }]}>{sessionNotice}</Text> : null}

              {/* About Help Section */}
              <View style={styles.newSectionHeader}>
                <Text style={styles.newSectionTitle}>About Help</Text>
              </View>
              <View style={styles.newCard}>
                <View style={styles.newAboutRow}>
                  <Text style={styles.newRowTitle}>Help center</Text>
                  <Text style={styles.newRowSubtitle}>Guides and FAQs</Text>
                </View>
                <View style={styles.newDivider} />
                <View style={styles.newAboutRow}>
                  <Text style={styles.newRowTitle}>Contact support</Text>
                  <Text style={styles.newRowSubtitle}>We reply within a day</Text>
                </View>
                <View style={styles.newDivider} />
                <View style={styles.newAboutRow}>
                  <Text style={styles.newRowTitle}>Terms & privacy policy</Text>
                  <Text style={styles.newRowSubtitle}>Updated this year</Text>
                </View>
              </View>

              {/* Log Out Button */}
              <TouchableOpacity
                style={styles.newSignOutBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setShowSettingsModal(false);
                  setShowLogoutConfirm(true);
                }}
              >
                <LogOut size={18} color={colors.isDark ? '#FED7AA' : '#C48B5A'} style={{ marginRight: 8 }} />
                <Text style={styles.newSignOutBtnText}>Log Out</Text>
              </TouchableOpacity>
            </ScrollView>
          {sessionToRevoke ? (
              <SessionRevokeWarning
                device={sessionToRevoke.device}
                isDark={isDark}
                onCancel={() => setSessionToRevoke(null)}
                onConfirm={() => {
                  handleRevokeSession(sessionToRevoke.id);
                  setSessionToRevoke(null);
                }}
              />
            ) : null}
          </SafeAreaView>
            </View>
          </View>
        </Modal>

        {/* ==========================================
            --- PROFILE & CREDENTIALS MODAL (Screenshot 1) ---
            ========================================== */}
        <Modal
          visible={showProfileModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setShowProfileModal(false);
            if (profileOpenedFromSettings) {
              setShowSettingsModal(true);
              setProfileOpenedFromSettings(false);
            }
          }}
        >
          <View style={{ flex: 1, backgroundColor: wide ? '#E2E8F0' : colors.bgSecondary, alignItems: 'center' }}>
            <View style={{ flex: 1, width: columnWidth, backgroundColor: colors.bgSecondary }}>
              <SafeAreaView style={[styles.settingsModalContainer, { backgroundColor: colors.bgSecondary }]} edges={['top']}>
            {/* Top User Summary Card (Screenshot 1 Top Header) */}
            <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 }}>
              <View style={[styles.newProfileCard, { paddingVertical: 10 }]}>
                <View style={[styles.newProfileAvatar, { width: 40, height: 40, borderRadius: 20 }]}>
                  {editProfileForm.photoUri ? (
                    <Image source={{ uri: editProfileForm.photoUri }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                  ) : (
                    <Text style={[styles.newProfileAvatarText, { fontSize: 17 }]}>{editProfileForm.name.charAt(0) || 'A'}</Text>
                  )}
                </View>
                <View style={styles.newProfileInfo}>
                  <Text style={styles.newProfileName}>{therapistProfile.fullName}</Text>
                  <Text style={styles.newProfileSubtitle}>
                    {therapistProfile.license} {therapistProfile.title}
                  </Text>
                </View>
              </View>
            </View>

            {/* Header Row */}
            <View style={styles.newHeaderRow}>
              <TouchableOpacity
                onPress={() => {
                  setShowProfileModal(false);
                  if (profileOpenedFromSettings) {
                    setShowSettingsModal(true);
                    setProfileOpenedFromSettings(false);
                  }
                }}
                style={styles.newBackButton}
                accessibilityLabel="Back"
              >
                <ChevronLeft size={22} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.profileHeading}>
                <Text accessibilityRole="header" style={styles.newHeaderTitle}>Profile & Credentials</Text>
                <Text style={styles.profileMode}>{editingProfile ? 'Editing profile' : 'Profile overview'}</Text>
              </View>
            </View>

            {editingProfile && (
              <ProfileEditWarning isDark={isDark} style={{ marginHorizontal: 16 }} />
            )}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.settingsScrollContent}>
              {/* Upload Photo Card */}
              <TouchableOpacity
                style={styles.newUploadPhotoCard}
                activeOpacity={0.8}
                onPress={handlePickPhoto}
                disabled={!editingProfile}
              >
                <View style={styles.newPhotoAvatarWrapper}>
                  <View style={styles.newPhotoAvatar}>
                    {editProfileForm.photoUri ? (
                      <Image source={{ uri: editProfileForm.photoUri }} style={styles.newPhotoAvatarImg} />
                    ) : (
                      <Text style={styles.newPhotoAvatarText}>A</Text>
                    )}
                  </View>
                  <View style={styles.newCameraBadge}>
                    <Camera size={14} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={styles.newUploadPhotoLabel}>{editingProfile ? 'Upload Photo' : 'Profile photo'}</Text>
              </TouchableOpacity>

              {/* Profile Section */}
              <Text style={styles.newSectionTitleStandalone}>Profile</Text>
              <View style={styles.newCard}>
                <View style={styles.newProfileFieldRow}>
                  <Text style={styles.newFieldLabel}>Name</Text>
                  <TextInput
                    style={styles.newFieldInput}
                    accessibilityLabel="Name"
                    editable={editingProfile}
                    value={editProfileForm.name}
                    onChangeText={(text) =>
                      setEditProfileForm((prev) => ({
                        ...prev,
                        name: text,
                        fullName: `${text}, ${prev.credentials}`,
                      }))
                    }
                    placeholder="Dr. Ameer Andres"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={styles.newDivider} />

                <View style={styles.newProfileFieldRow}>
                  <Text style={styles.newFieldLabel}>Professional Title</Text>
                  <TextInput
                    style={styles.newFieldInput}
                    accessibilityLabel="Professional title"
                    editable={editingProfile}
                    value={editProfileForm.title}
                    onChangeText={(text) => setEditProfileForm((prev) => ({ ...prev, title: text }))}
                    placeholder="Speech-Language Pathologist"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={styles.newDivider} />

                <View style={styles.newProfileFieldRow}>
                  <Text style={styles.newFieldLabel}>Contact Number</Text>
                  <TextInput
                    style={styles.newFieldInput}
                    accessibilityLabel="Contact number"
                    editable={editingProfile}
                    value={editProfileForm.contact}
                    onChangeText={(text) => setEditProfileForm((prev) => ({ ...prev, contact: text }))}
                    placeholder="+63 9000 000 000"
                    keyboardType="phone-pad"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={styles.newDivider} />

                <View style={[styles.newProfileFieldRow, styles.readOnlyCredential]}>
                  <Text style={styles.newFieldLabel}>PRC / Licensed Number</Text>
                  <Text style={[styles.newFieldInput, styles.readOnlyCredentialValue]}>{therapistProfile.license || '—'}</Text>
                </View>
                <View style={styles.newDivider} />

                <View style={[styles.newProfileFieldRow, styles.readOnlyCredential]}>
                  <Text style={styles.newFieldLabel}>Clinic/School</Text>
                  <Text style={[styles.newFieldInput, styles.readOnlyCredentialValue]}>{therapistProfile.clinic || CENTER_NAME}</Text>
                </View>
              </View>

              {/* Save Credentials Button */}
              <View style={styles.newSaveContainer}>
                <TouchableOpacity
                  style={styles.newSaveCredentialsBtn}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                onPress={editingProfile ? handleSaveProfile : startProfileEditing}
                >
                  <Text style={styles.newSaveCredentialsBtnText}>{editingProfile ? 'Save Credentials' : 'Edit profile'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
            </View>
          </View>
        </Modal>

        {/* ==========================================
            --- LOGOUT CONFIRM MODAL ---
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
        {(toastMessage || actionNotice) && (
          <View style={styles.toastContainer} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Text style={styles.toastText}>{toastMessage ?? actionNotice?.message}</Text>
          </View>
        )}

      </View>
    </View>
  );
}

// ==========================================
// --- STYLESHEET ---
// ==========================================
function createStyles(colors: ReturnType<typeof getThemeColors>) {
  return StyleSheet.create({
    topHeader: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
    iconButton: { padding: 8 },
    appTitle: { fontFamily: 'SourGummy-Bold', fontSize: 22 },
    notificationDot: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
    
    menuOverlay: { flex: 1, backgroundColor: colors.menuOverlay },
    menuDropdownContainer: { position: 'absolute', top: Platform.OS === 'android' ? 76 : 56, left: 14, width: 250, backgroundColor: colors.card, borderRadius: 16, padding: 10, shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 8, borderWidth: 1, borderColor: colors.border },
    menuUserHeader: { flexDirection: 'row', alignItems: 'center', padding: 6, borderRadius: 10 },
    menuAvatarCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.isDark ? '#082F49' : '#E0F2FE', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    menuAvatarText: { fontSize: 16, fontWeight: '800', color: colors.isDark ? '#38BDF8' : '#0284C7' },
    menuUserName: { fontSize: 13, fontWeight: '700', color: colors.text },
    menuUserRole: { fontSize: 11, color: colors.textSub },
    menuSectionDivider: { height: 1, backgroundColor: colors.divider, marginVertical: 6 },
    menuOptionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10 },
    menuIconCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.isDark ? '#0F172A' : '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    menuOptionLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
    menuOptionChevron: { fontSize: 16, color: colors.textMuted, fontWeight: '700' },

    notifDropdownContainer: { position: 'absolute', top: Platform.OS === 'android' ? 76 : 56, right: 14, width: 320, backgroundColor: colors.card, borderRadius: 18, padding: 14, shadowColor: '#000', shadowOpacity: 0.14, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 8, borderWidth: 1, borderColor: colors.border },
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

    settingsModalContainer: { flex: 1 },
    settingsScrollContent: { padding: 16, paddingBottom: 40 },

    // --- Exact Profile & Settings Modal Styles ---
    newHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    newBackButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newHeaderTitle: {
      fontFamily: 'SourGummy-Bold',
      fontSize: 20,
      color: colors.text,
    },
    profileHeading: { flex: 1, minWidth: 0, gap: 2 },
    profileMode: { color: colors.heading, fontSize: 13, fontWeight: '600' },
    newProfileCard: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    newProfileAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.isDark ? '#082F49' : '#CFE4F6',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    newProfileAvatarImg: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    newProfileAvatarText: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.isDark ? '#38BDF8' : '#0284C7',
    },
    newProfileInfo: {
      flex: 1,
      gap: 2,
    },
    newProfileNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    newProfileName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    newVerifiedBadge: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#22C55E',
      alignItems: 'center',
      justifyContent: 'center',
    },
    newProfileSubtitle: {
      fontSize: 12,
      color: colors.textSub,
    },
    newProfileHint: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    newSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 14,
      marginBottom: 4,
    },
    newSectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    newSectionTitleStandalone: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginTop: 14,
      marginBottom: 6,
    },
    newSubSectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSub,
      marginTop: 12,
      marginBottom: 4,
    },
    newCard: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: 'hidden',
    },
    newToggleRow: {
      minHeight: 56,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    newToggleRowCopy: {
      flex: 1,
      gap: 2,
    },
    newRowTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    newRowSubtitle: {
      fontSize: 12,
      color: colors.textSub,
    },
    newDivider: {
      height: 1,
      backgroundColor: colors.divider,
    },
    newShieldIcon: {
      marginRight: 2,
    },
    newThemeRow: {
      minHeight: 54,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    newThemeLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    newThemeSegmentControl: {
      flexDirection: 'row',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.isDark ? '#0F172A' : '#F8FAFC',
      padding: 2,
      gap: 2,
    },
    newThemeSegmentBtn: {
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newThemeSegmentBtnActive: {
      backgroundColor: colors.isDark ? 'rgba(196,139,90,0.28)' : 'rgba(196,139,90,0.18)',
    },
    newThemeSegmentText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSub,
    },
    newThemeSegmentTextActive: {
      color: colors.isDark ? '#FED7AA' : '#C48B5A',
      fontWeight: '700',
    },
    newSessionRow: {
      minHeight: 54,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    newThisDeviceBadge: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
      backgroundColor: colors.isDark ? 'rgba(34,197,94,0.22)' : 'rgba(34,197,94,0.15)',
    },
    newThisDeviceText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#22C55E',
    },
    newRevokeBtn: {
      borderWidth: 1,
      borderColor: colors.isDark ? '#7F1D1D' : '#FCA5A5',
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 4,
      backgroundColor: colors.isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)',
    },
    newRevokeBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.isDark ? '#FCA5A5' : '#DC2626',
    },
    newAboutRow: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 2,
    },
    newSignOutBtn: {
      borderWidth: 1,
      borderColor: colors.isDark ? '#C48B5A' : '#C48B5A',
      backgroundColor: colors.isDark ? 'rgba(196,139,90,0.14)' : 'rgba(196,139,90,0.08)',
      borderRadius: 12,
      height: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      alignSelf: 'center',
      width: 200,
      marginTop: 14,
      marginBottom: 24,
    },
    newSignOutBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.isDark ? '#FED7AA' : '#C48B5A',
    },
    newUploadPhotoCard: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingVertical: 24,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    newPhotoAvatarWrapper: {
      position: 'relative',
    },
    newPhotoAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.isDark ? '#082F49' : '#CFE4F6',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    newPhotoAvatarImg: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    newPhotoAvatarText: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.isDark ? '#38BDF8' : '#0284C7',
    },
    newCameraBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.card,
      backgroundColor: colors.isDark ? '#334155' : '#0F172A',
      alignItems: 'center',
      justifyContent: 'center',
    },
    newUploadPhotoLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    newProfileFieldRow: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 4,
    },
    readOnlyCredential: { backgroundColor: colors.isDark ? '#263241' : '#F1F3F5' },
    readOnlyCredentialValue: { color: colors.textSub },
    newFieldLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSub,
    },
    newFieldInput: {
      fontSize: 14,
      color: colors.text,
      padding: 0,
      minHeight: 22,
    },
    newSaveContainer: {
      alignItems: 'center',
      marginTop: 16,
      marginBottom: 28,
    },
    newSaveCredentialsBtn: {
      borderWidth: 1,
      borderColor: colors.isDark ? '#C48B5A' : '#C48B5A',
      backgroundColor: colors.isDark ? 'rgba(196,139,90,0.18)' : 'rgba(196,139,90,0.12)',
      borderRadius: 10,
      paddingHorizontal: 36,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newSaveCredentialsBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.isDark ? '#FED7AA' : '#C48B5A',
    },

    modalOverlay: { flex: 1, backgroundColor: colors.modalOverlay, justifyContent: 'center', padding: 16 },
    modalContent: { backgroundColor: colors.card, borderRadius: 20, padding: 18, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 8 },
    modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    modalPatientName: { fontSize: 15, fontWeight: '700', color: colors.text },
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
