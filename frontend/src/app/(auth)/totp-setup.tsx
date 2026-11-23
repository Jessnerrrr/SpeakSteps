import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { router, Stack, useLocalSearchParams } from 'expo-router'; 
import React, { useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function TotpSetupScreen() {
  const { role } = useLocalSearchParams(); 
  const [step, setStep] = useState(1);
  const [emailAccount, setEmailAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpPin, setOtpPin] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const emailWarning = !emailAccount.trim() ? 'Enter your email address.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAccount.trim()) ? 'Enter a valid email address.' : '';
  const passwordWarning = password.trim() ? '' : 'Enter your password.';
  const pinWarning = /^\d{6}$/.test(otpPin) ? '' : 'Enter the 6-digit PIN.';

  // Change Password Alert Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('../../../assets/Inter-Regular.ttf'),
    'Inter-Medium': require('../../../assets/Inter-Medium.ttf'),
    'Inter-Bold': require('../../../assets/Inter-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  const handleNext = () => {
    if ((step === 1 && (emailWarning || passwordWarning)) || (step === 3 && pinWarning)) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Show Change Password alert modal before navigating
      setShowPasswordModal(true);
    }
  };

  const handleProceedToPassword = () => {
    setShowPasswordModal(false);
    const currentRole = Array.isArray(role) ? role[0] : role;

    // Continue Account Setup -> Change Temporary Password
    router.replace({
      pathname: '/new-password',
      params: { role: currentRole || 'patient', flow: 'setup' },
    } as any);
  };

  const handleBack = () => {
    setShowValidation(false);
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const renderStepHeader = (number: string, title: string, subtitle: string) => (
    <View style={styles.stepHeaderContainer}>
      <Text style={styles.stepNumber}>{number}</Text>
      <View style={styles.stepTitleContainer}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color="#0066A4" style={styles.infoIcon} />
        <Text style={styles.infoText}>
          Time-based one-time password (TOTP) is a computer algorithm that generates a one-time password (OTP) that uses the current time as a source of uniqueness.
        </Text>
      </View>

      {renderStepHeader('1', 'Account Verification', 'Provide the account info')}

      <View style={styles.step1Layout}>
        <View style={styles.phoneMockup}>
          <View style={styles.phoneScreen}>
            <View style={styles.phoneLockCircle}>
              <Ionicons name="lock-closed" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.phoneMockupText}>Confirm it's you</Text>
            <View style={styles.phoneMockupDots}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={styles.mockupDot} />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.step1Inputs}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Account *</Text>
            <View nativeID="sign-in-verification-email-field" style={[styles.field, emailAccount.length > 0 && styles.filledField, showValidation && !!emailWarning && styles.invalidInput]}>
            <TextInput
              style={styles.passwordInput}
              accessibilityLabel="Email account"
              value={emailAccount}
              onChangeText={setEmailAccount}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
            />
            </View>
            {showValidation && emailWarning ? <Text accessibilityRole="alert" style={styles.fieldWarning}>{emailWarning}</Text> : null}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password *</Text>
            <View nativeID="sign-in-verification-password-field" style={[styles.field, password.length > 0 && styles.filledField, showValidation && !!passwordWarning && styles.invalidInput]}>
              <TextInput
                style={styles.passwordInput}
                accessibilityLabel="Password"
                value={password}
                onChangeText={setPassword}
                autoComplete="current-password"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                onPress={() => setShowPassword((prev) => !prev)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.eyeLabel}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
            {showValidation && passwordWarning ? <Text accessibilityRole="alert" style={styles.fieldWarning}>{passwordWarning}</Text> : null}
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      {renderStepHeader('2', 'QR Code and Secret Key', 'Generated QR Code and Secret Key')}

      <View style={styles.instructionsBox}>
        <Text style={styles.instructionsTitle}>Instructions:</Text>
        <Text style={styles.instructionText}>1. Below, you'll find your generated QR code and Secret Key. For security purposes, please capture a photo of this screen to securely retain a copy.</Text>
        <Text style={styles.instructionText}>2. Download and install the Authenticator app.</Text>
        <Text style={styles.instructionSubText}>• For Mobile device users:</Text>
        <Text style={styles.instructionSubBullet}>a. App Store for iOS devices: <Text style={{ fontFamily: 'Inter-Bold' }}>Google Authenticator</Text></Text>
        <Text style={styles.instructionSubBullet}>b. Google Play Store for Android devices: <Text style={{ fontFamily: 'Inter-Bold' }}>Google Authenticator</Text></Text>
        <Text style={styles.instructionText}>3. Set up the Time-based One-Time Password (TOTP) in the Authenticator app either by scanning the QR code or manually entering the Secret Key.</Text>
      </View>

      <View style={styles.optionsContainer}>
        <View style={styles.optionCol}>
          <Text style={styles.optionTitle}>Option 1 - QR Code</Text>
          <View style={styles.qrCodeBox}>
            <Ionicons name="qr-code" size={60} color="#1E293B" />
          </View>
        </View>
        
        <View style={styles.optionCol}>
          <Text style={styles.optionTitle}>Option 2 - Secret Key</Text>
          <View style={styles.secretKeyBox}>
            <Text style={styles.secretKeyText}>VLX8L5CD78D6CM9D</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      {renderStepHeader('3', 'Authenticator App', 'Provide the One-Time Pin')}

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color="#0066A4" style={styles.infoIcon} />
        <Text style={styles.infoText}>
          Enter the 6-digit One-Time Pin generated by the Authenticator App. <Text style={{ fontFamily: 'Inter-Bold' }}>You have a limit of 5 attempts. The account will be locked after 5 unsuccessful tries.</Text>
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>One-Time Pin</Text>
        <TextInput
          style={[styles.input, styles.pinInput, showValidation && !!pinWarning && styles.invalidInput]}
          accessibilityLabel="One-time PIN"
          value={otpPin}
          onChangeText={(value) => setOtpPin(value.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
        />
        {showValidation && pinWarning ? <Text accessibilityRole="alert" style={styles.fieldWarning}>{pinWarning}</Text> : null}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      {renderStepHeader('4', 'Authenticated', 'Setup TOTP completed')}

      <View style={styles.successContainer}>
        <View style={styles.successIconCircle}>
          <Ionicons name="checkmark-circle" size={32} color="#10B981" />
        </View>
        <Text style={styles.successText}>
          Great! You have set up your authenticator app!
        </Text>
      </View>
    </View>
  );

  return (
    <ImageBackground
      source={require('../../../assets/images/admin-bg.png')} 
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.blueOverlay} />

      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Setup Time-based{'\n'}One-Time Password</Text>
            </View>

            <View style={styles.card}>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}

              <View style={styles.footerAction}>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
                  <Text style={styles.nextButtonText}>
                    {step === 4 ? 'Continue' : 'Next'}
                  </Text>
                  <Ionicons 
                    name="chevron-forward"
                    size={20} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>

        {/* CHANGE PASSWORD ALERT MODAL */}
        <Modal
          visible={showPasswordModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPasswordModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.alertModalBox}>
              <View style={styles.alertIconContainer}>
                <Ionicons name="key" size={30} color="#0066A4" />
              </View>
              <Text style={styles.alertTitle}>Update Your Password</Text>
              <Text style={styles.alertMessage}>
                Your authenticator app is all set! Next, please replace your temporary password with a new permanent password to finish securing your account.
              </Text>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={handleProceedToPassword}
                activeOpacity={0.85}
              >
                <Text style={styles.alertButtonText}>Change Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  blueOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(53, 131, 198, 0.85)' },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerTitle: { fontFamily: 'Inter-Bold', fontSize: 20, color: '#FFFFFF', lineHeight: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8, minHeight: 450, justifyContent: 'space-between' },
  stepContent: { flex: 1 },
  stepHeaderContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  stepNumber: { fontFamily: 'Inter-Bold', fontSize: 48, color: '#0066A4', marginRight: 16, lineHeight: 56 },
  stepTitleContainer: { flex: 1 },
  stepTitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: '#0066A4', marginBottom: 2 },
  stepSubtitle: { fontFamily: 'Inter-Medium', fontSize: 12, color: '#64748B' },
  infoBox: { flexDirection: 'row', backgroundColor: '#F0F7FF', borderWidth: 1, borderColor: '#BAE6FD', borderRadius: 12, padding: 14, marginBottom: 24 },
  infoIcon: { marginRight: 10, marginTop: 2 },
  infoText: { flex: 1, fontFamily: 'Inter-Medium', fontSize: 12, color: '#0F172A', lineHeight: 18 },
  step1Layout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  phoneMockup: { width: '40%', aspectRatio: 0.5, backgroundColor: '#1E293B', borderRadius: 20, padding: 6, marginRight: 16 },
  phoneScreen: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, alignItems: 'center', paddingVertical: 20 },
  phoneLockCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0066A4', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  phoneMockupText: { fontFamily: 'Inter-Bold', fontSize: 10, color: '#0F172A', marginBottom: 16 },
  phoneMockupDots: { flexDirection: 'row', gap: 4 },
  mockupDot: { width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: '#CBD5E1' },
  step1Inputs: { flex: 1, minWidth: 0 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontFamily: 'Inter-Bold', fontSize: 12, color: '#0F172A', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, height: 44, paddingHorizontal: 12, fontFamily: 'Inter-Medium', fontSize: 14, color: '#0F172A' },
  field: { flexDirection: 'row', alignItems: 'stretch', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, height: 44, overflow: 'hidden' },
  filledField: { backgroundColor: '#FFF3C4' },
  passwordInput: { flex: 1, minWidth: 0, paddingHorizontal: 12, fontFamily: 'Inter-Medium', fontSize: 14, color: '#0F172A', backgroundColor: 'transparent' },
  eyeButton: { minWidth: 48, height: '100%', paddingHorizontal: 8, justifyContent: 'center', alignItems: 'center' },
  eyeLabel: { color: '#0066A4', fontFamily: 'Inter-Bold', fontSize: 12 },
  invalidInput: { borderColor: '#C63232', backgroundColor: '#FFF1F1' },
  fieldWarning: { color: '#A82020', fontFamily: 'Inter-Medium', fontSize: 12, marginTop: 6 },
  pinInput: { fontSize: 24, fontFamily: 'Inter-Bold', letterSpacing: 8, height: 56 },
  instructionsBox: { marginBottom: 20 },
  instructionsTitle: { fontFamily: 'Inter-Bold', fontSize: 12, color: '#0F172A', marginBottom: 6 },
  instructionText: { fontFamily: 'Inter-Medium', fontSize: 11, color: '#475569', lineHeight: 18, marginBottom: 4 },
  instructionSubText: { fontFamily: 'Inter-Medium', fontSize: 11, color: '#475569', marginLeft: 12, marginBottom: 2 },
  instructionSubBullet: { fontFamily: 'Inter-Medium', fontSize: 11, color: '#475569', marginLeft: 24, marginBottom: 2 },
  optionsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  optionCol: { flex: 1, alignItems: 'center' },
  optionTitle: { fontFamily: 'Inter-Bold', fontSize: 12, color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  qrCodeBox: { width: '100%', aspectRatio: 1, backgroundColor: '#0066A4', borderRadius: 12, justifyContent: 'center', alignItems: 'center', padding: 12 },
  secretKeyBox: { width: '100%', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center' },
  secretKeyText: { fontFamily: 'Inter-Bold', fontSize: 10, color: '#0F172A', textAlign: 'center' },
  successContainer: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 12, padding: 16, marginTop: 10 },
  successIconCircle: { marginRight: 12 },
  successText: { flex: 1, fontFamily: 'Inter-Medium', fontSize: 14, color: '#064E3B', lineHeight: 20, marginTop: 4 },
  footerAction: { alignItems: 'flex-end', marginTop: 32 },
  nextButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0066A4', paddingHorizontal: 16, borderRadius: 12 },
  nextButtonText: { fontFamily: 'Inter-Bold', fontSize: 15, color: '#FFFFFF', marginRight: 8 },

  // Change Password Alert Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  alertModalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#BAE6FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  alertIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#0066A4',
    textAlign: 'center',
    marginBottom: 10,
  },
  alertMessage: {
    fontFamily: 'Inter-Medium',
    fontSize: 13.5,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  alertButton: {
    width: '100%',
    backgroundColor: '#0066A4',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  alertButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
