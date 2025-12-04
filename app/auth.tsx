
import React, { useState } from "react";
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
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import IconSymbol from "@/components/IconSymbol";

export default function AuthScreen() {
  const { signIn, signUp, isLoading } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [farmName, setFarmName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Error states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [nameError, setNameError] = useState("");
  const [farmNameError, setFarmNameError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    // Reset errors
    setEmailError("");
    setPasswordError("");
    setNameError("");
    setFarmNameError("");

    // Validation
    if (!email) {
      setEmailError("Email is required");
      return;
    }
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    if (!password) {
      setPasswordError("Password is required");
      return;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    if (!isLogin) {
      if (!name) {
        setNameError("Name is required");
        return;
      }
      if (!farmName) {
        setFarmNameError("Farm name is required");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const result = await signIn(email, password);
        console.log("Sign in result:", result);
        
        if (result?.error) {
          const errorMessage = result.error.message || "Unable to sign in. Please check your credentials.";
          Alert.alert("Login Failed", errorMessage);
        }
      } else {
        const result = await signUp(email, password, name, farmName);
        console.log("Sign up result:", result);
        
        if (result?.error) {
          const errorMessage = result.error.message || "Unable to create account. Please try again.";
          Alert.alert("Sign Up Failed", errorMessage);
        } else if (result?.needsVerification) {
          Alert.alert(
            "Verify Your Email",
            "Please check your email and click the verification link to activate your account.",
            [{ text: "OK" }]
          );
        } else {
          Alert.alert(
            "Success",
            "Your account has been created successfully!",
            [{ text: "OK" }]
          );
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      Alert.alert("Error", err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient 
      colors={['#2D5016', '#4A7C2C', '#6B8E23']} 
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo and App Name */}
          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <IconSymbol 
                ios_icon_name="leaf.fill" 
                android_material_icon_name="eco" 
                size={64} 
                color="#FFFFFF" 
              />
            </View>
            <Text style={styles.appName}>SmallFarm Copilot</Text>
            <Text style={styles.tagline}>
              {isLogin ? "Welcome Back" : "Join the Community"}
            </Text>
          </View>

          {/* Auth Form */}
          <View style={styles.formContainer}>
            {/* EMAIL */}
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <IconSymbol 
                  ios_icon_name="envelope.fill" 
                  android_material_icon_name="email" 
                  size={20} 
                  color="#6B8E23" 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            {/* PASSWORD */}
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <IconSymbol 
                  ios_icon_name="lock.fill" 
                  android_material_icon_name="lock" 
                  size={20} 
                  color="#6B8E23" 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <IconSymbol 
                    ios_icon_name={showPassword ? "eye.slash.fill" : "eye.fill"} 
                    android_material_icon_name={showPassword ? "visibility_off" : "visibility"} 
                    size={20} 
                    color="#999" 
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            {/* SIGNUP FIELDS */}
            {!isLogin && (
              <>
                <View style={styles.inputGroup}>
                  <View style={styles.inputWrapper}>
                    <IconSymbol 
                      ios_icon_name="person.fill" 
                      android_material_icon_name="person" 
                      size={20} 
                      color="#6B8E23" 
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Your Name"
                      placeholderTextColor="#999"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                  {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputWrapper}>
                    <IconSymbol 
                      ios_icon_name="leaf.fill" 
                      android_material_icon_name="agriculture" 
                      size={20} 
                      color="#6B8E23" 
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Farm Name"
                      placeholderTextColor="#999"
                      value={farmName}
                      onChangeText={setFarmName}
                    />
                  </View>
                  {farmNameError ? <Text style={styles.errorText}>{farmNameError}</Text> : null}
                </View>
              </>
            )}

            {/* SUBMIT BUTTON */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLogin ? "Log In" : "Sign Up"}
                </Text>
              )}
            </TouchableOpacity>

            {/* SWITCH LOGIN/SIGNUP */}
            <TouchableOpacity 
              onPress={() => {
                setIsLogin(!isLogin);
                setEmailError("");
                setPasswordError("");
                setNameError("");
                setFarmNameError("");
              }}
              style={styles.switchButton}
            >
              <Text style={styles.switchText}>
                {isLogin 
                  ? "Don't have an account? Sign Up" 
                  : "Already have an account? Log In"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2E2E2E',
    marginLeft: 12,
  },
  errorText: {
    color: '#F44336',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: '#2D5016',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    boxShadow: '0px 2px 8px rgba(45, 80, 22, 0.3)',
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#6B8E23',
    fontSize: 15,
    fontWeight: '500',
  },
});
