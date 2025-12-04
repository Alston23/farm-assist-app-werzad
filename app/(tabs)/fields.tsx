
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PageHeader from '../../components/PageHeader';

export default function FieldsScreen() {
  return (
    <View style={styles.container}>
      <PageHeader title="🏞️ Fields/Beds" />
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Field & Bed Management</Text>
            <Text style={styles.cardText}>
              Organize and manage your different fields and bed sizes. 
              Track soil conditions, plan layouts, and optimize space usage 
              for maximum productivity.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.infoTitle}>Coming Soon:</Text>
            <Text style={styles.infoItem}>• Field mapping and visualization</Text>
            <Text style={styles.infoItem}>• Bed size calculator</Text>
            <Text style={styles.infoItem}>• Soil condition tracking</Text>
            <Text style={styles.infoItem}>• Irrigation zone planning</Text>
            <Text style={styles.infoItem}>• Space optimization tools</Text>
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
