
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PageHeader from '../../components/PageHeader';
import { vegetables, fruits, flowers, herbs, searchCrops, Crop } from '../../data/crops';

export default function CropsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const filteredCrops = searchQuery.trim() 
    ? searchCrops(searchQuery)
    : null;

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const renderCropList = (crops: Crop[]) => {
    return crops.map((crop, index) => (
      <View key={index} style={styles.cropItem}>
        <Text style={styles.cropName}>{crop.name}</Text>
        {crop.scientificName && (
          <Text style={styles.scientificName}>{crop.scientificName}</Text>
        )}
      </View>
    ));
  };

  const renderCategory = (
    title: string,
    emoji: string,
    crops: Crop[],
    categoryKey: string
  ) => {
    const isExpanded = expandedCategory === categoryKey;
    
    return (
      <View style={styles.categoryCard}>
        <TouchableOpacity 
          style={styles.categoryHeader}
          onPress={() => toggleCategory(categoryKey)}
        >
          <View style={styles.categoryTitleRow}>
            <Text style={styles.categoryEmoji}>{emoji}</Text>
            <Text style={styles.categoryTitle}>{title}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{crops.length}</Text>
            </View>
          </View>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.cropList}>
            {renderCropList(crops)}
          </View>
        )}
      </View>
    );
  };

  const renderSearchResults = () => {
    if (!filteredCrops) return null;

    return (
      <View style={styles.searchResultsCard}>
        <Text style={styles.searchResultsTitle}>
          Search Results ({filteredCrops.length})
        </Text>
        {filteredCrops.length === 0 ? (
          <Text style={styles.noResults}>No crops found matching &quot;{searchQuery}&quot;</Text>
        ) : (
          <View style={styles.cropList}>
            {renderCropList(filteredCrops)}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader title="🌾 Crops" />
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search crops..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {searchQuery.trim() ? (
            renderSearchResults()
          ) : (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Crop Database</Text>
                <Text style={styles.summaryText}>
                  Browse our comprehensive collection of {vegetables.length + fruits.length + flowers.length + herbs.length} crops 
                  organized into four categories. Tap any category to expand and view the full list.
                </Text>
              </View>

              {renderCategory('Vegetables', '🥕', vegetables, 'vegetables')}
              {renderCategory('Fruits', '🍎', fruits, 'fruits')}
              {renderCategory('Flowers', '🌸', flowers, 'flowers')}
              {renderCategory('Herbs & Spices', '🌿', herbs, 'herbs')}
            </>
          )}
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
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryCard: {
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
  summaryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  categoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#4A7C2C',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 18,
    color: '#4A7C2C',
    fontWeight: 'bold',
  },
  cropList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cropItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cropName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#777',
  },
  searchResultsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchResultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 16,
  },
  noResults: {
    fontSize: 15,
    color: '#777',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
