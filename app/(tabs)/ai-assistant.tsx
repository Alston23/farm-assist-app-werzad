
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import * as ImagePicker from 'expo-image-picker';
import { openAIService, ChatMessage } from '@/utils/openaiService';

type AIFeature = 
  | 'plant-diagnosis'
  | 'planting-windows'
  | 'farm-questions'
  | 'market-prices'
  | 'harvest-plans';

export default function AIAssistantScreen() {
  const [selectedFeature, setSelectedFeature] = useState<AIFeature | null>(null);

  const features = [
    {
      id: 'plant-diagnosis' as AIFeature,
      title: 'Plant Diagnosis',
      description: 'Diagnose plant problems with text or photos',
      icon: 'medical-services',
      iosIcon: 'stethoscope',
      color: colors.error,
    },
    {
      id: 'planting-windows' as AIFeature,
      title: 'Planting Windows',
      description: 'Get optimal planting schedules for your crops',
      icon: 'calendar-today',
      iosIcon: 'calendar',
      color: colors.primary,
    },
    {
      id: 'farm-questions' as AIFeature,
      title: 'Farm Q&A',
      description: 'Ask any farming-related questions',
      icon: 'help',
      iosIcon: 'questionmark.circle',
      color: colors.accent,
    },
    {
      id: 'market-prices' as AIFeature,
      title: 'Market Prices',
      description: 'Auto-generate market price lists',
      icon: 'attach-money',
      iosIcon: 'dollarsign.circle',
      color: colors.success,
    },
    {
      id: 'harvest-plans' as AIFeature,
      title: 'Harvest Plans',
      description: 'Auto-build optimized harvest schedules',
      icon: 'agriculture',
      iosIcon: 'leaf',
      color: colors.warning,
    },
  ];

  if (selectedFeature) {
    return (
      <View style={commonStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedFeature(null)}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {features.find(f => f.id === selectedFeature)?.title}
          </Text>
        </View>
        {renderFeatureContent(selectedFeature)}
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <IconSymbol
            ios_icon_name="sparkles"
            android_material_icon_name="auto-awesome"
            size={48}
            color={colors.primary}
          />
          <Text style={styles.mainTitle}>AI Farm Assistant</Text>
          <Text style={styles.mainSubtitle}>
            Powered by advanced AI to help you make better farming decisions
          </Text>
        </View>

        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.featureCard, { borderLeftColor: feature.color }]}
              onPress={() => setSelectedFeature(feature.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: feature.color + '20' }]}>
                <IconSymbol
                  ios_icon_name={feature.iosIcon}
                  android_material_icon_name={feature.icon}
                  size={32}
                  color={feature.color}
                />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="info.circle"
            android_material_icon_name="info"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            To use AI features, configure your OpenAI API key in Settings.
            This ensures secure and private access to AI capabilities.
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  function renderFeatureContent(feature: AIFeature) {
    switch (feature) {
      case 'plant-diagnosis':
        return <PlantDiagnosisFeature />;
      case 'planting-windows':
        return <PlantingWindowsFeature />;
      case 'farm-questions':
        return <FarmQuestionsFeature />;
      case 'market-prices':
        return <MarketPricesFeature />;
      case 'harvest-plans':
        return <HarvestPlansFeature />;
      default:
        return null;
    }
  }
}

