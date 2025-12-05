
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSubscription } from '../contexts/SubscriptionContext';

interface Feature {
  text: string;
}

const features: Feature[] = [
  { text: 'Advanced planting & fertilizer recommendations' },
  { text: 'AI Farm Copilot for your own farm data' },
  { text: 'Sales & revenue tracking with automatic inventory updates' },
  { text: 'Space & yield optimization' },
  { text: 'Smart alerts and analytics' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { activateSubscription, refreshSubscription } = useSubscription();
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      console.log('Paywall: Starting purchase process');
      
      // TODO: In a real app, this would integrate with:
      // - Natively's built-in subscription system
      // - Expo In-App Purchases (expo-in-app-purchases)
      // - Or a payment provider like Stripe/RevenueCat
      
      // For now, we'll simulate the purchase process
      // In production, you would:
      // 1. Call the native store (App Store / Play Store) to initiate purchase
      // 2. Verify the purchase receipt with your backend
      // 3. Activate the subscription in your database
      
      // Simulate a delay for the purchase process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Activate the subscription
      await activateSubscription();
      
      // Refresh subscription status to update the UI
      await refreshSubscription();
      
      console.log('Paywall: Purchase successful, subscription activated');
      
      Alert.alert(
        'Welcome to Farm Copilot Pro! 🎉',
        'Your subscription is now active. Enjoy all premium features!',
        [
          {
            text: 'Get Started',
            onPress: () => {
              console.log('Paywall: User acknowledged purchase success');
              // The PremiumGuard will automatically show the protected content
              // since hasActiveSubscription is now true
            },
          },
        ]
      );
    } catch (error) {
      console.error('Paywall: Purchase error:', error);
      Alert.alert(
        'Purchase Failed',
        'There was an error processing your purchase. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handleMaybeLater = () => {
    console.log('Paywall: Maybe later button pressed');
    // Navigate back to the Crops tab
    router.replace("/(tabs)/crops");
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Unlock Farm Copilot Pro</Text>
            <Text style={styles.subtitle}>
              Smarter planning. Faster decisions. Bigger harvests.
            </Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.bulletPoint}>
                  <Text style={styles.bulletText}>✓</Text>
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          {/* Pricing Card */}
          <View style={styles.pricingCard}>
            <View style={styles.pricingBadge}>
              <Text style={styles.pricingBadgeText}>BEST VALUE</Text>
            </View>
            <Text style={styles.pricingTitle}>Farm Copilot Pro</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.priceAmount}>$12.99</Text>
              <Text style={styles.pricePeriod}> / month</Text>
            </View>
            <Text style={styles.pricingDescription}>
              Cancel anytime • No hidden fees • Full access to all features
            </Text>
          </View>

          {/* Primary Button */}
          <TouchableOpacity
            style={[styles.upgradeButton, purchasing && styles.upgradeButtonDisabled]}
            onPress={handlePurchase}
            disabled={purchasing}
            activeOpacity={0.8}
          >
            {purchasing ? (
              <View style={styles.purchasingContainer}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.upgradeButtonText}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.upgradeButtonText}>
                Upgrade to Farm Copilot Pro — $12.99 / month
              </Text>
            )}
          </TouchableOpacity>

          {/* Secondary Button */}
          <TouchableOpacity
            style={styles.maybeLaterButton}
            onPress={handleMaybeLater}
            disabled={purchasing}
            activeOpacity={0.7}
          >
            <Text style={styles.maybeLaterButtonText}>Maybe later</Text>
          </TouchableOpacity>

          {/* Free Plan Info */}
          <View style={styles.freeAccessContainer}>
            <Text style={styles.freeAccessTitle}>Free Plan Includes:</Text>
            <Text style={styles.freeAccessItem}>• Basic crop recommendations</Text>
            <Text style={styles.freeAccessItem}>• Basic inventory management</Text>
            <Text style={styles.freeAccessItem}>• Fields and plantings tracking</Text>
            <Text style={styles.freeAccessItem}>• Task management</Text>
          </View>

          {/* Legal Text */}
          <Text style={styles.legalText}>
            By subscribing, you agree to our Terms of Service and Privacy Policy. 
            Subscription automatically renews unless cancelled at least 24 hours before 
            the end of the current period.
          </Text>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D5016',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#E8F5E9',
    textAlign: 'center',
    lineHeight: 26,
  },
  featuresContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bulletPoint: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4A7C2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  bulletText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  pricingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    position: 'relative',
  },
  pricingBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pricingBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2D5016',
    letterSpacing: 1,
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
    marginTop: 8,
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4A7C2C',
  },
  pricePeriod: {
    fontSize: 20,
    color: '#666',
  },
  pricingDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  upgradeButton: {
    backgroundColor: '#4A7C2C',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  upgradeButtonDisabled: {
    opacity: 0.7,
  },
  purchasingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  maybeLaterButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  maybeLaterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  freeAccessContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  freeAccessTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  freeAccessItem: {
    fontSize: 14,
    color: '#E8F5E9',
    marginBottom: 6,
    lineHeight: 20,
  },
  legalText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
