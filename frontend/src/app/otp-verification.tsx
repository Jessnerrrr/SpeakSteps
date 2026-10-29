import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export default function OtpVerificationScreen() {
  const { email } = useLocalSearchParams();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<any[]>([]);

  // Timer State (5 minutes = 300 seconds)
  const [timeLeft, setTimeLeft] = useState(300);

  // Custom Alert States
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');

  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../assets/fonts/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../assets/fonts/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../assets/fonts/SourGummy-Bold.ttf'),
  });

  useEffect(() => {
    const timerId = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  if (!fontsLoaded) return null; 

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text !== '' && index < 5) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) prevInput.focus();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSubmit = () => {
    const enteredOtp = otp.join('');
    
    if (enteredOtp.length < 6) {
      setAlertTitle("Incomplete OTP");
      setAlertMessage("Please enter the full 6-digit verification code before submitting.");
      setAlertType('error');
      setAlertVisible(true);
      return;
    }

    router.push('/new-password' as any);
  };

  const handleResend = () => {
    setAlertTitle("OTP Resent!");
    setAlertMessage(`A new 6-digit OTP has been sent to ${email ? email : 'your email'}.`);
    setAlertType('success');
    setAlertVisible(true);
    setTimeLeft(300);
  };

  const canResend = timeLeft <= 180; 

  // --- Circular Progress Math & Colors ---
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  // Calculates how much of the circle should be empty
  const strokeDashoffset = circumference * (1 - (timeLeft / 300)); 

  // Dynamically change colors based on remaining time
  const getRingColor = () => {
    if (timeLeft > 180) return '#0865AD'; // Blue (5:00 - 3:01)
    if (timeLeft > 60) return '#F5B041';  // Yellow (3:00 - 1:01)
    return '#E74C3C';                     // Red (1:00 - 0:00)
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
            
            <View style={styles.animationContainer}>
              <View style={styles.circleWrapper}>
                
                {/* SVG Circular Progress Ring */}
                <Svg width="140" height="140" style={styles.svgRing}>
                  {/* Faded Background Track */}
                  <Circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke="#E8F4FA"
                    strokeWidth="6"
                    fill="none"
                  />
                  {/* Dynamic Color Countdown Track */}
                  <Circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke={getRingColor()}
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </Svg>

                <View style={styles.innerCircle}>
                  <Image 
                    source={require('../../assets/images/otp-timer.gif')} 
                    style={styles.centerGif}
                    contentFit="contain"
                  />
                </View>
              </View>
              
              {/* Text color now matches the ring color! */}
              <Text style={[styles.timerText, { color: getRingColor() }]}>
                {formatTime(timeLeft)}
              </Text>
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.subText}>
                Enter the OTP sent to {email ? email : 'your email'}:
              </Text>
            </View>

            <View style={styles.formContainer}>
              
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputRefs.current[index] = ref; }}
                    style={styles.otpInput}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="numeric"
                    maxLength={1}
                  />
                ))}
              </View>

              <Text style={styles.timeBasedLabel}>TIME-BASED ONE-TIME-PASSWORD</Text>

              <View style={styles.buttonStack}>
                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                  <Text style={styles.submitBtnText}>Submit</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.resendBtn, !canResend && { backgroundColor: '#F0F0F0' }]} 
                  onPress={handleResend} 
                  disabled={!canResend}
                >
                  <Text style={[styles.resendBtnText, !canResend && { color: '#999' }]}>
                    Resend Code
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </View>

        <Modal visible={alertVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.alertBox}>
              <Text style={[styles.alertTitle, alertType === 'error' ? { color: '#E74C3C' } : { color: '#0865AD' }]}>
                {alertTitle}
              </Text>
              <Text style={styles.alertMessage}>{alertMessage}</Text>
              <TouchableOpacity 
                style={[styles.alertBtn, alertType === 'error' ? { backgroundColor: '#E74C3C' } : { backgroundColor: '#0865AD' }]} 
                onPress={() => setAlertVisible(false)}
              >
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
  
  bottomCard: { backgroundColor: '#FFFFFF', borderRadius: 40, marginHorizontal: 15, paddingHorizontal: 25, paddingTop: 40, paddingBottom: 40 },
  
  // Animation & Timer Styles
  animationContainer: { alignItems: 'center', marginBottom: 20, marginTop: -20 },
  circleWrapper: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center', marginBottom: 15, position: 'relative' },
  
  // Rotates to start at top, flips X to deplete clockwise!
  svgRing: { position: 'absolute', transform: [{ rotate: '-90deg' }, { scaleX: -1 }] },
  
  innerCircle: { width: 115, height: 115, borderRadius: 57.5, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, overflow: 'hidden' },
  centerGif: { width: 75, height: 75 },
  
  timerText: { fontFamily: 'SourGummy-Bold', fontSize: 32 },
  
  textContainer: { alignItems: 'center', marginBottom: 20 },
  subText: { fontFamily: 'SourGummy-Medium', fontSize: 13, color: '#666', textAlign: 'center', paddingHorizontal: 10, lineHeight: 18 },
  
  formContainer: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 5 },
  
  otpContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 15 },
  otpInput: { width: 35, height: 45, borderBottomWidth: 2, borderColor: '#0865AD', textAlign: 'center', fontFamily: 'SourGummy-Bold', fontSize: 24, color: '#0865AD' },
  
  timeBasedLabel: { fontFamily: 'SourGummy-Medium', fontSize: 10, color: '#0865AD', textAlign: 'center', marginBottom: 30, letterSpacing: 0.5 },

  buttonStack: { width: '100%', gap: 12 },
  submitBtn: { backgroundColor: '#F5B041', alignSelf: 'center', width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  submitBtnText: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 16 },
  
  resendBtn: { backgroundColor: '#E8F4FA', alignSelf: 'center', width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  resendBtnText: { fontFamily: 'SourGummy-Bold', color: '#0865AD', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: '#FFFFFF', width: '75%', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  alertTitle: { fontFamily: 'SourGummy-Bold', fontSize: 22, marginBottom: 10, textAlign: 'center' },
  alertMessage: { fontFamily: 'SourGummy-Medium', fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  alertBtn: { paddingVertical: 10, paddingHorizontal: 40, borderRadius: 10 },
  alertBtnText: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 16 }
});