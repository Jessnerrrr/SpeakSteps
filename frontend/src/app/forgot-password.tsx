import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ForgotPasswordScreen() {
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../assets/fonts/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../assets/fonts/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../assets/fonts/SourGummy-Bold.ttf'),
  });

  if (!fontsLoaded) return null; 

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
          
          {/* Top Header Section (on blue background) */}
          <View style={styles.topHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButtonWhite}>
              <Text style={styles.backIconBlue}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.topHeaderText}>Forgot Password</Text>
          </View>

          {/* Bottom Section: White Card that stretches to the bottom */}
          <View style={styles.bottomCard}>
            
            {/* Overlapping Bird Logo */}
            <Image 
              source={require('../../assets/images/bird-logo.gif')} 
              style={styles.overlappingBird}
              contentFit="contain"
            />
            
            <View style={styles.textContainer}>
              <Text style={styles.welcomeText}>Oops! Let's get you back in</Text>
              <Text style={styles.subText}>
                <Text style={styles.subTextBold}>Options | </Text>
                Choose one of the options below
              </Text>
            </View>

            {/* Option 1: Multi-Factor */}
            <TouchableOpacity 
              style={[styles.roleCard, { backgroundColor: '#FDE4AB' }]}
              onPress={() => router.push('/multi-factor' as any)} 
            >
              <View style={styles.iconBoxWhite}>
                <Image source={require('../../assets/images/shieldplus.png')} style={styles.placeholderIcon} />
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>Multi-Factor Authenticator</Text>
                <Text style={styles.roleSubtitle}>Get an OTP by email or phone number</Text>
              </View>
              <Text style={styles.arrowIconBlue}>›</Text>
            </TouchableOpacity>

           {/* Option 2: Security Questions */}
            <TouchableOpacity 
              style={[styles.roleCard, { backgroundColor: '#CBE6F6' }]}
              onPress={() => router.push('/security-questions' as any)} 
            >
              <View style={styles.iconBoxWhite}>
                <Image source={require('../../assets/images/shieldquestion.png')} style={styles.placeholderIcon} />
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>Security Questions</Text>
                <Text style={styles.roleSubtitle}>Answer your secret questions</Text>
              </View>
              <Text style={styles.arrowIconBlue}>›</Text>
            </TouchableOpacity>

            {/* Back to Login Button */}
            <TouchableOpacity style={styles.backToLoginBtn} onPress={() => router.push('/login' as any)}>
              <Text style={styles.backToLoginText}>Back to Log In</Text>
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
  
 bottomCard: { backgroundColor: '#FFFFFF', borderRadius: 40, marginHorizontal: 15, paddingHorizontal: 25, paddingTop: 45, paddingBottom: 30 },
  
 overlappingBird: { position: 'absolute', top: 10, left: -2, width: 100, height: 100, zIndex: 10 },
  
  // Pushed text to the right to clear the bird perfectly
  textContainer: { marginLeft: 70, marginBottom: 35, marginTop: -5 },
  welcomeText: { fontFamily: 'SourGummy-Bold', fontSize: 18, color: '#0865AD', marginBottom: 5 },
  subText: { fontFamily: 'SourGummy-Medium', fontSize: 10, color: '#666' },
  subTextBold: { fontFamily: 'SourGummy-Bold', color: '#333' },
  
  roleCard: { flexDirection: 'row', alignItems: 'center', width: '100%', padding: 15, borderRadius: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  iconBoxWhite: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  placeholderIcon: { width: 20, height: 20, opacity: 0.5 },
  roleTextContainer: { flex: 1 },
  roleTitle: { fontFamily: 'SourGummy-Bold', fontSize: 14, color: '#0865AD' },
  roleSubtitle: { fontFamily: 'SourGummy-Medium', fontSize: 10, color: '#666', marginTop: 2 },
  arrowIconBlue: { color: '#0865AD', fontSize: 24, fontFamily: 'SourGummy-Bold', paddingRight: 10 },
  
  backToLoginBtn: { backgroundColor: '#0865AD', alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 10, marginTop: 30, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  backToLoginText: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 14 },
});