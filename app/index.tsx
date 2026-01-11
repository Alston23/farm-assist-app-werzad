
import { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('Index: Auth state - loading:', loading, 'user:', !!user);
  }, [loading, user]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6BA542" />
      </View>
    );
  }

  // Redirect based on auth state
  if (user) {
    console.log('Index: User authenticated, redirecting to /(tabs)/home');
    return <Redirect href="/(tabs)/home" />;
  } else {
    console.log('Index: No user, redirecting to /login');
    return <Redirect href="/login" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});
