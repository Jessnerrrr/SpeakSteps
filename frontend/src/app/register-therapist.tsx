import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ImageBackground, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';

export default function TherapistRegistrationScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [licenseNo, setLicenseNo] = useState('');
  const [profileImage, setProfileImage] = useState<string | undefined>(undefined);
  const [idImage, setIdImage] = useState<string | undefined>(undefined);

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'success'>('error');

  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../assets/SourGummy-Regular.ttf'), 
    'SourGummy-Medium': require('../../assets/SourGummy-Medium.ttf'), 
    'SourGummy-Bold': require('../../assets/SourGummy-Bold.ttf'), 
  });

  if (!fontsLoaded) return null; 

  const pickProfileImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) setProfileImage(result.assets[0].uri);
  };

  const pickIdImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) setIdImage(result.assets[0].uri);
  };

  const isLengthValid = password.length >= 8 && password.length <= 20;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_]/.test(password);
  const isPasswordValid = isLengthValid && hasLowercase && hasUppercase && hasNumber && hasSpecial;

  const handleSubmit = () => {
    setHasSubmitted(true);
    if (!fullName || !email || !password || !licenseNo || !profileImage || !idImage) {
      setAlertTitle("Missing Details");
      setAlertMessage("Please fill in all the required fields and upload your photos before submitting.");
      setAlertType('error');
      setAlertVisible(true);
      return; 
    }

    if (!isPasswordValid) {
      setAlertTitle("Weak Password");
      setAlertMessage("Please ensure your password meets all the security requirements.");
      setAlertType('error');
      setAlertVisible(true);
      return;
    }

    setAlertTitle("Success!");
    setAlertMessage("Registered successfully, wait for the approval of the account.");
    setAlertType('success');
    setAlertVisible(true);
  };

  const closeAlert = () => {
    setAlertVisible(false);
    if (alertType === 'success') {
      router.push('/login' as any);
    }
  };

  const handleLicenseInput = (text: string) => {
    const numericOnly = text.replace(/[^0-9]/g, '');
    setLicenseNo(numericOnly);
  };

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
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.container}>
            
            <View style={styles.topSection}>
              <Image source={require('../../assets/images/bird-logo.gif')} style={styles.birdImage} contentFit="contain" />
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
                  <Text style={styles.headerText}>Therapist Account</Text>
                </View>

                {/* Therapist GIF Icon */}
                <Image source={require('../../assets/images/therapist_blue.gif')} style={styles.gifIcon} contentFit="cover" />

                <Text style={styles.welcomeText}>Register as Therapist</Text>
                <Text style={styles.subText}>Licensed and ID check required</Text>

                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Personal Information</Text>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Full name</Text>
                    <TextInput style={[styles.input, hasSubmitted && !fullName && styles.errorBorder]} placeholder="last name, first name, middle initial" placeholderTextColor="#999" value={fullName} onChangeText={setFullName} />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput style={[styles.input, hasSubmitted && !email && styles.errorBorder]} placeholder="therapist@gmail.com" placeholderTextColor="#999" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
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
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                        <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

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

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Upload Profile Picture</Text>
                    <TouchableOpacity 
                      style={[styles.uploadButton, profileImage ? styles.uploadButtonWithImage : null, hasSubmitted && !profileImage && styles.errorBorder]} 
                      onPress={pickProfileImage}
                    >
                      {profileImage ? (
                        <Image source={{ uri: profileImage }} style={styles.uploadedImage} contentFit="cover" />
                      ) : (
                        <Image source={require('../../assets/images/upload-icon.png')} style={styles.uploadIconImage} contentFit="contain" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Professional Verification</Text>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>License no. <Text style={styles.asterisk}>*</Text></Text>
                    <TextInput 
                      style={[styles.input, hasSubmitted && !licenseNo && styles.errorBorder]} 
                      placeholder="e.g. 1234567" 
                      placeholderTextColor="#999" 
                      keyboardType="numeric"
                      value={licenseNo} 
                      onChangeText={handleLicenseInput} 
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Photo of valid ID or PRC License <Text style={styles.asterisk}>*</Text></Text>
                    <TouchableOpacity 
                      style={[styles.uploadButton, idImage ? styles.uploadButtonWithImage : null, hasSubmitted && !idImage && styles.errorBorder]} 
                      onPress={pickIdImage}
                    >
                      {idImage ? (
                        <Image source={{ uri: idImage }} style={styles.uploadedImage} contentFit="cover" />
                      ) : (
                        <Image source={require('../../assets/images/upload-icon.png')} style={styles.uploadIconImage} contentFit="contain" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                  <Text style={styles.submitText}>Submit for Approval</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/login' as any)}>
                  <Text style={styles.loginLink}>Already Have an Account? Log In</Text>
                </TouchableOpacity>

              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>

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
  topSection: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 40, paddingHorizontal: 20, transform: [{ translateX: -15 }] }, 
  birdImage: { width: 110, height: 110, marginRight: 15 }, 
  brandTextContainer: { justifyContent: 'center' },
  brandTitle: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 36 }, 
  bottomCard: { backgroundColor: '#FFFFFF', flex: 4, borderRadius: 40, marginHorizontal: 15, marginBottom: 15, paddingHorizontal: 25, paddingTop: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#CBE6F6' },
  scrollContent: { paddingBottom: 30 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  backButton: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#0865AD', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  backIcon: { color: '#FFFFFF', fontSize: 18, lineHeight: 22, fontFamily: 'SourGummy-Bold' },
  headerText: { fontFamily: 'SourGummy-Bold', color: '#0865AD', fontSize: 14 },
  gifIcon: { width: 40, height: 40, borderRadius: 8, marginBottom: 10 },
  welcomeText: { fontFamily: 'SourGummy-Bold', fontSize: 22, color: '#0865AD', marginBottom: 5 }, 
  subText: { fontFamily: 'SourGummy-Medium', fontSize: 10, color: '#666', marginBottom: 15 },
  sectionContainer: { borderWidth: 1, borderColor: '#CBE6F6', borderRadius: 15, padding: 15, marginBottom: 15 },
  sectionTitle: { fontFamily: 'SourGummy-Bold', fontSize: 14, color: '#0865AD', marginBottom: 15 },
  inputContainer: { marginBottom: 12 },
  inputLabel: { fontFamily: 'SourGummy-Bold', fontSize: 10, color: '#0865AD', marginBottom: 4 },
  asterisk: { color: '#E74C3C' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBE6F6', borderRadius: 10, paddingHorizontal: 15, height: 40, fontFamily: 'SourGummy', color: '#333', fontSize: 12 },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBE6F6', borderRadius: 10, paddingHorizontal: 15, height: 40 },
  passwordInput: { flex: 1, fontFamily: 'SourGummy', color: '#333', fontSize: 12, height: '100%' },
  eyeBtn: { paddingLeft: 10 },
  eyeText: { fontFamily: 'SourGummy-Bold', fontSize: 10, color: '#0865AD' },
  requirementsBox: { backgroundColor: '#F4F6F8', borderRadius: 4, overflow: 'hidden', marginBottom: 15 },
  requirementsHeader: { backgroundColor: '#2C7FB8', padding: 12 },
  requirementsHeaderText: { color: '#FFFFFF', fontFamily: 'SourGummy-Medium', fontSize: 11, lineHeight: 16 },
  requirementsList: { padding: 12, gap: 10 },
  reqItem: { flexDirection: 'row', alignItems: 'center' },
  reqCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 2.5, borderColor: '#2C7FB8', marginRight: 10 },
  reqCircleFilled: { backgroundColor: '#2C7FB8', borderWidth: 0 }, 
  reqText: { fontFamily: 'SourGummy-Medium', fontSize: 12, color: '#2C7FB8' },
  uploadButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBE6F6', borderRadius: 10, height: 40, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }, 
  uploadButtonWithImage: { height: 150 }, 
  uploadIconImage: { width: 24, height: 24 },
  uploadedImage: { width: '100%', height: '100%' }, 
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { width: '80%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 5 },
  alertTitle: { fontFamily: 'SourGummy-Bold', fontSize: 20, color: '#0865AD', marginBottom: 10, textAlign: 'center' },
  alertMessage: { fontFamily: 'SourGummy', fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  alertBtn: { backgroundColor: '#0865AD', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 10 },
  alertBtnText: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 16 },
  submitBtn: { backgroundColor: '#0865AD', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 15 },
  submitText: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 16 },
  loginLink: { fontFamily: 'SourGummy-Bold', fontSize: 10, color: '#0865AD', textAlign: 'center', textDecorationLine: 'underline' },
  errorBorder: { borderColor: '#E74C3C', borderWidth: 1.5 },
});