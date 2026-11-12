import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

export default function AdminForgotPasswordScreen() {
  const [userId, setUserId] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showRecoveryKey, setShowRecoveryKey] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Responsive hook to match the login screen centering
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('../../../assets/Inter-Regular.ttf'),
    'Inter-Medium': require('../../../assets/Inter-Medium.ttf'),
    'Inter-Bold': require('../../../assets/Inter-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  const handleResetPassword = () => {
    // Handle the reset logic here, then route back to login
    router.replace('/(admin)/admin-login' as any);
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
            
            {/* Wrapper to prevent stretching on desktop */}
            <View style={[styles.contentWrapper, isDesktop && styles.desktopContentWrapper]}>
              
              {/* TOP HEADER */}
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                  <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Forgot Password</Text>
              </View>

              {/* RESET CARD */}
              <View style={styles.resetCard}>
                
                {/* Security Badge Header */}
                <View style={styles.securityHeader}>
                  <View style={styles.shieldIconWrapper}>
                    <Ionicons name="shield-checkmark-outline" size={24} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.securityTitle}>Reset Admin Password</Text>
                    <Text style={styles.securitySubtitle}>Enter your Center recovery key to set a new password.</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* User ID Input */}
                <Text style={styles.inputLabel}>User ID</Text>
                <View style={styles.inputWrapper}>
                  <Image 
                    source={require('../../../assets/images/vector.png')} 
                    style={styles.inputImage} 
                    contentFit="contain"
                  />
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

                {/* Recovery Key Input */}
                <Text style={styles.inputLabel}>Recovery Key</Text>
                <View style={styles.inputWrapper}>
                  <Image 
                    source={require('../../../assets/images/lock.png')} 
                    style={styles.inputImage} 
                    contentFit="contain"
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your recovery key"
                    placeholderTextColor="#94A3B8"
                    value={recoveryKey}
                    onChangeText={setRecoveryKey}
                    secureTextEntry={!showRecoveryKey}
                  />
                  <TouchableOpacity onPress={() => setShowRecoveryKey(!showRecoveryKey)} style={styles.eyeButton}>
                    <Ionicons 
                      name={showRecoveryKey ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#0284C7" 
                    />
                  </TouchableOpacity>
                </View>

                {/* New Password Input */}
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.inputWrapper}>
                  <Image 
                    source={require('../../../assets/images/lock.png')} 
                    style={styles.inputImage} 
                    contentFit="contain"
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••••••"
                    placeholderTextColor="#94A3B8"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeButton}>
                    <Ionicons 
                      name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#0284C7" 
                    />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password Input */}
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <Image 
                    source={require('../../../assets/images/lock.png')} 
                    style={styles.inputImage} 
                    contentFit="contain"
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••••••"
                    placeholderTextColor="#94A3B8"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#0284C7" 
                    />
                  </TouchableOpacity>
                </View>

                {/* Reset Password Button */}
                <TouchableOpacity style={styles.resetBtn} activeOpacity={0.8} onPress={handleResetPassword}>
                  <Text style={styles.resetBtnText}>Reset Password</Text>
                </TouchableOpacity>

              </View>

            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  
  // Centering and width restriction styles
  container: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
  desktopContainer: { justifyContent: 'center', alignItems: 'center', paddingTop: 0 },
  contentWrapper: { width: '100%', maxWidth: 450, alignSelf: 'center' },
  desktopContentWrapper: { paddingVertical: 40 },
  
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, justifyContent: 'center' },
  backButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0284C7', justifyContent: 'center', alignItems: 'center', marginRight: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3, position: 'absolute', left: 0 },
  headerTitle: { fontFamily: 'Inter-Bold', fontSize: 20, color: '#0284C7' },
  
  resetCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, borderWidth: 1, borderColor: '#94A3B8' },
  securityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  shieldIconWrapper: { width: 40, height: 40, backgroundColor: '#F0F9FF', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#E0F2FE' },
  securityTitle: { fontFamily: 'Inter-Bold', fontSize: 16, color: '#0369A1' },
  securitySubtitle: { fontFamily: 'Inter-Medium', fontSize: 11, color: '#64748B', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginBottom: 20 },
  inputLabel: { fontFamily: 'Inter-Bold', fontSize: 12, color: '#1E293B', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#FFFFFF', height: 48, paddingHorizontal: 12, marginBottom: 16 },
  inputImage: { width: 18, height: 18, marginRight: 10 },
  textInput: { flex: 1, fontFamily: 'Inter-Medium', fontSize: 14, color: '#1E293B' },
  eyeButton: { padding: 4 },
  resetBtn: { backgroundColor: '#0284C7', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#0284C7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 4, marginTop: 8 },
  resetBtnText: { fontFamily: 'Inter-Bold', fontSize: 16, color: '#FFFFFF' },
});