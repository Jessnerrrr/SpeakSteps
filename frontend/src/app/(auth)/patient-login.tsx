import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { loginAccount } from '@/services/user-api';
import {
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Modal,
} from 'react-native';

export default function PatientLoginScreen() {
  // Responsive Hooks
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // TOTP Setup Alert Modal State
  const [showSetupModal, setShowSetupModal] = useState(false);

  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  const handleLogin = async () => {
    setHasSubmitted(true);
    setLoginError('');

    if (!email.trim()) {
      setLoginError('Email is required. Please fill in this field.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLoginError('Please enter a valid email address format (e.g. name@example.com).');
      return;
    }
    if (!password.trim()) {
      setLoginError('Password is required. Please fill in this field.');
      return;
    }
    setIsLoggingIn(true);
    try {
      await loginAccount(email.trim(), password, 'parent');
      router.replace('/user-mode-select' as any);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Could not sign in.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleProceedToTotp = () => {
    setShowSetupModal(false);
    router.push({
      pathname: '/totp-setup',
      params: { role: 'patient', status: 'new' },
    } as any);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setLoginError('');
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setLoginError('');
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

            {/* Tablet constraint applied to the main card */}
            <View style={[styles.bottomCard, isTablet && styles.bottomCardTablet]}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <View style={styles.cardHeader}>
                  <TouchableOpacity
                    onPress={() => router.replace('/login' as any)}
                    style={styles.backButton}
                  >
                    <Text style={styles.backIcon}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.headerText}>Student login</Text>
                </View>

                {/* Patient Kid GIF Icon */}
                <Image
                  source={require('../../../assets/images/kid_yellow.gif')}
                  style={styles.gifIcon}
                  contentFit="cover"
                />

                <Text style={styles.welcomeText}>Student sign in</Text>
                <Text style={styles.subText}>Welcome back! Sign in to start practicing.</Text>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View nativeID="sign-in-patient-email-field" style={[
                    styles.field,
                    email.length > 0 && styles.filledInput,
                    (hasSubmitted && !email) || loginError ? styles.errorBorder : null,
                  ]}>
                    <TextInput
                      style={styles.fieldInput}
                      underlineColorAndroid="transparent"
                      placeholder="new@speaksteps.com"
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={handleEmailChange}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View nativeID="sign-in-patient-password-field" style={[
                    styles.field,
                    password.length > 0 && styles.filledInput,
                    (hasSubmitted && !password) || loginError ? styles.errorBorder : null
                  ]}>
                    <TextInput
                      style={styles.fieldInput}
                      underlineColorAndroid="transparent"
                      placeholder="••••••••"
                      placeholderTextColor="#999"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={handlePasswordChange}
                    />
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      style={[styles.showButton, password.length > 0 && !loginError && styles.filledInput]}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text style={styles.showButtonText}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Inline Error Message */}
                {!!loginError && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>⚠ {loginError}</Text>
                  </View>
                )}

                <TouchableOpacity style={styles.signInBtn} onPress={() => void handleLogin()} disabled={isLoggingIn}>
                  <Text style={styles.signInText}>{isLoggingIn ? 'Signing in…' : 'Sign in'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setLoginError('Password recovery is not available here. Please contact your administrator.')}>
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* FIRST-TIME LOGIN TOTP SETUP ALERT MODAL */}
        <Modal
          visible={showSetupModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSetupModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.alertModalBox}>
              <View style={styles.alertIconContainer}>
                <Text style={styles.alertIcon}>🔒</Text>
              </View>
              <Text style={styles.alertTitle}>Secure Your Account</Text>
              <Text style={styles.alertMessage}>
                Since this is your first time signing in with a temporary password, we'll first set up your Time-based OTP (Authenticator App) and update your password.
              </Text>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={handleProceedToTotp}
                activeOpacity={0.85}
              >
                <Text style={styles.alertButtonText}>Continue to Setup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ImageBackground>
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
  brandTextContainer: { justifyContent: 'center' },
  brandTitle: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 36 },

  bottomCard: {
    backgroundColor: '#FFFFFF',
    flex: 2.5,
    borderRadius: 40,
    marginHorizontal: 15,
    marginBottom: 30,
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 20,
  },
  bottomCardTablet: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },

  scrollContent: { paddingBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0865AD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  backIcon: { color: '#FFFFFF', fontSize: 18, lineHeight: 22, fontFamily: 'SourGummy-Bold' },
  headerText: { fontFamily: 'SourGummy-Bold', color: '#0865AD', fontSize: 14 },
  gifIcon: { width: 40, height: 40, borderRadius: 8, marginBottom: 10 },
  welcomeText: { fontFamily: 'SourGummy-Bold', fontSize: 26, color: '#0865AD', marginBottom: 5 },
  subText: { fontFamily: 'SourGummy-Medium', fontSize: 12, color: '#666', marginBottom: 20 },
  inputContainer: { marginBottom: 15 },
  inputLabel: { fontFamily: 'SourGummy-Bold', fontSize: 12, color: '#0865AD', marginBottom: 5 },

  field: {
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBE6F6',
    borderRadius: 10,
    height: 45,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },

  filledInput: { backgroundColor: '#FFF3C4' },
  fieldInput: { flex: 1, alignSelf: 'stretch', minWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 15, fontFamily: 'SourGummy', color: '#333' },
  showButton: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 15, marginRight: 8 },
  showButtonText: { color: '#0865AD', fontFamily: 'SourGummy-Bold', fontSize: 12 },

  errorBorder: {
    borderColor: '#E74C3C',
    borderWidth: 2,
    backgroundColor: '#FDEDEC',
  },
  errorContainer: {
    backgroundColor: '#FDEDEC',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F5B7B1',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 13,
    color: '#C0392B',
  },

  signInBtn: {
    backgroundColor: '#0865AD',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  signInText: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 16 },
  forgotPasswordText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 12,
    color: '#0865AD',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },

  // TOTP Setup Alert Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    borderColor: '#CBE6F6',
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
    backgroundColor: '#EAF6FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertIcon: {
    fontSize: 32,
  },
  alertTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 22,
    color: '#0865AD',
    textAlign: 'center',
    marginBottom: 10,
  },
  alertMessage: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
  },
  alertButton: {
    width: '100%',
    backgroundColor: '#0865AD',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  alertButtonText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
