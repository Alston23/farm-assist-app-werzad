
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';

export default function AuthScreen() {
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [farmName, setFarmName] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    console.log('Auth screen - user state:', user ? 'logged in' : 'not logged in');
    if (user) {
      console.log('User already logged in, redirecting to crops...');
      router.replace('/(tabs)/crops');
    }
  }, [user]);

  const handleSubmit = async () => {
    console.log('=== SUBMIT BUTTON PRESSED ===');
    console.log('isLoading:', isLoading);
    console.log('isLogin:', isLogin);
    console.log('Form data:', { email: email.trim(), name: name.trim(), farmName: farmName.trim() });

    if (isLoading) {
      console.log('Already loading, ignoring submit');
      return;
    }

    // Basic validation
    if (!email.trim() || !password.trim()) {
      console.log('Validation failed: email or password empty');
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    if (!isLogin && !name.trim()) {
      console.log('Validation failed: name empty for signup');
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    console.log('Validation passed, setting loading to true');
    setIsLoading(true);

    try {
      let result;
      if (isLogin) {
        console.log('=== ATTEMPTING SIGN IN ===');
        console.log('Email:', email.trim());
        result = await signIn(email.trim(), password);
        console.log('Sign in result:', result);
      } else {
        console.log('=== ATTEMPTING SIGN UP ===');
        console.log('Name:', name.trim());
        console.log('Farm Name:', farmName.trim());
        console.log('Email:', email.trim());
        result = await signUp(name.trim(), farmName.trim(), email.trim(), password);
        console.log('Sign up result:', result);
      }

      if (result && result.success) {
        console.log('=== AUTHENTICATION SUCCESSFUL ===');
        // The useEffect will handle navigation when user state updates
      } else {
        console.log('=== AUTHENTICATION FAILED ===');
        console.log('Error:', result?.error);
        Alert.alert('Error', result?.error || 'An error occurred');
      }
    } catch (error) {
      console.error('=== AUTH ERROR ===', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      console.log('Setting loading to false');
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    console.log('Toggling mode from', isLogin ? 'login' : 'signup', 'to', isLogin ? 'signup' : 'login');
    setIsLogin(!isLogin);
    // Clear form when switching modes
    setEmail('');
    setPassword('');
    setName('');
    setFarmName('');
    setShowPassword(false);
  };

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
          {/* Header */}
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

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </Text>

            {/* Name field (Sign Up only) */}
            {!isLogin && (
              <View style={styles.inputContainer}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            )}

            {/* Farm Name field (Sign Up only) */}
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
                  editable={!isLoading}
                />
              </View>
            )}

            {/* Email field */}
            <View style={styles.inputContainer}>
              <IconSymbol
                ios_icon_name="envelope.fill"
                android_material_icon_name="email"
                size={20}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Password field */}
            <View style={styles.inputContainer}>
              <IconSymbol
                ios_icon_name="lock.fill"
                android_material_icon_name="lock"
                size={20}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                disabled={isLoading}
              >
                <IconSymbol
                  ios_icon_name={showPassword ? 'eye.slash.fill' : 'eye.fill'}
                  android_material_icon_name={showPassword ? 'visibility_off' : 'visibility'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.card} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle Mode */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
              </Text>
              <TouchableOpacity onPress={toggleMode} disabled={isLoading}>
                <Text style={styles.toggleButton}>
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Text */}
          <Text style={styles.infoText}>
            Your data is stored locally on your device and is secure.
          </Text>
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
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    minHeight: 52,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.card,
    fontSize: 18,
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
  infoText: {
    fontSize: 12,
    color: colors.card,
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.8,
  },
});
