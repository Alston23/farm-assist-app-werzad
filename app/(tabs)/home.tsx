
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PageHeader from '../../components/PageHeader';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <PageHeader title="🏡 Home" />
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>Welcome to SmallFarm Copilot</Text>
            <Text style={styles.welcomeText}>
              Your comprehensive farming companion for managing crops, fields, tasks, and more.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🌾 Getting Started</Text>
            <Text style={styles.infoText}>
              - Browse crops in the Crops tab{'\n'}
              - Add fields and plantings{'\n'}
              - Track tasks and schedules{'\n'}
              - Monitor revenue and expenses{'\n'}
              - Get AI-powered assistance
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>✨ Features</Text>
            <Text style={styles.infoText}>
              - Comprehensive crop database{'\n'}
              - Field and planting management{'\n'}
              - Task scheduling and reminders{'\n'}
              - Revenue and expense tracking{'\n'}
              - Equipment and inventory management{'\n'}
              - AI assistant for farming advice{'\n'}
              - Weather insights and recommendations
            </Text>
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
    paddingBottom: 120,
  },
  welcomeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
  },
});
