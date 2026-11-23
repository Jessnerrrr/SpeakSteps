import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewPasswordScreen() {
  const insets = useSafeAreaInsets();

  const { role, flow } = useLocalSearchParams();
  const currentRole = Array.isArray(role) ? role[0] : role;
  const isSetupFlow = (Array.isArray(flow) ? flow[0] : flow) === 'setup';

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Tracks if the new password input is clicked/focused
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Custom Alert States
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error'); // 'error' | 'success'

  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  // --- Real-time Password Validation Logic ---
  const isLengthValid = newPassword.length >= 8 && newPassword.length <= 20;
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_]/.test(newPassword);

  const isPasswordValid = isLengthValid && hasLowercase && hasUppercase && hasNumber && hasSpecial;

  const handleSave = () => {
    if (!oldPassword.trim()) {
      setAlertTitle("Required Field");
      setAlertMessage("Old password is required. Please fill in this field.");
      setAlertType('error');
      setAlertVisible(true);
      return;
    }
    if (!newPassword.trim()) {
      setAlertTitle("Required Field");
      setAlertMessage("New password is required. Please fill in this field.");
      setAlertType('error');
      setAlertVisible(true);
      return;
    }
    if (!confirmPassword.trim()) {
      setAlertTitle("Required Field");
      setAlertMessage("Confirm password is required. Please fill in this field.");
      setAlertType('error');
      setAlertVisible(true);
      return;
    }

    if (!isPasswordValid) {
      setAlertTitle("Weak Password");
      setAlertMessage("Please ensure your new password meets all the security requirements.");
      setAlertType('error');
      setAlertVisible(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setAlertTitle("Oops!");
      setAlertMessage("Your new password and confirm password don't match. Please try again.");
      setAlertType('error');
      setAlertVisible(true);
      return;
    }

    setAlertTitle("Success!");
    setAlertMessage(
      isSetupFlow
        ? "Your password has been updated! Let's finish setting up your account."
        : "Your password has been changed. You will now be redirected to sign in."
    );
    setAlertType('success');
    setAlertVisible(true);
  };

  const handleAlertClose = () => {
    setAlertVisible(false);
    if (alertType === 'success') {
      if (isSetupFlow) {
        if (currentRole === 'therapist') {
          if (router.canDismiss()) router.dismissAll();
          router.replace('/therapist' as any);
        } else if (currentRole === 'teacher') {
          if (router.canDismiss()) router.dismissAll();
          router.replace('/teacher/teacher-dashboard' as any);
        } else {
          // Patient setup continues to Check-in
          // Update '/check-in' below if your check-in file has a different route name
          router.replace({ pathname: '/speech-checkin', params: { role: 'patient' } } as any);
        }
      } else {
        if (router.canDismiss()) router.dismissAll();
        router.replace('/login' as any);
      }
    }
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
        source={require('../../../assets/images/split-bg.png')}
        style={styles.background}
        imageStyle={{ opacity: 1 }}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}
          >
            <View style={styles.bottomCard}>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={22} color="#0865AD" />
              </TouchableOpacity>
              <View style={styles.titleRow}>
                <Image source={require('../../../assets/images/bird-logo.gif')} style={styles.bird} contentFit="contain" />
                <View style={styles.textContainer}>
                  <Text accessibilityRole="header" style={styles.welcomeText}>Create new password</Text>
                  <Text style={styles.subText}>{isSetupFlow ? 'Replace your temporary password' : 'Provide your new password'}</Text>
                </View>
              </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  {isSetupFlow ? 'Temporary Password' : 'Old Password'}
                </Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor="#6A7985"
                    secureTextEntry={!showOldPassword}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                  />
                  <TouchableOpacity accessibilityRole="button" style={styles.eyeButton} onPress={() => setShowOldPassword(!showOldPassword)}>
                    <Text style={styles.eyeButtonText}>{showOldPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor="#6A7985"
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    maxLength={20}
                    onChangeText={setNewPassword}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                  />
                  <TouchableOpacity accessibilityRole="button" style={styles.eyeButton} onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Text style={styles.eyeButtonText}>{showNewPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dynamic Password Requirements Box (Only visible when focused) */}
              {isPasswordFocused && (
                <View style={styles.requirementsBox}>
                  <View style={styles.requirementsHeader}>
                    <Text style={styles.requirementsHeaderText}>
                      Your password needs:
                    </Text>
                  </View>
                  <View style={styles.requirementsList}>
                    <RequirementItem text="8–20 characters" isValid={isLengthValid} />
                    <RequirementItem text="Lowercase letter" isValid={hasLowercase} />
                    <RequirementItem text="Capital letter" isValid={hasUppercase} />
                    <RequirementItem text="Number" isValid={hasNumber} />
                    <RequirementItem text="Special character" isValid={hasSpecial} />
                  </View>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor="#6A7985"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    maxLength={20}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity accessibilityRole="button" style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Text style={styles.eyeButtonText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity accessibilityRole="button" style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Custom Branded UI Alert Modal */}
        <Modal visible={alertVisible} transparent={true} animationType="fade" onRequestClose={handleAlertClose}>
          <View style={styles.modalOverlay}>
            <View style={styles.alertBox}>
              <Text style={[styles.alertTitle, alertType === 'error' ? { color: '#E74C3C' } : { color: '#0865AD' }]}>
                {alertTitle}
              </Text>
              <Text style={styles.alertMessage}>{alertMessage}</Text>
              <TouchableOpacity style={styles.alertBtn} onPress={handleAlertClose}>
                <Text style={styles.alertBtnText}>OK</Text>
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
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  bottomCard: { width: '100%', maxWidth: 460, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, gap: 14 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EAF5FC', justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-start' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 2 },
  bird: { width: 54, height: 54 },
  textContainer: { flex: 1, minWidth: 0 },
  welcomeText: { fontFamily: 'SourGummy-Bold', fontSize: 22, color: '#0865AD' },
  subText: { fontFamily: 'SourGummy-Medium', fontSize: 14, color: '#536575', marginTop: 2 },
  formContainer: { gap: 12 },
  inputContainer: { gap: 5 },
  inputLabel: { fontFamily: 'SourGummy-Bold', fontSize: 13, color: '#0865AD' },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', minHeight: 48, borderWidth: 1, borderColor: '#CBE6F6', borderRadius: 10, overflow: 'hidden' },
  input: { flex: 1, minWidth: 0, minHeight: 46, paddingHorizontal: 12, fontFamily: 'SourGummy', fontSize: 15, color: '#243646' },
  eyeButton: { minWidth: 52, minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  eyeButtonText: { fontFamily: 'SourGummy-Bold', fontSize: 13, color: '#0865AD' },

  // --- Dynamic Requirements Styles ---
  requirementsBox: { backgroundColor: '#F4F6F8', borderRadius: 8, overflow: 'hidden' },
  requirementsHeader: { backgroundColor: '#2C7FB8', padding: 12 },
  requirementsHeaderText: { color: '#FFFFFF', fontFamily: 'SourGummy-Medium', fontSize: 11, lineHeight: 16 },
  requirementsList: { padding: 12, gap: 10 },
  reqItem: { flexDirection: 'row', alignItems: 'center' },
  reqCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 2.5, borderColor: '#2C7FB8', marginRight: 10 },
  reqCircleFilled: { backgroundColor: '#2C7FB8', borderWidth: 0 },
  reqText: { fontFamily: 'SourGummy-Medium', fontSize: 12, color: '#2C7FB8' },

  saveBtn: { minHeight: 48, backgroundColor: '#0865AD', justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  saveBtnText: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 16 },

  // Custom Modal Alert Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: '#FFFFFF', width: '75%', maxWidth: 400, borderRadius: 20, padding: 25, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  alertTitle: { fontFamily: 'SourGummy-Bold', fontSize: 22, marginBottom: 10, textAlign: 'center' },
  alertMessage: { fontFamily: 'SourGummy-Medium', fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  alertBtn: { backgroundColor: '#0865AD', paddingVertical: 10, paddingHorizontal: 40, borderRadius: 10 },
  alertBtnText: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 16 }
});
