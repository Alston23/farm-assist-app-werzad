
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';

export default function TestAuthScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [usersDb, setUsersDb] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const loadDebugInfo = async () => {
    try {
      const usersData = await AsyncStorage.getItem('@farm_users_db');
      const userData = await AsyncStorage.getItem('@farm_user');
      
      console.log('=== DEBUG INFO ===');
      console.log('Users DB:', usersData);
      console.log('Current User:', userData);
      
      setUsersDb(usersData ? JSON.parse(usersData) : []);
      setCurrentUser(userData ? JSON.parse(userData) : null);
      
      Alert.alert('Debug Info Loaded', 'Check console for details');
    } catch (error) {
      console.error('Error loading debug info:', error);
      Alert.alert('Error', 'Failed to load debug info');
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all users and sign you out. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@farm_users_db');
              await AsyncStorage.removeItem('@farm_user');
              await signOut();
              Alert.alert('Success', 'All data cleared');
              router.replace('/auth');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <IconSymbol
          ios_icon_name="wrench.and.screwdriver.fill"
          android_material_icon_name="build"
          size={40}
          color={colors.primary}
        />
        <Text style={styles.title}>Auth Testing</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current User</Text>
        <View style={styles.card}>
          {user ? (
            <>
              <Text style={styles.label}>Email: <Text style={styles.value}>{user.email}</Text></Text>
              <Text style={styles.label}>Name: <Text style={styles.value}>{user.name}</Text></Text>
              {user.farmName && (
                <Text style={styles.label}>Farm: <Text style={styles.value}>{user.farmName}</Text></Text>
              )}
              <Text style={styles.label}>ID: <Text style={styles.value}>{user.id}</Text></Text>
            </>
          ) : (
            <Text style={styles.noData}>No user logged in</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Info</Text>
        <TouchableOpacity style={styles.button} onPress={loadDebugInfo}>
          <Text style={styles.buttonText}>Load Debug Info</Text>
        </TouchableOpacity>
        
        {usersDb.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.label}>Total Users: {usersDb.length}</Text>
            {usersDb.map((u, index) => (
              <View key={index} style={styles.userItem}>
                <Text style={styles.userEmail}>{u.email}</Text>
                <Text style={styles.userName}>{u.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary]} 
          onPress={() => router.push('/auth')}
        >
          <Text style={styles.buttonText}>Go to Auth Screen</Text>
        </TouchableOpacity>

        {user && (
          <TouchableOpacity 
            style={[styles.button, styles.buttonWarning]} 
            onPress={signOut}
          >
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.button, styles.buttonDanger]} 
          onPress={clearAllData}
        >
          <Text style={styles.buttonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Testing Instructions:</Text>
        <Text style={styles.instructionsText}>
          1. Create a new account with any email/password{'\n'}
          2. Sign out{'\n'}
          3. Sign in with the same credentials{'\n'}
          4. Check console logs for detailed flow{'\n'}
          5. Use "Load Debug Info" to see stored data
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  value: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  noData: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  userItem: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  userEmail: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  userName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonSecondary: {
    backgroundColor: colors.accent,
  },
  buttonWarning: {
    backgroundColor: colors.warning,
  },
  buttonDanger: {
    backgroundColor: colors.error,
  },
  buttonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
