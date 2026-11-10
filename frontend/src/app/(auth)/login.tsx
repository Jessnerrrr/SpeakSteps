import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import { 
  ActivityIndicator, 
  ImageBackground, 
  KeyboardAvoidingView, 
  Modal, 
  Platform, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  useWindowDimensions
} from 'react-native';

// UPDATED: Added specific test accounts for the Patient login flow
const TEMP_ACCOUNTS = {
  Therapist: { email: 'therapist@speaksteps.com', password: 'Therapist@123' },
  Teacher: { email: 'teacher@speaksteps.com', password: 'Teacher@123' },
  'Patient (New)': { email: 'new@speaksteps.com', password: 'Patient@123' },
  'Patient (Old)': { email: 'old@speaksteps.com', password: 'Patient@123' },
};

// Extracted role type from TEMP_ACCOUNTS keys
type RoleKey = keyof typeof TEMP_ACCOUNTS;

export default function LoginScreen() {
  // Modal & Captcha States
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleKey | null>(null);
  const [captchaStatus, setCaptchaStatus] = useState<'idle' | 'verifying' | 'success'>('idle');

  // Responsive hook to scale layouts
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  if (!fontsLoaded) return null; 

  const handleOpenModal = () => {
    setIsModalVisible(true);
    setSelectedRole(null);
    setCaptchaStatus('idle');
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setTimeout(() => {
      setSelectedRole(null);
      setCaptchaStatus('idle');
    }, 300);
  };

  const handleSelectRole = (role: RoleKey) => {
    setSelectedRole(role);
    setCaptchaStatus('idle');
  };

  const handleVerifyCaptcha = () => {
    if (captchaStatus !== 'idle') return;
    setCaptchaStatus('verifying');
    
    // Simulate network/captcha verification delay
    setTimeout(() => {
      setCaptchaStatus('success');
    }, 1500);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} /> 

      <ImageBackground 
        source={require('../../../assets/images/split-bg.png')} 
        style={styles.background}
        imageStyle={{ opacity: 1 }} 
        resizeMode="cover"
      >
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.container}>
            
            {/* Top Section */}
            <View style={styles.topSection}>
              <Image 
                source={require('../../../assets/images/bird-logo.gif')} 
                style={styles.birdImage}
                contentFit="contain"
              />
              <View style={styles.brandTextContainer}>
                <Text style={styles.brandTitle}>SpeakSteps</Text>
              </View>
            </View>

            {/* Bottom Section: White Card */}
            <View style={[styles.bottomCard, isTablet && styles.bottomCardTablet]}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Back Button Header */}
                <View style={styles.cardHeader}>
                  <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backIcon}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.headerText}>Log In</Text>
                </View>

                <Text style={styles.welcomeText}>Welcome back!</Text>
                <Text style={styles.subText}>Choose how you'd like to log in.</Text>

                {/* Login as Therapist Button */}
                <TouchableOpacity style={styles.roleCard} activeOpacity={0.7} onPress={() => router.push('/therapist-login' as any)}>
                  <Image source={require('../../../assets/images/therapist_blue.gif')} style={styles.gifIcon} contentFit="cover" />
                  <View style={styles.roleTextContainer}>
                    <Text style={styles.roleTitle}>Log In as Therapist</Text>
                    <Text style={styles.roleSubtitle}>Manage patients and activities.</Text>
                  </View>
                  <View style={styles.arrowCircle}>
                    <Text style={styles.arrowText}>›</Text>
                  </View>
                </TouchableOpacity>

                {/* Login as Teacher Button */}
                <TouchableOpacity style={styles.roleCard} activeOpacity={0.7} onPress={() => router.push('/teacher-login' as any)}>
                  <Image source={require('../../../assets/images/teacher-icon.gif')} style={styles.gifIcon} contentFit="cover" />
                  <View style={styles.roleTextContainer}>
                    <Text style={styles.roleTitle}>Log In as Teacher</Text>
                    <Text style={styles.roleSubtitle}>Parent / Guardian and Child</Text>
                  </View>
                  <View style={styles.arrowCircle}>
                    <Text style={styles.arrowText}>›</Text>
                  </View>
                </TouchableOpacity>

                {/* Login as Patient Button */}
                <TouchableOpacity style={styles.roleCard} activeOpacity={0.7} onPress={() => router.push('/patient-login' as any)}>
                  <Image source={require('../../../assets/images/kid_yellow.gif')} style={styles.gifIcon} contentFit="cover" />
                  <View style={styles.roleTextContainer}>
                    <Text style={styles.roleTitle}>Log In as Patient</Text>
                    <Text style={styles.roleSubtitle}>Parent / Guardian and Child</Text>
                  </View>
                  <View style={styles.arrowCircle}>
                    <Text style={styles.arrowText}>›</Text>
                  </View>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>new here?</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Footer Buttons/Links */}
                <View style={styles.footer}>
                  <TouchableOpacity style={styles.createAccountBtn} activeOpacity={0.8} onPress={() => router.push('/create-account' as any)}>
                    <Text style={styles.createAccountBtnText}>Create Account</Text>
                  </TouchableOpacity>

                  {/* TEMPORARY ACCOUNT LINK */}
                  <TouchableOpacity onPress={handleOpenModal}>
                    <Text style={styles.guestLink}>Continue with a Temporary Account</Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
            </View>

          </View>
        </KeyboardAvoidingView>
      </ImageBackground>

      {/* --- TEMPORARY ACCOUNTS MODAL --- */}
      <Modal visible={isModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          {/* Prevent the modal from stretching infinitely on wide screens */}
          <View style={[styles.modalContent, isTablet && styles.modalContentTablet]}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedRole ? `${selectedRole} Account` : 'Temporary Accounts'}
              </Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Step 1: Select a Role */}
            {!selectedRole && (
              <View style={styles.roleList}>
                <Text style={styles.modalSubtitle}>Select a role to view its credentials.</Text>
                {(Object.keys(TEMP_ACCOUNTS) as Array<RoleKey>).map((role) => (
                  <TouchableOpacity key={role} style={styles.modalRoleBtn} onPress={() => handleSelectRole(role)}>
                    <Text style={styles.modalRoleText}>{role}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#0865AD" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Step 2: Captcha & Credentials */}
            {selectedRole && (
              <View style={styles.captchaContainer}>
                
                {/* Fake reCAPTCHA Box */}
                {captchaStatus !== 'success' ? (
                  <>
                    <Text style={styles.modalSubtitle}>Security check required.</Text>
                    <TouchableOpacity 
                      style={styles.captchaBox} 
                      onPress={handleVerifyCaptcha}
                      activeOpacity={0.8}
                    >
                      <View style={styles.captchaCheckbox}>
                        {captchaStatus === 'verifying' && <ActivityIndicator size="small" color="#0865AD" />}
                      </View>
                      <Text style={styles.captchaText}>I'm not a robot</Text>
                      <Image 
                        source={{uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/RecaptchaLogo.svg/1200px-RecaptchaLogo.svg.png'}} 
                        style={styles.captchaLogo} 
                        contentFit="contain" 
                      />
                    </TouchableOpacity>
                  </>
                ) : (
                  /* Step 3: Success! Show Credentials */
                  <View style={styles.credentialsCard}>
                    <View style={styles.successHeader}>
                      <Ionicons name="checkmark-circle" size={32} color="#16A34A" />
                      <Text style={styles.successText}>Verification Complete</Text>
                    </View>
                    
                    <View style={styles.credentialRow}>
                      <Text style={styles.credentialLabel}>Email:</Text>
                      <Text style={styles.credentialValue}>{TEMP_ACCOUNTS[selectedRole].email}</Text>
                    </View>
                    <View style={styles.credentialRow}>
                      <Text style={styles.credentialLabel}>Password:</Text>
                      <Text style={styles.credentialValue}>{TEMP_ACCOUNTS[selectedRole].password}</Text>
                    </View>

                    <TouchableOpacity style={styles.copyBtn} activeOpacity={0.8} onPress={handleCloseModal}>
                      <Text style={styles.copyBtnText}>Got it!</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Back button to re-select role if not finished */}
                {captchaStatus !== 'success' && (
                  <TouchableOpacity onPress={() => setSelectedRole(null)} style={{ marginTop: 20 }}>
                    <Text style={styles.adminLink}>‹ Back to roles</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#3487C6' },
  container: { flex: 1, justifyContent: 'space-between' },
  
  topSection: { 
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingTop: 40, 
    paddingHorizontal: 20,
    transform: [{ translateX: -15 }], 
  },  
  birdImage: { width: 110, height: 110, marginRight: 15 }, 
  brandTextContainer: { flex: 1, justifyContent: 'center', maxWidth: 200 },
  brandTitle: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 36 }, 
  
  // Base mobile card with flexible margin
  bottomCard: { 
    backgroundColor: '#FFFFFF', 
    flex: 2.5, 
    borderRadius: 40, 
    marginHorizontal: '5%', 
    marginBottom: 30, 
    paddingHorizontal: 25, 
    paddingTop: 25, 
    paddingBottom: 20 
  },
  // Tablet override to limit width
  bottomCardTablet: {
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center'
  },
  
  scrollContent: { paddingBottom: 10, flexGrow: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  backButton: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#0865AD', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  backIcon: { color: '#FFFFFF', fontSize: 18, lineHeight: 22, fontFamily: 'SourGummy-Bold', textAlign: 'center' },
  headerText: { fontFamily: 'SourGummy-Bold', color: '#0865AD', fontSize: 14 },
  welcomeText: { fontFamily: 'SourGummy-Bold', fontSize: 26, color: '#0865AD', marginBottom: 5 },
  subText: { fontFamily: 'SourGummy-Medium', fontSize: 12, color: '#666', marginBottom: 20 },
  
  roleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', width: '100%', padding: 15, borderRadius: 15, marginBottom: 12, borderWidth: 1, borderColor: '#E5E5E5', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  gifIcon: { width: 40, height: 40, borderRadius: 8, marginRight: 15 },
  roleTextContainer: { flex: 1 },
  roleTitle: { fontFamily: 'SourGummy-Bold', fontSize: 14, color: '#000' },
  roleSubtitle: { fontFamily: 'SourGummy-Medium', fontSize: 10, color: '#888', marginTop: 2 },
  arrowCircle: { backgroundColor: '#0865AD', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  arrowText: { color: '#FFFFFF', fontSize: 16, lineHeight: 22, fontFamily: 'SourGummy-Bold', textAlign: 'center' },
  
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E5E5' },
  dividerText: { marginHorizontal: 10, fontFamily: 'SourGummy-Medium', fontSize: 12, color: '#999' },
  
  footer: { width: '100%', alignItems: 'center', marginTop: 'auto', paddingTop: 10, marginBottom: 10 },
  createAccountBtn: { backgroundColor: '#0865AD', width: '100%', paddingVertical: 15, borderRadius: 15, alignItems: 'center', marginBottom: 18, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  createAccountBtnText: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 16 },
  guestLink: { fontFamily: 'SourGummy-Bold', fontSize: 13, color: '#666', textDecorationLine: 'underline', marginBottom: 18 },
  adminLink: { fontFamily: 'SourGummy-Bold', fontSize: 12, color: '#0865AD', textDecorationLine: 'underline' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' },
  // Flexible width base
  modalContent: { width: '90%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
  // Restrict width on tablets
  modalContentTablet: { maxWidth: 450 },
  
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { flex: 1, fontFamily: 'SourGummy-Bold', fontSize: 20, color: '#0865AD' },
  closeBtn: { padding: 4, marginLeft: 10 },
  modalSubtitle: { fontFamily: 'SourGummy-Medium', fontSize: 13, color: '#666', marginBottom: 16 },
  
  roleList: { marginTop: 10 },
  modalRoleBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  modalRoleText: { fontFamily: 'SourGummy-Bold', fontSize: 16, color: '#1E293B' },
  
  captchaContainer: { alignItems: 'center', marginTop: 10 },
  captchaBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#D4D4D4', borderRadius: 4, width: '100%', padding: 12, elevation: 1 },
  captchaCheckbox: { width: 28, height: 28, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#C1C1C1', borderRadius: 3, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  captchaText: { fontFamily: 'Inter-Medium', fontSize: 14, color: '#333' },
  captchaLogo: { width: 40, height: 40, marginLeft: 'auto' },

  credentialsCard: { width: '100%', backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 12, padding: 20, alignItems: 'center', marginTop: 10 },
  successHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  successText: { fontFamily: 'SourGummy-Bold', fontSize: 18, color: '#16A34A', marginLeft: 8 },
  credentialRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#DCFCE7' },
  credentialLabel: { fontFamily: 'SourGummy-Bold', fontSize: 14, color: '#166534' },
  credentialValue: { flex: 1, fontFamily: 'Inter-Bold', fontSize: 14, color: '#1E293B', textAlign: 'right', marginLeft: 10 },
  copyBtn: { backgroundColor: '#16A34A', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8, marginTop: 12, width: '100%', alignItems: 'center' },
  copyBtnText: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 14 },
});