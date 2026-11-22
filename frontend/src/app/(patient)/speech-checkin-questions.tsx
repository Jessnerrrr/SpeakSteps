import { CheckinHeader } from '../../components/CheckinHeader';
import React, { useEffect, useRef, useState } from 'react';
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
    options: [
      "No concerns",
      "Hearing worries or infections",
      "Lost words or skills",
      "Both of these",
    ],
  },
  {
    step: 7,
    question: "What is your main goal for your child?",
    options: [
      "Say first words",
      "Say more words",
      "Join words together",
      "Speak more clearly",
    ],
  },
];

export default function SpeechCheckInQuestionsScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const isTablet = width > 600;

  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../../assets/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../../assets/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  useEffect(() => {
    return () => {
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
      }
    };
  }, []);

  if (!fontsLoaded) return null;

  const activeData = questionsData[currentStep - 1];
  const isLastStep = currentStep === questionsData.length;

  // Larger responsive card
  const cardHeight = Math.min(580, height * 0.75);

  const goToSoundCheck = () => {
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    setIsNavigating(true);
    router.push('/sound-check' as any);
  };

  const handleBack = () => {
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    setIsNavigating(false);

    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setSelectedOption(answers[prevStep] ?? null);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/speech-checkin' as any);
    }
  };

  const handleSelect = (index: number) => {
    if (isNavigating) return;

    setSelectedOption(index);
    setAnswers((prev) => ({ ...prev, [currentStep]: index }));

    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
    }

    if (!isLastStep) {
      stepTimerRef.current = setTimeout(() => {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        setSelectedOption(answers[nextStep] ?? null);
      }, 220);
    } else {
      stepTimerRef.current = setTimeout(() => {
        goToSoundCheck();
      }, 150);
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
        <View
          style={[
            styles.container,
            isTablet && styles.containerTablet,
          ]}
        >
          {/* HEADER */}
          <CheckinHeader title="Speech check-in" onBack={handleBack} />

          {/* MINIMAL QUESTION CARD */}
          <View
            style={[
              styles.questionCard,
              { height: cardHeight },
            ]}
          >
            {/* PROGRESS LINES */}
            <View style={styles.progressContainer}>
              {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                <View
                  key={step}
                  style={[
                    styles.progressBar,
                    step <= currentStep
                      ? styles.progressActive
                      : styles.progressInactive,
                  ]}
                />
              ))}
            </View>

            {/* QUESTION */}
            <Text style={styles.questionText}>
              {activeData.question}
            </Text>

            {/* ANSWER OPTIONS */}
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
                    disabled={isNavigating}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* QUESTION COUNTER */}
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

  // MAIN CONTAINER
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 80,
    paddingBottom: 12,
  },

  containerTablet: {
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },

  // HEADER
  // QUESTION CARD (MINIMAL)
  questionCard: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C8DFEE',
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 26,
    justifyContent: 'space-between',
    alignSelf: 'center',
    marginTop: -5,
    marginBottom: 'auto',
  },

  // PROGRESS LINES
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 18,
  },

  progressBar: {
    flex: 1,
    height: 11,
    borderRadius: 6,
    marginHorizontal: 3,
  },

  progressActive: {
    backgroundColor: '#FEB723',
  },

  progressInactive: {
    backgroundColor: '#DCEBF5',
  },

  // QUESTION
  questionText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 22,
    color: '#0C66AD',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 37,
  },

  // ANSWER OPTIONS
  optionsContainer: {
    width: '100%',
    marginVertical: 10,
  },

  optionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.8,
    borderColor: '#D0E6F5',
    borderRadius: 26,
    paddingVertical: 21,
    paddingHorizontal: 22,
    marginBottom: 15,
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
    fontSize: 18,
    color: '#0C66AD',
    textAlign: 'center',
  },

  optionTextSelected: {
    fontFamily: 'SourGummy-Bold',
    color: '#0C66AD',
  },

  // FOOTER
  footerInfo: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 16,
    color: '#657786',
    textAlign: 'center',
    marginBottom: 4,
  },
});