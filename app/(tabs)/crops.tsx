
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { cropDatabase } from '@/data/cropDatabase';
import { Crop } from '@/types/crop';
import { IconSymbol } from '@/components/IconSymbol';

export default function CropsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'vegetable', label: 'Vegetables' },
    { id: 'fruit', label: 'Fruits' },
    { id: 'herb', label: 'Herbs' },
    { id: 'flower', label: 'Flowers' },
    { id: 'spice', label: 'Spices' },
    { id: 'aromatic', label: 'Aromatics' },
  ];

  const filteredCrops = cropDatabase.filter((crop) => {
    const matchesSearch = crop.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || crop.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Crop Database</Text>
          <Text style={styles.headerSubtitle}>{cropDatabase.length} crops available</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <IconSymbol
            ios_icon_name="gearshape.fill"
            android_material_icon_name="settings"
            size={28}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <IconSymbol
          ios_icon_name="magnifyingglass"
          android_material_icon_name="search"
          size={20}
          color={colors.textSecondary}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search crops..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category.id && styles.categoryButtonTextActive,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.cropList}
        contentContainerStyle={styles.cropListContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredCrops.map((crop) => (
          <TouchableOpacity
            key={crop.id}
            style={styles.cropCard}
            onPress={() => setSelectedCrop(crop)}
          >
            <View style={styles.cropCardHeader}>
              <Text style={styles.cropName}>{crop.name}</Text>
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(crop.category) }]}>
                <Text style={styles.categoryBadgeText}>{crop.category}</Text>
              </View>
            </View>
            <Text style={styles.cropDescription} numberOfLines={2}>
              {crop.description}
            </Text>
            <View style={styles.cropInfo}>
              <View style={styles.cropInfoItem}>
                <IconSymbol
                  ios_icon_name="sun.max.fill"
                  android_material_icon_name="wb-sunny"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.cropInfoText}>{crop.sunlightHours}</Text>
              </View>
              <View style={styles.cropInfoItem}>
                <IconSymbol
                  ios_icon_name="drop.fill"
                  android_material_icon_name="water-drop"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.cropInfoText}>{crop.waterNeeds}</Text>
              </View>
              <View style={styles.cropInfoItem}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="event"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.cropInfoText}>{crop.daysToMaturity} days</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={selectedCrop !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedCrop(null)}
      >
        {selectedCrop && (
          <SafeAreaView style={styles.modalContainer} edges={['top']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedCrop.name}</Text>
              <TouchableOpacity onPress={() => setSelectedCrop(null)}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="close"
                  size={28}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(selectedCrop.category), alignSelf: 'flex-start' }]}>
                <Text style={styles.categoryBadgeText}>{selectedCrop.category}</Text>
              </View>

              <Text style={styles.modalDescription}>{selectedCrop.description}</Text>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Growing Conditions</Text>
                <DetailRow label="Sunlight" value={`${selectedCrop.sunlight} (${selectedCrop.sunlightHours})`} />
                <DetailRow label="Water Needs" value={`${selectedCrop.waterNeeds} (${selectedCrop.waterFrequency})`} />
                <DetailRow label="Soil Type" value={selectedCrop.soilType.join(', ')} />
                <DetailRow label="pH Range" value={`${selectedCrop.phMin} - ${selectedCrop.phMax}`} />
                <DetailRow label="Temperature" value={`${selectedCrop.temperatureMin}°F - ${selectedCrop.temperatureMax}°F`} />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Spacing & Planting</Text>
                <DetailRow label="Plant Spacing" value={`${selectedCrop.plantSpacing} inches`} />
                <DetailRow label="Row Spacing" value={`${selectedCrop.rowSpacing} inches`} />
                <DetailRow label="Planting Depth" value={`${selectedCrop.depth} inches`} />
                <DetailRow label="Plants per Sq Ft" value={selectedCrop.plantsPerSqFt.toString()} />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Timeline</Text>
                <DetailRow label="Days to Germination" value={selectedCrop.daysToGermination} />
                <DetailRow label="Days to Maturity" value={selectedCrop.daysToMaturity} />
                <DetailRow label="Harvest Window" value={selectedCrop.harvestWindow} />
                <DetailRow label="Planting Seasons" value={selectedCrop.plantingSeasons.join(', ')} />
                <DetailRow label="Frost Tolerance" value={selectedCrop.frostTolerance} />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Yield & Production</Text>
                <DetailRow label="Yield per Plant" value={selectedCrop.yieldPerPlant} />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Companion Planting</Text>
                <DetailRow label="Good Companions" value={selectedCrop.companionPlants.join(', ') || 'None listed'} />
                <DetailRow label="Avoid Planting With" value={selectedCrop.avoidPlants.join(', ') || 'None listed'} />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Cover Crops</Text>
                <DetailRow label="Recommended" value={selectedCrop.recommendedCoverCrops.join(', ')} />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Care & Maintenance</Text>
                <DetailRow label="Fertilizer" value={selectedCrop.fertilizer} />
                <DetailRow label="Common Pests" value={selectedCrop.commonPests.join(', ')} />
                <DetailRow label="Common Diseases" value={selectedCrop.commonDiseases.join(', ')} />
              </View>

              {selectedCrop.specialNotes && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Special Notes</Text>
                  <Text style={styles.specialNotes}>{selectedCrop.specialNotes}</Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function getCategoryColor(category: string): string {
  const colorsMap: { [key: string]: string } = {
    vegetable: '#6B8E23',
    fruit: '#FF6B6B',
    herb: '#4ECDC4',
    flower: '#FFB6C1',
    spice: '#D4A574',
    aromatic: '#9B59B6',
  };
  return colorsMap[category] || colors.primary;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  settingsButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  categoryButtonTextActive: {
    color: colors.card,
  },
  cropList: {
    flex: 1,
  },
  cropListContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  cropCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  cropCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cropName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.card,
    textTransform: 'capitalize',
  },
  cropDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  cropInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  cropInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cropInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  modalDescription: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginTop: 16,
    marginBottom: 24,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 140,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  specialNotes: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
