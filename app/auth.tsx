
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
  const { signIn, signUp, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    console.log('Auth screen - authLoading:', authLoading, 'user:', user ? user.email : 'null');
    if (!authLoading && user) {
      console.log('Auth screen - User is logged in, redirecting to crops...');
      setTimeout(() => {
        router.replace('/(tabs)/crops');
      }, 100);
    }
  }, [user, authLoading]);

  const handleSubmit = async () => {
    console.log('=== SUBMIT BUTTON PRESSED ===');
    console.log('isSubmitting:', isSubmitting);
    console.log('isLogin:', isLogin);
    console.log('Form data:', { email: email.trim(), name: name.trim(), farmName: farmName.trim() });

    if (isSubmitting) {
      console.log('Already submitting, ignoring...');
      return;
    }

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

    console.log('Validation passed, setting submitting to true');
    setIsSubmitting(true);

    try {
      let result;
      if (isLogin) {
        console.log('=== CALLING SIGN IN ===');
        result = await signIn(email.trim(), password);
        console.log('=== SIGN IN RESULT ===', result);
      } else {
        console.log('=== CALLING SIGN UP ===');
        result = await signUp(name.trim(), farmName.trim(), email.trim(), password);
        console.log('=== SIGN UP RESULT ===', result);
      }

      if (result && result.success) {
        console.log('=== AUTHENTICATION SUCCESSFUL ===');
        console.log('User state will update and trigger navigation via useEffect');
        // Don't set isSubmitting to false - let the navigation happen
        // The component will unmount when navigation occurs
      } else {
        console.log('=== AUTHENTICATION FAILED ===');
        console.log('Error:', result?.error);
        Alert.alert('Error', result?.error || 'An error occurred');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('=== AUTH ERROR ===', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    console.log('Toggling mode from', isLogin ? 'login' : 'signup', 'to', isLogin ? 'signup' : 'login');
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setName('');
    setFarmName('');
    setShowPassword(false);
  };

  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 16 }}>Loading...</Text>
      </View>
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
                  editable={!isSubmitting}
                />
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
                editable={!isSubmitting}
              />
            </View>

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
                <Text style={styles.toggleButton}>
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

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
  infoText: {
    fontSize: 12,
    color: colors.card,
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.8,
  },
});