function PlantDiagnosisFeature() {
  const [inputMethod, setInputMethod] = useState<'text' | 'image'>('text');
  const [symptoms, setSymptoms] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePicture = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const analyzePlant = async () => {
    if (inputMethod === 'text' && !symptoms.trim()) {
      Alert.alert('Input Required', 'Please describe the symptoms');
      return;
    }
    if (inputMethod === 'image' && !selectedImage) {
      Alert.alert('Image Required', 'Please select or take a photo');
      return;
    }

    setLoading(true);
    setDiagnosis(null);
    
    try {
      let result: string | null;
      
      if (inputMethod === 'text') {
        result = await openAIService.diagnosePlant(symptoms);
      } else {
        result = await openAIService.diagnosePlantFromImage(selectedImage!);
      }

      if (result) {
        setDiagnosis(result);
      } else {
        Alert.alert('Error', 'No diagnosis received. Please try again.');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      Alert.alert('Error', error.message || 'Failed to analyze. Please check your API configuration in Settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.featureContainer} contentContainerStyle={styles.featureContentPadding}>
      <View style={styles.methodSelector}>
        <TouchableOpacity
          style={[styles.methodButton, inputMethod === 'text' && styles.methodButtonActive]}
          onPress={() => setInputMethod('text')}
        >
          <IconSymbol
            ios_icon_name="text.bubble"
            android_material_icon_name="text-fields"
            size={24}
            color={inputMethod === 'text' ? colors.card : colors.textSecondary}
          />
          <Text style={[styles.methodButtonText, inputMethod === 'text' && styles.methodButtonTextActive]}>
            Text Description
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.methodButton, inputMethod === 'image' && styles.methodButtonActive]}
          onPress={() => setInputMethod('image')}
        >
          <IconSymbol
            ios_icon_name="camera"
            android_material_icon_name="photo-camera"
            size={24}
            color={inputMethod === 'image' ? colors.card : colors.textSecondary}
          />
          <Text style={[styles.methodButtonText, inputMethod === 'image' && styles.methodButtonTextActive]}>
            Photo Analysis
          </Text>
        </TouchableOpacity>
      </View>

      {inputMethod === 'text' ? (
        <View style={styles.inputSection}>
          <Text style={styles.label}>Describe the symptoms:</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={6}
            placeholder="E.g., Yellow spots on leaves, wilting stems, brown edges..."
            placeholderTextColor={colors.textSecondary}
            value={symptoms}
            onChangeText={setSymptoms}
          />
        </View>
      ) : (
        <View style={styles.inputSection}>
          <Text style={styles.label}>Upload or take a photo:</Text>
          {selectedImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={32}
                  color={colors.error}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imageButtons}>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <IconSymbol
                  ios_icon_name="photo"
                  android_material_icon_name="photo-library"
                  size={32}
                  color={colors.primary}
                />
                <Text style={styles.imageButtonText}>Choose Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageButton} onPress={takePicture}>
                <IconSymbol
                  ios_icon_name="camera.fill"
                  android_material_icon_name="photo-camera"
                  size={32}
                  color={colors.primary}
                />
                <Text style={styles.imageButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[commonStyles.button, loading && styles.buttonDisabled]}
        onPress={analyzePlant}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.card} />
        ) : (
          <Text style={commonStyles.buttonText}>Analyze Plant</Text>
        )}
      </TouchableOpacity>

      {diagnosis && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={24}
              color={colors.success}
            />
            <Text style={styles.resultTitle}>Diagnosis Complete</Text>
          </View>
          <Text style={styles.resultText}>{diagnosis}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function PlantingWindowsFeature() {
  const [selectedCrop, setSelectedCrop] = useState('');
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string | null>(null);

  const generatePlan = async () => {
    if (!selectedCrop.trim() || !region.trim()) {
      Alert.alert('Input Required', 'Please enter crop and region');
      return;
    }

    setLoading(true);
    setRecommendations(null);
    
    try {
      const result = await openAIService.generatePlantingWindows(selectedCrop, region);
      
      if (result) {
        setRecommendations(result);
      } else {
        Alert.alert('Error', 'No recommendations received. Please try again.');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      Alert.alert('Error', error.message || 'Failed to generate recommendations. Please check your API configuration in Settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.featureContainer} contentContainerStyle={styles.featureContentPadding}>
      <View style={styles.inputSection}>
        <Text style={styles.label}>Crop Name:</Text>
        <TextInput
          style={commonStyles.input}
          placeholder="E.g., Tomatoes, Lettuce, Carrots..."
          placeholderTextColor={colors.textSecondary}
          value={selectedCrop}
          onChangeText={setSelectedCrop}
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.label}>Your Region/Zone:</Text>
        <TextInput
          style={commonStyles.input}
          placeholder="E.g., Zone 7a, Pacific Northwest..."
          placeholderTextColor={colors.textSecondary}
          value={region}
          onChangeText={setRegion}
        />
      </View>

      <TouchableOpacity
        style={[commonStyles.button, loading && styles.buttonDisabled]}
        onPress={generatePlan}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.card} />
        ) : (
          <Text style={commonStyles.buttonText}>Generate Planting Plan</Text>
        )}
      </TouchableOpacity>

      {recommendations && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <IconSymbol
              ios_icon_name="calendar.badge.checkmark"
              android_material_icon_name="event-available"
              size={24}
              color={colors.success}
            />
            <Text style={styles.resultTitle}>Planting Schedule</Text>
          </View>
          <Text style={styles.resultText}>{recommendations}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function FarmQuestionsFeature() {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!question.trim()) {
      return;
    }

    const userMessage = question;
    setQuestion('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const conversationHistory: ChatMessage[] = chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const result = await openAIService.answerFarmQuestion(userMessage, conversationHistory);
      
      if (result) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: result }]);
      } else {
        Alert.alert('Error', 'No response received. Please try again.');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      Alert.alert('Error', error.message || 'Failed to get response. Please check your API configuration in Settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.chatContainer}>
      <ScrollView
        style={styles.chatMessages}
        contentContainerStyle={styles.chatMessagesContent}
      >
        {chatHistory.length === 0 ? (
          <View style={styles.emptyChat}>
            <IconSymbol
              ios_icon_name="bubble.left.and.bubble.right"
              android_material_icon_name="chat"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyChatText}>Ask me anything about farming!</Text>
            <Text style={styles.emptyChatSubtext}>
              Crop management, pest control, soil health, irrigation, and more...
            </Text>
          </View>
        ) : (
          chatHistory.map((message, index) => (
            <View
              key={index}
              style={[
                styles.chatMessage,
                message.role === 'user' ? styles.userMessage : styles.assistantMessage,
              ]}
            >
              <Text style={[
                styles.chatMessageText,
                message.role === 'user' && styles.userMessageText,
              ]}>
                {message.content}
              </Text>
            </View>
          ))
        )}
        {loading && (
          <View style={styles.loadingMessage}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.chatInputContainer}>
        <TextInput
          style={styles.chatInput}
          placeholder="Ask a farming question..."
          placeholderTextColor={colors.textSecondary}
          value={question}
          onChangeText={setQuestion}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!question.trim() || loading) && styles.sendButtonDisabled]}
          onPress={askQuestion}
          disabled={!question.trim() || loading}
        >
          <IconSymbol
            ios_icon_name="arrow.up.circle.fill"
            android_material_icon_name="send"
            size={32}
            color={question.trim() && !loading ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MarketPricesFeature() {
  const [crops, setCrops] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [priceList, setPriceList] = useState<string | null>(null);

  const generatePriceList = async () => {
    if (!crops.trim() || !location.trim()) {
      Alert.alert('Input Required', 'Please enter crops and location');
      return;
    }

    setLoading(true);
    setPriceList(null);
    
    try {
      const result = await openAIService.generateMarketPrices(crops, location);
      
      if (result) {
        setPriceList(result);
      } else {
        Alert.alert('Error', 'No price list received. Please try again.');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      Alert.alert('Error', error.message || 'Failed to generate price list. Please check your API configuration in Settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.featureContainer} contentContainerStyle={styles.featureContentPadding}>
      <View style={styles.inputSection}>
        <Text style={styles.label}>Crops to Price:</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="E.g., Tomatoes, Lettuce, Carrots, Herbs..."
          placeholderTextColor={colors.textSecondary}
          value={crops}
          onChangeText={setCrops}
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.label}>Market Location:</Text>
        <TextInput
          style={commonStyles.input}
          placeholder="E.g., Portland, OR or Farmers Market Name..."
          placeholderTextColor={colors.textSecondary}
          value={location}
          onChangeText={setLocation}
        />
      </View>

      <TouchableOpacity
        style={[commonStyles.button, loading && styles.buttonDisabled]}
        onPress={generatePriceList}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.card} />
        ) : (
          <Text style={commonStyles.buttonText}>Generate Price List</Text>
        )}
      </TouchableOpacity>

      {priceList && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <IconSymbol
              ios_icon_name="dollarsign.circle.fill"
              android_material_icon_name="monetization-on"
              size={24}
              color={colors.success}
            />
            <Text style={styles.resultTitle}>Market Prices</Text>
          </View>
          <Text style={styles.resultText}>{priceList}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function HarvestPlansFeature() {
  const [plantingData, setPlantingData] = useState('');
  const [goals, setGoals] = useState('');
  const [loading, setLoading] = useState(false);
  const [harvestPlan, setHarvestPlan] = useState<string | null>(null);

  const generateHarvestPlan = async () => {
    if (!plantingData.trim()) {
      Alert.alert('Input Required', 'Please enter your planting information');
      return;
    }

    setLoading(true);
    setHarvestPlan(null);
    
    try {
      const result = await openAIService.generateHarvestPlan(plantingData, goals || undefined);
      
      if (result) {
        setHarvestPlan(result);
      } else {
        Alert.alert('Error', 'No harvest plan received. Please try again.');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      Alert.alert('Error', error.message || 'Failed to generate harvest plan. Please check your API configuration in Settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.featureContainer} contentContainerStyle={styles.featureContentPadding}>
      <View style={styles.inputSection}>
        <Text style={styles.label}>Current Plantings:</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={6}
          placeholder="E.g., Tomatoes planted 4/15, Lettuce 5/1, Carrots 5/10..."
          placeholderTextColor={colors.textSecondary}
          value={plantingData}
          onChangeText={setPlantingData}
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.label}>Goals (Optional):</Text>
        <TextInput
          style={commonStyles.input}
          placeholder="E.g., Maximize revenue, Continuous supply..."
          placeholderTextColor={colors.textSecondary}
          value={goals}
          onChangeText={setGoals}
        />
      </View>

      <TouchableOpacity
        style={[commonStyles.button, loading && styles.buttonDisabled]}
        onPress={generateHarvestPlan}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.card} />
        ) : (
          <Text style={commonStyles.buttonText}>Generate Harvest Plan</Text>
        )}
      </TouchableOpacity>

      {harvestPlan && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <IconSymbol
              ios_icon_name="calendar.badge.checkmark"
              android_material_icon_name="event-available"
              size={24}
              color={colors.success}
            />
            <Text style={styles.resultTitle}>Harvest Schedule</Text>
          </View>
          <Text style={styles.resultText}>{harvestPlan}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 48 : 16,
    paddingBottom: 100,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  mainSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
    borderLeftWidth: 4,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 48 : 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  featureContainer: {
    flex: 1,
  },
  featureContentPadding: {
    padding: 16,
    paddingBottom: 100,
  },
  methodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    gap: 8,
  },
  methodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  methodButtonTextActive: {
    color: colors.card,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  imagePreview: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  resultText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
  },
  chatContainer: {
    flex: 1,
  },
  chatMessages: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyChatText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyChatSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  chatMessage: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatMessageText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.card,
  },
  loadingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  chatInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
    gap: 12,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    padding: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
