import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export default function AuthSelectionScreen() {
  const { role, status, email } = useLocalSearchParams(); 

  const currentRole = Array.isArray(role) ? role[0] : role;
  const currentStatus = Array.isArray(status) ? status[0] : status;

  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [pinCode, setPinCode] = useState('');
  
  // Timer State (300 seconds = 5 minutes)
  const [timeLeft, setTimeLeft] = useState(300);

  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showPinModal && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showPinModal, timeLeft]);

  const formattedTime = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;

  const CIRCLE_SIZE = 110; 
  const STROKE_WIDTH = 6;
  const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE - (timeLeft / 300) * CIRCUMFERENCE;

  if (!fontsLoaded) return null;

  const isNewAccount = currentStatus === 'new';

  // Helper function to dynamically mask the email address for security
  const getMaskedEmail = (rawEmail: string | string[] | undefined) => {
    const emailStr = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail;
    if (!emailStr) return 'n***@speaksteps.com';
    const parts = emailStr.split('@');
    if (parts.length !== 2) return 'n***@speaksteps.com';
    const [name, domain] = parts;
    return `${name[0]}***@${domain}`;
  };

  const maskedEmailToDisplay = getMaskedEmail(email);

  const handleGetPin = (method: string) => {
    setSelectedMethod(method);
    setPinCode('');
    setTimeLeft(300); 
    setShowPinModal(true);
  };

  const handleCloseModal = () => {
    setShowPinModal(false);
    setSelectedMethod('');
  };

  const handleVerifyAndLogin = () => {
    if (pinCode.length >= 4 && timeLeft > 0) {
      setShowPinModal(false);
      setSelectedMethod('');

      // If a new account lands here, send them into Account Setup (TOTP -> Change Password)
      if (isNewAccount) {
        router.replace({ pathname: '/totp-setup', params: { role: currentRole || 'patient' } } as any);
        return;
      }

      // Returning accounts: clear stack and go straight to Dashboard
      if (router.canDismiss()) {
        router.dismissAll();
      }

      if (currentRole === 'therapist') {
        router.replace('/therapist' as any);
      } else if (currentRole === 'teacher') {
        router.replace('/teacher/teacher-dashboard' as any);
      } else if (currentRole === 'patient') {
        router.replace('/patient-dashboard' as any);
      } else {
        router.replace('/' as any);
      }
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/split-bg.png')} 
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          
          <View style={styles.topSection}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Authentication</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.cardContainer}>

              <View style={styles.infoBanner}>
                <Ionicons name="information-circle-outline" size={24} color="#0F69AF" style={styles.infoIcon} />
                <Text style={styles.infoBannerText}>
                  Select ONE(1) option and click/tap to get your PIN and proceed.
                </Text>
              </View>

              {/* COMPACT BUTTON 1: TOTP */}
              <TouchableOpacity 
                style={[
                  styles.methodButton, 
                  selectedMethod === 'TOTP' && styles.methodButtonActive,
                  isNewAccount && styles.methodButtonDisabled 
                ]}
                activeOpacity={0.7}
                onPress={() => handleGetPin('TOTP')}
                disabled={isNewAccount} 
              >
                <View style={[styles.iconCircle, selectedMethod === 'TOTP' && styles.iconCircleActive]}>
                  <Image 
                    source={require('../../../assets/images/totp-icon.gif')} 
                    style={[styles.customIcon, isNewAccount && styles.iconDisabled]} 
                    contentFit="contain" 
                  />
                </View>
                <View style={styles.methodTextContainer}>
                  <Text style={[styles.methodTitle, isNewAccount && styles.textDisabled]}>Time-based OTP</Text>
                  <Text style={[styles.methodSubtitle, isNewAccount && styles.textDisabled]}>
                    {isNewAccount ? 'Setup required after first login' : 'Use Authenticator App'}
                  </Text>
                </View>
                {!isNewAccount && (
                  <Ionicons name="chevron-forward" size={24} color={selectedMethod === 'TOTP' ? '#0F69AF' : '#94A3B8'} />
                )}
                {isNewAccount && (
                  <Ionicons name="lock-closed" size={20} color="#CBD5E1" />
                )}
              </TouchableOpacity>

              {/* COMPACT BUTTON 2: EMAIL OTP */}
              <TouchableOpacity 
                style={[styles.methodButton, selectedMethod === 'Email' && styles.methodButtonActive]}
                activeOpacity={0.7}
                onPress={() => handleGetPin('Email')}
              >
                <View style={[styles.iconCircle, selectedMethod === 'Email' && styles.iconCircleActive]}>
                  <Image 
                    source={require('../../../assets/images/email-otp.gif')} 
                    style={styles.customIcon} 
                    contentFit="contain" 
                  />
                </View>
                <View style={styles.methodTextContainer}>
                  <Text style={styles.methodTitle}>Email OTP</Text>
                  <Text style={styles.methodSubtitle}>Code sent to your email</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={selectedMethod === 'Email' ? '#0F69AF' : '#94A3B8'} />
              </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* REDESIGNED MODAL */}
        <Modal visible={showPinModal} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.newModalBox}>
              
              <View style={styles.modalTopBlue} />

              <View style={styles.modalCircleIconWrapper}>
                <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={{ position: 'absolute' }}>
                  <Circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} stroke="#E2E8F0" strokeWidth={STROKE_WIDTH} fill="#FFFFFF" />
                  <Circle
                    cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} stroke="#73BCF3" strokeWidth={STROKE_WIDTH} fill="none"
                    strokeDasharray={CIRCUMFERENCE} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                    transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
                  />
                </Svg>
                <Image 
                  source={selectedMethod === 'TOTP' ? require('../../../assets/images/totp-icon.gif') : require('../../../assets/images/email-otp.gif')} 
                  style={styles.modalCustomIcon} contentFit="cover" 
                />
              </View>

              <View style={styles.modalContent}>
                
                <Text style={[styles.timerText, timeLeft === 0 && styles.timerTextExpired]}>
                  {formattedTime}
                </Text>

                {/* DYNAMIC INSTRUCTION TEXT BASED ON SELECTED METHOD */}
                <Text style={styles.modalInstruction}>
                  {selectedMethod === 'Email' 
                    ? `Please check the one-time pin sent to ${maskedEmailToDisplay}` 
                    : 'Enter your Single Sign-On credentials:'}
                </Text>

                <TextInput
                  style={styles.newPinInput}
                  value={pinCode}
                  onChangeText={setPinCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="_ _ _ _ _ _"
                  placeholderTextColor="#CBD5E1"
                  textAlign="center"
                  autoFocus
                  editable={timeLeft > 0} 
                />

                <Text style={styles.methodLabel}>
                  {selectedMethod === 'TOTP' ? 'TIME-BASED ONE-TIME-PASSWORD' : 'EMAIL ONE-TIME PIN'}
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.loginBtn, (pinCode.length < 4 || timeLeft === 0) && styles.loginBtnDisabled]} 
                onPress={handleVerifyAndLogin}
                activeOpacity={0.8}
                disabled={pinCode.length < 4 || timeLeft === 0}
              >
                <Text style={styles.loginBtnText}>LOGIN</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.returnBtn} onPress={handleCloseModal} activeOpacity={0.8}>
                <Text style={styles.returnBtnText}>RETURN TO OPTIONS</Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#3487C6' },
  safeArea: { flex: 1 },
  topSection: { width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerTitle: { fontFamily: 'SourGummy-Bold', fontSize: 22, color: '#FFFFFF' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16 },
  cardContainer: { width: '100%', maxWidth: 600, alignSelf: 'center', backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6, marginBottom: 20 },
  infoBanner: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoIcon: { marginRight: 12 },
  infoBannerText: { fontFamily: 'SourGummy-Medium', fontSize: 14, color: '#475569', flex: 1, lineHeight: 22 },
  
  methodButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 2, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  methodButtonActive: { borderColor: '#0F69AF', backgroundColor: '#F0F9FF' },
  methodButtonDisabled: { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9', elevation: 0, shadowOpacity: 0 },
  
  iconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden' },
  iconCircleActive: { backgroundColor: '#FFFFFF' },
  customIcon: { width: 32, height: 32 },
  iconDisabled: { opacity: 0.4 },
  
  methodTextContainer: { flex: 1 },
  methodTitle: { fontFamily: 'SourGummy-Bold', fontSize: 16, color: '#0F172A', marginBottom: 4 },
  methodSubtitle: { fontFamily: 'SourGummy-Medium', fontSize: 13, color: '#64748B' },
  textDisabled: { color: '#94A3B8' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  newModalBox: { backgroundColor: '#FFFFFF', width: '100%', maxWidth: 340, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  modalTopBlue: { height: 90, backgroundColor: '#3BA1EE', width: '100%' },
  modalCircleIconWrapper: { width: 110, height: 110, borderRadius: 55, alignSelf: 'center', marginTop: -55, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  modalCustomIcon: { width: 65, height: 65, zIndex: 2 },
  modalContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 24, alignItems: 'center' },
  timerText: { fontFamily: 'SourGummy-Medium', fontSize: 24, color: '#333333', marginBottom: 16 },
  timerTextExpired: { color: '#E74C3C' },
  
  modalInstruction: { fontFamily: 'SourGummy', fontSize: 12, color: '#64748B', textAlign: 'center', marginBottom: 10 },
  
  newPinInput: { width: '100%', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, height: 54, fontFamily: 'SourGummy-Bold', fontSize: 24, color: '#0F172A', letterSpacing: 12, textAlign: 'center', marginBottom: 20 },
  methodLabel: { fontFamily: 'SourGummy-Bold', fontSize: 10, color: '#4A82B3', textAlign: 'center', letterSpacing: 0.5 },

  loginBtn: { width: '100%', backgroundColor: '#4A82B3', paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  loginBtnDisabled: { backgroundColor: '#9CBAD4' },
  loginBtnText: { fontFamily: 'SourGummy-Bold', fontSize: 14, color: '#FFFFFF', letterSpacing: 1 },
  returnBtn: { width: '100%', backgroundColor: '#E2E8F0', paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  returnBtnText: { fontFamily: 'SourGummy-Medium', fontSize: 12, color: '#475569', letterSpacing: 0.5 },
});