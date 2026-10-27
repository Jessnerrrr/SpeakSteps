import DateTimePicker from '@react-native-community/datetimepicker';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ImageBackground, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PatientRegistrationScreen() {
  // Parent/Guardian States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Parent Date Picker States
  const [parentDob, setParentDob] = useState<Date | null>(null);
  const [showParentDatePicker, setShowParentDatePicker] = useState(false);

  // Child States
  const [childName, setChildName] = useState('');
  const [startingLevel, setStartingLevel] = useState('');
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);

  // Child Date Picker States
  const [childDob, setChildDob] = useState<Date | null>(null);
  const [showChildDatePicker, setShowChildDatePicker] = useState(false);

  // Custom Alert States
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'success'>('error');

  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../assets/fonts/SourGummy.ttf'), 
  });

  if (!fontsLoaded) return null; 

  // --- Date Limits ---
  const today = new Date();
  
  // Parent: 25 to 65 years old
  const parentMaxDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate()); 
  const parentMinDate = new Date(today.getFullYear() - 65, today.getMonth(), today.getDate()); 

  // Child: 9 to 21 years old
  const childMaxDate = new Date(today.getFullYear() - 9, today.getMonth(), today.getDate()); 
  const childMinDate = new Date(today.getFullYear() - 21, today.getMonth(), today.getDate()); 

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) setProfileImage(result.assets[0].uri);
  };

  const calculateAge = (birthday: Date) => {
    const currentDate = new Date();
    let calculatedAge = currentDate.getFullYear() - birthday.getFullYear();
    const m = currentDate.getMonth() - birthday.getMonth();
    if (m < 0 || (m === 0 && currentDate.getDate() < birthday.getDate())) {
      calculatedAge--;
    }
    return calculatedAge;
  };

  const handleSubmit = () => {
    if (!fullName || !parentDob || !email || !password || !childName || !childDob || !startingLevel || !profileImage) {
      setAlertTitle("Missing Details");
      setAlertMessage("Please fill in all the required fields and upload a profile picture before submitting.");
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

  const levelOptions = [
    'Beginner (Sounds & Words)', 
    'Intermediate (Short Phrases)', 
    'Advanced (Sentences)'
  ];

  const formatDateAndAge = (date: Date | null) => {
    if (!date) return "Select Birthday";
    return `${date.toLocaleDateString()} (Age: ${calculateAge(date)})`; 
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
              <Text style={styles.brandSubtitle}>Speech delay practice for children</Text>
            </View>
          </View>

          <View style={styles.bottomCard}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              
              <View style={styles.cardHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                  <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerText}>Patient Account</Text>
              </View>

              <Text style={styles.welcomeText}>Create Patient Account</Text>
              <Text style={styles.subText}>For parents and guardians. You will add your child next.</Text>

              <Text style={styles.sectionTitle}>1 - Parent / Guardian</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full name</Text>
                <TextInput style={styles.input} placeholder="last name, first name, middle initial" placeholderTextColor="#999" value={fullName} onChangeText={setFullName} />
              </View>

              {/* Parent Birthday Picker */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Birthday</Text>
                <TouchableOpacity style={styles.dropdownInput} onPress={() => setShowParentDatePicker(true)}>
                  <Text style={[styles.dropdownPlaceholder, !parentDob && { color: '#999' }]}>
                    {parentDob ? parentDob.toLocaleDateString() : "Select Birthday"}
                  </Text>
                  <Image source={require('../../assets/images/calendar-icon.png')} style={styles.calendarIcon} contentFit="contain" />
                </TouchableOpacity>
              </View>

              {/* Parent Age (Auto-calculated & Read-Only) */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput 
                  style={[styles.input, styles.readOnlyInput]} 
                  placeholder="Auto-calculated" 
                  placeholderTextColor="#999" 
                  value={parentDob ? calculateAge(parentDob).toString() : ''} 
                  editable={false} 
                />
              </View>

              {/* Parent Date Picker Component */}
              {showParentDatePicker && (
                <DateTimePicker
                  value={parentDob || parentMaxDate} 
                  mode="date"
                  display="default"
                  minimumDate={parentMinDate} 
                  maximumDate={parentMaxDate} 
                  onChange={(event, selectedDate) => {
                    setShowParentDatePicker(Platform.OS === 'ios'); 
                    if (selectedDate) setParentDob(selectedDate);
                  }}
                />
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput style={styles.input} placeholder="parents@gmail.com" placeholderTextColor="#999" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordWrapper}>
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
                <TouchableOpacity style={[styles.uploadButton, profileImage && styles.uploadButtonWithImage]} onPress={pickImage}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.uploadedImage} contentFit="cover" />
                  ) : (
                    <Image source={require('../../assets/images/upload-icon.png')} style={styles.uploadIconImage} contentFit="contain" />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>2 - Child's profile</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Child's name</Text>
                <TextInput style={styles.input} placeholder="" placeholderTextColor="#999" value={childName} onChangeText={setChildName} />
              </View>

              {/* Child Birthday Picker */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Birthday</Text>
                <TouchableOpacity style={styles.dropdownInput} onPress={() => setShowChildDatePicker(true)}>
                  <Text style={[styles.dropdownPlaceholder, !childDob && { color: '#999' }]}>
                    {childDob ? childDob.toLocaleDateString() : "Select Birthday"}
                  </Text>
                  <Image source={require('../../assets/images/calendar-icon.png')} style={styles.calendarIcon} contentFit="contain" />
                </TouchableOpacity>
              </View>

              {/* Child Age (Auto-calculated & Read-Only) */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput 
                  style={[styles.input, styles.readOnlyInput]} 
                  placeholder="Auto-calculated" 
                  placeholderTextColor="#999" 
                  value={childDob ? calculateAge(childDob).toString() : ''} 
                  editable={false} 
                />
              </View>

              {/* Child Date Picker Component */}
              {showChildDatePicker && (
                <DateTimePicker
                  value={childDob || childMaxDate} 
                  mode="date"
                  display="default"
                  minimumDate={childMinDate} 
                  maximumDate={childMaxDate} 
                  onChange={(event, selectedDate) => {
                    setShowChildDatePicker(Platform.OS === 'ios');
                    if (selectedDate) setChildDob(selectedDate);
                  }}
                />
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Starting Level</Text>
                <TouchableOpacity style={styles.dropdownInput} onPress={() => setShowLevelDropdown(true)}>
                  <Text style={styles.dropdownPlaceholder}>
                    {startingLevel || 'Select Level'}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitText}>Create Account</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/login' as any)}>
                <Text style={styles.loginLink}>Already Have an Account? Log In</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </ImageBackground>

      {/* Custom Alert Modal */}
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

      {/* Level Dropdown Modal */}
      <Modal visible={showLevelDropdown} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLevelDropdown(false)}>
          <View style={styles.modalContent}>
            {levelOptions.map((item) => (
              <TouchableOpacity key={item} style={styles.modalItem} onPress={() => {
                  setStartingLevel(item); setShowLevelDropdown(false);
                }}>
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

    </>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#3487C6' },
  container: { flex: 1, justifyContent: 'space-between' },
  topSection: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 },
  birdImage: { width: 80, height: 80, marginRight: 10 },
  brandTextContainer: { flex: 1, justifyContent: 'center' },
  brandTitle: { fontFamily: 'SourGummy', color: '#FFFFFF', fontSize: 24 },
  brandSubtitle: { fontFamily: 'SourGummy', color: '#FFFFFF', fontSize: 9 },
  bottomCard: { backgroundColor: '#FFFFFF', flex: 4, borderRadius: 40, marginHorizontal: 15, marginBottom: 15, paddingHorizontal: 25, paddingTop: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#CBE6F6' },
  scrollContent: { paddingBottom: 30 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  backButton: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#0865AD', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  backIcon: { color: '#FFFFFF', fontSize: 18, lineHeight: 22, fontWeight: 'bold' },
  headerText: { fontFamily: 'SourGummy', color: '#0865AD', fontSize: 14, fontWeight: 'bold' },
  welcomeText: { fontFamily: 'SourGummy', fontSize: 22, color: '#0865AD', marginBottom: 5 },
  subText: { fontFamily: 'SourGummy', fontSize: 10, color: '#666', marginBottom: 15 },
  sectionTitle: { fontFamily: 'SourGummy', fontSize: 14, color: '#0865AD', fontWeight: 'bold', marginTop: 10, marginBottom: 10 },
  inputContainer: { marginBottom: 12 },
  inputLabel: { fontFamily: 'SourGummy', fontSize: 10, color: '#0865AD', marginBottom: 4, fontWeight: 'bold' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBE6F6', borderRadius: 10, paddingHorizontal: 15, height: 40, fontFamily: 'SourGummy', color: '#333', fontSize: 12 },
  
  readOnlyInput: { backgroundColor: '#F0F5F9', color: '#666' },

  passwordWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBE6F6', borderRadius: 10, paddingHorizontal: 15, height: 40 },
  passwordInput: { flex: 1, fontFamily: 'SourGummy', color: '#333', fontSize: 12, height: '100%' },
  eyeBtn: { paddingLeft: 10 },
  eyeText: { fontFamily: 'SourGummy', fontSize: 10, color: '#0865AD', fontWeight: 'bold' },
  
  uploadButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBE6F6', borderRadius: 10, height: 40, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  uploadButtonWithImage: { height: 150 }, 
  uploadIconImage: { width: 24, height: 24 },
  uploadedImage: { width: '100%', height: '100%' },
  
  dropdownInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBE6F6', borderRadius: 10, paddingHorizontal: 15, height: 40 },
  dropdownPlaceholder: { flex: 1, fontFamily: 'SourGummy', fontSize: 12, color: '#333' },
  dropdownArrow: { color: '#0865AD', fontSize: 12 }, 
  calendarIcon: { width: 18, height: 18 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', maxHeight: '60%', backgroundColor: '#FFFFFF', borderRadius: 15, paddingVertical: 10, elevation: 5 },
  modalItem: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalItemText: { fontFamily: 'SourGummy', fontSize: 14, color: '#0865AD', textAlign: 'center' },

  alertBox: { width: '80%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 5 },
  alertTitle: { fontFamily: 'SourGummy', fontSize: 20, color: '#0865AD', marginBottom: 10, textAlign: 'center' },
  alertMessage: { fontFamily: 'SourGummy', fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  alertBtn: { backgroundColor: '#0865AD', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 10 },
  alertBtnText: { fontFamily: 'SourGummy', color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  submitBtn: { backgroundColor: '#0865AD', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 15, marginBottom: 15 },
  submitText: { fontFamily: 'SourGummy', color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  loginLink: { fontFamily: 'SourGummy', fontSize: 10, color: '#0865AD', textAlign: 'center', textDecorationLine: 'underline', fontWeight: 'bold' },
});