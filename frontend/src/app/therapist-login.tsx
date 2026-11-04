import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, Modal, ScrollView } from 'react-native';

export default function TherapistLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // NEW STATE: Tracks if the password input is clicked/focused
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Alert States for Redirect Notice
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../assets/fonts/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../assets/fonts/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../assets/fonts/SourGummy-Bold.ttf'),
  });

  if (!fontsLoaded) return null; 

  // --- Real-time Password Validation Logic ---
  const isLengthValid = password.length >= 8 && password.length <= 20;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_]/.test(password);

  const handleLogin = () => {
    setHasSubmitted(true);
    if (!email || !password) {
      return; 
    }
  };

  const handleRequestAccount = () => {
    setAlertTitle("Redirecting");
    setAlertMessage("You will now be redirected to the Therapist Registration page to request an account.");
    setAlertVisible(true);
  };

  const closeAlert = () => {
    setAlertVisible(false);
    router.push('/register-therapist' as any); // Redirects after clicking OK
  };

  // Reusable component for the checklist items
  const RequirementItem = ({ text, isValid }: { text: string, isValid: boolean }) => (
    <View style={styles.reqItem}>
      <View style={[styles.reqCircle, isValid && styles.reqCircleFilled]} />
      <Text style={styles.reqText}>{text}</Text>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} /> 

      <ImageBackground 
        source={require('../../assets/images/split-bg.png')} 
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
                source={require('../../assets/images/bird-logo.gif')} 
                style={styles.birdImage}
                contentFit="contain"
              />
              <View style={styles.brandTextContainer}>
                <Text style={styles.brandTitle}>SpeakSteps</Text>
              </View>
            </View>

            <View style={styles.bottomCard}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                <View style={styles.cardHeader}>
                  <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backIcon}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.headerText}>Therapist login</Text>
                </View>

                {/* Therapist Blue GIF Icon (Matches Patient Login UI) */}
                <Image 
                  source={require('../../assets/images/therapist_blue.gif')} 
                  style={styles.gifIcon}
                  contentFit="cover"
                />
                
                <Text style={styles.welcomeText}>Therapist sign in</Text>
                <Text style={styles.subText}>Welcome back! Sign in to manage your patients.</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput 
                    style={[styles.input, hasSubmitted && !email && styles.errorBorder]} 
                    placeholder="therapist@gmail.com"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={[styles.passwordWrapper, hasSubmitted && !password && styles.errorBorder]}>
                    <TextInput 
                      style={styles.passwordInput} 
                      placeholder="••••••••"
                      placeholderTextColor="#999"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setIsPasswordFocused(true)}   
                      onBlur={() => setIsPasswordFocused(false)}   
                    />
                    <TouchableOpacity 
                      style={styles.showButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text style={styles.showButtonText}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Only renders the box if the password input is focused */}
                {isPasswordFocused && (
                  <View style={styles.requirementsBox}>
                    <View style={styles.requirementsHeader}>
                      <Text style={styles.requirementsHeaderText}>
                        The password length is 8-20 characters and must contain at least 1 lowercase letter, 1 capital letter, 1 number, and 1 special character.
                      </Text>
                    </View>
                    <View style={styles.requirementsList}>
                      <RequirementItem text="Number of characters" isValid={isLengthValid} />
                      <RequirementItem text="Lowercase letter" isValid={hasLowercase} />
                      <RequirementItem text="Capital letter" isValid={hasUppercase} />
                      <RequirementItem text="Number" isValid={hasNumber} />
                      <RequirementItem text="Special character" isValid={hasSpecial} />
                    </View>
                  </View>
                )}

                <TouchableOpacity style={styles.signInBtn} onPress={handleLogin}>
                  <Text style={styles.signInText}>Sign in</Text>
                </TouchableOpacity>

                <View style={styles.linksContainer}>
                  <TouchableOpacity onPress={() => router.push('/forgot-password' as any)}>
                    <Text style={styles.linkText}>Forgot password?</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleRequestAccount}>
                    <Text style={styles.linkText}>Request a therapist account.</Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>

      {/* Redirect Alert Modal */}
      <Modal visible={alertVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>{alertTitle}</Text>
            <Text style={styles.alertMessage}>{alertMessage}</Text>
            <TouchableOpacity style={styles.alertBtn} onPress={closeAlert}>
              <Text style={styles.alertBtnText}>OK</Text>
            </TouchableOpacity>
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
  },  birdImage: { width: 110, height: 110, marginRight: 15 },
  brandTextContainer: { justifyContent: 'center' },
  brandTitle: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 36 },
  bottomCard: { backgroundColor: '#FFFFFF', flex: 2.5, borderRadius: 40, marginHorizontal: 15, marginBottom: 30, paddingHorizontal: 25, paddingTop: 25, paddingBottom: 20 },
  scrollContent: { paddingBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#0865AD', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  backIcon: { color: '#FFFFFF', fontSize: 18, lineHeight: 22, fontFamily: 'SourGummy-Bold' },
  headerText: { fontFamily: 'SourGummy-Bold', color: '#0865AD', fontSize: 14 },
  
  // GIF Icon replaces the iconBox
  gifIcon: { width: 40, height: 40, borderRadius: 8, marginBottom: 10 },
  
  welcomeText: { fontFamily: 'SourGummy-Bold', fontSize: 26, color: '#0865AD', marginBottom: 5 },
  subText: { fontFamily: 'SourGummy-Medium', fontSize: 12, color: '#666', marginBottom: 20 },
  inputContainer: { marginBottom: 15 },
  inputLabel: { fontFamily: 'SourGummy-Bold', fontSize: 12, color: '#0865AD', marginBottom: 5 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBE6F6', borderRadius: 10, paddingHorizontal: 15, height: 45, fontFamily: 'SourGummy', color: '#333', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBE6F6', borderRadius: 10, height: 45, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  passwordInput: { flex: 1, paddingHorizontal: 15, fontFamily: 'SourGummy', color: '#333' },
  showButton: { backgroundColor: '#CBE6F6', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 15, marginRight: 8 },
  showButtonText: { color: '#0865AD', fontFamily: 'SourGummy-Bold', fontSize: 12 },
  
  // --- Dynamic Requirements Styles ---
  requirementsBox: { backgroundColor: '#F4F6F8', borderRadius: 4, overflow: 'hidden', marginBottom: 15 },
  requirementsHeader: { backgroundColor: '#2C7FB8', padding: 12 },
  requirementsHeaderText: { color: '#FFFFFF', fontFamily: 'SourGummy-Medium', fontSize: 11, lineHeight: 16 },
  requirementsList: { padding: 12, gap: 10 },
  reqItem: { flexDirection: 'row', alignItems: 'center' },
  reqCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 2.5, borderColor: '#2C7FB8', marginRight: 10 },
  reqCircleFilled: { backgroundColor: '#2C7FB8', borderWidth: 0 }, 
  reqText: { fontFamily: 'SourGummy-Medium', fontSize: 12, color: '#2C7FB8' },

  signInBtn: { backgroundColor: '#0865AD', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  signInText: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 16 },
  linksContainer: { alignItems: 'center', gap: 5 },
  linkText: { fontFamily: 'SourGummy-Bold', fontSize: 12, color: '#0865AD', textDecorationLine: 'underline' },
  errorBorder: { borderColor: '#E74C3C', borderWidth: 1.5 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { width: '80%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 5 },
  alertTitle: { fontFamily: 'SourGummy-Bold', fontSize: 20, color: '#0865AD', marginBottom: 10, textAlign: 'center' },
  alertMessage: { fontFamily: 'SourGummy', fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  alertBtn: { backgroundColor: '#0865AD', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 10 },
  alertBtnText: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 16 },
});