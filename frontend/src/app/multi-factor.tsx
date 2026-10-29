import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function MultiFactorScreen() {
  const [email, setEmail] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../assets/fonts/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../assets/fonts/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../assets/fonts/SourGummy-Bold.ttf'),
  });

  if (!fontsLoaded) return null; 

  const handleSendOTP = () => {
    setHasSubmitted(true);
    
    if (!email) {
      Alert.alert("Email Required", "Please enter your email to receive an OTP.");
      return; 
    }
    
    // Once validated, push to the next screen and pass the email!
    router.push({ 
      pathname: '/otp-verification', 
      params: { email: email } 
    });
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
          
          {/* Top Header Section */}
          <View style={styles.topHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButtonWhite}>
              <Text style={styles.backIconBlue}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.topHeaderText}>Forgot Password</Text>
          </View>

          {/* Bottom Section: White Card that stretches to the bottom */}
          <View style={styles.bottomCard}>
            
            <Text style={styles.welcomeText}>Multi-factor Authentication</Text>
            <Text style={styles.subText}>Enter your email to start recovery.</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput 
                style={[styles.input, hasSubmitted && !email && styles.errorBorder]} 
                placeholder="parent@gmail.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Now triggering the validation function before routing */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSendOTP}>
              <Text style={styles.submitBtnText}>Get OTP</Text>
            </TouchableOpacity>

          </View>
        </View>
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
  
  bottomCard: { backgroundColor: '#FFFFFF', borderRadius: 40, marginHorizontal: 15, paddingHorizontal: 25, paddingTop: 40, paddingBottom: 40 },
  welcomeText: { fontFamily: 'SourGummy-Bold', fontSize: 20, color: '#0865AD', marginBottom: 10, textAlign: 'center' },
  subText: { fontFamily: 'SourGummy-Medium', fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 35 },
  
  inputContainer: { marginBottom: 35 },
  inputLabel: { fontFamily: 'SourGummy-Bold', fontSize: 12, color: '#0865AD', marginBottom: 5 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBE6F6', borderRadius: 10, paddingHorizontal: 15, height: 50, fontFamily: 'SourGummy', color: '#333', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  errorBorder: { borderColor: '#E74C3C', borderWidth: 1.5 },
  
  // Renamed from otpBtn to submitBtn to match your JSX code
  submitBtn: { backgroundColor: '#F5B041', alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 60, borderRadius: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  submitBtnText: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 16 },
});