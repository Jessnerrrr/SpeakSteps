import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Switch,
  Pressable,
  useWindowDimensions,
} from 'react-native';

const RECENT_REQUESTS_DASHBOARD = [
  { id: '1', name: 'Khyl Shervin Sude', role: 'Therapist', time: 'Today AT 11:12 AM', status: 'Pending', avatar: require('../../../assets/images/person1.jpg') },
  { id: '2', name: 'Angelica Vega', role: 'Teacher', time: 'Today AT 11:12 AM', status: 'Pending', avatar: require('../../../assets/images/person2.jpg') },
  { id: '3', name: 'Jhonas Elsisura', role: 'Therapist', time: 'Today AT 11:12 AM', status: 'Pending', avatar: require('../../../assets/images/person3.jpg') },
];

const MOCK_REQUESTS = [
  { id: '1', name: 'Ana Reyes', email: 'ana.reyes@example.com', role: 'Patient', child: 'Lian Reyes, age 5', level: '1 - Sounds', studentId: 'S-2026-003', verification: 'Name differs - record: Lian Cruz', contact: '0917 555 0142', roleColor: '#D97706', roleBg: '#FEF3C7', avatar: require('../../../assets/images/person4.png') },
  { id: '2', name: 'Mark Dizon', email: 'mark.dizon@example.com', role: 'Teacher', child: 'Lian Reyes, age 5', level: '1 - Sounds', studentId: 'S-2026-003', verification: 'Name differs - record: Lian Cruz', contact: '0917 555 0142', roleColor: '#16A34A', roleBg: '#DCFCE7', avatar: require('../../../assets/images/person1.jpg') },
];

const MOCK_ACCOUNTS = [
  { id: '1', name: 'Ana Reyes', email: 'ana.reyes@example.com', role: 'Patient', status: 'Active', roleColor: '#D97706', roleBg: '#FEF3C7', statusColor: '#16A34A', statusBg: '#DCFCE7', avatar: require('../../../assets/images/person3.jpg') },
  { id: '2', name: 'John Doe', email: 'john.doe@example.com', role: 'Teacher', status: 'Active', roleColor: '#16A34A', roleBg: '#DCFCE7', statusColor: '#16A34A', statusBg: '#DCFCE7', avatar: require('../../../assets/images/person4.png') },
];

const INITIAL_NOTIFICATIONS = [
  { id: 'notif-1', name: 'System', action: 'New Therapist Registration', detail: 'Khyl Shervin Sude requested access.', time: '5m ago', unread: true },
  { id: 'notif-2', name: 'Security', action: 'Account Suspended', detail: 'Patient account linked to Ana Reyes suspended due to inactivity.', time: '1h ago', unread: true },
  { id: 'notif-3', name: 'System', action: 'Database Backup', detail: 'Weekly cloud backup completed successfully.', time: '3h ago', unread: false },
];

