import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, FlatList } from 'react-native';

const SECURITY_QUESTIONS = [
  "What is the name of your first-grade teacher?",
  "What is the middle name of your father?",
  "On what street did you grow up?",
  "What is the first and last name of your first boyfriend or girlfriend?",
  "What was the name of your elementary school?",
  "Where did you meet your spouse?",
  "In what town was your father born?",
  "In what town was your mother born?",
  "What was the first and last name of your first boss?",
];

export default function SecurityQuestionsScreen() {
  const [question, setQuestion] = useState('Select a question...');
  const [answer, setAnswer] = useState('');
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  const [fontsLoaded] = useFonts({
    'SourGummy': require('../../assets/fonts/SourGummy-Regular.ttf'),
    'SourGummy-Medium': require('../../assets/fonts/SourGummy-Medium.ttf'),
    'SourGummy-Bold': require('../../assets/fonts/SourGummy-Bold.ttf'),
  });

  if (!fontsLoaded) return null; 

  const handleSelectQuestion = (selectedQuestion: string) => {
    setQuestion(selectedQuestion);
    setDropdownVisible(false);
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
        {/* Pinned Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonWhite}>
            <Text style={styles.backIconBlue}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.topHeaderText}>Forgot Password</Text>
        </View>

        {/* Centered Floating Card Layout */}
        <View style={styles.container}>
          <View style={styles.bottomCard}>
            
            <Text style={styles.welcomeText}>Security Questions</Text>
            <Text style={styles.subText}>Pick 1 security question to answer</Text>

            <View style={styles.formContainer}>
              {/* Custom Dropdown Trigger */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Security Questions</Text>
                <TouchableOpacity 
                  style={styles.dropdownTrigger} 
                  activeOpacity={0.7}
                  onPress={() => setDropdownVisible(true)}
                >
                  <Text style={[styles.dropdownTriggerText, question === 'Select a question...' && { color: '#999' }]} numberOfLines={1}>
                    {question}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Answer Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Answer</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="input answer"
                  placeholderTextColor="#999"
                  value={answer}
                  onChangeText={setAnswer}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={() => router.push('/new-password' as any)}>
              <Text style={styles.submitBtnText}>Submit</Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* Custom Dropdown Modal */}
        <Modal visible={isDropdownVisible} transparent={true} animationType="fade">
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setDropdownVisible(false)}
          >
            <View style={styles.dropdownMenu}>
              <FlatList
                data={SECURITY_QUESTIONS}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.dropdownItem} 
                    onPress={() => handleSelectQuestion(item)}
                  >
                    <Text style={styles.dropdownItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
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
  
  welcomeText: { fontFamily: 'SourGummy-Bold', fontSize: 20, color: '#0865AD', marginBottom: 5 },
  subText: { fontFamily: 'SourGummy-Medium', fontSize: 12, color: '#666', marginBottom: 25 },
  
  formContainer: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, marginBottom: 30 },
  
  inputContainer: { marginBottom: 15 },
  inputLabel: { fontFamily: 'SourGummy-Bold', fontSize: 10, color: '#0865AD', marginBottom: 5 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBE6F6', borderRadius: 10, paddingHorizontal: 15, height: 45, fontFamily: 'SourGummy', color: '#333' },
  
  /* Custom Dropdown Trigger Styles */
  dropdownTrigger: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBE6F6', borderRadius: 10, paddingHorizontal: 15, height: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownTriggerText: { fontFamily: 'SourGummy', color: '#333', flex: 1, paddingRight: 10 },
  dropdownIcon: { color: '#CBE6F6', fontSize: 12 },
  
  submitBtn: { backgroundColor: '#F5B041', alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 60, borderRadius: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  submitBtnText: { fontFamily: 'SourGummy-Bold', color: '#FFFFFF', fontSize: 16 },

  /* Modal Menu Styles */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' },
  dropdownMenu: { backgroundColor: '#FFFFFF', width: '85%', maxHeight: '50%', borderRadius: 15, paddingVertical: 10, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  dropdownItem: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  dropdownItemText: { fontFamily: 'SourGummy', fontSize: 13, color: '#333' }
});