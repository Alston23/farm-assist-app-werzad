
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { allCrops } from '../../data/crops';
import { supabase } from '../../lib/supabase';

type CustomCropDetail = {
  id: string;
  name: string;
  category: 'vegetable' | 'fruit' | 'flower' | 'herb';
  scientific_name?: string;
  sunlight?: string;
  water?: string;
  soil_type?: string;
  soil_ph?: string;
  plant_spacing?: string;
  row_spacing?: string;
  days_to_maturity?: string;
  planting_depth?: string;
  temperature?: string;
  hardiness?: string;
  companions?: string;
  avoid?: string;
  pests?: string;
  diseases?: string;
  harvest?: string;
  storage?: string;
  notes?: string;
};

export default function CropDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [customCrop, setCustomCrop] = useState<CustomCropDetail | null>(null);
  const [loading, setLoading] = useState(false);
  
  const isCustomCrop = typeof id === 'string' && id.startsWith('custom-');
  const crop = !isCustomCrop ? allCrops.find(c => c.id === id) : null;

  useEffect(() => {
    if (isCustomCrop) {
      loadCustomCrop();
    }
  }, [id, isCustomCrop]);

  const loadCustomCrop = async () => {
    if (!id || typeof id !== 'string') return;
    
    const cropId = id.replace('custom-', '');
    setLoading(true);
    
    try {
      console.log('Loading custom crop:', cropId);
      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .eq('id', cropId)
        .single();

      if (error) {
        console.error('Error loading custom crop:', error);
        return;
      }

      console.log('Loaded custom crop:', data);
      setCustomCrop(data);
    } catch (e) {
      console.error('Exception loading custom crop:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading crop details...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (!crop && !customCrop) {
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

  const displayCrop = customCrop || crop;
  const cropName = customCrop?.name || crop?.name || '';
  const category = customCrop?.category || crop?.category || 'vegetable';
  const scientificName = customCrop?.scientific_name || crop?.scientificName;

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'vegetable': return '🥕';
      case 'fruit': return '🍎';
      case 'flower': return '🌸';
      case 'herb': return '🌿';
      default: return '🌱';
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'vegetable': return '#4A7C2C';
      case 'fruit': return '#D84315';
      case 'flower': return '#E91E63';
      case 'herb': return '#388E3C';
      default: return '#4A7C2C';
    }
  };

  // For custom crops, use database values; for default crops, use mock data
  const cropDetails = customCrop ? {
    sunlight: customCrop.sunlight || 'Not specified',
    water: customCrop.water || 'Not specified',
    soilType: customCrop.soil_type || 'Not specified',
    soilPH: customCrop.soil_ph || 'Not specified',
    plantSpacing: customCrop.plant_spacing || 'Not specified',
    rowSpacing: customCrop.row_spacing || 'Not specified',
    daysToMaturity: customCrop.days_to_maturity || 'Not specified',
    plantingDepth: customCrop.planting_depth || 'Not specified',
    temperature: customCrop.temperature || 'Not specified',
    hardiness: customCrop.hardiness || 'Not specified',
    companions: customCrop.companions || 'Not specified',
    avoid: customCrop.avoid || 'Not specified',
    pests: customCrop.pests || 'Not specified',
    diseases: customCrop.diseases || 'Not specified',
    harvest: customCrop.harvest || 'Not specified',
    storage: customCrop.storage || 'Not specified',
    notes: customCrop.notes || 'No additional notes',
  } : {
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
            <Text style={styles.emoji}>{getCategoryEmoji(category)}</Text>
            <Text style={styles.cropName}>{cropName}</Text>
            {scientificName && (
              <Text style={styles.scientificName}>{scientificName}</Text>
            )}
            <View style={styles.badgeRow}>
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(category) }]}>
                <Text style={styles.categoryBadgeText}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </View>
              {customCrop && (
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>Custom</Text>
                </View>
              )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 16,
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
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
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
  customBadge: {
    backgroundColor: '#6BA542',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  customBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
