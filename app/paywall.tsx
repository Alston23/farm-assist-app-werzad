
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSubscription } from '../contexts/SubscriptionContext';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: '🌟',
    title: 'Advanced Recommendations',
    description: 'Get AI-powered crop recommendations tailored to your farm conditions',
  },
  {
    icon: '🤖',
    title: 'AI Farm Copilot',
    description: 'Chat with your personal AI assistant for farming advice and insights',
  },
  {
    icon: '🛒',
    title: 'Sales & Marketplace Tools',
    description: 'Access marketplace features to sell produce and equipment',
  },
  {
    icon: '📊',
    title: 'Space & Yield Optimizer',
    description: 'Optimize your field layouts and maximize crop yields',
  },
  {
    icon: '📈',
    title: 'Inventory Analytics',
    description: 'Advanced analytics for seeds, fertilizers, and storage management',
  },
  {
    icon: '🔔',
    title: 'Smart Notifications',
    description: 'Get timely alerts for planting, harvesting, and task reminders',
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { activateSubscription } = useSubscription();
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      console.log('Paywall: Starting purchase process');
      
      // In a real app, this would integrate with Expo In-App Purchases
      // or a payment provider like Stripe. For now, we'll simulate the purchase.
      
      // Simulate a delay for the purchase process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Activate the subscription
      await activateSubscription();
      
      console.log('Paywall: Purchase successful');
      
      Alert.alert(
        'Welcome to Farm Copilot Pro! 🎉',
        'Your subscription is now active. Enjoy all premium features!',
        [
          {
            text: 'Get Started',
            onPress: () => {
              console.log('Paywall: Navigating back after purchase');
              router.back();
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

  const handleBack = () => {
    console.log('Paywall: Back button pressed');
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Unlock Farm Copilot Pro</Text>
            <Text style={styles.subtitle}>
              Smarter planning. Faster decisions. Bigger harvests.
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureIconText}>{feature.icon}</Text>
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.pricingCard}>
            <Text style={styles.pricingTitle}>Farm Copilot Pro</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.priceAmount}>$12.99</Text>
              <Text style={styles.pricePeriod}>/month</Text>
            </View>
            <Text style={styles.pricingDescription}>
              Cancel anytime. No hidden fees.
            </Text>
          </View>

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
                Upgrade to Farm Copilot Pro — $12.99/month
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={purchasing}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>Maybe Later</Text>
          </TouchableOpacity>

          <View style={styles.freeAccessContainer}>
            <Text style={styles.freeAccessTitle}>Free Plan Includes:</Text>
            <Text style={styles.freeAccessItem}>• Basic crop recommendations</Text>
            <Text style={styles.freeAccessItem}>• Basic inventory management</Text>
            <Text style={styles.freeAccessItem}>• Fields and plantings tracking</Text>
            <Text style={styles.freeAccessItem}>• Task management</Text>
          </View>
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
    marginBottom: 32,
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
    marginBottom: 32,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureIconText: {
    fontSize: 28,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
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
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
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
    marginLeft: 4,
  },
  pricingDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  freeAccessContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
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
});
