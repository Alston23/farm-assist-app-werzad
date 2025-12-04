
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PageHeader from '../../components/PageHeader';

export default function CropsScreen() {
  return (
    <View style={styles.container}>
      <PageHeader title="🌾 Crops" />
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Crop Management</Text>
            <Text style={styles.cardText}>
              Manage your crops, track growth cycles, and monitor plant health. 
              View detailed information about each crop including light, water, 
              soil conditions, pH levels, and spacing requirements.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.infoTitle}>Coming Soon:</Text>
            <Text style={styles.infoItem}>• Comprehensive crop database</Text>
            <Text style={styles.infoItem}>• Growth tracking</Text>
            <Text style={styles.infoItem}>• Harvest predictions</Text>
            <Text style={styles.infoItem}>• Crop rotation planning</Text>
            <Text style={styles.infoItem}>• Pest and disease alerts</Text>
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
    paddingBottom: 100,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
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
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 15,
    color: '#555',
    lineHeight: 28,
    paddingLeft: 8,
  },
});
