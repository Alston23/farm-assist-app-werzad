
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSubscription } from '../contexts/SubscriptionContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

interface PremiumGuardProps {
  children: React.ReactNode;
}

export default function PremiumGuard({ children }: PremiumGuardProps) {
  const { hasActiveSubscription, loading } = useSubscription();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !hasActiveSubscription) {
      console.log('PremiumGuard: No active subscription, redirecting to paywall');
      router.replace('/paywall');
    }
  }, [hasActiveSubscription, loading, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A7C2C" />
      </View>
    );
  }

  if (!hasActiveSubscription) {
    return null;
  }

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
