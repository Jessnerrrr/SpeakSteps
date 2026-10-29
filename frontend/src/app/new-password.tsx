import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal } from 'react-native';

export default function NewPasswordScreen() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Custom Alert States
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error'); // 'error' | 'success'

  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../assets/fonts/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../assets/fonts/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../assets/fonts/SourGummy-Bold.ttf'),
  });

  if (!fontsLoaded) return null; 

  const handleSave = () => {
    if (newPassword !== confirmPassword) {
      setAlertTitle("Oops!");
      setAlertMessage("Your new password and confirm password don't match. Please try again.");
      setAlertType('error');
      setAlertVisible(true);
      return;
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      setAlertTitle("Missing Fields");
      setAlertMessage("Please fill out all password fields before saving.");
      setAlertType('error');
      setAlertVisible(true);
      return;
    }

    setAlertTitle("Success!");
    setAlertMessage("Your password has been changed. You will now be redirected to sign in.");
    setAlertType('success');
    setAlertVisible(true);
  };

  const handleAlertClose = () => {
    setAlertVisible(false);
    if (alertType === 'success') {
      router.push('/login' as any);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} /> 

      <ImageBackground 
        source={require('../../assets/images/split-bg.png')} 
        style={styles.background}
        imageStyle={{ opacity: 1 }} 
        resizeMode="cover"
      >
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonWhite}>
            <Text style={styles.backIconBlue}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.topHeaderText}>Forgot Password</Text>
        </View>

        <View style={styles.container}>
          <View style={styles.bottomCard}>
            
            <Image 
              source={require('../../assets/images/bird-logo.gif')} 
              style={styles.overlappingBird}
              contentFit="contain"
            />
            
            <View style={styles.textContainer}>
              <Text style={styles.welcomeText}>Create new password</Text>
              <Text style={styles.subText}>Provide your new password</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Old Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput 
                    style={[styles.input, { paddingRight: 50 }]} 
                    placeholder="input password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showOldPassword}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowOldPassword(!showOldPassword)}>
                    <Text style={styles.eyeButtonText}>{showOldPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput 
                    style={[styles.input, { paddingRight: 50 }]} 
                    placeholder="input password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Text style={styles.eyeButtonText}>{showNewPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput 
                    style={[styles.input, { paddingRight: 50 }]} 
                    placeholder="input password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Text style={styles.eyeButtonText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* Custom Branded UI Alert Modal */}
        <Modal visible={alertVisible} transparent={true} animationType="fade">
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
  container: { flex: 1, justifyContent: 'center' },
  
  topHeader: { position: 'absolute', top: 60, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, zIndex: 20 },
  backButtonWhite: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2 },
  backIconBlue: { color: '#0865AD', fontSize: 24, lineHeight: 28, fontFamily: 'SourGummy-Bold' },
  topHeaderText: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 24 },
  
  bottomCard: { backgroundColor: '#FFFFFF', borderRadius: 40, marginHorizontal: 15, paddingHorizontal: 25, paddingTop: 40, paddingBottom: 40, position: 'relative' },
  
  overlappingBird: { position: 'absolute', top: 2, left: 8, width: 90, height: 90, zIndex: 10 },
  textContainer: { marginLeft: 75, marginBottom: 25 },
  welcomeText: { fontFamily: 'SourGummy-Bold', fontSize: 20, color: '#0865AD', marginBottom: 3 },
  subText: { fontFamily: 'SourGummy-Medium', fontSize: 12, color: '#666' },
  
  formContainer: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, marginBottom: 30 },
  
  inputContainer: { marginBottom: 12 },
  inputLabel: { fontFamily: 'SourGummy-Bold', fontSize: 10, color: '#0865AD', marginBottom: 5 },
  passwordWrapper: { position: 'relative', justifyContent: 'center' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBE6F6', borderRadius: 10, paddingHorizontal: 15, height: 45, fontFamily: 'SourGummy', color: '#333' },
  
  eyeButton: { position: 'absolute', right: 15, height: '100%', justifyContent: 'center' },
  eyeButtonText: { fontFamily: 'SourGummy-Bold', fontSize: 10, color: '#0865AD' },
  
  saveBtn: { backgroundColor: '#F5B041', alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 60, borderRadius: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  saveBtnText: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 16 },

  // Custom Modal Alert Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: '#FFFFFF', width: '75%', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  alertTitle: { fontFamily: 'SourGummy-Bold', fontSize: 22, marginBottom: 10, textAlign: 'center' },
  alertMessage: { fontFamily: 'SourGummy-Medium', fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  alertBtn: { backgroundColor: '#0865AD', paddingVertical: 10, paddingHorizontal: 40, borderRadius: 10 },
  alertBtnText: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 16 }
});