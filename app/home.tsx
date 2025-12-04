
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    console.log('HomeScreen: Sign out button pressed');
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('HomeScreen: User confirmed sign out, calling signOut');
              await signOut();
              console.log('HomeScreen: Sign out completed successfully');
              // Navigation will be handled automatically by _layout.tsx
            } catch (error: any) {
              console.error('HomeScreen: Sign out failed:', error);
              // Even if there's an error, the local state is cleared
              // So we can just show a warning but the user is effectively signed out
              Alert.alert('Notice', 'You have been signed out locally. If you experience issues, please restart the app.');
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🌱 SmallFarm Copilot</Text>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>Welcome!</Text>
            <Text style={styles.welcomeText}>
              You&apos;re successfully logged in to SmallFarm Copilot.
            </Text>
            {user?.email && (
              <Text style={styles.emailText}>
                Logged in as: {user.email}
              </Text>
            )}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🚀 Coming Soon</Text>
            <Text style={styles.infoText}>
              We&apos;re building amazing features for your farm management needs:
            </Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>• Crop Management</Text>
              <Text style={styles.featureItem}>• Field & Bed Planning</Text>
              <Text style={styles.featureItem}>• Planting Schedules</Text>
              <Text style={styles.featureItem}>• Equipment Tracking</Text>
              <Text style={styles.featureItem}>• Task Management</Text>
              <Text style={styles.featureItem}>• Inventory Control</Text>
              <Text style={styles.featureItem}>• Revenue Tracking</Text>
              <Text style={styles.featureItem}>• Marketplace Access</Text>
              <Text style={styles.featureItem}>• AI Assistant</Text>
            </View>
          </View>
        </View>
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
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  signOutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 12,
  },
  emailText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  featureList: {
    marginTop: 8,
  },
  featureItem: {
    fontSize: 15,
    color: '#555',
    lineHeight: 28,
    paddingLeft: 8,
  },
});
