
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { cropDatabase } from '@/data/cropDatabase';
import { Crop } from '@/types/crop';
import { IconSymbol } from '@/components/IconSymbol';
import { storage } from '@/utils/storage';
import { openAIService } from '@/utils/openaiService';

export default function CropsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customCrops, setCustomCrops] = useState<Crop[]>([]);
  const [allCrops, setAllCrops] = useState<Crop[]>([]);

  useEffect(() => {
    loadCustomCrops();
  }, []);

  useEffect(() => {
    setAllCrops([...cropDatabase, ...customCrops]);
  }, [customCrops]);

  const loadCustomCrops = async () => {
    const crops = await storage.getCustomCrops();
    setCustomCrops(crops);
  };

  const handleAddCrop = async (crop: Crop) => {
    const updatedCrops = [...customCrops, crop];
    setCustomCrops(updatedCrops);
    await storage.saveCustomCrops(updatedCrops);
    setShowAddModal(false);
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'vegetable', label: 'Vegetables' },
    { id: 'fruit', label: 'Fruits' },
    { id: 'herb', label: 'Herbs' },
    { id: 'flower', label: 'Flowers' },
    { id: 'spice', label: 'Spices' },
    { id: 'aromatic', label: 'Aromatics' },
  ];

  const filteredCrops = allCrops.filter((crop) => {
    const matchesSearch = crop.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || crop.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Crop Database</Text>
          <Text style={styles.headerSubtitle}>{allCrops.length} crops available</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <IconSymbol
              ios_icon_name="plus.circle.fill"
              android_material_icon_name="add-circle"
              size={28}
              color={colors.primary}
            />
          </TouchableOpacity>
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

      <AddCropModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddCrop}
      />
    </SafeAreaView>
  );
}

