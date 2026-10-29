import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ImageBackground, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function App() {
  // State to control the About modal visibility
  const [aboutVisible, setAboutVisible] = useState(false);

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
        source={require('../../assets/images/landing-bg-pattern.png')} 
        style={styles.background}
        imageStyle={{ opacity: 0.08 }}
        resizeMode="cover"
      >
        <View style={styles.container}>
          
          <Image 
            source={require('../../assets/images/landing-logo.gif')} 
            style={styles.logoImage}
            contentFit="contain" 
          />

          <View style={styles.buttonContainer}>
            
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={() => router.push('/login' as any)} 
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Text style={styles.playIcon}>▶</Text> 
            </TouchableOpacity>

            {/* Triggers the smooth fade-in Modal */}
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={() => setAboutVisible(true)}
            >
              <Text style={styles.secondaryButtonText}>About SpeakSteps</Text>
            </TouchableOpacity>
            
          </View>
        </View>

        {/* Custom About SpeakSteps Alert Modal with Fade Transition */}
        <Modal visible={aboutVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.alertBox}>
              
              <Image 
                source={require('../../assets/images/bird-logo.gif')} 
                style={styles.alertBird}
                contentFit="contain" 
              />
              
              <Text style={styles.alertTitle}>SpeakSteps</Text>
              <Text style={styles.alertMessage}>
                SpeakSteps helps children with speech delay practice sounds, words, phrases and sentences. Therapists assign activities, parents guide practice at home, and children play and speak.
              </Text>
              
              {/* Closes the modal with a smooth fade-out */}
              <TouchableOpacity style={styles.alertBtn} onPress={() => setAboutVisible(false)}>
                <Text style={styles.alertBtnText}>Got it!</Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>

      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoImage: {
    width: 340, 
    height: 340,
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 15, 
  },
  button: {
    width: '80%',
    paddingVertical: 15,
    borderRadius: 30, 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  primaryButton: {
    backgroundColor: '#FFB923', 
  },
  primaryButtonText: {
    fontFamily: 'SourGummy-Bold',
    color: '#FFFFFF',
    fontSize: 18,
    marginRight: 10,
  },
  playIcon: {
    color: '#0865AD',
    fontSize: 18,
  },
  secondaryButton: {
    backgroundColor: '#0865AD', 
  },
  secondaryButtonText: {
    fontFamily: 'SourGummy-Bold',
    color: '#FFFFFF', 
    fontSize: 16,
  },

  // Custom Modal Styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  alertBox: { 
    backgroundColor: '#FFFFFF', 
    width: '80%', 
    borderRadius: 20, 
    padding: 25, 
    alignItems: 'center', 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 4 
  },
  alertBird: {
    width: 70,
    height: 70,
    marginBottom: 10,
  },
  alertTitle: { 
    fontFamily: 'SourGummy-Bold', 
    fontSize: 24, 
    color: '#0865AD',
    marginBottom: 15, 
    textAlign: 'center' 
  },
  alertMessage: { 
    fontFamily: 'SourGummy-Medium', 
    fontSize: 14, 
    color: '#555', 
    textAlign: 'center', 
    marginBottom: 25, 
    lineHeight: 22 
  },
  alertBtn: { 
    backgroundColor: '#F5B041', 
    paddingVertical: 12, 
    paddingHorizontal: 40, 
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  alertBtnText: { 
    fontFamily: 'SourGummy-Bold', 
    color: '#FFFFFF', 
    fontSize: 16 
  }
});