export default function AdminDashboardScreen() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'request' | 'accounts'>('dashboard');
  const [requestSubTab, setRequestSubTab] = useState('All');
  const [accountSubTab, setAccountSubTab] = useState('All');

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    confirmText: '',
    confirmColor: '#0284C7',
    iconName: 'warning',
    onConfirm: () => {},
  });

  // ==========================================
  // --- MENU & SETTINGS MODAL STATES ---
  // ==========================================
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notificationsFilter, setNotificationsFilter] = useState<'All' | 'Unread'>('All');
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  
  // Settings Toggles
  const [newRequestToggle, setNewRequestToggle] = useState(true);
  const [securityAlertsToggle, setSecurityAlertsToggle] = useState(true);
  
  // Desktop check
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('../../../assets/Inter-Regular.ttf'),
    'Inter-Medium': require('../../../assets/Inter-Medium.ttf'),
    'Inter-Bold': require('../../../assets/Inter-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  // Helper to trigger custom warning alerts
  const triggerAlert = (title: string, message: string, confirmText: string, confirmColor: string, iconName: any, onConfirm: () => void) => {
    setShowMenu(false); 
    setShowSettingsModal(false);
    setAlertConfig({ title, message, confirmText, confirmColor, iconName, onConfirm });
    setAlertVisible(true);
  };

  // ==========================================
  // --- UNIFIED TOP HEADER FOR ALL TABS ---
  // ==========================================
  const renderTopHeader = (title: string, showBackButton = false) => (
    <View style={styles.topHeader}>
      <View style={styles.headerLeft}>
        {showBackButton ? (
          <TouchableOpacity onPress={() => setActiveTab('dashboard')} style={styles.backButtonBlue}>
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.hamburgerBtn}
            onPress={() => {
              setShowNotificationsDropdown(false);
              setShowMenu(!showMenu);
            }}
          >
            <Ionicons name="menu" size={28} color="#0284C7" />
          </TouchableOpacity>
        )}
        {!showBackButton && <Image source={require('../../../assets/images/bird-logo.gif')} style={styles.logoImage} contentFit="contain" />}
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.headerIconBtn} 
          onPress={() => {
            setShowMenu(false);
            setShowNotificationsDropdown(!showNotificationsDropdown);
          }}
        >
          <Ionicons name="notifications-outline" size={24} color="#0284C7" />
          {notifications.some((n) => n.unread) && <View style={styles.notificationDot} />}
        </TouchableOpacity>
        
        {/* Desktop Navbar Links */}
        {isDesktop && (
          <View style={styles.desktopNavLinks}>
            <TouchableOpacity onPress={() => setActiveTab('dashboard')} style={[styles.desktopNavLink, activeTab === 'dashboard' && styles.desktopNavLinkActive]}>
              <Text style={[styles.desktopNavText, activeTab === 'dashboard' && styles.desktopNavTextActive]}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('request')} style={[styles.desktopNavLink, activeTab === 'request' && styles.desktopNavLinkActive]}>
              <Text style={[styles.desktopNavText, activeTab === 'request' && styles.desktopNavTextActive]}>Requests</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('accounts')} style={[styles.desktopNavLink, activeTab === 'accounts' && styles.desktopNavLinkActive]}>
              <Text style={[styles.desktopNavText, activeTab === 'accounts' && styles.desktopNavTextActive]}>Accounts</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderDashboard = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}>
      {renderTopHeader('Welcome, Admin')}

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Active Accounts</Text>
        <Text style={styles.heroNumber}>4</Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressSegment, { flex: 2, backgroundColor: '#0284C7' }]} />
          <View style={[styles.progressSegment, { flex: 1, backgroundColor: '#16A34A' }]} />
          <View style={[styles.progressSegment, { flex: 1, backgroundColor: '#F59E0B' }]} />
          <View style={[styles.progressSegment, { flex: 1, backgroundColor: '#DC2626' }]} />
        </View>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#0284C7' }]} /><Text style={styles.legendText}>Therapist</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} /><Text style={styles.legendText}>Teachers</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} /><Text style={styles.legendText}>Patient</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} /><Text style={styles.legendText}>Pending</Text></View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <TouchableOpacity style={[styles.statCard, { width: isDesktop ? '23%' : '48%' }]} activeOpacity={0.7} onPress={() => setActiveTab('accounts')}>
          <View style={styles.statCardTopRow}>
            <View style={styles.iconWrapper}><Image source={require('../../../assets/images/admin-therapist.png')} style={styles.statIconImage} contentFit="contain" /></View>
            <Text style={styles.statNumber}>2</Text>
          </View>
          <View style={styles.statCardBottomRow}>
            <View><Text style={styles.statLabel}>Therapist</Text><Text style={styles.statSubLabel}>accounts</Text></View>
            <View style={[styles.chevronCircle, { backgroundColor: '#0284C7' }]}><Ionicons name="chevron-forward" size={14} color="#FFFFFF" /></View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.statCard, { width: isDesktop ? '23%' : '48%' }]} activeOpacity={0.7} onPress={() => setActiveTab('accounts')}>
          <View style={styles.statCardTopRow}>
            <View style={styles.iconWrapper}><Image source={require('../../../assets/images/admin-teacher.png')} style={styles.statIconImage} contentFit="contain" /></View>
            <Text style={styles.statNumber}>1</Text>
          </View>
          <View style={styles.statCardBottomRow}>
            <View><Text style={styles.statLabel}>Teachers</Text><Text style={styles.statSubLabel}>accounts</Text></View>
            <View style={[styles.chevronCircle, { backgroundColor: '#0284C7' }]}><Ionicons name="chevron-forward" size={14} color="#FFFFFF" /></View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.statCard, { width: isDesktop ? '23%' : '48%' }]} activeOpacity={0.7} onPress={() => setActiveTab('accounts')}>
          <View style={styles.statCardTopRow}>
            <View style={styles.iconWrapper}><Image source={require('../../../assets/images/admin-patient.png')} style={styles.statIconImage} contentFit="contain" /></View>
            <Text style={styles.statNumber}>1</Text>
          </View>
          <View style={styles.statCardBottomRow}>
            <View><Text style={styles.statLabel}>Patient</Text><Text style={styles.statSubLabel}>accounts</Text></View>
            <View style={[styles.chevronCircle, { backgroundColor: '#0284C7' }]}><Ionicons name="chevron-forward" size={14} color="#FFFFFF" /></View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.statCard, { width: isDesktop ? '23%' : '48%' }]} activeOpacity={0.7} onPress={() => setActiveTab('request')}>
          <View style={styles.statCardTopRow}>
            <View style={styles.iconWrapper}><Image source={require('../../../assets/images/admin-pending.png')} style={styles.statIconImage} contentFit="contain" /></View>
            <Text style={styles.statNumber}>1</Text>
          </View>
          <View style={styles.statCardBottomRow}>
            <View><Text style={styles.statLabel}>Pending request</Text><Text style={styles.statSubLabel}>accounts</Text></View>
            <View style={[styles.chevronCircle, { backgroundColor: '#0284C7' }]}><Ionicons name="chevron-forward" size={14} color="#FFFFFF" /></View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.recentSectionHeader}>
        <Text style={styles.recentTitle}>Recent Requests</Text>
        <TouchableOpacity onPress={() => setActiveTab('request')}><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
      </View>

      <View style={styles.recentListContainer}>
        {RECENT_REQUESTS_DASHBOARD.map((request) => (
          <TouchableOpacity key={request.id} style={styles.requestItemDashboard} activeOpacity={0.7}>
            <Image source={request.avatar} style={styles.requestAvatar} contentFit="cover" />
            <View style={styles.requestDetails}>
              <Text style={styles.requestName}>{request.name}</Text>
              <Text style={styles.requestSubtext}>{request.role}   {request.time}</Text>
            </View>
            <View style={styles.requestRightActions}>
              <View style={styles.pendingBadgeDashboard}><Text style={styles.pendingBadgeTextDashboard}>{request.status}</Text></View>
              <View style={[styles.chevronCircle, { backgroundColor: '#0284C7', marginLeft: 8 }]}><Ionicons name="chevron-forward" size={14} color="#FFFFFF" /></View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderRequests = () => (
    <View style={styles.tabContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}>
        
        {/* Header and Sub-tabs moved inside the constrained scroll view */}
        {renderTopHeader('Requests', true)}
        
        <View style={styles.subTabsContainer}>
          {['All', 'Pending (3)', 'Approved (4)', 'Rejected (0)'].map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setRequestSubTab(tab)} style={styles.subTabBtn}>
              <Text style={[styles.subTabText, requestSubTab === tab && styles.subTabTextActive]}>{tab}</Text>
              {requestSubTab === tab && <View style={styles.subTabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
        
        {MOCK_REQUESTS.map((req, i) => (
          <View key={i} style={styles.fullCard}>
            <View style={styles.cardHeaderRow}>
              <Image source={req.avatar} style={styles.cardAvatarLarge} contentFit="cover" />
              <View style={styles.cardHeaderInfo}>
                <Text style={styles.cardNameLarge}>{req.name}</Text>
                <Text style={styles.cardEmailText}>{req.email}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: req.roleBg }]}>
                <Text style={[styles.roleBadgeText, { color: req.roleColor }]}>{req.role}</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.cardBody}>
              <Text style={styles.detailText}><Text style={styles.detailLabel}>Child:</Text> {req.child}</Text>
              <Text style={styles.detailText}><Text style={styles.detailLabel}>Level:</Text> {req.level}</Text>
              <Text style={styles.detailText}><Text style={styles.detailLabel}>Student ID:</Text> {req.studentId}</Text>
              <Text style={styles.detailText}><Text style={styles.detailLabel}>Contact:</Text> {req.contact}</Text>
              
              <View style={styles.warningBox}>
                <Ionicons name="warning-outline" size={16} color="#D97706" />
                <Text style={styles.warningText}>{req.verification}</Text>
              </View>
            </View>

            <View style={styles.cardActionsRow}>
              <TouchableOpacity 
                style={styles.rejectBtn}
                onPress={() => triggerAlert(
                  'Reject Request',
                  `Are you sure you want to reject ${req.name}'s request? This action cannot be undone.`,
                  'Reject',
                  '#EF4444',
                  'close-circle',
                  () => console.log('Rejected:', req.name)
                )}
              >
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.approveBtn}>
                <Text style={styles.approveBtnText}>Approve Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderAccounts = () => (
    <View style={styles.tabContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}>
        
        {/* Header and Sub-tabs moved inside the constrained scroll view */}
        {renderTopHeader('Accounts', true)}
        
        <View style={styles.subTabsContainer}>
          {['All', 'Therapist', 'Teacher', 'Patient'].map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setAccountSubTab(tab)} style={styles.subTabBtn}>
              <Text style={[styles.subTabText, accountSubTab === tab && styles.subTabTextActive]}>{tab}</Text>
              {accountSubTab === tab && <View style={styles.subTabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {MOCK_ACCOUNTS.map((acc, i) => (
          <View key={i} style={styles.fullCard}>
             <View style={styles.cardHeaderRow}>
              <Image source={acc.avatar} style={styles.cardAvatarLarge} contentFit="cover" />
              <View style={styles.cardHeaderInfo}>
                <Text style={styles.cardNameLarge}>{acc.name}</Text>
                <Text style={styles.cardEmailText}>{acc.email}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: acc.roleBg }]}>
                <Text style={[styles.roleBadgeText, { color: acc.roleColor }]}>{acc.role}</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.accountStatusRow}>
              <Text style={styles.detailLabel}>Account Status:</Text>
              <View style={[styles.statusBadge, { backgroundColor: acc.statusBg }]}>
                <Text style={[styles.statusBadgeText, { color: acc.statusColor }]}>{acc.status}</Text>
              </View>
            </View>

            <View style={styles.cardActionsRow}>
              <TouchableOpacity 
                style={styles.editBtn}
                onPress={() => triggerAlert(
                  'Edit Account',
                  `Are you sure you want to modify ${acc.name}'s account settings?`,
                  'Edit Details',
                  '#0284C7',
                  'create',
                  () => console.log('Edit Account:', acc.name)
                )}
              >
                <Ionicons name="create-outline" size={16} color="#0284C7" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.suspendBtn}
                onPress={() => triggerAlert(
                  'Suspend Account',
                  `Are you sure you want to suspend ${acc.name}? They will instantly lose access to the system.`,
                  'Suspend',
                  '#EF4444',
                  'alert-circle',
                  () => console.log('Suspended:', acc.name)
                )}
              >
                <Ionicons name="ban-outline" size={16} color="#DC2626" />
                <Text style={styles.suspendBtnText}>Suspend</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <ImageBackground 
      source={require('../../../assets/images/admin-bg.png')} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="dark-content" />

        <View style={styles.mainWrapper}>
          
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'request' && renderRequests()}
            {activeTab === 'accounts' && renderAccounts()}
          </View>

          {/* MOBILE BOTTOM NAVIGATION */}
          {!isDesktop && (
            <View style={styles.bottomNav}>
              <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('dashboard')}>
                <Ionicons name={activeTab === 'dashboard' ? 'home' : 'home-outline'} size={24} color={activeTab === 'dashboard' ? '#0284C7' : '#94A3B8'} />
                <Text style={[styles.navText, activeTab === 'dashboard' && styles.navTextActive]}>Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('request')}>
                <Ionicons name={activeTab === 'request' ? 'clipboard' : 'clipboard-outline'} size={24} color={activeTab === 'request' ? '#0284C7' : '#94A3B8'} />
                <Text style={[styles.navText, activeTab === 'request' && styles.navTextActive]}>Request</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('accounts')}>
                <Ionicons name={activeTab === 'accounts' ? 'people' : 'people-outline'} size={24} color={activeTab === 'accounts' ? '#0284C7' : '#94A3B8'} />
                <Text style={[styles.navText, activeTab === 'accounts' && styles.navTextActive]}>Accounts</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>

        {/* ==========================================
            --- HAMBURGER DROPDOWN MENU ---
            ========================================== */}
        {showMenu && (
          <Modal transparent animationType="fade" visible={showMenu} onRequestClose={() => setShowMenu(false)}>
            <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
              <View style={[styles.menuDropdownContainer, isDesktop && { top: 76, left: 16 }]}>
                <TouchableOpacity
                  style={styles.menuUserHeader}
                  activeOpacity={0.8}
                  onPress={() => { setShowMenu(false); setShowProfileModal(true); }}
                >
                  <View style={styles.menuAvatarCircle}>
                    <Text style={styles.menuAvatarText}>A</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.menuUserName} numberOfLines={1}>Admin User</Text>
                    <Text style={styles.menuUserRole} numberOfLines={1}>System Administrator</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.menuSectionDivider} />

                <TouchableOpacity style={styles.menuOptionRow} activeOpacity={0.7} onPress={() => { setShowMenu(false); setShowProfileModal(true); }}>
                  <View style={styles.menuIconCircle}>
                    <Ionicons name="person-outline" size={16} color="#0284C7" />
                  </View>
                  <Text style={styles.menuOptionLabel}>Profile</Text>
                  <Text style={styles.menuOptionChevron}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuOptionRow} activeOpacity={0.7} onPress={() => { setShowMenu(false); setShowSettingsModal(true); }}>
                  <View style={styles.menuIconCircle}>
                    <Ionicons name="settings-outline" size={16} color="#0284C7" />
                  </View>
                  <Text style={styles.menuOptionLabel}>Settings</Text>
                  <Text style={styles.menuOptionChevron}>›</Text>
                </TouchableOpacity>

                <View style={styles.menuSectionDivider} />

                <TouchableOpacity
                  style={styles.menuOptionRow}
                  activeOpacity={0.7}
                  onPress={() => triggerAlert(
                    'Log Out',
                    'Are you sure you want to log out of the Admin Dashboard?',
                    'Log Out',
                    '#EF4444',
                    'log-out',
                    () => router.replace('/(admin)/admin-login' as any)
                  )}
                >
                  <View style={[styles.menuIconCircle, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="log-out-outline" size={16} color="#EF4444" />
                  </View>
                  <Text style={[styles.menuOptionLabel, { color: '#DC2626', fontFamily: 'Inter-Bold' }]}>Logout</Text>
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
                        <Text style={styles.notifItemTitle}><Text style={{ fontFamily: 'Inter-Bold' }}>{item.name} </Text>{item.action}</Text>
                        <Text style={styles.notifItemDetail}>{item.detail}</Text>
                      </View>
                      <Text style={styles.notifItemTime}>{item.time}</Text>
                    </View>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.markAllReadBtn} onPress={() => setNotifications(notifications.map(n => ({ ...n, unread: false })))}>
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
          <SafeAreaView style={styles.settingsModalContainer}>
            <View style={styles.settingsTopBar}>
              <Text style={styles.settingsNavTitle}>Admin Settings</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.settingsScrollContent}>
              <View style={styles.settingsProfileHeaderRow}>
                <View style={styles.settingsAvatarCircle}><Text style={styles.settingsAvatarLetter}>A</Text></View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.settingsDoctorName}>Admin User</Text>
                  <Text style={styles.settingsDoctorRole}>System Administrator</Text>
                </View>
              </View>

              <Text style={styles.settingsSectionTitle}>Notifications</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingsCardRow}>
                  <View style={{ flex: 1, marginRight: 10 }}><Text style={styles.settingsRowTitle}>New Account Requests</Text><Text style={styles.settingsRowSub}>Alerts for new signups</Text></View>
                  <Switch value={newRequestToggle} onValueChange={setNewRequestToggle} trackColor={{ false: '#CBD5E1', true: '#0284C7' }} thumbColor="#FFFFFF" />
                </View>
                <View style={styles.settingsRowDivider} />
                <View style={styles.settingsCardRow}>
                  <View style={{ flex: 1, marginRight: 10 }}><Text style={styles.settingsRowTitle}>Security Alerts</Text><Text style={styles.settingsRowSub}>Unusual login attempts</Text></View>
                  <Switch value={securityAlertsToggle} onValueChange={setSecurityAlertsToggle} trackColor={{ false: '#CBD5E1', true: '#0284C7' }} thumbColor="#FFFFFF" />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.settingsLogoutButton} 
                activeOpacity={0.8} 
                onPress={() => triggerAlert('Log Out', 'Are you sure you want to log out?', 'Log Out', '#EF4444', 'log-out', () => router.replace('/(admin)/admin-login' as any))}
              >
                <Text style={styles.settingsLogoutButtonText}>Log Out</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* ==========================================
            --- PROFILE MODAL ---
            ========================================== */}
        <Modal visible={showProfileModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowProfileModal(false)}>
          <SafeAreaView style={styles.settingsModalContainer}>
            <View style={styles.settingsTopBar}>
              <Text style={styles.settingsNavTitle}>Admin Profile</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.settingsScrollContent}>
              <View style={styles.profileHeroCard}>
                <View style={styles.profileBigAvatarCircle}><Text style={styles.profileBigAvatarLetter}>A</Text></View>
                <Text style={styles.profileHeroName}>Admin User</Text>
                <Text style={styles.profileHeroRole}>System Administrator</Text>
                <View style={styles.licenseBadge}><Text style={styles.licenseBadgeText}>Master Access</Text></View>
              </View>
              <Text style={styles.settingsSectionTitle}>System Credentials</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingsCardRow}><View><Text style={styles.settingsRowSub}>Role</Text><Text style={styles.settingsRowTitle}>Global Admin</Text></View></View>
                <View style={styles.settingsRowDivider} />
                <View style={styles.settingsCardRow}><View><Text style={styles.settingsRowSub}>Email Address</Text><Text style={styles.settingsRowTitle}>admin@speaksteps.com</Text></View></View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* ==========================================
            --- PREMIUM CUSTOM WARNING MODAL ---
            ========================================== */}
        <Modal visible={alertVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.alertBox}>
              
              <View style={[styles.alertIconCircle, { backgroundColor: `${alertConfig.confirmColor}15` }]}>
                <Ionicons 
                  name={alertConfig.iconName as any} 
                  size={36} 
                  color={alertConfig.confirmColor} 
                />
              </View>

              <Text style={styles.alertTitle}>{alertConfig.title}</Text>
              <Text style={styles.alertMessage}>{alertConfig.message}</Text>
              
              <View style={styles.alertActions}>
                <TouchableOpacity 
                  style={styles.alertCancelBtn} 
                  onPress={() => setAlertVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.alertCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.alertConfirmBtn, { backgroundColor: alertConfig.confirmColor }]} 
                  onPress={() => {
                    alertConfig.onConfirm();
                    setAlertVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.alertConfirmBtnText}>{alertConfig.confirmText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  safeArea: { flex: 1, backgroundColor: 'transparent' }, 
  mainWrapper: { flex: 1 },
  
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 10 : 20,
    paddingBottom: 100, 
  },
  desktopScrollContent: {
    paddingHorizontal: 40,
    paddingBottom: 40, 
    maxWidth: 1200, 
    alignSelf: 'center', 
    width: '100%',
  },
  
  tabContainer: { flex: 1 },

  // ==========================================
  // --- TOP HEADER (REPLACES DESKTOP SIDEBAR) ---
  // ==========================================
  topHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 0 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  hamburgerBtn: { padding: 8, marginRight: 8 },
  backButtonBlue: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0284C7', justifyContent: 'center', alignItems: 'center', marginRight: 12, elevation: 2 },
  logoImage: { width: 44, height: 44, marginRight: 10 },
  headerTitle: { fontFamily: 'Inter-Bold', fontSize: 24, color: '#0284C7', letterSpacing: -0.5 },
  
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerIconBtn: { padding: 8, marginLeft: 4, position: 'relative' },
  notificationDot: { position: 'absolute', top: 6, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  
  // Desktop Nav Links in Header
  desktopNavLinks: { flexDirection: 'row', marginLeft: 16 },
  desktopNavLink: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginLeft: 8 },
  desktopNavLinkActive: { backgroundColor: '#F0F9FF' },
  desktopNavText: { fontFamily: 'Inter-Medium', fontSize: 14, color: '#64748B' },
  desktopNavTextActive: { fontFamily: 'Inter-Bold', color: '#0284C7' },
  
  // Dashboard Metrics
  heroCard: { backgroundColor: '#0284C7', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#0284C7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
  heroLabel: { fontFamily: 'Inter-Medium', fontSize: 14, color: '#E0F2FE', marginBottom: 4 },
  heroNumber: { fontFamily: 'Inter-Bold', fontSize: 42, color: '#FFFFFF', marginBottom: 16 },
  progressContainer: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: '#FFFFFF', marginBottom: 16 },
  progressSegment: { height: '100%' },
  legendContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  legendText: { fontFamily: 'Inter-Medium', fontSize: 9, color: '#E0F2FE' },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  statCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  iconWrapper: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  statIconImage: { width: 36, height: 36, borderRadius: 8 }, 
  statNumber: { fontFamily: 'Inter-Bold', fontSize: 28, color: '#1E293B', lineHeight: 32 },
  statCardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  statLabel: { fontFamily: 'Inter-Bold', fontSize: 13, color: '#334155' },
  statSubLabel: { fontFamily: 'Inter-Regular', fontSize: 10, color: '#94A3B8' },
  chevronCircle: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  
  recentSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  recentTitle: { fontFamily: 'Inter-Bold', fontSize: 16, color: '#0284C7' },
  viewAllText: { fontFamily: 'Inter-Bold', fontSize: 12, color: '#0284C7' },
  recentListContainer: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 8 },
  requestItemDashboard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  requestAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 }, 
  requestDetails: { flex: 1 },
  requestName: { fontFamily: 'Inter-Medium', fontSize: 13, color: '#1E293B', marginBottom: 4 },
  requestSubtext: { fontFamily: 'Inter-Regular', fontSize: 10, color: '#64748B' },
  requestRightActions: { alignItems: 'flex-end', justifyContent: 'center' },
  pendingBadgeDashboard: { backgroundColor: '#FCE7F3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginBottom: 6 },
  pendingBadgeTextDashboard: { fontFamily: 'Inter-Bold', fontSize: 9, color: '#DB2777' },

  // Mobile Bottom Nav
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 2, borderTopColor: '#0284C7', justifyContent: 'space-around', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 15 : 0 },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navText: { fontFamily: 'Inter-Medium', fontSize: 10, color: '#94A3B8', marginTop: 4 },
  navTextActive: { color: '#0284C7', fontFamily: 'Inter-Bold' },

  // Tab Styles
  subTabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 16, paddingBottom: 4 },
  subTabBtn: { paddingVertical: 12, paddingHorizontal: 10, marginRight: 8, position: 'relative' },
  subTabText: { fontFamily: 'Inter-Medium', fontSize: 12, color: '#64748B' },
  subTabTextActive: { color: '#0284C7', fontFamily: 'Inter-Bold' },
  subTabIndicator: { position: 'absolute', bottom: -1, left: 10, right: 10, height: 3, backgroundColor: '#0284C7', borderRadius: 2 },
  
  // Fully Detailed Cards (Requests & Accounts)
  fullCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  cardAvatarLarge: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  cardHeaderInfo: { flex: 1 },
  cardNameLarge: { fontFamily: 'Inter-Bold', fontSize: 15, color: '#1E293B', marginBottom: 2 },
  cardEmailText: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#64748B' },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  roleBadgeText: { fontFamily: 'Inter-Bold', fontSize: 11 },
  cardDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  
  cardBody: { marginBottom: 16 },
  detailText: { fontFamily: 'Inter-Medium', fontSize: 13, color: '#475569', marginBottom: 6 },
  detailLabel: { fontFamily: 'Inter-Bold', color: '#1E293B' },
  warningBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 10, borderRadius: 8, marginTop: 8 },
  warningText: { fontFamily: 'Inter-Medium', fontSize: 12, color: '#D97706', marginLeft: 8, flex: 1 },
  
  accountStatusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
  statusBadgeText: { fontFamily: 'Inter-Bold', fontSize: 11 },

  cardActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  rejectBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#F1F5F9' },
  rejectBtnText: { fontFamily: 'Inter-Bold', fontSize: 13, color: '#475569' },
  approveBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#0284C7' },
  approveBtnText: { fontFamily: 'Inter-Bold', fontSize: 13, color: '#FFFFFF' },
  
  editBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD' },
  editBtnText: { fontFamily: 'Inter-Bold', fontSize: 13, color: '#0284C7', marginLeft: 6 },
  suspendBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  suspendBtnText: { fontFamily: 'Inter-Bold', fontSize: 13, color: '#DC2626', marginLeft: 6 },

  // ==========================================
  // --- DROP DOWN MENU STYLES ---
  // ==========================================
  menuOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  menuDropdownContainer: { position: 'absolute', top: Platform.OS === 'android' ? 76 : 52, left: 16, width: 240, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 10, shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  menuUserHeader: { flexDirection: 'row', alignItems: 'center', padding: 6, borderRadius: 10 },
  menuAvatarCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' },
  menuAvatarText: { fontSize: 16, fontFamily: 'Inter-Bold', color: '#0284C7' },
  menuUserName: { fontSize: 13, fontFamily: 'Inter-Bold', color: '#1E293B' },
  menuUserRole: { fontSize: 11, fontFamily: 'Inter-Medium', color: '#64748B' },
  menuSectionDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 6 },
  menuOptionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10 },
  menuIconCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  menuOptionLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter-Medium', color: '#1E293B' },
  menuOptionChevron: { fontSize: 16, color: '#94A3B8', fontFamily: 'Inter-Bold' },

  // ==========================================
  // --- NOTIFICATIONS STYLES ---
  // ==========================================
  notifDropdownContainer: { position: 'absolute', top: Platform.OS === 'android' ? 76 : 52, right: 16, width: 320, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, shadowColor: '#000', shadowOpacity: 0.14, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  notifDropdownHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  notifDropdownTitle: { fontSize: 15, fontFamily: 'Inter-Bold', color: '#1E293B' },
  notifPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginLeft: 6, backgroundColor: '#FFFFFF' },
  notifPillActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  notifPillText: { fontSize: 11, color: '#64748B', fontFamily: 'Inter-Medium' },
  notifPillTextActive: { color: '#FFFFFF', fontFamily: 'Inter-Bold' },
  notifItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  notifItemTitle: { fontSize: 12, color: '#1E293B', marginBottom: 2, lineHeight: 16, fontFamily: 'Inter-Regular' },
  notifItemDetail: { fontSize: 11, color: '#64748B', lineHeight: 15, fontFamily: 'Inter-Regular' },
  notifItemTime: { fontSize: 10, color: '#94A3B8', marginLeft: 8, fontFamily: 'Inter-Medium' },
  markAllReadBtn: { marginTop: 10, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', backgroundColor: '#F8FAFC' },
  markAllReadBtnText: { fontSize: 11, color: '#64748B', fontFamily: 'Inter-Bold' },

  // ==========================================
  // --- SETTINGS/PROFILE MODAL STYLES ---
  // ==========================================
  settingsModalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  settingsTopBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  closeButton: { padding: 8 },
  settingsNavTitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: '#0F172A' },
  settingsScrollContent: { padding: 20, paddingBottom: 40 },
  settingsProfileHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  settingsAvatarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' },
  settingsAvatarLetter: { fontFamily: 'Inter-Bold', fontSize: 28, color: '#0284C7' },
  settingsDoctorName: { fontFamily: 'Inter-Bold', fontSize: 16, color: '#0F172A', marginBottom: 2 },
  settingsDoctorRole: { fontSize: 12, fontFamily: 'Inter-Medium', color: '#475569', marginBottom: 2 },
  settingsLicenseText: { fontSize: 11, color: '#94A3B8', fontFamily: 'Inter-Regular' },
  settingsSectionTitle: { fontSize: 13, fontFamily: 'Inter-Bold', color: '#475569', marginBottom: 8, marginTop: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  settingsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', marginBottom: 20 },
  settingsCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  settingsRowDivider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
  settingsRowTitle: { fontSize: 14, fontFamily: 'Inter-Bold', color: '#1E293B', marginBottom: 2 },
  settingsRowSub: { fontSize: 12, color: '#64748B', fontFamily: 'Inter-Regular' },
  settingsLogoutButton: { backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 10, marginBottom: 10, borderWidth: 1, borderColor: '#FECACA' },
  settingsLogoutButtonText: { fontSize: 14, fontFamily: 'Inter-Bold', color: '#DC2626' },
  profileHeroCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 24, alignItems: 'center', marginBottom: 20 },
  profileBigAvatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  profileBigAvatarLetter: { fontFamily: 'Inter-Bold', fontSize: 34, color: '#0284C7' },
  profileHeroName: { fontFamily: 'Inter-Bold', fontSize: 20, color: '#0F172A', marginBottom: 4 },
  profileHeroRole: { fontSize: 14, color: '#475569', fontFamily: 'Inter-Medium', marginBottom: 10 },
  licenseBadge: { backgroundColor: '#F0F9FF', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#BAE6FD' },
  licenseBadgeText: { fontSize: 11, color: '#0284C7', fontFamily: 'Inter-Bold' },

  // ==========================================
  // --- CUSTOM ALERT MODAL STYLES (PREMIUM)---
  // ==========================================
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.65)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  alertBox: { 
    backgroundColor: '#FFFFFF', 
    width: '100%', 
    maxWidth: 380, 
    borderRadius: 28, 
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24, 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 12 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 24, 
    elevation: 10 
  },
  alertIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  alertTitle: { 
    fontFamily: 'Inter-Bold', 
    fontSize: 22, 
    color: '#0F172A', 
    marginBottom: 12, 
    textAlign: 'center' 
  },
  alertMessage: { 
    fontFamily: 'Inter-Regular', 
    fontSize: 15, 
    color: '#475569', 
    textAlign: 'center', 
    marginBottom: 32, 
    lineHeight: 22 
  },
  alertActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%', 
    gap: 12 
  },
  alertCancelBtn: { 
    flex: 1, 
    paddingVertical: 14, 
    borderRadius: 14, 
    backgroundColor: '#F1F5F9', 
    alignItems: 'center',
    justifyContent: 'center'
  },
  alertCancelBtnText: { 
    fontFamily: 'Inter-Bold', 
    fontSize: 15, 
    color: '#475569' 
  },
  alertConfirmBtn: { 
    flex: 1, 
    paddingVertical: 14, 
    borderRadius: 14, 
    alignItems: 'center',
    justifyContent: 'center'
  },
  alertConfirmBtnText: { 
    fontFamily: 'Inter-Bold', 
    fontSize: 15, 
    color: '#FFFFFF' 
  },
});