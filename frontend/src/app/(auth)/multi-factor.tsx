import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { requestPasswordReset } from '@/services/user-api';

export default function MultiFactorScreen() {
  // Responsive Hooks
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  const [email, setEmail] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  if (!fontsLoaded) return null; 

  const handleSendOTP = async () => {
    setHasSubmitted(true);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Email required', 'Enter a valid email address.');
      return; 
    }
    setIsSubmitting(true);
    try {
      const { resetCode } = await requestPasswordReset(email.trim());
      if (!resetCode) {
        Alert.alert('Check your email', 'If an account exists for this address, a reset code has been issued.');
        return;
      }
      const continueToReset = () => router.push({ pathname: '/new-password', params: { flow: 'reset', email: email.trim() } } as any);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`Password reset code\n\nUse this code to choose a new password:\n\n${resetCode}`);
        continueToReset();
      } else {
        Alert.alert(
          'Password reset code',
          `Use this code to choose a new password:\n\n${resetCode}`,
          [{ text: 'Continue', onPress: continueToReset }],
        );
      }
    } catch (error) {
      Alert.alert('Could not request reset code', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <View style={styles.container}>
            
            {/* Top Header Section */}
            <View style={styles.topHeader}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButtonWhite}>
                <Text style={styles.backIconBlue}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.topHeaderText}>Forgot Password</Text>
            </View>

            {/* Bottom Section: White Card with Tablet Constraint */}
            <View style={[styles.bottomCard, isTablet && styles.bottomCardTablet]}>
              
              <Text style={styles.welcomeText}>Multi-factor Authentication</Text>
              <Text style={styles.subText}>Request a secure password reset code for your account.</Text>

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

              {/* Added Reminder Text */}
              <View style={styles.reminderContainer}>
                <Text style={styles.reminderText}>
                  Keep your contact details updated in <Text style={styles.boldText}>Settings</Text> and <Text style={styles.linkText}>enable two-factor authentication</Text> to protect your account and your child's progress.
                </Text>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={() => void handleSendOTP()} disabled={isSubmitting}>
                <Text style={styles.submitBtnText}>{isSubmitting ? 'Requesting…' : 'Request reset code'}</Text>
              </TouchableOpacity>

            </View>
          </View>
        </KeyboardAvoidingView>
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
  // Responsive Tablet Constraint
  bottomCardTablet: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },

  welcomeText: { fontFamily: 'SourGummy-Bold', fontSize: 20, color: '#0865AD', marginBottom: 10, textAlign: 'center' },
  subText: { fontFamily: 'SourGummy-Medium', fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 25 },
  
  inputContainer: { marginBottom: 15 },
  inputLabel: { fontFamily: 'SourGummy-Bold', fontSize: 12, color: '#0865AD', marginBottom: 5 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBE6F6', borderRadius: 10, paddingHorizontal: 15, height: 50, fontFamily: 'SourGummy', color: '#333', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  errorBorder: { borderColor: '#E74C3C', borderWidth: 1.5 },
  
  // New Reminder Styles
  reminderContainer: { paddingHorizontal: 5, marginBottom: 35 },
  reminderText: { fontFamily: 'SourGummy-Medium', fontSize: 10, color: '#666', lineHeight: 14, textAlign: 'left' },
  boldText: { fontFamily: 'SourGummy-Bold', color: '#333' },
  linkText: { fontFamily: 'SourGummy-Bold', color: '#0865AD', textDecorationLine: 'underline' },

  submitBtn: { backgroundColor: '#F5B041', alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 60, borderRadius: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  submitBtnText: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 16 },
});