
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (!hasRedirected && !loading) {
        console.warn('Index: Redirect timeout, forcing navigation');
        setHasRedirected(true);
        if (user) {
          router.replace('/(tabs)/crops');
        } else {
          router.replace('/auth');
        }
      }
    }, 2000); // 2 second timeout

    if (loading || hasRedirected) {
      return () => clearTimeout(timeoutId);
    }

    // Perform redirect
    setHasRedirected(true);
    
    if (user) {
      console.log('Index: User authenticated, redirecting to /(tabs)/crops');
      router.replace('/(tabs)/crops');
    } else {
      console.log('Index: User not authenticated, redirecting to /auth');
      router.replace('/auth');
    }

    return () => clearTimeout(timeoutId);
  }, [user, loading, hasRedirected]);

  // Show loading indicator while determining auth state
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6BA542" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2D5016',
  },
});
