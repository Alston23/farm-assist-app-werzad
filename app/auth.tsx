import React, { useState, useEffect } from "react";
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
import { colors, commonStyles } from "@/styles/commonStyles";
import { LinearGradient } from "expo-linear-gradient";
import IconSymbol from "@/components/IconSymbol";

export default function AuthScreen() {
  const { signIn, signUp, resendVerificationEmail, isLoading, user } = useAuth();

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
  const [authError, setAuthError] = useState("");

  const handleSubmit = async () => {
    setAuthError("");
    setEmailError("");
    setPasswordError("");

    if (!email.includes("@")) {
      setEmailError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (!name) {
          setNameError("Enter your name.");
          setIsSubmitting(false);
          return;
        }
        if (!farmName) {
          setFarmNameError("Enter your farm name.");
          setIsSubmitting(false);
          return;
        }

        await signUp(email, password, name, farmName);
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed.");
    }

    setIsSubmitting(false);
  };

  return (
    <LinearGradient colors={[colors.background, colors.backgroundAlt]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>{isLogin ? "Log In" : "Create Account"}</Text>

          {/* EMAIL */}
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            {emailError ? <Text style={styles.error}>{emailError}</Text> : null}
          </View>

          {/* PASSWORD */}
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
          </View>

          {/* SIGNUP FIELDS */}
          {!isLogin && (
            <>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Your Name"
                  value={name}
                  onChangeText={setName}
                />
                {nameError ? <Text style={styles.error}>{nameError}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Farm Name"
                  value={farmName}
                  onChangeText={setFarmName}
                />
                {farmNameError ? <Text style={styles.error}>{farmNameError}</Text> : null}
              </View>
            </>
          )}

          {authError ? <Text style={styles.errorLarge}>{authError}</Text> : null}

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={commonStyles.button}
            onPress={handleSubmit}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={commonStyles.buttonText}>
                {isLogin ? "Log In" : "Sign Up"}
              </Text>
            )}
          </TouchableOpacity>

          {/* SWITCH LOGIN/SIGNUP */}
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchText}>
              {isLogin ? "Create an account" : "Already have an account? Log In"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 30,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 14,
  },
  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
  },
  error: {
    color: "red",
    marginTop: 4,
    fontSize: 13,
  },
  errorLarge: {
    color: "red",
    marginVertical: 10,
    fontSize: 15,
    textAlign: "center",
  },
  switchText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    textDecorationLine: "underline",
  },
});
