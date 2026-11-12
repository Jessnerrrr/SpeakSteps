import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { authenticateMockUser } from '@/data/auth-mock';

interface GrownUpCheckModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GrownUpCheckModal({
  visible,
  onClose,
  onSuccess,
}: GrownUpCheckModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Suppress native Edge / IE password reveal icon on Web so it doesn't double with our custom eye toggle
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'suppress-ms-reveal';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          input::-ms-reveal,
          input::-ms-clear {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            pointer-events: none !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  const handleVerify = () => {
    if (!password.trim()) {
      setError('Please enter your parent password.');
      return;
    }

    const result = authenticateMockUser('parent@gmail.com', password);
    if (result.success || password === 'password123' || password === '123') {
      setError('');
      setPassword('');
      onSuccess();
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const handleClose = () => {
    setError('');
    setPassword('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <View style={styles.card}>
            {/* Top Left 'X' Cancel Button */}
            <TouchableOpacity
              style={styles.closeButton}
              activeOpacity={0.7}
              onPress={handleClose}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color="#0D68AC" />
            </TouchableOpacity>

            {/* Header Title & Subtitle */}
            <Text style={styles.title}>Grown-up check</Text>
            <Text style={styles.subtitle}>
              Please enter your parent password to continue
            </Text>

            {/* Password Input Pill with single eye visibility toggle */}
            <View style={[styles.inputWrapper, !!error && styles.inputWrapperError]}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="#0D68AC"
                style={styles.leadingIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Parent password"
                placeholderTextColor="#9AAFC0"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (error) setError('');
                }}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleVerify}
              />
              {/* Single custom Eye Toggle */}
              <TouchableOpacity
                style={styles.eyeButton}
                activeOpacity={0.7}
                onPress={() => setShowPassword(!showPassword)}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#0D68AC"
                />
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Primary Action Button: Confirm */}
            <TouchableOpacity
              style={styles.confirmButton}
              activeOpacity={0.85}
              onPress={handleVerify}
              accessibilityLabel="Confirm"
              accessibilityRole="button"
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  keyboardAvoid: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingTop: 34,
    paddingBottom: 26,
    paddingHorizontal: 22,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: '#C7DFEE',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F8FC',
    borderWidth: 1,
    borderColor: '#D4E7F5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  title: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 24,
    color: '#0D68AC',
    textAlign: 'center',
    marginBottom: 6,
    marginTop: 4,
  },
  subtitle: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 13,
    color: '#6B8299',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#F5F9FD',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBE0EF',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  inputWrapperError: {
    borderColor: '#E74C3C',
    backgroundColor: '#FFF8F8',
  },
  leadingIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontFamily: 'SourGummy',
    fontSize: 15,
    color: '#0D68AC',
    paddingVertical: 6,
  },
  eyeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 12,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 10,
  },
  confirmButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#0865AD',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#084878',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 17,
    color: '#FFFFFF',
  },
});
