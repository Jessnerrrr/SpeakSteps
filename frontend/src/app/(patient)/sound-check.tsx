import React, { useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

const soundChecksData = [
  { 
    step: 1, 
    title: "DOG", 
    type: "image", 
    source: require('../../../assets/images/dog.png') 
  },
  { 
    step: 2, 
    title: "MORE MILK", 
    type: "image",
    source: require('../../../assets/images/milk.png') 
  },
];

export default function SoundCheckScreen() {
  const router = useRouter();
  
  // Responsive Hooks
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  // FIXED FONT PATHS: Removed the /fonts/ folder segment
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  const activeCheck = soundChecksData[currentIndex];

  const handleSubmit = () => {
    if (currentIndex < soundChecksData.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsRecording(false);
    } else {
      router.push('/speech-checkin-result');
    }
  };

  return (
    <View style={styles.screenContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      <ImageBackground
        source={require('../../../assets/images/landing-bg-pattern.png')}
        style={styles.background}
        imageStyle={{ opacity: 0.05 }}
        resizeMode="cover"
      >
        <View style={[styles.container, isTablet && styles.containerTablet]}>
          
          {/* Top Header Bar */}
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                if (currentIndex > 0) {
                  setCurrentIndex(currentIndex - 1);
                } else {
                  router.back();
                }
              }}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Say it!</Text>
          </View>

          {/* Main White Card filling the screen height nicely */}
          <View style={styles.card}>
            
            {/* Target Image / Illustration Box with Dashed Border */}
            <View style={styles.imageBox}>
              {activeCheck.type === 'image' ? (
                <Image 
                  source={activeCheck.source} 
                  style={styles.dogAvatar} 
                  resizeMode="contain" 
                />
              ) : (
                <Text style={styles.emojiPlaceholder}>{(activeCheck as any).emoji}</Text>
              )}
              <Text style={styles.cardWordTitle}>{activeCheck.title}</Text>
            </View>

            {/* Listen Button with volume.png image */}
            <TouchableOpacity 
              style={styles.listenButton}
              activeOpacity={0.85}
              onPress={() => {}}
            >
              <View style={styles.listenContent}>
                <Image 
                  source={require('../../../assets/images/volume.png')} 
                  style={styles.volumeIcon} 
                  resizeMode="contain" 
                />
                <Text style={styles.listenButtonText}>Listen</Text>
              </View>
            </TouchableOpacity>

            {/* Microphone Recording Section with mic.png image */}
            <View style={styles.micContainer}>
              <TouchableOpacity 
                style={[styles.micButton, isRecording && styles.micButtonActive]}
                activeOpacity={0.8}
                onPressIn={() => setIsRecording(true)}
                onPressOut={() => setIsRecording(false)}
              >
                <Image 
                  source={require('../../../assets/images/mic.png')} 
                  style={styles.micImage} 
                  resizeMode="contain" 
                />
              </TouchableOpacity>
              <Text style={styles.micSubtext}>Long press the mic to record your voice</Text>
              <Text style={styles.micPrompt}>Ask your child to say it</Text>
            </View>

            {/* Submit Button inside the White Card */}
            <TouchableOpacity 
              style={styles.submitButton}
              activeOpacity={0.85}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>

          </View>

        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { 
    flex: 1, 
    backgroundColor: '#C4E1F0' 
  },
  background: { 
    flex: 1, 
    width: '100%', 
    height: '100%' 
  },
  container: { 
    flex: 1, 
    flexDirection: 'column', 
    alignItems: 'center', 
    paddingHorizontal: 25, 
    paddingTop: 70,
    paddingBottom: 100,
  },
  containerTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  headerRow: { 
    width: '100%', 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 14,
    flexShrink: 0,
  },
  backButton: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 3, 
    elevation: 3, 
    marginRight: 12,
  },
  backIcon: { 
    fontSize: 22, 
    color: '#0C66AD', 
    fontWeight: 'bold',
  },
  headerTitle: { 
    fontFamily: 'SourGummy-Bold', 
    fontSize: 23, 
    color: '#0C66AD',
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    borderWidth: 2.5, 
    borderColor: '#B0D5EC', 
    width: '100%', 
    borderRadius: 32, 
    paddingVertical: 28, 
    paddingHorizontal: 22, 
    alignItems: 'center', 
    justifyContent: 'space-between',
    flex: 1,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.12, 
    shadowRadius: 10, 
    elevation: 6,
  },
  imageBox: { 
    width: '100%', 
    flex: 1.3,
    maxHeight: 250, 
    borderWidth: 2, 
    borderColor: '#FEB723', 
    borderStyle: 'dashed', 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#FFFAED',
    marginBottom: -8,
  },
  dogAvatar: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  emojiPlaceholder: { 
    fontSize: 65, 
    marginBottom: 6, 
  },
  cardWordTitle: { 
    fontFamily: 'SourGummy-Bold', 
    fontSize: 22, 
    color: '#0C66AD', 
    letterSpacing: 1.5, 
  },
  listenButton: { 
    backgroundColor: '#0C66AD', 
    width: '100%', 
    paddingVertical: 14, 
    borderRadius: 26, 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 3 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 5, 
    elevation: 3,
    marginTop: -30,
  },
  listenContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeIcon: {
    width: 22,
    height: 22,
    marginRight: 8,
  },
  listenButtonText: { 
    fontFamily: 'SourGummy-Bold', 
    color: '#FFFFFF', 
    fontSize: 18, 
  },
  micContainer: { 
    alignItems: 'center', 
    marginTop: -40,
  },
  micButton: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    backgroundColor: '#E74C3C', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 6, 
    elevation: 5, 
  },
  micButtonActive: { 
    backgroundColor: '#C0392B', 
    transform: [{ scale: 0.95 }], 
  },
  micImage: {
    width: 45,
    height: 45,
  },
  micPrompt: { 
    fontFamily: 'SourGummy-Bold', 
    fontSize: 16, 
    color: '#0C66AD', 
    marginTop: 4, 
  },
  micSubtext: { 
    fontFamily: 'SourGummy-Medium', 
    fontSize: 12.5, 
    color: '#8A9BA8', 
    textAlign: 'center', 
  },
  submitButton: { 
    backgroundColor: '#FEB723', 
    width: '100%', 
    paddingVertical: 18, 
    borderRadius: 28, 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 3 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 5, 
    elevation: 7, 
    marginTop: -30
  },
  submitButtonText: { 
    fontFamily: 'SourGummy-Bold', 
    color: '#FFFFFF', 
    fontSize: 19, 
  },
});