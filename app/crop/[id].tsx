
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { allCrops } from '../../data/crops';

export default function CropDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const crop = allCrops.find(c => c.id === id);

  if (!crop) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Crop not found</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>← Go Back</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'vegetable': return '🥕';
      case 'fruit': return '🍎';
      case 'flower': return '🌸';
      case 'herb': return '🌿';
      default: return '🌱';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'vegetable': return '#4A7C2C';
      case 'fruit': return '#D84315';
      case 'flower': return '#E91E63';
      case 'herb': return '#388E3C';
      default: return '#4A7C2C';
    }
  };

  // Mock data for crop requirements - in a real app, this would come from a database
  const cropDetails = {
    sunlight: 'Full sun (6-8 hours daily)',
    water: 'Regular watering, keep soil consistently moist',
    soilType: 'Well-draining, rich in organic matter',
    soilPH: '6.0 - 7.0',
    plantSpacing: '18-24 inches',
    rowSpacing: '24-36 inches',
    daysToMaturity: '60-80 days',
    plantingDepth: '1/4 inch',
    temperature: '65-85°F (18-29°C)',
    hardiness: 'Zones 3-11 (annual)',
    companions: 'Basil, carrots, onions, marigolds',
    avoid: 'Brassicas, fennel',
    pests: 'Aphids, hornworms, whiteflies',
    diseases: 'Blight, wilt, leaf spot',
    harvest: 'When fruit is firm and fully colored',
    storage: 'Store at room temperature until ripe',
    notes: 'This is sample data. In production, each crop would have specific growing requirements tailored to its needs.',
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <TouchableOpacity style={styles.backButtonTop} onPress={() => router.back()}>
            <Text style={styles.backButtonTopText}>← Back to Crops</Text>
          </TouchableOpacity>

          <View style={styles.headerCard}>
            <Text style={styles.emoji}>{getCategoryEmoji(crop.category)}</Text>
            <Text style={styles.cropName}>{crop.name}</Text>
            {crop.scientificName && (
              <Text style={styles.scientificName}>{crop.scientificName}</Text>
            )}
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(crop.category) }]}>
              <Text style={styles.categoryBadgeText}>
                {crop.category.charAt(0).toUpperCase() + crop.category.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>☀️ Growing Conditions</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sunlight:</Text>
              <Text style={styles.detailValue}>{cropDetails.sunlight}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Water:</Text>
              <Text style={styles.detailValue}>{cropDetails.water}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Temperature:</Text>
              <Text style={styles.detailValue}>{cropDetails.temperature}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Hardiness:</Text>
              <Text style={styles.detailValue}>{cropDetails.hardiness}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🌱 Soil Requirements</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Soil Type:</Text>
              <Text style={styles.detailValue}>{cropDetails.soilType}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Soil pH:</Text>
              <Text style={styles.detailValue}>{cropDetails.soilPH}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📏 Spacing & Planting</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Plant Spacing:</Text>
              <Text style={styles.detailValue}>{cropDetails.plantSpacing}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Row Spacing:</Text>
              <Text style={styles.detailValue}>{cropDetails.rowSpacing}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Planting Depth:</Text>
              <Text style={styles.detailValue}>{cropDetails.plantingDepth}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Days to Maturity:</Text>
              <Text style={styles.detailValue}>{cropDetails.daysToMaturity}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🤝 Companion Planting</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Good Companions:</Text>
              <Text style={styles.detailValue}>{cropDetails.companions}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Avoid Planting With:</Text>
              <Text style={styles.detailValue}>{cropDetails.avoid}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🐛 Pests & Diseases</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Common Pests:</Text>
              <Text style={styles.detailValue}>{cropDetails.pests}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Common Diseases:</Text>
              <Text style={styles.detailValue}>{cropDetails.diseases}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🌾 Harvest & Storage</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>When to Harvest:</Text>
              <Text style={styles.detailValue}>{cropDetails.harvest}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Storage:</Text>
              <Text style={styles.detailValue}>{cropDetails.storage}</Text>
            </View>
          </View>

          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>📝 Notes</Text>
            <Text style={styles.notesText}>{cropDetails.notes}</Text>
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButtonTop: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backButtonTopText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  cropName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D5016',
    textAlign: 'center',
    marginBottom: 8,
  },
  scientificName: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#777',
    textAlign: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sectionCard: {
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  notesCard: {
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
  notesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
  },
});
