
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import PageHeader from '../../components/PageHeader';
import PremiumGuard from '../../components/PremiumGuard';

function MarketplaceContent() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <PageHeader title="🛒 Marketplace" />
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Marketplace</Text>
            <Text style={styles.cardText}>
              Connect with customers and other farmers. Sell your produce directly 
              to customers or buy and sell farm equipment with the community.
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.marketplaceOption}
            onPress={() => router.push('/marketplace/customer')}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionIconText}>🌾</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Customer Marketplace</Text>
              <Text style={styles.optionDescription}>
                Sell your produce directly to customers. List products, manage orders, 
                and connect with buyers.
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.marketplaceOption}
            onPress={() => router.push('/marketplace/equipment')}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionIconText}>🚜</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Equipment Marketplace</Text>
              <Text style={styles.optionDescription}>
                Buy and sell farm equipment. List equipment for sale or find what 
                you need from other farmers.
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

export default function MarketplaceScreen() {
  return (
    <PremiumGuard>
      <MarketplaceContent />
    </PremiumGuard>
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
    paddingBottom: 100,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  marketplaceOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionIconText: {
    fontSize: 32,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  arrow: {
    fontSize: 32,
    color: '#4A7C2C',
    marginLeft: 8,
  },
});
