import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ImageBackground, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function TherapistRegistrationScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [license, setLicense] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [idImage, setIdImage] = useState<string | null>(null);

  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'success'>('error');

  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../assets/fonts/SourGummy-Regular.ttf'), 
    'SourGummy-Medium': require('../../assets/fonts/SourGummy-Medium.ttf'), 
    'SourGummy-Bold': require('../../assets/fonts/SourGummy-Bold.ttf'), 
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

  const handleSubmit = () => {
    setHasSubmitted(true);
    if (!fullName || !email || !password || !license || !profileImage || !idImage) {
      setAlertTitle("Missing Details");
      setAlertMessage("Please fill in all the required fields and upload your photos before submitting.");
      setAlertType('error');
      setAlertVisible(true);
      return; 
    }

    setAlertTitle("Success!");
    setAlertMessage("Registered successfully, wait for the approval of the account.\n\n(Note: This pop-up will be removed once the UI integration is done, for now it is just for presentation.)");
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
    setLicense(numericOnly);
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

              <Text style={styles.welcomeText}>Register as Therapist</Text>
              <Text style={styles.subText}>Your license / therapy ID is checked by the Center before you can log in.</Text>

              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full name</Text>
                <TextInput style={[styles.input, hasSubmitted && !fullName && styles.errorBorder]} placeholder="last name, first name, middle initial" placeholderTextColor="#999" value={fullName} onChangeText={setFullName} />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput style={[styles.input, hasSubmitted && !email && styles.errorBorder]} placeholder="parents@gmail.com" placeholderTextColor="#999" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
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
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Upload Profile Picture</Text>
                <TouchableOpacity 
                  style={[styles.uploadButton, profileImage && styles.uploadButtonWithImage, hasSubmitted && !profileImage && styles.errorBorder]} 
                  onPress={pickProfileImage}
                >
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.uploadedImage} contentFit="cover" />
                  ) : (
                    <Image source={require('../../assets/images/upload-icon.png')} style={styles.uploadIconImage} contentFit="contain" />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>Professional Verification</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>License / Therapy ID no.</Text>
                <TextInput 
                  style={[styles.input, hasSubmitted && !license && styles.errorBorder]} 
                  placeholder="e.g. 1234567" 
                  placeholderTextColor="#999" 
                  keyboardType="numeric"
                  value={license} 
                  onChangeText={handleLicenseInput} 
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Photo of valid ID or Therapy ID *</Text>
                <TouchableOpacity 
                  style={[styles.uploadButton, idImage && styles.uploadButtonWithImage, hasSubmitted && !idImage && styles.errorBorder]} 
                  onPress={pickIdImage}
                >
                  {idImage ? (
                    <Image source={{ uri: idImage }} style={styles.uploadedImage} contentFit="cover" />
                  ) : (
                    <Image source={require('../../assets/images/upload-icon.png')} style={styles.uploadIconImage} contentFit="contain" />
                  )}
                </TouchableOpacity>
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
topSection: { 
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingTop: 40, 
    paddingHorizontal: 20,
    transform: [{ translateX: -15 }], // <-- Visually nudges everything to the left without squeezing the text!
  },  birdImage: { width: 110, height: 110, marginRight: 15 }, 
  brandTextContainer: { justifyContent: 'center' },
  brandTitle: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 36 }, 
  bottomCard: { backgroundColor: '#FFFFFF', flex: 4, borderRadius: 40, marginHorizontal: 15, marginBottom: 15, paddingHorizontal: 25, paddingTop: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#CBE6F6' },
  scrollContent: { paddingBottom: 30 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  backButton: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#0865AD', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  backIcon: { color: '#FFFFFF', fontSize: 18, lineHeight: 22, fontFamily: 'SourGummy-Bold' },
  headerText: { fontFamily: 'SourGummy-Bold', color: '#0865AD', fontSize: 14 },
  
  // This is now Bold!
  welcomeText: { fontFamily: 'SourGummy-Bold', fontSize: 22, color: '#0865AD', marginBottom: 5 }, 
  
  subText: { fontFamily: 'SourGummy-Medium', fontSize: 10, color: '#666', marginBottom: 15 },
  sectionTitle: { fontFamily: 'SourGummy-Bold', fontSize: 14, color: '#0865AD', marginTop: 10, marginBottom: 10 },
  inputContainer: { marginBottom: 12 },
  inputLabel: { fontFamily: 'SourGummy-Bold', fontSize: 10, color: '#0865AD', marginBottom: 4 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBE6F6', borderRadius: 10, paddingHorizontal: 15, height: 40, fontFamily: 'SourGummy', color: '#333', fontSize: 12 },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBE6F6', borderRadius: 10, paddingHorizontal: 15, height: 40 },
  passwordInput: { flex: 1, fontFamily: 'SourGummy', color: '#333', fontSize: 12, height: '100%' },
  eyeBtn: { paddingLeft: 10 },
  eyeText: { fontFamily: 'SourGummy-Bold', fontSize: 10, color: '#0865AD' },
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
  submitBtn: { backgroundColor: '#0865AD', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 15, marginBottom: 15 },
  submitText: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 16 },
  loginLink: { fontFamily: 'SourGummy-Bold', fontSize: 10, color: '#0865AD', textAlign: 'center', textDecorationLine: 'underline' },
  errorBorder: { borderColor: '#E74C3C', borderWidth: 1.5 },
});