import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  ImageBackground,
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
  
  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  // Responsive hook
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
    <ImageBackground 
      source={require('../../../assets/images/admin-bg.png')} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.container, isDesktop && styles.desktopContainer]}>
            
            <View style={[styles.contentWrapper, isDesktop && styles.desktopContentWrapper]}>
              
              {/* TOP HEADER - Centered with Size 35 Brand Title */}
              <View style={styles.headerRow}>
                <View style={styles.brandRow}>
                  <Image source={require('../../../assets/images/bird-logo.gif')} style={styles.logoImage} contentFit="contain" />
                  <View>
                    <Text style={styles.brandTitle}>SpeakSteps</Text>
                    <Text style={styles.brandSubtitle}>Center Administration</Text>
                  </View>
                </View>
              </View>

              {/* PAGE TITLES - Centered & Scaled Down */}
              <View style={styles.titleSection}>
                <Text style={styles.pageTitle}>Administrator sign in</Text>
                <Text style={styles.pageDescription}>Manage accounts, requests and records.</Text>
              </View>

              {/* LOGIN CARD */}
              <View style={styles.loginCard}>
                <View style={styles.securityHeader}>
                  <View style={styles.shieldIconWrapper}>
                    <Ionicons name="shield-checkmark-outline" size={24} color="#0284C7" />
                  </View>
                  <View>
                    <Text style={styles.securityTitle}>Secure staff access</Text>
                    <Text style={styles.securitySubtitle}>Authorized Center staff only.</Text>
                  </View>
                </View>

                <Text style={styles.inputLabel}>User ID</Text>
                <View style={styles.inputWrapper}>
                  <Image source={require('../../../assets/images/vector.png')} style={styles.inputImage} contentFit="contain" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="admin@center.org"
                    placeholderTextColor="#94A3B8"
                    value={userId}
                    onChangeText={setUserId}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Image source={require('../../../assets/images/lock.png')} style={styles.inputImage} contentFit="contain" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#0284C7" />
                  </TouchableOpacity>
                </View>

                <View style={styles.optionsRow}>
                  <TouchableOpacity style={styles.checkboxWrapper} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.7}>
                    <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                      {rememberMe && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.rememberText}>Remember me</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push('/(admin)/admin-forgot-password' as any)}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.loginBtn} activeOpacity={0.8} onPress={handleLogin}>
                  <Image source={require('../../../assets/images/shield-check.png')} style={styles.loginBtnIcon} contentFit="contain" />
                  <Text style={styles.loginBtnText}>Log In</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </KeyboardAvoidingView>

        {/* CUSTOM SYSTEM UI ALERT MODAL */}
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
  desktopContainer: { justifyContent: 'center', alignItems: 'center', paddingTop: 0 },
  contentWrapper: { width: '100%', alignSelf: 'center' },
  desktopContentWrapper: { width: '100%', maxWidth: 450, paddingVertical: 40, alignSelf: 'center' },
  
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  
  logoImage: {left: -10, bottom: 10, width: 100, height: 100, marginRight: 14 }, 
  brandTitle: { left: -15, fontFamily: 'Inter-Bold', fontSize: 45, color: '#0284C7', lineHeight: 40 },
  brandSubtitle: { right: -20, top:10, fontFamily: 'Inter-Medium', fontSize: 13, color: '#64748B' },
  
  titleSection: { marginBottom: 24, alignItems: 'center' },
  pageTitle: { fontFamily: 'Inter-Bold', fontSize: 20, color: '#0284C7', marginBottom: 6, textAlign: 'center' },
  pageDescription: { fontFamily: 'Inter-Medium', fontSize: 13, color: '#64748B', textAlign: 'center' },
  
  loginCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: '#94A3B8',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    elevation: 5 
  },
  
  securityHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FF', padding: 12, borderRadius: 12, marginBottom: 24 },
  shieldIconWrapper: { width: 40, height: 40, backgroundColor: '#E0F2FE', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  securityTitle: { fontFamily: 'Inter-Bold', fontSize: 15, color: '#0369A1' },
  securitySubtitle: { fontFamily: 'Inter-Medium', fontSize: 11, color: '#64748B', marginTop: 2 },
  inputLabel: { fontFamily: 'Inter-Bold', fontSize: 12, color: '#1E293B', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#FFFFFF', height: 48, paddingHorizontal: 12, marginBottom: 16 },
  inputImage: { width: 18, height: 18, marginRight: 10 },
  textInput: { flex: 1, fontFamily: 'Inter-Medium', fontSize: 14, color: '#1E293B' },
  eyeButton: { padding: 4 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  checkboxWrapper: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 18, height: 18, borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  checkboxActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  rememberText: { fontFamily: 'Inter-Medium', fontSize: 13, color: '#475569' },
  forgotText: { fontFamily: 'Inter-Bold', fontSize: 12, color: '#0284C7' },
  loginBtn: { flexDirection: 'row', backgroundColor: '#0284C7', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#0284C7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 4 },
  loginBtnIcon: { width: 20, height: 20, marginRight: 8 },
  loginBtnText: { fontFamily: 'Inter-Bold', fontSize: 16, color: '#FFFFFF' },

  // Custom Modal Alert Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: '#FFFFFF', width: '85%', maxWidth: 400, borderRadius: 24, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  alertTitle: { fontFamily: 'Inter-Bold', fontSize: 20, color: '#1E293B', marginBottom: 10, textAlign: 'center' },
  alertMessage: { fontFamily: 'Inter-Medium', fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  alertBtn: { backgroundColor: '#EF4444', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, width: '100%', alignItems: 'center' },
  alertBtnText: { fontFamily: 'Inter-Bold', fontSize: 15, color: '#FFFFFF' },
});