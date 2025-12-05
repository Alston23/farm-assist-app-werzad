
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🌱 SmallFarm Copilot</Text>
          <TouchableOpacity 
            style={styles.signOutButton} 
            onPress={async () => {
              try {
                await supabase.auth.signOut();
                router.replace("/auth");
              } catch (err) {
                console.error("Logout error", err);
                Alert.alert("Error", "Failed to sign out.");
              }
            }}
            activeOpacity={0.7}
          >
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
              <Text style={styles.featureItem}>- Crop Management</Text>
              <Text style={styles.featureItem}>- Field & Bed Planning</Text>
              <Text style={styles.featureItem}>- Planting Schedules</Text>
              <Text style={styles.featureItem}>- Equipment Tracking</Text>
              <Text style={styles.featureItem}>- Task Management</Text>
              <Text style={styles.featureItem}>- Inventory Control</Text>
              <Text style={styles.featureItem}>- Revenue Tracking</Text>
              <Text style={styles.featureItem}>- Marketplace Access</Text>
              <Text style={styles.featureItem}>- AI Assistant</Text>
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
