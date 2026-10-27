import { Image } from 'expo-image';
import { router, Stack } from 'expo-router'; // <-- Added Stack here
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function App() {
  return (
    <>
      {/* This hides the default top header on the landing page */}
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

            <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
              <Text style={styles.secondaryButtonText}>About SpeakSteps</Text>
            </TouchableOpacity>
            
          </View>

        </View>
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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
    color: '#FFFFFF', 
    fontSize: 16,
    fontWeight: 'bold',
  },
});