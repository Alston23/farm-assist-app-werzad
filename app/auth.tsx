
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';

export default function AuthScreen() {
  const { signIn, signUp, resendVerificationEmail, isLoading, user } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Email verification state
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  // Debug: Log when user changes
  useEffect(() => {
    console.log('AuthScreen - user changed:', user ? user.email : 'null');
    if (user) {
      console.log('✅ User is logged in, navigation should happen automatically');
      setIsSubmitting(false);
    }
  }, [user]);

  // Reset submitting state when switching between login/signup
  useEffect(() => {
    setIsSubmitting(false);
    setAuthError('');
    setNeedsVerification(false);
  }, [isLogin]);

  const validateEmail = (text: string) => {
    setEmail(text);
    setEmailError('');
    setAuthError('');
    
    if (text.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(text)) {
        setEmailError('Please enter a valid email address');
      }
    }
  };

  const validatePassword = (text: string) => {
    setPassword(text);
    setPasswordError('');
    setAuthError('');
    
    if (!isLogin && text.length > 0 && text.length < 6) {
      setPasswordError('Password must be at least 6 characters');
    }
  };

  const validateName = (text: string) => {
    setName(text);
    setNameError('');
    setAuthError('');
    
    if (!isLogin && text.length > 0 && text.length < 2) {
      setNameError('Name must be at least 2 characters');
    }
  };

  const handleResendVerification = async () => {
    setIsSubmitting(true);
    const result = await resendVerificationEmail(verificationEmail);
    setIsSubmitting(false);
    
    if (result.success) {
      Alert.alert(
        'Email Sent!',
        'We\'ve sent a new verification link to your email. Please check your inbox and spam folder.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Error',
        result.error || 'Failed to resend verification email',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSubmit = async () => {
    console.log('=== AUTH SCREEN: SUBMIT PRESSED ===');
    
    if (isSubmitting) {
      console.log('Already submitting, ignoring');
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();
    const trimmedFarmName = farmName.trim();

    // Clear previous auth error
    setAuthError('');
    setNeedsVerification(false);

    // Validate all fields
    let hasError = false;

    if (!trimmedEmail) {
      setEmailError('Email is required');
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setEmailError('Please enter a valid email address');
        hasError = true;
      }
    }

    if (!trimmedPassword) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (!isLogin && trimmedPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    }

    if (!isLogin && !trimmedName) {
      setNameError('Name is required');
      hasError = true;
    }

    if (hasError) {
      console.log('Validation errors, not submitting');
      return;
    }

    setIsSubmitting(true);
    console.log('Setting isSubmitting to true');

    try {
      let result;
      
      if (isLogin) {
        console.log('Calling signIn with email:', trimmedEmail);
        result = await signIn(trimmedEmail, trimmedPassword);
      } else {
        console.log('Calling signUp with name:', trimmedName, 'email:', trimmedEmail);
        result = await signUp(trimmedName, trimmedFarmName, trimmedEmail, trimmedPassword);
      }

      console.log('Auth result:', result);

      if (result && result.success) {
        if (result.needsVerification) {
          // Show verification needed message
          console.log('⚠️ Email verification required');
          setNeedsVerification(true);
          setVerificationEmail(trimmedEmail);
          setIsSubmitting(false);
          
          Alert.alert(
            '📧 Verify Your Email',
            'We\'ve sent a verification link to your email address. Please check your inbox (and spam folder) and click the link to activate your account.\n\nOnce verified, you can sign in with your credentials.',
            [{ text: 'OK' }]
          );
        } else {
          console.log('✅ Authentication successful!');
          Alert.alert(
            'Success',
            isLogin ? 'Signed in successfully!' : 'Account created successfully!',
            [{ text: 'OK' }]
          );
        }
      } else {
        console.log('❌ Authentication failed:', result?.error);
        setAuthError(result?.error || 'An error occurred');
        setIsSubmitting(false);
        
        // Show error alert with more helpful message
        const errorMessage = result?.error || 'An error occurred';
        Alert.alert(
          isLogin ? 'Sign In Failed' : 'Sign Up Failed',
          errorMessage,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Auth error:', error);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setAuthError(errorMessage);
      setIsSubmitting(false);
      
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    }
  };

  const toggleMode = () => {
    if (isSubmitting) {
      console.log('Cannot toggle mode while submitting');
      return;
    }
    
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setName('');
    setFarmName('');
    setShowPassword(false);
    setEmailError('');
    setPasswordError('');
    setNameError('');
    setAuthError('');
    setNeedsVerification(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  // Show verification reminder screen
  if (needsVerification) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={[colors.primary, colors.accent, colors.background]}
          style={styles.gradient}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <IconSymbol
                ios_icon_name="envelope.badge.fill"
                android_material_icon_name="mark_email_read"
                size={80}
                color={colors.card}
              />
              <Text style={styles.title}>Check Your Email</Text>
              <Text style={styles.subtitle}>
                We&apos;ve sent a verification link to
              </Text>
              <Text style={[styles.subtitle, { fontWeight: '700', marginTop: 8 }]}>
                {verificationEmail}
              </Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.verificationSteps}>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Check your email inbox (and spam folder)
                  </Text>
                </View>
                
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Click the verification link in the email
                  </Text>
                </View>
                
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Return here and sign in with your credentials
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleResendVerification}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.card} />
                ) : (
                  <React.Fragment>
                    <IconSymbol
                      ios_icon_name="arrow.clockwise"
                      android_material_icon_name="refresh"
                      size={20}
                      color={colors.card}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.submitButtonText}>
                      Resend Verification Email
                    </Text>
                  </React.Fragment>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setNeedsVerification(false);
                  setIsLogin(true);
                }}
                disabled={isSubmitting}
              >
                <Text style={styles.backButtonText}>
                  Back to Sign In
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoContainer}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={16}
                color={colors.card}
                style={{ opacity: 0.8 }}
              />
              <Text style={styles.infoText}>
                Verification links expire after 24 hours
              </Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[colors.primary, colors.accent, colors.background]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <IconSymbol
              ios_icon_name="leaf.fill"
              android_material_icon_name="eco"
              size={60}
              color={colors.card}
            />
            <Text style={styles.title}>SmallFarm Copilot</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Welcome back!' : 'Start your farming journey'}
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </Text>

            {!isLogin && (
              <View>
                <View style={[
                  styles.inputContainer,
                  nameError ? styles.inputContainerError : null
                ]}>
                  <IconSymbol
                    ios_icon_name="person.fill"
                    android_material_icon_name="person"
                    size={20}
                    color={nameError ? colors.error : colors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={colors.textSecondary}
                    value={name}
                    onChangeText={validateName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!isSubmitting}
                  />
                </View>
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
              </View>
            )}

            {!isLogin && (
              <View style={styles.inputContainer}>
                <IconSymbol
                  ios_icon_name="house.fill"
                  android_material_icon_name="home"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Farm Name (Optional)"
                  placeholderTextColor={colors.textSecondary}
                  value={farmName}
                  onChangeText={setFarmName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
              </View>
            )}

            <View>
              <View style={[
                styles.inputContainer,
                emailError ? styles.inputContainerError : null
              ]}>
                <IconSymbol
                  ios_icon_name="envelope.fill"
                  android_material_icon_name="email"
                  size={20}
                  color={emailError ? colors.error : colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={validateEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
              </View>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            <View>
              <View style={[
                styles.inputContainer,
                passwordError ? styles.inputContainerError : null
              ]}>
                <IconSymbol
                  ios_icon_name="lock.fill"
                  android_material_icon_name="lock"
                  size={20}
                  color={passwordError ? colors.error : colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={validatePassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={isSubmitting}
                >
                  <IconSymbol
                    ios_icon_name={showPassword ? 'eye.slash.fill' : 'eye.fill'}
                    android_material_icon_name={showPassword ? 'visibility_off' : 'visibility'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            {authError ? (
              <View style={styles.authErrorContainer}>
                <IconSymbol
                  ios_icon_name="exclamationmark.triangle.fill"
                  android_material_icon_name="error"
                  size={20}
                  color={colors.error}
                />
                <Text style={styles.authErrorText}>{authError}</Text>
              </View>
            ) : null}

            {isLogin && (
              <View style={styles.helpTextContainer}>
                <IconSymbol
                  ios_icon_name="info.circle"
                  android_material_icon_name="info"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.helpText}>
                  Make sure you&apos;ve verified your email before signing in
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={colors.card} />
                  <Text style={styles.loadingText}>
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
              </Text>
              <TouchableOpacity onPress={toggleMode} disabled={isSubmitting}>
                <Text style={[styles.toggleButton, isSubmitting && styles.toggleButtonDisabled]}>
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <IconSymbol
              ios_icon_name="lock.shield.fill"
              android_material_icon_name="security"
              size={16}
              color={colors.card}
              style={{ opacity: 0.8 }}
            />
            <Text style={styles.infoText}>
              Your data is secured with Supabase authentication
            </Text>
          </View>

          {__DEV__ && (
            <View style={styles.devHint}>
              <Text style={styles.devHintText}>
                💡 Dev Tip: Create an account to test, or sign in if you already have one
              </Text>
              <Text style={styles.devHintText}>
                Current user: {user ? user.email : 'None'}
              </Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 60 : 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.card,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.card,
    opacity: 0.9,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 5,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputContainerError: {
    borderColor: colors.error,
    borderWidth: 2,
    marginBottom: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text,
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 16,
    marginTop: -8,
  },
  authErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '15',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  authErrorText: {
    flex: 1,
    color: colors.error,
    fontSize: 14,
    fontWeight: '500',
  },
  helpTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  helpText: {
    flex: 1,
    color: colors.primary,
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    minHeight: 52,
    flexDirection: 'row',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.card,
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  toggleText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 4,
  },
  toggleButton: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  toggleButtonDisabled: {
    opacity: 0.5,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.card,
    opacity: 0.8,
  },
  devHint: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  devHintText: {
    fontSize: 12,
    color: colors.card,
    textAlign: 'center',
    marginVertical: 2,
  },
  verificationSteps: {
    marginBottom: 24,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    paddingTop: 5,
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
});
