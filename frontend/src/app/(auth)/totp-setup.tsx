import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { router, Stack, useLocalSearchParams } from 'expo-router'; 
import React, { useState } from 'react';
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
} from 'react-native';

export default function TotpSetupScreen() {
  const { role } = useLocalSearchParams(); 
  const [step, setStep] = useState(1);
  const [emailAccount, setEmailAccount] = useState('');
  const [password, setPassword] = useState('');
  const [otpPin, setOtpPin] = useState('');

  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('../../../assets/Inter-Regular.ttf'),
    'Inter-Medium': require('../../../assets/Inter-Medium.ttf'),
    'Inter-Bold': require('../../../assets/Inter-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // 1. Safely extract the role in case Expo Router passed it as an array
      const currentRole = Array.isArray(role) ? role[0] : role;

      // 2. Route based on the extracted role
      if (currentRole === 'therapist') {
        router.replace('/therapist' as any);
      } else if (currentRole === 'teacher') {
        router.replace('/teacher/teacher-dashboard' as any);
      } else {
        // BULLETPROOF FALLBACK: Default to patient dashboard instead of landing page '/'
        // Since patients are the ones doing the speech check-in flow, this is the safest default!
        router.replace('/patient-dashboard' as any);
      }
    }
  };

  const handleBack = () => {
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
            <TextInput
              style={styles.input}
              value={emailAccount}
              onChangeText={setEmailAccount}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
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
          style={[styles.input, styles.pinInput]}
          value={otpPin}
          onChangeText={setOtpPin}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
        />
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
                  {/* Text changes based on whether it is the final step or not */}
                  <Text style={styles.nextButtonText}>
                    {step === 4 ? 'Go to Dashboard' : 'Next'}
                  </Text>
                  <Ionicons 
                    name={step === 4 ? "home" : "chevron-forward-circle"} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
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
  step1Inputs: { flex: 1 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontFamily: 'Inter-Bold', fontSize: 12, color: '#0F172A', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, height: 44, paddingHorizontal: 12, fontFamily: 'Inter-Medium', fontSize: 14, color: '#0F172A' },
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
  nextButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5A623', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 24, shadowColor: '#F5A623', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  nextButtonText: { fontFamily: 'Inter-Bold', fontSize: 15, color: '#FFFFFF', marginRight: 8 },
});