
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import PaywallScreen from '../app/paywall';

interface PremiumGuardProps {
  children: React.ReactNode;
}

/**
 * PremiumGuard component that protects premium content
 * 
 * If the user has Pro status (is_pro = true in profiles table), renders the children
 * If not, shows the paywall inline instead of redirecting
 * 
 * This provides a better UX as users can upgrade and immediately
 * access the content without navigation issues
 */
export default function PremiumGuard({ children }: PremiumGuardProps) {
  const { isPro, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A7C2C" />
      </View>
    );
  }

  // Show paywall inline if user doesn't have Pro status
  if (!isPro) {
    console.log('PremiumGuard: User is not Pro, showing paywall');
    return <PaywallScreen />;
  }

  // User has Pro status, show protected content
  console.log('PremiumGuard: User is Pro, showing protected content');
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2D5016',
  },
});
