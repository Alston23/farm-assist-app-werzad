
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PageHeader from '../../components/PageHeader';

export default function AIAssistantScreen() {
  return (
    <View style={styles.container}>
      <PageHeader title="🤖 AI Assistant" />
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>AI Assistant</Text>
            <Text style={styles.cardText}>
              Get intelligent recommendations and answers to your farming questions. 
              Your personal farming advisor powered by AI.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.infoTitle}>Coming Soon:</Text>
            <Text style={styles.infoItem}>• Crop recommendations</Text>
            <Text style={styles.infoItem}>• Problem diagnosis</Text>
            <Text style={styles.infoItem}>• Growing tips</Text>
            <Text style={styles.infoItem}>• Weather insights</Text>
            <Text style={styles.infoItem}>• Personalized advice</Text>
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
