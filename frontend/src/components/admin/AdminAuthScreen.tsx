import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import React, { useRef, useState } from 'react';
import { loginAccount } from '@/services/user-api';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

type AuthMode = 'sign-in' | 'reset-password';
type FieldName = 'userId' | 'password' | 'recoveryKey' | 'newPassword' | 'confirmPassword';
type FieldErrors = Partial<Record<FieldName, string>>;

const COLORS = {
  blue: '#0F69AF',
  blueDark: '#12395F',
  ink: '#102A43',
  muted: '#64748B',
  border: '#D9E2EC',
  danger: '#B42318',
  dangerBg: '#FEF3F2',
  white: '#FFFFFF',
};

export default function AdminAuthScreen({ mode }: { mode: AuthMode }) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [visibleFields, setVisibleFields] = useState<Partial<Record<FieldName, boolean>>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formMessage, setFormMessage] = useState('');
  const [focusedField, setFocusedField] = useState<FieldName | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  type InputHandle = React.ElementRef<typeof TextInput>;
  const userIdRef = useRef<InputHandle>(null);
  const passwordRef = useRef<InputHandle>(null);
  const recoveryKeyRef = useRef<InputHandle>(null);
  const newPasswordRef = useRef<InputHandle>(null);
  const confirmPasswordRef = useRef<InputHandle>(null);

  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const showIllustration = isDesktop;

  const [fontsLoaded] = useFonts({
    'Geist-Regular': require('../../../assets/fonts/Geist-Regular.ttf'),
    'Geist-Medium': require('../../../assets/fonts/Geist-Medium.ttf'),
    'Geist-SemiBold': require('../../../assets/fonts/Geist-SemiBold.ttf'),
    'SourGummy-Bold': require('../../../assets/SourGummy-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  const setFieldError = (name: FieldName, value: string) => {
    setErrors((current) => ({ ...current, [name]: value }));
  };

  const toggleVisibility = (name: FieldName) => {
    setVisibleFields((current) => ({ ...current, [name]: !current[name] }));
  };

  const validateOnBlur = (name: FieldName) => {
    const value = {
      userId,
      password,
      recoveryKey,
      newPassword,
      confirmPassword,
    }[name];
    if (name === 'confirmPassword' && value && newPassword && value !== newPassword) {
      setFieldError(name, 'These passwords do not match.');
    } else if (!value.trim()) {
      const labels: Record<FieldName, string> = {
        userId: 'User ID',
        password: 'password',
        recoveryKey: 'recovery key',
        newPassword: 'new password',
        confirmPassword: 'password confirmation',
      };
      setFieldError(name, `Enter your ${labels[name]}.`);
    } else {
      setFieldError(name, '');
    }
  };

  const showUnavailableMessage = () => {
    setFormMessage(
      'Administrator password recovery is not connected. No password was changed.',
    );
  };

  const handleSignIn = async () => {
    const nextErrors: FieldErrors = {};
    if (!userId.trim()) nextErrors.userId = 'Enter your User ID.';
    if (!password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    setFormMessage('');

    if (Object.keys(nextErrors).length) {
      if (nextErrors.userId) userIdRef.current?.focus();
      else passwordRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await loginAccount(userId.trim(), password, 'admin');
      router.replace('/(admin)/admin-dashboard' as any);
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    const nextErrors: FieldErrors = {};
    if (!userId.trim()) nextErrors.userId = 'Enter your User ID.';
    if (!recoveryKey.trim()) nextErrors.recoveryKey = 'Enter your recovery key.';
    if (!newPassword) nextErrors.newPassword = 'Enter a new password.';
    if (!confirmPassword) nextErrors.confirmPassword = 'Confirm your new password.';
    else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = 'These passwords do not match.';
    }

    setErrors(nextErrors);
    setFormMessage('');

    if (Object.keys(nextErrors).length) {
      if (nextErrors.userId) userIdRef.current?.focus();
      else if (nextErrors.recoveryKey) recoveryKeyRef.current?.focus();
      else if (nextErrors.newPassword) newPasswordRef.current?.focus();
      else confirmPasswordRef.current?.focus();
      return;
    }

    showUnavailableMessage();
  };

  const renderFieldError = (name: FieldName) =>
    errors[name] ? (
      <Text style={styles.fieldError} accessibilityLiveRegion="polite">
        {errors[name]}
      </Text>
    ) : null;

  const renderTextField = ({
    name,
    label,
    value,
    onChangeText,
    icon,
    inputRef,
    secure = false,
    autoComplete,
    keyboardType,
    autoCapitalize,
    returnKeyType = 'next',
    onSubmitEditing,
  }: {
    name: FieldName;
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    inputRef: React.RefObject<InputHandle | null>;
    secure?: boolean;
    autoComplete?: 'username' | 'current-password' | 'new-password' | 'off';
    keyboardType?: 'default' | 'email-address';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    returnKeyType?: 'next' | 'done';
    onSubmitEditing?: () => void;
  }) => {
    const canReveal = secure;
    const visible = visibleFields[name] ?? false;

    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View
          nativeID={currentMode === 'sign-in' ? `sign-in-admin-${name}-field` : undefined}
          style={[
            styles.inputWrapper,
            currentMode === 'sign-in' && value.length > 0 && styles.filledInput,
            focusedField === name && styles.inputWrapperFocused,
            errors[name] && styles.inputWrapperError,
          ]}
        >
          <Ionicons name={icon} size={18} color={COLORS.muted} style={styles.inputIcon} />
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={value}
            onChangeText={(text) => {
              onChangeText(text);
              if (name === 'confirmPassword' && errors.confirmPassword) {
                setFieldError(
                  name,
                  !text
                    ? 'Confirm your new password.'
                    : text === newPassword
                      ? ''
                      : 'These passwords do not match.',
                );
              } else if (name === 'newPassword' && errors.confirmPassword && confirmPassword) {
                setFieldError(
                  'confirmPassword',
                  confirmPassword === text ? '' : 'These passwords do not match.',
                );
              } else if (errors[name]) {
                setFieldError(name, '');
              }
              if (formMessage) setFormMessage('');
            }}
            placeholder={name === 'userId' ? 'userid@center.org' : secure ? '********' : undefined}
            placeholderTextColor="#8293A5"
            secureTextEntry={secure && !visible}
            autoCapitalize={autoCapitalize ?? 'none'}
            autoCorrect={false}
            keyboardType={keyboardType ?? 'default'}
            spellCheck={false}
            autoComplete={autoComplete}
            textContentType={
              autoComplete === 'username'
                ? 'username'
                : autoComplete === 'current-password'
                  ? 'password'
                  : autoComplete === 'new-password'
                    ? 'newPassword'
                    : 'none'
            }
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            onFocus={() => setFocusedField(name)}
            onBlur={() => {
              setFocusedField((current) => (current === name ? null : current));
              validateOnBlur(name);
            }}
            accessibilityLabel={label}
          />
          {canReveal ? (
            <TouchableOpacity
              onPress={() => toggleVisibility(name)}
              style={styles.eyeButton}
              accessibilityRole="button"
              accessibilityLabel={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
              accessibilityState={{ selected: visible }}
            >
              <Ionicons
                name={visible ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={COLORS.blue}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        {renderFieldError(name)}
      </View>
    );
  };

  const switchTo = (next: AuthMode) => {
    setCurrentMode(next);
    setErrors({});
    setFormMessage('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          nativeID="admin-auth-root"
          style={[styles.container, isDesktop && styles.desktopContainer]}
        >
          {showIllustration ? (
            <View
              style={[
                styles.illustrationPanel,
                isDesktop && styles.desktopIllustrationPanel,
              ]}
            >
              <Image
                source={require('../../../assets/images/speaksteps-landing-wide.gif')}
                style={styles.illustration}
                contentFit="cover"
                accessibilityLabel="SpeakSteps illustrated landscape with the Chirpy mascot"
              />
            </View>
          ) : null}

          <View style={styles.authPanel}>
            <ScrollView
              style={styles.authScroll}
              contentContainerStyle={[
                styles.authScrollContent,
                isDesktop && styles.desktopAuthScrollContent,
              ]}
              keyboardShouldPersistTaps="handled"
            >
              <View style={[styles.contentWrapper, isDesktop && styles.desktopContentWrapper]}>
                <View style={styles.authCard}>
                  <View style={styles.brandLockup}>
                    <Image
                      source={require('../../../assets/images/speaksteps-children-mark.png')}
                      style={styles.brandMark}
                      contentFit="cover"
                      accessibilityLabel="SpeakSteps children logo"
                    />
                    <Text style={styles.brandName} accessibilityLabel="SpeakSteps">
                      SpeakSteps
                    </Text>
                  </View>
                  <Text style={styles.pageTitle}>
                    {currentMode === 'sign-in' ? 'Administrator Sign In' : 'Reset Password'}
                  </Text>
                  <Text style={styles.pageDescription}>
                    {currentMode === 'sign-in'
                      ? 'Manage center accounts, requests, and records.'
                      : 'Use your recovery key to set a new password.'}
                  </Text>

                  <View style={styles.form}>
                    {renderTextField({
                      name: 'userId',
                      label: 'User ID',
                      value: userId,
                      onChangeText: setUserId,
                      icon: 'person-outline',
                      inputRef: userIdRef,
                      autoComplete: 'username',
                      keyboardType: 'email-address',
                      returnKeyType: 'next',
                      onSubmitEditing: () =>
                        (currentMode === 'sign-in' ? passwordRef : recoveryKeyRef).current?.focus(),
                    })}

                    {currentMode === 'sign-in' ? (
                      <>
                        {renderTextField({
                          name: 'password',
                          label: 'Password',
                          value: password,
                          onChangeText: setPassword,
                          icon: 'lock-closed-outline',
                          inputRef: passwordRef,
                          secure: true,
                          autoComplete: 'current-password',
                          returnKeyType: 'done',
                          onSubmitEditing: handleSignIn,
                        })}

                        <View style={styles.optionsRow}>
                          <TouchableOpacity
                            style={styles.checkboxWrapper}
                            onPress={() => setRememberMe((value) => !value)}
                            activeOpacity={0.8}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: rememberMe }}
                          >
                            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                              {rememberMe ? (
                                <Ionicons name="checkmark" size={14} color={COLORS.white} />
                              ) : null}
                            </View>
                            <Text style={styles.rememberText}>Remember me</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => switchTo('reset-password')}
                            accessibilityRole="link"
                            style={styles.secondaryAction}
                          >
                            <Text style={styles.secondaryActionText}>Forgot password?</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      <>
                        {renderTextField({
                          name: 'recoveryKey',
                          label: 'Recovery Key',
                          value: recoveryKey,
                          onChangeText: setRecoveryKey,
                          icon: 'key-outline',
                          inputRef: recoveryKeyRef,
                          secure: true,
                          autoComplete: 'off',
                          returnKeyType: 'next',
                          onSubmitEditing: () => newPasswordRef.current?.focus(),
                        })}
                        {renderTextField({
                          name: 'newPassword',
                          label: 'New Password',
                          value: newPassword,
                          onChangeText: setNewPassword,
                          icon: 'lock-closed-outline',
                          inputRef: newPasswordRef,
                          secure: true,
                          autoComplete: 'new-password',
                          returnKeyType: 'next',
                          onSubmitEditing: () => confirmPasswordRef.current?.focus(),
                        })}
                        {renderTextField({
                          name: 'confirmPassword',
                          label: 'Confirm New Password',
                          value: confirmPassword,
                          onChangeText: setConfirmPassword,
                          icon: 'lock-closed-outline',
                          inputRef: confirmPasswordRef,
                          secure: true,
                          autoComplete: 'new-password',
                          returnKeyType: 'done',
                          onSubmitEditing: handleReset,
                        })}
                      </>
                    )}

                    {formMessage ? (
                      <View style={styles.formMessage} accessibilityLiveRegion="polite">
                        <Ionicons
                          name="information-circle-outline"
                          size={19}
                          color={COLORS.danger}
                        />
                        <Text style={styles.formMessageText}>{formMessage}</Text>
                      </View>
                    ) : null}

                    <TouchableOpacity
                      style={styles.primaryButton}
                      activeOpacity={0.82}
                      onPress={currentMode === 'sign-in' ? handleSignIn : handleReset}
                      disabled={isSubmitting}
                      accessibilityRole="button"
                    >
                      <Text style={styles.primaryButtonText}>
                        {currentMode === 'sign-in'
                          ? isSubmitting ? 'Signing in…' : 'Log In'
                          : 'Reset Password'}
                      </Text>
                    </TouchableOpacity>

                    {currentMode === 'reset-password' ? (
                      <View style={styles.backLinkRow}>
                        <Text style={styles.backLinkLead}>Remember password?</Text>
                        <TouchableOpacity
                          onPress={() => switchTo('sign-in')}
                          style={styles.backLinkTarget}
                          accessibilityRole="link"
                        >
                          <Text style={styles.backLinkText}>Log in here</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                </View>

                <Text style={styles.copyrightText}>© 2026 SpeakSteps · Center Administration</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  keyboardAvoiding: { flex: 1 },
  container: { flex: 1, flexDirection: 'column', backgroundColor: COLORS.white },
  desktopContainer: { flexDirection: 'row' },
  illustrationPanel: {
    width: '100%',
    height: 160,
    backgroundColor: '#1284C4',
    overflow: 'hidden',
  },
  desktopIllustrationPanel: { width: '50%', height: '100%', flex: 1 },
  illustration: { width: '100%', height: '100%' },
  authPanel: { flex: 1, minHeight: 0, backgroundColor: COLORS.white },
  authScroll: { flex: 1 },
  authScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
  },
  desktopAuthScrollContent: { paddingHorizontal: 32, paddingTop: 28, paddingBottom: 24 },
  contentWrapper: { width: '100%', alignSelf: 'center' },
  desktopContentWrapper: { maxWidth: 430 },
  authCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E1E7EF',
    paddingHorizontal: 28,
    paddingTop: 25,
    paddingBottom: 26,
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 17,
  },
  brandMark: { width: 36, height: 22 },
  brandName: {
    fontFamily: 'SourGummy-Bold',
    color: COLORS.blue,
    fontSize: 18,
    lineHeight: 24,
  },
  pageTitle: {
    fontFamily: 'Geist-SemiBold',
    color: COLORS.blueDark,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.45,
    marginBottom: 5,
  },
  pageDescription: {
    fontFamily: 'Geist-Regular',
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 19,
  },
  form: { width: '100%' },
  fieldGroup: { marginBottom: 12 },
  inputLabel: {
    fontFamily: 'Geist-Medium',
    fontSize: 12,
    color: COLORS.ink,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  filledInput: { backgroundColor: '#FFF3C4' },
  inputWrapperError: { borderColor: COLORS.danger },
  inputIcon: { marginRight: 9 },
  textInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    paddingVertical: 6,
    fontFamily: 'Geist-Regular',
    fontSize: 14,
    color: COLORS.ink,
  },
  eyeButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -8,
  },
  inputWrapperFocused: { borderColor: COLORS.blue, borderWidth: 1.5 },
  fieldError: {
    color: COLORS.danger,
    fontFamily: 'Geist-Medium',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 4,
    marginTop: 0,
    marginBottom: 15,
  },
  checkboxWrapper: { minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  checkbox: {
    width: 17,
    height: 17,
    borderWidth: 1,
    borderColor: '#AFC2D2',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  rememberText: { fontFamily: 'Geist-Regular', fontSize: 13, color: COLORS.ink },
  secondaryAction: { minHeight: 44, justifyContent: 'center', paddingLeft: 8 },
  secondaryActionText: {
    fontFamily: 'Geist-Medium',
    fontSize: 12,
    color: COLORS.blue,
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.blue,
  },
  formMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.dangerBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 12,
  },
  formMessageText: {
    flex: 1,
    fontFamily: 'Geist-Medium',
    fontSize: 12,
    lineHeight: 17,
    color: '#8E241D',
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: { fontFamily: 'Geist-SemiBold', fontSize: 14, color: COLORS.white },
  backLinkRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  backLinkLead: { fontFamily: 'Geist-Regular', fontSize: 12, color: COLORS.muted },
  backLinkTarget: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  backLinkText: {
    fontFamily: 'Geist-Medium',
    fontSize: 12,
    color: COLORS.blue,
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.blue,
  },
  copyrightText: {
    fontFamily: 'Geist-Regular',
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 12,
  },
});
