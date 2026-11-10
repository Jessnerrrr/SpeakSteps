import React, { useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

const questionsData = [
  {
    step: 1,
    question: "How many words does your child say on their own?",
    options: ["None yet", "A few (1-10)", "Many (10-50)", "More than 50"],
  },
  {
    step: 2,
    question: "Does your child put words together?",
    options: ["Not yet", "Two-word phrases sometimes", "Often", "Short sentences"],
  },
  {
    step: 3,
    question: "Does your child understand and follow simple directions?",
    options: ["Not yet", "With gestures", "Usually", "Yes"],
  },
  {
    step: 4,
    question: "Does your child babble or copy sounds and words?",
    options: ["Rarely", "Sometimes", "Often", "Always"],
  },
  {
    step: 5,
    question: "How much can people outside the family understand?",
    options: ["Almost nothing", "A little", "Most of it", "Almost everything"],
  },
  {
    step: 6,
    question: "Have you noticed any of these concerns?",
    options: ["No concerns", "Hearing worries or infections", "Lost words or skills", "Both of these"],
  },
  {
    step: 7,
    question: "What is your main goal for your child?",
    options: ["Say first words", "Say more words", "Join words together", "Speak more clearly"],
  },
];

export default function SpeechCheckInQuestionsScreen() {
  const router = useRouter();
  
  // Responsive Hooks
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // FIXED FONT PATHS: Removed the /fonts/ folder segment
  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  const activeData = questionsData[currentStep - 1];

  const handleSelect = (index: number) => {
    setSelectedOption(index);
    setTimeout(() => {
      if (currentStep < 7) {
        setCurrentStep(currentStep + 1);
        setSelectedOption(null);
      } else {
        // Connected: Navigates to the Sound Check screen after step 7!
        router.push('/sound-check');
      }
    }, 250);
  };

  return (
    <View style={styles.screenContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* FIXED IMAGE PATH: 3 levels up */}
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
                if (currentStep > 1) {
                  setCurrentStep(currentStep - 1);
                  setSelectedOption(null);
                } else {
                  router.back();
                }
              }}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Speech check-in</Text>
          </View>

          {/* 7-Step Progress Indicator Bars */}
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4, 5, 6, 7].map((step) => (
              <View
                key={step}
                style={[
                  styles.progressBar,
                  step <= currentStep ? styles.progressActive : styles.progressInactive,
                ]}
              />
            ))}
          </View>

          {/* Question Card Container */}
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{activeData.question}</Text>

            <View style={styles.optionsContainer}>
              {activeData.options.map((option, index) => {
                const isSelected = selectedOption === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      isSelected && styles.optionButtonSelected,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleSelect(index)}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Question Counter Footer */}
            <Text style={styles.footerInfo}>
              Question {currentStep} of 7 • no right or wrong answers
            </Text>
          </View>

        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#C4E1F0',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 80,
  },
  // Added Tablet MaxWidth Constraint
  containerTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 20,
    color: '#0C66AD',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 22,
    color: '#0C66AD',
  },
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  progressBar: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  progressActive: {
    backgroundColor: '#FEB723',
  },
  progressInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#B0D5EC',
    width: '100%',
    borderRadius: 30,
    paddingVertical: 30,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  questionText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 20,
    color: '#0C66AD',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 28,
  },
  optionsContainer: {
    width: '100%',
    marginBottom: 18,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D0E6F5',
    borderRadius: 22,
    paddingVertical: 17,
    paddingHorizontal: 20,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionButtonSelected: {
    backgroundColor: '#EAF4FC',
    borderColor: '#0C66AD',
  },
  optionText: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 15.5,
    color: '#0C66AD',
  },
  optionTextSelected: {
    fontFamily: 'SourGummy-Bold',
    color: '#0C66AD',
  },
  footerInfo: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 12.5,
    color: '#657786',
    textAlign: 'center',
  },
});