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

export default function AdminDashboardScreen() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'request' | 'accounts'>('dashboard');
  const [requestSubTab, setRequestSubTab] = useState('All');
  const [accountSubTab, setAccountSubTab] = useState('All');
  
  // State to control whether the sidebar is expanded or collapsed
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Desktop check
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('../../../assets/Inter-Regular.ttf'),
    'Inter-Medium': require('../../../assets/Inter-Medium.ttf'),
    'Inter-Bold': require('../../../assets/Inter-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  const renderDashboard = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../../assets/images/bird-logo.gif')} style={styles.logoImage} contentFit="contain" />
          <View>
            <Text style={styles.headerTitle}>Welcome, Admin</Text>
          </View>
        </View>
        {!isDesktop && (
          <TouchableOpacity style={styles.logoutButton} onPress={() => router.replace('/(admin)/admin-login' as any)}>
            <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

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
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setActiveTab('dashboard')} style={styles.backButtonBlue}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Requests</Text>
      </View>
      <View style={styles.subTabsContainer}>
        {['All', 'Pending (3)', 'Approved (4)', 'Rejected (0)'].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setRequestSubTab(tab)} style={styles.subTabBtn}>
            <Text style={[styles.subTabText, requestSubTab === tab && styles.subTabTextActive]}>{tab}</Text>
            {requestSubTab === tab && <View style={styles.subTabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}>
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
              <TouchableOpacity style={styles.rejectBtn}>
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
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setActiveTab('dashboard')} style={styles.backButtonBlue}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Accounts</Text>
      </View>
      <View style={styles.subTabsContainer}>
        {['All', 'Therapist', 'Teacher', 'Patient'].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setAccountSubTab(tab)} style={styles.subTabBtn}>
            <Text style={[styles.subTabText, accountSubTab === tab && styles.subTabTextActive]}>{tab}</Text>
            {accountSubTab === tab && <View style={styles.subTabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}>
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
              <TouchableOpacity style={styles.editBtn}>
                <Ionicons name="create-outline" size={16} color="#0284C7" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.suspendBtn}>
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

        <View style={[styles.mainWrapper, isDesktop && { flexDirection: 'row' }]}>
          
          {/* DESKTOP SIDEBAR - Dynamic Width based on isSidebarOpen state */}
          {isDesktop && (
            <View style={[styles.desktopSidebar, { width: isSidebarOpen ? 250 : 88, paddingHorizontal: isSidebarOpen ? 20 : 12 }]}>
              
              {/* Sidebar Collapse Toggle Button */}
              <TouchableOpacity 
                onPress={() => setIsSidebarOpen(!isSidebarOpen)}
                style={{ alignItems: isSidebarOpen ? 'flex-end' : 'center', marginBottom: 15, paddingTop: 5 }}
              >
                <Ionicons name={isSidebarOpen ? "chevron-back" : "menu"} size={26} color="#94A3B8" />
              </TouchableOpacity>

              {/* Dynamic Brand Logo & Text */}
              <View style={styles.sidebarBrand}>
                <Image source={require('../../../assets/images/bird-logo.gif')} style={{width: isSidebarOpen ? 50 : 40, height: isSidebarOpen ? 50 : 40, marginBottom: isSidebarOpen ? 10 : 0}} contentFit="contain" />
                {isSidebarOpen && <Text style={{fontFamily: 'Inter-Bold', color: '#0284C7', fontSize: 20}}>SpeakSteps</Text>}
              </View>

              {/* Dynamic Navigation Links */}
              <View style={{flex: 1, marginTop: 40}}>
                <TouchableOpacity style={[styles.sidebarNavBtn, activeTab === 'dashboard' && styles.sidebarNavActive, !isSidebarOpen && { justifyContent: 'center' }]} onPress={() => setActiveTab('dashboard')}>
                  <Ionicons name="home" size={22} color={activeTab === 'dashboard' ? '#FFFFFF' : '#64748B'} />
                  {isSidebarOpen && <Text style={[styles.sidebarNavText, activeTab === 'dashboard' && styles.sidebarNavTextActive]}>Dashboard</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sidebarNavBtn, activeTab === 'request' && styles.sidebarNavActive, !isSidebarOpen && { justifyContent: 'center' }]} onPress={() => setActiveTab('request')}>
                  <Ionicons name="clipboard" size={22} color={activeTab === 'request' ? '#FFFFFF' : '#64748B'} />
                  {isSidebarOpen && <Text style={[styles.sidebarNavText, activeTab === 'request' && styles.sidebarNavTextActive]}>Requests</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sidebarNavBtn, activeTab === 'accounts' && styles.sidebarNavActive, !isSidebarOpen && { justifyContent: 'center' }]} onPress={() => setActiveTab('accounts')}>
                  <Ionicons name="people" size={22} color={activeTab === 'accounts' ? '#FFFFFF' : '#64748B'} />
                  {isSidebarOpen && <Text style={[styles.sidebarNavText, activeTab === 'accounts' && styles.sidebarNavTextActive]}>Accounts</Text>}
                </TouchableOpacity>
              </View>

              {/* Dynamic Log Out Button */}
              <TouchableOpacity style={[styles.sidebarLogoutBtn, !isSidebarOpen && { justifyContent: 'center' }]} onPress={() => router.replace('/(admin)/admin-login' as any)}>
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                {isSidebarOpen && <Text style={{fontFamily: 'Inter-Bold', color: '#EF4444', marginLeft: 10}}>Log Out</Text>}
              </TouchableOpacity>
            </View>
          )}

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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 20,
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
  
  // Desktop Sidebar Base Styles
  desktopSidebar: { backgroundColor: '#FFFFFF', borderRightWidth: 1, borderRightColor: '#E2E8F0', paddingVertical: 20 },
  sidebarBrand: { alignItems: 'center', paddingBottom: 30, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sidebarNavBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8 },
  sidebarNavActive: { backgroundColor: '#0284C7' },
  sidebarNavText: { fontFamily: 'Inter-Medium', fontSize: 15, color: '#64748B', marginLeft: 12 },
  sidebarNavTextActive: { color: '#FFFFFF', fontFamily: 'Inter-Bold' },
  sidebarLogoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#FEF2F2', borderRadius: 12 },

  // Dashboard Styles
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  logoImage: { width: 48, height: 48, marginRight: 10 },
  headerTitle: { fontFamily: 'Inter-Bold', fontSize: 22, color: '#0284C7', letterSpacing: -0.5 },
  headerSubtitle: { fontFamily: 'Inter-Medium', fontSize: 10, color: '#64748B', marginTop: 2 },
  logoutButton: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#0284C7', justifyContent: 'center', alignItems: 'center' },
  
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
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 20, paddingBottom: 10 },
  backButtonBlue: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0284C7', justifyContent: 'center', alignItems: 'center', marginRight: 12, elevation: 2 },
  topBarTitle: { fontFamily: 'Inter-Bold', fontSize: 24, color: '#0284C7' },
  subTabsContainer: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 10 },
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
});