function AddCropModal({ visible, onClose, onAdd }: { visible: boolean; onClose: () => void; onAdd: (crop: Crop) => void }) {
  const [formData, setFormData] = useState<Partial<Crop>>({
    name: '',
    category: 'vegetable',
    description: '',
    sunlight: 'full-sun',
    sunlightHours: '6-8 hours',
    waterNeeds: 'moderate',
    waterFrequency: '1 inch per week',
    soilType: ['loamy'],
    phMin: 6.0,
    phMax: 7.0,
    temperatureMin: 60,
    temperatureMax: 80,
    plantSpacing: 12,
    rowSpacing: 18,
    depth: 0.5,
    daysToGermination: '7-14',
    daysToMaturity: '60-90',
    harvestWindow: '2-3 weeks',
    plantingSeasons: ['spring'],
    frostTolerance: 'half-hardy',
    yieldPerPlant: '1-2 lbs',
    plantsPerSqFt: 1,
    companionPlants: [],
    avoidPlants: [],
    recommendedCoverCrops: ['clover'],
    fertilizer: 'Balanced NPK',
    commonPests: [],
    commonDiseases: [],
    specialNotes: '',
  });
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const handleAutoFillWithAI = async () => {
    if (!formData.name || formData.name.trim().length === 0) {
      Alert.alert('Crop Name Required', 'Please enter a crop name before using AI auto-fill.');
      return;
    }

    setIsLoadingAI(true);

    try {
      // Create a comprehensive prompt with the crop database structure
      const systemPrompt = `You are an expert agricultural database assistant. Your task is to analyze a crop name and provide comprehensive growing information based on similar crops in the database.

The crop database contains the following structure for each crop:
- name: string
- category: 'vegetable' | 'fruit' | 'flower' | 'herb' | 'spice' | 'aromatic'
- description: string (brief description)
- sunlight: 'full-sun' | 'partial-shade' | 'full-shade'
- sunlightHours: string (e.g., "6-8 hours")
- waterNeeds: 'low' | 'moderate' | 'high'
- waterFrequency: string (e.g., "1-2 inches per week")
- soilType: array of strings (e.g., ["loamy", "well-drained"])
- phMin: number (e.g., 6.0)
- phMax: number (e.g., 7.0)
- temperatureMin: number in Fahrenheit
- temperatureMax: number in Fahrenheit
- plantSpacing: number in inches
- rowSpacing: number in inches
- depth: number in inches (planting depth)
- daysToGermination: string (e.g., "7-14")
- daysToMaturity: string (e.g., "60-90")
- harvestWindow: string (e.g., "2-3 weeks")
- plantingSeasons: array of strings (e.g., ["spring", "fall"])
- frostTolerance: 'tender' | 'half-hardy' | 'hardy'
- yieldPerPlant: string (e.g., "2-4 lbs")
- plantsPerSqFt: number
- companionPlants: array of strings (crop names)
- avoidPlants: array of strings (crop names)
- recommendedCoverCrops: array of strings
- fertilizer: string (description)
- commonPests: array of strings
- commonDiseases: array of strings
- specialNotes: string

Here are some example crops from the database:
${JSON.stringify(cropDatabase.slice(0, 5), null, 2)}

Respond ONLY with a valid JSON object containing all the fields above. Do not include any explanatory text, markdown formatting, or code blocks. Just the raw JSON object.`;

      const userPrompt = `Provide comprehensive growing information for: ${formData.name}

Based on similar crops in the database and your agricultural knowledge, fill in all the required fields with accurate, practical information for small farms and homesteads.`;

      const response = await openAIService.chatCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'gpt-4o-mini',
        temperature: 0.3,
      });

      if (response) {
        try {
          // Clean the response to extract JSON
          let jsonString = response.trim();
          
          // Remove markdown code blocks if present
          if (jsonString.startsWith('```')) {
            jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          }
          
          const aiData = JSON.parse(jsonString);
          
          // Merge AI data with form data, keeping the user's crop name
          setFormData({
            ...aiData,
            name: formData.name, // Keep the user's entered name
          });

          Alert.alert(
            'AI Auto-Fill Complete',
            'All crop information has been filled in. Please review and adjust as needed before saving.',
            [{ text: 'OK' }]
          );
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
          console.log('AI Response:', response);
          Alert.alert(
            'Error',
            'Failed to parse AI response. Please try again or fill in the information manually.'
          );
        }
      }
    } catch (error: any) {
      console.error('AI auto-fill error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to auto-fill crop information. Please check your OpenAI API key in Settings and try again.'
      );
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.name) {
      Alert.alert('Error', 'Crop name is required');
      return;
    }

    const newCrop: Crop = {
      id: formData.name.toLowerCase().replace(/\s+/g, '-'),
      name: formData.name,
      category: formData.category as any,
      description: formData.description || '',
      sunlight: formData.sunlight as any,
      sunlightHours: formData.sunlightHours || '6-8 hours',
      waterNeeds: formData.waterNeeds as any,
      waterFrequency: formData.waterFrequency || '1 inch per week',
      soilType: formData.soilType || ['loamy'],
      phMin: formData.phMin || 6.0,
      phMax: formData.phMax || 7.0,
      temperatureMin: formData.temperatureMin || 60,
      temperatureMax: formData.temperatureMax || 80,
      plantSpacing: formData.plantSpacing || 12,
      rowSpacing: formData.rowSpacing || 18,
      depth: formData.depth || 0.5,
      daysToGermination: formData.daysToGermination || '7-14',
      daysToMaturity: formData.daysToMaturity || '60-90',
      harvestWindow: formData.harvestWindow || '2-3 weeks',
      plantingSeasons: formData.plantingSeasons || ['spring'],
      frostTolerance: formData.frostTolerance as any,
      yieldPerPlant: formData.yieldPerPlant || '1-2 lbs',
      plantsPerSqFt: formData.plantsPerSqFt || 1,
      companionPlants: formData.companionPlants || [],
      avoidPlants: formData.avoidPlants || [],
      recommendedCoverCrops: formData.recommendedCoverCrops || ['clover'],
      fertilizer: formData.fertilizer || 'Balanced NPK',
      commonPests: formData.commonPests || [],
      commonDiseases: formData.commonDiseases || [],
      specialNotes: formData.specialNotes || '',
    };

    onAdd(newCrop);
    setFormData({
      name: '',
      category: 'vegetable',
      description: '',
      sunlight: 'full-sun',
      sunlightHours: '6-8 hours',
      waterNeeds: 'moderate',
      waterFrequency: '1 inch per week',
      soilType: ['loamy'],
      phMin: 6.0,
      phMax: 7.0,
      temperatureMin: 60,
      temperatureMax: 80,
      plantSpacing: 12,
      rowSpacing: 18,
      depth: 0.5,
      daysToGermination: '7-14',
      daysToMaturity: '60-90',
      harvestWindow: '2-3 weeks',
      plantingSeasons: ['spring'],
      frostTolerance: 'half-hardy',
      yieldPerPlant: '1-2 lbs',
      plantsPerSqFt: 1,
      companionPlants: [],
      avoidPlants: [],
      recommendedCoverCrops: ['clover'],
      fertilizer: 'Balanced NPK',
      commonPests: [],
      commonDiseases: [],
      specialNotes: '',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer} edges={['top']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add New Crop</Text>
          <TouchableOpacity onPress={onClose}>
            <IconSymbol
              ios_icon_name="xmark.circle.fill"
              android_material_icon_name="close"
              size={28}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} contentContainerStyle={styles.formContainer}>
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Basic Information</Text>
            
            <Text style={styles.formLabel}>Crop Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g., Cherry Tomato"
              placeholderTextColor={colors.textSecondary}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <TouchableOpacity
              style={[styles.aiButton, isLoadingAI && styles.aiButtonDisabled]}
              onPress={handleAutoFillWithAI}
              disabled={isLoadingAI}
            >
              {isLoadingAI ? (
                <React.Fragment>
                  <ActivityIndicator color={colors.card} size="small" />
                  <Text style={styles.aiButtonText}>Analyzing with AI...</Text>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <IconSymbol
                    ios_icon_name="sparkles"
                    android_material_icon_name="auto-awesome"
                    size={20}
                    color={colors.card}
                  />
                  <Text style={styles.aiButtonText}>Auto-fill with AI</Text>
                </React.Fragment>
              )}
            </TouchableOpacity>

            <Text style={styles.aiHintText}>
              Enter a crop name above and tap &quot;Auto-fill with AI&quot; to automatically populate all fields with growing information from our comprehensive database.
            </Text>

            <Text style={styles.formLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPickerScroll}>
              {['vegetable', 'fruit', 'herb', 'flower', 'spice', 'aromatic'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPickerButton,
                    formData.category === cat && styles.categoryPickerButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, category: cat as any })}
                >
                  <Text
                    style={[
                      styles.categoryPickerText,
                      formData.category === cat && styles.categoryPickerTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              placeholder="Brief description of the crop"
              placeholderTextColor={colors.textSecondary}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Growing Conditions</Text>
            
            <Text style={styles.formLabel}>Sunlight</Text>
            <View style={styles.buttonGroup}>
              {['full-sun', 'partial-shade', 'full-shade'].map((sun) => (
                <TouchableOpacity
                  key={sun}
                  style={[
                    styles.buttonGroupItem,
                    formData.sunlight === sun && styles.buttonGroupItemActive,
                  ]}
                  onPress={() => setFormData({ ...formData, sunlight: sun as any })}
                >
                  <Text
                    style={[
                      styles.buttonGroupText,
                      formData.sunlight === sun && styles.buttonGroupTextActive,
                    ]}
                  >
                    {sun.replace('-', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Sunlight Hours</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g., 6-8 hours"
              placeholderTextColor={colors.textSecondary}
              value={formData.sunlightHours}
              onChangeText={(text) => setFormData({ ...formData, sunlightHours: text })}
            />

            <Text style={styles.formLabel}>Water Needs</Text>
            <View style={styles.buttonGroup}>
              {['low', 'moderate', 'high'].map((water) => (
                <TouchableOpacity
                  key={water}
                  style={[
                    styles.buttonGroupItem,
                    formData.waterNeeds === water && styles.buttonGroupItemActive,
                  ]}
                  onPress={() => setFormData({ ...formData, waterNeeds: water as any })}
                >
                  <Text
                    style={[
                      styles.buttonGroupText,
                      formData.waterNeeds === water && styles.buttonGroupTextActive,
                    ]}
                  >
                    {water}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Water Frequency</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g., 1-2 inches per week"
              placeholderTextColor={colors.textSecondary}
              value={formData.waterFrequency}
              onChangeText={(text) => setFormData({ ...formData, waterFrequency: text })}
            />

            <View style={styles.formRow}>
              <View style={styles.formRowItem}>
                <Text style={styles.formLabel}>pH Min</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="6.0"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.phMin?.toString()}
                  onChangeText={(text) => setFormData({ ...formData, phMin: parseFloat(text) || 6.0 })}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.formRowItem}>
                <Text style={styles.formLabel}>pH Max</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="7.0"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.phMax?.toString()}
                  onChangeText={(text) => setFormData({ ...formData, phMax: parseFloat(text) || 7.0 })}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formRowItem}>
                <Text style={styles.formLabel}>Temp Min (°F)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="60"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.temperatureMin?.toString()}
                  onChangeText={(text) => setFormData({ ...formData, temperatureMin: parseInt(text) || 60 })}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.formRowItem}>
                <Text style={styles.formLabel}>Temp Max (°F)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="80"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.temperatureMax?.toString()}
                  onChangeText={(text) => setFormData({ ...formData, temperatureMax: parseInt(text) || 80 })}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Spacing & Planting</Text>
            
            <View style={styles.formRow}>
              <View style={styles.formRowItem}>
                <Text style={styles.formLabel}>Plant Spacing (in)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="12"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.plantSpacing?.toString()}
                  onChangeText={(text) => setFormData({ ...formData, plantSpacing: parseInt(text) || 12 })}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.formRowItem}>
                <Text style={styles.formLabel}>Row Spacing (in)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="18"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.rowSpacing?.toString()}
                  onChangeText={(text) => setFormData({ ...formData, rowSpacing: parseInt(text) || 18 })}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formRowItem}>
                <Text style={styles.formLabel}>Depth (in)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0.5"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.depth?.toString()}
                  onChangeText={(text) => setFormData({ ...formData, depth: parseFloat(text) || 0.5 })}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.formRowItem}>
                <Text style={styles.formLabel}>Plants/Sq Ft</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="1"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.plantsPerSqFt?.toString()}
                  onChangeText={(text) => setFormData({ ...formData, plantsPerSqFt: parseFloat(text) || 1 })}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Timeline</Text>
            
            <Text style={styles.formLabel}>Days to Germination</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g., 7-14"
              placeholderTextColor={colors.textSecondary}
              value={formData.daysToGermination}
              onChangeText={(text) => setFormData({ ...formData, daysToGermination: text })}
            />

            <Text style={styles.formLabel}>Days to Maturity</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g., 60-90"
              placeholderTextColor={colors.textSecondary}
              value={formData.daysToMaturity}
              onChangeText={(text) => setFormData({ ...formData, daysToMaturity: text })}
            />

            <Text style={styles.formLabel}>Harvest Window</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g., 2-3 weeks"
              placeholderTextColor={colors.textSecondary}
              value={formData.harvestWindow}
              onChangeText={(text) => setFormData({ ...formData, harvestWindow: text })}
            />

            <Text style={styles.formLabel}>Frost Tolerance</Text>
            <View style={styles.buttonGroup}>
              {['tender', 'half-hardy', 'hardy'].map((frost) => (
                <TouchableOpacity
                  key={frost}
                  style={[
                    styles.buttonGroupItem,
                    formData.frostTolerance === frost && styles.buttonGroupItemActive,
                  ]}
                  onPress={() => setFormData({ ...formData, frostTolerance: frost as any })}
                >
                  <Text
                    style={[
                      styles.buttonGroupText,
                      formData.frostTolerance === frost && styles.buttonGroupTextActive,
                    ]}
                  >
                    {frost}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Yield</Text>
            
            <Text style={styles.formLabel}>Yield per Plant</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g., 1-2 lbs"
              placeholderTextColor={colors.textSecondary}
              value={formData.yieldPerPlant}
              onChangeText={(text) => setFormData({ ...formData, yieldPerPlant: text })}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Care & Maintenance</Text>
            
            <Text style={styles.formLabel}>Fertilizer</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g., Balanced NPK 10-10-10"
              placeholderTextColor={colors.textSecondary}
              value={formData.fertilizer}
              onChangeText={(text) => setFormData({ ...formData, fertilizer: text })}
            />

            <Text style={styles.formLabel}>Special Notes</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              placeholder="Any special care instructions or notes"
              placeholderTextColor={colors.textSecondary}
              value={formData.specialNotes}
              onChangeText={(text) => setFormData({ ...formData, specialNotes: text })}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Add Crop</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    padding: 4,
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
  formContainer: {
    paddingBottom: 40,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formRowItem: {
    flex: 1,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  buttonGroupItem: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  buttonGroupItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  buttonGroupText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  buttonGroupTextActive: {
    color: colors.card,
  },
  categoryPickerScroll: {
    marginBottom: 16,
  },
  categoryPickerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryPickerButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryPickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  categoryPickerTextActive: {
    color: colors.card,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.card,
  },
  aiButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  aiButtonDisabled: {
    opacity: 0.6,
  },
  aiButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.card,
  },
  aiHintText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 20,
    fontStyle: 'italic',
    paddingHorizontal: 4,
  },
});
