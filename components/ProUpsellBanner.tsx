
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useProStatus } from '../hooks/useProStatus';

interface ProUpsellBannerProps {
  message?: string;
}

export default function ProUpsellBanner({ 
  message = "Want field-specific planting and fertilizer plans? Unlock Farm Copilot Pro." 
}: ProUpsellBannerProps) {
  const { isPro, loading } = useProStatus();
  const router = useRouter();

  // Don't show banner if user is Pro or still loading
  if (isPro || loading) {
    return null;
  }

  const handleUpgrade = () => {
    console.log('ProUpsellBanner: Navigating to paywall');
    router.push('/paywall');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>✨</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Upgrade to Pro</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.button}
        onPress={handleUpgrade}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Upgrade Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D5016',
  },
});
