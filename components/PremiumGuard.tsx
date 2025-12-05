
import React from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import PaywallScreen from '../app/paywall';

interface PremiumGuardProps {
  children: React.ReactNode;
}

/**
 * PremiumGuard component that protects premium content
 * 
 * If the user has an active subscription, renders the children
 * If not, shows the paywall inline instead of redirecting
 * 
 * This provides a better UX as users can upgrade and immediately
 * access the content without navigation issues
 */
export default function PremiumGuard({ children }: PremiumGuardProps) {
  const { hasActiveSubscription, loading } = useSubscription();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A7C2C" />
      </View>
    );
  }

  // Show paywall inline if user doesn't have active subscription
  if (!hasActiveSubscription) {
    console.log('PremiumGuard: No active subscription, showing paywall');
    return <PaywallScreen />;
  }

  // User has active subscription, show protected content
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
