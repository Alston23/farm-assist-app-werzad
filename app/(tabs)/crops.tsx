
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import PageHeader from '../../components/PageHeader';
import AddCustomCropModal from '../../components/AddCustomCropModal';
import SubscriptionDebugPanel from '../../components/SubscriptionDebugPanel';
import { vegetables, fruits, flowers, herbs, searchCrops, Crop } from '../../data/crops';
import { supabase } from '../../lib/supabase';

type CustomCrop = {
  id: string;
  name: string;
  category: 'vegetable' | 'fruit' | 'flower' | 'herb';
  scientific_name?: string;
};

export default function CropsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customCrops, setCustomCrops] = useState<CustomCrop[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadCustomCrops = useCallback(async () => {
    try {
      console.log('Loading custom crops from database');
      const { data, error } = await supabase
        .from('crops')
        .select('id, name, category, scientific_name')
        .order('name');

      if (error) {
        console.error('Error loading custom crops:', error);
        return;
      }

      console.log('Loaded custom crops:', data?.length || 0);
      setCustomCrops(data || []);
    } catch (e) {
      console.error('Exception loading custom crops:', e);
    }
  }, []);

  useEffect(() => {
    loadCustomCrops();
  }, [loadCustomCrops]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCustomCrops();
    setRefreshing(false);
  }, [loadCustomCrops]);

  const handleAddSuccess = () => {
    console.log('Crop added successfully, reloading list');
    loadCustomCrops();
  };

  const allCropsWithCustom = [
    ...vegetables,
    ...fruits,
    ...flowers,
    ...herbs,
    ...customCrops.map(c => ({
      id: `custom-${c.id}`,
      name: c.name,
      category: c.category,
      scientificName: c.scientific_name,
      isCustom: true,
    })),
  ];

  const filteredCrops = searchQuery.trim() 
    ? allCropsWithCustom.filter(crop => 
        crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (crop.scientificName && crop.scientificName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : null;

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleCropPress = (crop: Crop & { isCustom?: boolean }) => {
    console.log('Navigating to crop detail:', crop.id);
    router.push({
      pathname: '/crop/[id]',
      params: { id: crop.id }
    });
  };

  const renderCropList = (crops: (Crop & { isCustom?: boolean })[]) => {
    return crops.map((crop, index) => (
      <TouchableOpacity 
        key={index} 
        style={styles.cropItem}
        onPress={() => handleCropPress(crop)}
        activeOpacity={0.7}
      >
        <View style={styles.cropItemHeader}>
          <Text style={styles.cropName}>{crop.name}</Text>
          {crop.isCustom && (
            <View style={styles.customBadge}>
              <Text style={styles.customBadgeText}>Custom</Text>
            </View>
          )}
        </View>
        {crop.scientificName && (
          <Text style={styles.scientificName}>{crop.scientificName}</Text>
        )}
        <Text style={styles.viewDetails}>Tap to view details →</Text>
      </TouchableOpacity>
    ));
  };

  const getCategoryWithCustom = (category: 'vegetable' | 'fruit' | 'flower' | 'herb') => {
    const baseCrops = {
      vegetable: vegetables,
      fruit: fruits,
      flower: flowers,
      herb: herbs,
    }[category];

    const customInCategory = customCrops
      .filter(c => c.category === category)
      .map(c => ({
        id: `custom-${c.id}`,
        name: c.name,
        category: c.category,
        scientificName: c.scientific_name,
        isCustom: true,
      }));

    return [...baseCrops, ...customInCategory];
  };

  const renderCategory = (
    title: string,
    emoji: string,
    categoryKey: 'vegetable' | 'fruit' | 'flower' | 'herb'
  ) => {
    const crops = getCategoryWithCustom(categoryKey);
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

  const totalCrops = vegetables.length + fruits.length + flowers.length + herbs.length + customCrops.length;

  return (
    <View style={styles.container}>
      <PageHeader title="🌾 Crops" />
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
          }
        >
          {/* Debug Panel - REMOVE BEFORE PRODUCTION */}
          <SubscriptionDebugPanel />

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>✨ Add Custom Crop with AI</Text>
          </TouchableOpacity>

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
                  Browse our comprehensive collection of {totalCrops} crops 
                  {customCrops.length > 0 && ` (including ${customCrops.length} custom)`} organized into four categories. 
                  Tap any category to expand and view the full list.
                </Text>
              </View>

              {renderCategory('Vegetables', '🥕', 'vegetable')}
              {renderCategory('Fruits', '🍎', 'fruit')}
              {renderCategory('Flowers', '🌸', 'flower')}
              {renderCategory('Herbs & Spices', '🌿', 'herb')}
            </>
          )}
        </ScrollView>
      </LinearGradient>

      <AddCustomCropModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />
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
  addButton: {
    backgroundColor: '#6BA542',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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
  cropItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  customBadge: {
    backgroundColor: '#6BA542',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  customBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  scientificName: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#777',
    marginBottom: 4,
  },
  viewDetails: {
    fontSize: 12,
    color: '#4A7C2C',
    fontWeight: '500',
    marginTop: 4,
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
