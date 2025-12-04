
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('Index: Auth state - loading:', loading, 'user:', user ? 'exists' : 'none');
    
    if (!loading) {
      if (user) {
        console.log('Index: User authenticated, redirecting to tabs');
        // Use setTimeout to ensure navigation happens after render
        setTimeout(() => {
          router.replace('/(tabs)/crops');
        }, 0);
      } else {
        console.log('Index: No user, redirecting to auth');
        // Use setTimeout to ensure navigation happens after render
        setTimeout(() => {
          router.replace('/auth');
        }, 0);
      }
    }
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2D5016" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
