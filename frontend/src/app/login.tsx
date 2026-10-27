import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  // Load the custom font from your assets folder
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../assets/fonts/SourGummy.ttf'), 
  });

  // Wait for the font to load before showing the screen
  if (!fontsLoaded) {
    return null; 
  }

  return (
    <>
      {/* Hides the default white top header */}
      <Stack.Screen options={{ headerShown: false }} /> 

      <ImageBackground 
        source={require('../../assets/images/split-bg.png')} 
        style={styles.background}
        imageStyle={{ opacity: 1 }} // Changed to 1 so the full color shows
        resizeMode="cover"
      >
        <View style={styles.container}>
          
          {/* Top Section: Logo & Brand Side-by-Side */}
          <View style={styles.topSection}>
            <Image 
              source={require('../../assets/images/bird-logo.gif')} 
              style={styles.birdImage}
              contentFit="contain"
            />
            <View style={styles.brandTextContainer}>
              <Text style={styles.brandTitle}>SpeakSteps</Text>
              <Text style={styles.brandSubtitle}>Speech delay practice for children</Text>
            </View>
          </View>

          {/* Bottom Section: White Card */}
          <View style={styles.bottomCard}>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.subText}>Choose how you'd like to log in.</Text>

            {/* Therapist Button */}
            <TouchableOpacity 
              style={styles.roleCard}
              onPress={() => router.push('/therapist-login' as any)} 
            >
              <View style={[styles.iconBox, { backgroundColor: '#CBE6F6' }]} />
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>Log In as Therapist</Text>
                <Text style={styles.roleSubtitle}>Manage patients and activities</Text>
              </View>
              <View style={styles.arrowCircle}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </TouchableOpacity>

            {/* Patient Button */}
            <TouchableOpacity 
              style={styles.roleCard}
              onPress={() => router.push('/patient-login' as any)} 
            >
              <View style={[styles.iconBox, { backgroundColor: '#FDE4AB' }]} />
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>Log In as Patient</Text>
                <Text style={styles.roleSubtitle}>Parent / Guardian and Child</Text>
              </View>
              <View style={styles.arrowCircle}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </TouchableOpacity>

            {/* Footer Links */}
            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.createAccountBtn}
                onPress={() => router.push('/create-account' as any)} 
              >
                <Text style={styles.createAccountText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#3487C6', 
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
    flexDirection: 'row', 
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  birdImage: {
    width: 100, 
    height: 100,
    marginRight: 10,
  },
  brandTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: 'SourGummy',
    color: '#FFFFFF',
    fontSize: 28,
  },
  brandSubtitle: {
    fontFamily: 'SourGummy',
    color: '#FFFFFF',
    fontSize: 10,
  },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    flex: 2,
    borderRadius: 40, 
    marginHorizontal: 15, 
    marginBottom: 30, 
    paddingHorizontal: 25,
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
    borderWidth: 1, 
    borderColor: '#CBE6F6',
  },
  welcomeText: {
    fontFamily: 'SourGummy',
    fontSize: 28,
    color: '#0865AD',
    marginBottom: 10,
  },
  subText: {
    fontFamily: 'SourGummy',
    fontSize: 12,
    color: '#666',
    marginBottom: 30,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    width: '100%',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 15,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontFamily: 'SourGummy',
    fontSize: 14,
    color: '#000',
  },
  roleSubtitle: {
    fontFamily: 'SourGummy',
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  arrowCircle: {
    backgroundColor: '#0865AD',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  createAccountBtn: {
    backgroundColor: '#0865AD',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  createAccountText: {
    fontFamily: 'SourGummy',
    color: '#FFFFFF',
    fontSize: 16,
  },
});