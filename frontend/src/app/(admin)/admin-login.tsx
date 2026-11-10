import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

export default function AdminLoginScreen() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('../../../assets/Inter-Regular.ttf'),
    'Inter-Medium': require('../../../assets/Inter-Medium.ttf'),
    'Inter-Bold': require('../../../assets/Inter-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  const handleLogin = () => {
    if (!userId.trim() || !password.trim()) {
      showAlert("Missing Fields", "Please enter both User ID and Password.");
      return;
    }

    if (userId.trim().toLowerCase() === 'admin@center.org' && password === 'Admin@123') {
      router.replace('/(admin)/admin-dashboard' as any);
    } else {
      showAlert("Login Failed", "Invalid User ID or Password. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.container, isDesktop && styles.desktopContainer]}>
          
          {/* Left Side (Desktop only) */}
          {isDesktop && (
            <View style={styles.leftSideContainer}>
              <Image 
                source={require('../../../assets/images/speaksteps-side-design.gif')} 
                style={styles.sideDesignImage}
                contentFit="cover" 
              />
            </View>
          )}

          {/* Right Side (Form) */}
          <View style={[styles.rightSideContainer, isDesktop && styles.desktopRightSide]}>
            <View style={[styles.contentWrapper, isDesktop && styles.desktopContentWrapper]}>
              
              <View style={styles.loginCard}>
                
                {/* Center Administration Header in Card */}
                <View style={styles.cardBrandHeader}>
                  <Image 
                    source={require('../../../assets/images/bird-logo.gif')} 
                    style={styles.cardLogoImage} 
                    contentFit="contain" 
                  />
                  <Text style={styles.cardBrandSubText}>Center Administration</Text>
                </View>

                <View style={styles.titleSection}>
                  <Text style={styles.pageTitle}>Administrator sign in</Text>
                  <Text style={styles.pageDescription}>Manage accounts, requests and records.</Text>
                </View>

                {/* Form Inputs */}
                <Text style={styles.inputLabel}>User ID</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="userid@center.org"
                    placeholderTextColor="#94A3B8"
                    value={userId}
                    onChangeText={setUserId}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#0F69AF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.optionsRow}>
                  <TouchableOpacity style={styles.checkboxWrapper} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.7}>
                    <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                      {rememberMe && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.rememberText}>Remember me</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push('/(admin)/admin-forgot-password' as any)}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Pill-shaped Button */}
                <TouchableOpacity style={styles.loginBtn} activeOpacity={0.8} onPress={handleLogin}>
                  <Text style={styles.loginBtnText}>Log In</Text>
                </TouchableOpacity>
              </View>

              {/* Secure Staff Access */}
              <View style={styles.secureAccessFooter}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#0F69AF" style={{ marginRight: 8 }} />
                <View>
                  <Text style={styles.secureAccessTitle}>Secure staff access</Text>
                  <Text style={styles.secureAccessSub}>Authorized Center staff only.</Text>
                </View>
              </View>

            </View>

            {/* Copyright Footer */}
            <Text style={styles.copyrightText}>© 2026 SpeakSteps - Center Administration</Text>

          </View>

        </View>
      </KeyboardAvoidingView>

      <Modal visible={alertVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <Ionicons name="alert-circle" size={60} color="#EF4444" style={{ marginBottom: 15 }} />
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
            <TouchableOpacity style={styles.alertBtn} onPress={() => setAlertVisible(false)} activeOpacity={0.8}>
              <Text style={styles.alertBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, flexDirection: 'column' },
  desktopContainer: { flexDirection: 'row' },

  leftSideContainer: {
    flex: 0.62,
    height: '100%',
    backgroundColor: '#1C7BC2', 
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sideDesignImage: {
    width: '100%',
    height: '100%',
  },

  rightSideContainer: {
    flex: 1.38, 
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    position: 'relative', 
  },
  desktopRightSide: {
    paddingHorizontal: 0,
  },

  contentWrapper: { width: '100%', paddingHorizontal: 20, alignSelf: 'center' },
  desktopContentWrapper: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  
  loginCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 32, 
    borderWidth: 1,          // Added border to separate from the background
    borderColor: '#E2E8F0',  // Subtle light gray border color
    shadowColor: '#000000', 
    shadowOffset: { width: 0, height: 12 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 24, 
    elevation: 8,            // Tweaked elevation for Android to pop nicely
    marginBottom: 24,
  },
  
  cardBrandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardLogoImage: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  cardBrandSubText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#FBBF24', 
  },

  titleSection: { marginBottom: 24, alignItems: 'flex-start' },
  pageTitle: { fontFamily: 'Inter-Bold', fontSize: 28, color: '#1E293B', marginBottom: 8 },
  pageDescription: { fontFamily: 'Inter-Medium', fontSize: 13, color: '#94A3B8' },
  
  inputLabel: { fontFamily: 'Inter-Bold', fontSize: 12, color: '#1E293B', marginBottom: 8 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    borderRadius: 8, 
    backgroundColor: '#FFFFFF', 
    height: 48, 
    paddingHorizontal: 12, 
    marginBottom: 16 
  },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontFamily: 'Inter-Medium', fontSize: 14, color: '#1E293B' },
  eyeButton: { padding: 4 },
  
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 4 },
  checkboxWrapper: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  checkboxActive: { backgroundColor: '#0F69AF', borderColor: '#0F69AF' },
  rememberText: { fontFamily: 'Inter-Medium', fontSize: 13, color: '#475569' },
  forgotText: { fontFamily: 'Inter-Bold', fontSize: 13, color: '#0F69AF' },
  
  loginBtn: { 
    flexDirection: 'row', 
    backgroundColor: '#0F69AF', 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  loginBtnText: { fontFamily: 'Inter-Bold', fontSize: 15, color: '#FFFFFF' },

  secureAccessFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  secureAccessTitle: { fontFamily: 'Inter-Bold', fontSize: 14, color: '#0F69AF' },
  secureAccessSub: { fontFamily: 'Inter-Medium', fontSize: 12, color: '#64748B' },

  copyrightText: {
    position: 'absolute',
    bottom: 30, 
    left: 0,
    right: 0,
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: '#FFFFFF', width: '85%', maxWidth: 400, borderRadius: 24, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  alertTitle: { fontFamily: 'Inter-Bold', fontSize: 20, color: '#1E293B', marginBottom: 10, textAlign: 'center' },
  alertMessage: { fontFamily: 'Inter-Medium', fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  alertBtn: { backgroundColor: '#EF4444', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, width: '100%', alignItems: 'center' },
  alertBtnText: { fontFamily: 'Inter-Bold', fontSize: 15, color: '#FFFFFF' },
});