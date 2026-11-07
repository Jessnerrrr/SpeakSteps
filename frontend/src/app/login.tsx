import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

export default function LoginScreen() {
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../assets/SourGummy-Bold.ttf'),
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
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Back Button Header */}
                <View style={styles.cardHeader}>
                  <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backIcon}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.headerText}>Log In</Text>
                </View>

                <Text style={styles.welcomeText}>Welcome back!</Text>
                <Text style={styles.subText}>Choose how you'd like to log in.</Text>

                {/* Login as Therapist Button */}
                <TouchableOpacity 
                  style={styles.roleCard}
                  onPress={() => router.push('/therapist-login' as any)} 
                >
                  <Image 
                    source={require('../../assets/images/therapist_blue.gif')} 
                    style={styles.gifIcon}
                    contentFit="cover"
                  />
                  <View style={styles.roleTextContainer}>
                    <Text style={styles.roleTitle}>Log In as Therapist</Text>
                    <Text style={styles.roleSubtitle}>Manage patients and activities.</Text>
                  </View>
                  <View style={styles.arrowCircle}>
                    <Text style={styles.arrowText}>›</Text>
                  </View>
                </TouchableOpacity>

                {/* Login as Teacher Button */}
                <TouchableOpacity 
                  style={styles.roleCard}
                  onPress={() => router.push('/teacher-login' as any)} 
                >
                  <Image 
                    source={require('../../assets/images/teacher-icon.gif')} 
                    style={styles.gifIcon}
                    contentFit="cover"
                  />
                  <View style={styles.roleTextContainer}>
                    <Text style={styles.roleTitle}>Log In as Teacher</Text>
                    <Text style={styles.roleSubtitle}>Parent / Guardian and Child</Text>
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
                  <Image 
                    source={require('../../assets/images/kid_yellow.gif')} 
                    style={styles.gifIcon}
                    contentFit="cover"
                  />
                  <View style={styles.roleTextContainer}>
                    <Text style={styles.roleTitle}>Log In as Patient</Text>
                    <Text style={styles.roleSubtitle}>Parent / Guardian and Child</Text>
                  </View>
                  <View style={styles.arrowCircle}>
                    <Text style={styles.arrowText}>›</Text>
                  </View>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>new here?</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Footer Buttons/Links */}
                <View style={styles.footer}>
                  <TouchableOpacity 
                    style={styles.createAccountBtn}
                    onPress={() => router.push('/create-account' as any)}
                  >
                    <Text style={styles.createAccountBtnText}>Create Account</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => router.push('/admin-login' as any)}>
                    <Text style={styles.adminLink}>Sign in as Center Admin</Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
            </View>

          </View>
        </KeyboardAvoidingView>
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
    transform: [{ translateX: -15 }], 
  },  
  birdImage: { width: 110, height: 110, marginRight: 15  }, 
  brandTextContainer: { flex: 1, justifyContent: 'center' },
  brandTitle: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 36 }, 
  bottomCard: { backgroundColor: '#FFFFFF', flex: 2.5, borderRadius: 40, marginHorizontal: 15, marginBottom: 30, paddingHorizontal: 25, paddingTop: 25, paddingBottom: 20 },
  scrollContent: { paddingBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  backButton: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#0865AD', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  backIcon: { color: '#FFFFFF', fontSize: 18, lineHeight: 22, fontFamily: 'SourGummy-Bold' },
  headerText: { fontFamily: 'SourGummy-Bold', color: '#0865AD', fontSize: 14 },
  welcomeText: { fontFamily: 'SourGummy-Bold', fontSize: 26, color: '#0865AD', marginBottom: 5 },
  subText: { fontFamily: 'SourGummy-Medium', fontSize: 12, color: '#666', marginBottom: 20 },
  roleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', width: '100%', padding: 15, borderRadius: 15, marginBottom: 12, borderWidth: 1, borderColor: '#E5E5E5', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  gifIcon: { width: 40, height: 40, borderRadius: 8, marginRight: 15 },
  roleTextContainer: { flex: 1 },
  roleTitle: { fontFamily: 'SourGummy-Bold', fontSize: 14, color: '#000' },
  roleSubtitle: { fontFamily: 'SourGummy-Medium', fontSize: 10, color: '#888', marginTop: 2 },
  arrowCircle: { backgroundColor: '#0865AD', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  arrowText: { color: '#FFFFFF', fontSize: 16, lineHeight: 22, fontFamily: 'SourGummy-Bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E5E5' },
  dividerText: { marginHorizontal: 10, fontFamily: 'SourGummy-Medium', fontSize: 12, color: '#999' },
  footer: { width: '100%', alignItems: 'center', marginBottom: 10 },
  createAccountBtn: { backgroundColor: '#0865AD', width: '100%', paddingVertical: 15, borderRadius: 15, alignItems: 'center', marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  createAccountBtnText: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 16 },
  adminLink: { fontFamily: 'SourGummy-Bold', fontSize: 12, color: '#0865AD', textDecorationLine: 'underline' },
});