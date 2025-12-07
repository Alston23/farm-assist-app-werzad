
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCamera } from '../contexts/CameraContext';

export default function CameraOnboardingScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { requestCameraPermission, markCameraAsked } = useCamera();

  const handleAllowCamera = async () => {
    console.log('CameraOnboarding: User tapped Allow Camera');
    setLoading(true);
    try {
      const granted = await requestCameraPermission();
      console.log('CameraOnboarding: Permission granted:', granted);
      
      // Navigate to main app regardless of permission result
      router.replace('/(tabs)/crops');
    } catch (error) {
      console.error('CameraOnboarding: Error requesting permission:', error);
      // Still navigate to main app
      router.replace('/(tabs)/crops');
    } finally {
      setLoading(false);
    }
  };

  const handleNotNow = async () => {
    console.log('CameraOnboarding: User tapped Not Now');
    try {
      // Mark that we've asked so we don't show this again
      await markCameraAsked();
      router.replace('/(tabs)/crops');
    } catch (error) {
      console.error('CameraOnboarding: Error marking camera as asked:', error);
      // Still navigate
      router.replace('/(tabs)/crops');
    }
  };

  return (
    <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
      <View style={styles.container}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📷</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Use your camera for better insights</Text>

        {/* Body Text */}
        <Text style={styles.body}>
          We use your camera to help identify plant issues, document your crops, and list items in
          the marketplace. You can still use the app without camera access, but some features will
          be limited.
        </Text>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleAllowCamera}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Allow Camera</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleNotNow}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Not Now</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Note */}
        <Text style={styles.privacyNote}>
          Your photos are only used within the app and are never shared with third parties without
          your permission.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'android' ? 80 : 100,
    paddingBottom: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 36,
  },
  body: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#2D5016',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  privacyNote: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
