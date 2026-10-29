import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
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
          
          {/* Top Section */}
          <View style={styles.topSection}>
            <Image 
              source={require('../../assets/images/bird-logo.gif')} 
              style={styles.birdImage}
              contentFit="contain"
            />
            <View style={styles.brandTextContainer}>
              <Text style={styles.brandTitle}>SpeakSteps</Text>
            </View>
          </View>

          {/* Bottom Section: White Card */}
          <View style={styles.bottomCard}>
            
            {/* Back Button Header */}
            <View style={styles.cardHeader}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Text style={styles.backIcon}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.headerText}>Log In</Text>
            </View>

            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.subText}>Sign in to your account.</Text>

            {/* Login as Therapist Button */}
            <TouchableOpacity 
              style={styles.roleCard}
              onPress={() => router.push('/therapist-login' as any)} 
            >
              <View style={[styles.iconBox, { backgroundColor: '#CBE6F6' }]} />
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>Log in as Therapist</Text>
                <Text style={styles.roleSubtitle}>Access your patients</Text>
              </View>
              <View style={styles.arrowCircle}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </TouchableOpacity>

            {/* Login as Patient Button */}
            <TouchableOpacity 
              style={styles.roleCard}
              onPress={() => router.push('/patient-login' as any)} 
            >
              <View style={[styles.iconBox, { backgroundColor: '#FDE4AB' }]} />
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>Log in as Patient</Text>
                <Text style={styles.roleSubtitle}>Start practicing</Text>
              </View>
              <View style={styles.arrowCircle}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </TouchableOpacity>

            {/* Footer Link */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={() => router.push('/create-account' as any)}>
                <Text style={styles.createLink}>Don't have an Account? Register here</Text>
              </TouchableOpacity>
            </View>

          </View>

        </View>
      </ImageBackground>
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
  },  
  // Increased bird logo size
  birdImage: { width: 110, height: 110, marginRight: 15  }, 
  
  brandTextContainer: { flex: 1, justifyContent: 'center' },
  
  // Increased title size
  brandTitle: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 36 }, 
  
  bottomCard: { backgroundColor: '#FFFFFF', flex: 2, borderRadius: 40, marginHorizontal: 15, marginBottom: 30, paddingHorizontal: 25, paddingTop: 25, paddingBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#0865AD', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  backIcon: { color: '#FFFFFF', fontSize: 18, lineHeight: 22, fontFamily: 'SourGummy-Bold' },
  headerText: { fontFamily: 'SourGummy-Bold', color: '#0865AD', fontSize: 14 },
  welcomeText: { fontFamily: 'SourGummy-Medium', fontSize: 26, color: '#0865AD', marginBottom: 5 },
  subText: { fontFamily: 'SourGummy-Medium', fontSize: 12, color: '#666', marginBottom: 20 },
  
  roleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', width: '100%', padding: 15, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#E5E5E5', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  iconBox: { width: 40, height: 40, borderRadius: 8, marginRight: 15 },
  roleTextContainer: { flex: 1 },
  roleTitle: { fontFamily: 'SourGummy-Bold', fontSize: 14, color: '#000' },
  roleSubtitle: { fontFamily: 'SourGummy-Medium', fontSize: 10, color: '#888', marginTop: 2 },
  
  arrowCircle: { backgroundColor: '#0865AD', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  arrowText: { color: '#FFFFFF', fontSize: 16, lineHeight: 22, fontFamily: 'SourGummy-Bold' },
  
  footer: { width: '100%', alignItems: 'center', marginTop: 'auto', marginBottom: 10 },
  createLink: { fontFamily: 'SourGummy-Bold', fontSize: 12, color: '#0865AD', textDecorationLine: 'underline' },
});