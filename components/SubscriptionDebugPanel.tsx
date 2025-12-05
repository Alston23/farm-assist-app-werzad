
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { syncProFromProfile } from '../lib/subscriptions';

/**
 * Debug panel for testing subscription functionality
 * 
 * This component provides buttons to:
 * - View current Pro status
 * - Manually set Pro status to true (for testing)
 * - Manually set Pro status to false (for testing)
 * - Refresh Pro status from Supabase
 * 
 * IMPORTANT: Remove this component or hide it before production release!
 */
export default function SubscriptionDebugPanel() {
  const { user, isPro, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSetProTrue = async () => {
    if (!user) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_pro: true })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      Alert.alert('Success', 'Pro status set to TRUE');
    } catch (error) {
      console.error('Error setting Pro status:', error);
      Alert.alert('Error', 'Failed to update Pro status');
    } finally {
      setLoading(false);
    }
  };

  const handleSetProFalse = async () => {
    if (!user) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_pro: false })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      Alert.alert('Success', 'Pro status set to FALSE');
    } catch (error) {
      console.error('Error setting Pro status:', error);
      Alert.alert('Error', 'Failed to update Pro status');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await syncProFromProfile();
      await refreshProfile();
      Alert.alert('Success', 'Pro status refreshed from Supabase');
    } catch (error) {
      console.error('Error refreshing Pro status:', error);
      Alert.alert('Error', 'Failed to refresh Pro status');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Subscription Debug Panel</Text>
      <Text style={styles.warning}>⚠️ Remove before production!</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Current Status:</Text>
        <Text style={[styles.statusValue, isPro ? styles.proBadge : styles.freeBadge]}>
          {isPro ? '✓ PRO' : '✗ FREE'}
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>User ID: {user.id.substring(0, 8)}...</Text>
        <Text style={styles.infoText}>Profile ID: {profile?.id.substring(0, 8) || 'N/A'}...</Text>
        <Text style={styles.infoText}>is_pro in DB: {profile?.is_pro ? 'true' : 'false'}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.buttonPro]}
          onPress={handleSetProTrue}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Set Pro = TRUE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonFree]}
          onPress={handleSetProFalse}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Set Pro = FALSE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonRefresh]}
          onPress={handleRefresh}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Refresh Status</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        Use these buttons to test Pro features without making actual purchases.
        The "Set Pro" buttons directly update the database.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 2,
    borderColor: '#FFC107',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  warning: {
    fontSize: 14,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proBadge: {
    backgroundColor: '#4CAF50',
    color: '#FFFFFF',
  },
  freeBadge: {
    backgroundColor: '#9E9E9E',
    color: '#FFFFFF',
  },
  infoContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    gap: 8,
    marginBottom: 12,
  },
  button: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonPro: {
    backgroundColor: '#4CAF50',
  },
  buttonFree: {
    backgroundColor: '#9E9E9E',
  },
  buttonRefresh: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
