
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { useProStatus } from '../../hooks/useProStatus';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: Date;
}

interface QuickAction {
  id: string;
  icon: string;
  title: string;
  prompt: string;
  requiresImage?: boolean;
  isPremium?: boolean;
}

const quickActions: QuickAction[] = [
  {
    id: 'crop-recommendation',
    icon: '🌱',
    title: 'Crop Recommendations',
    prompt: 'Based on my farm location and current season, what crops would you recommend I plant?',
    isPremium: true,
  },
  {
    id: 'identify-plant-issues',
    icon: '🔍',
    title: 'Identify Plant Issues',
    prompt: 'I need help diagnosing a problem with my crops. Can you help me identify what might be wrong?',
    isPremium: true,
  },
  {
    id: 'weather-insights',
    icon: '🌤️',
    title: 'Weather Insights',
    prompt: 'Show me the weather forecast and suggest tasks I should complete based on upcoming conditions.',
    isPremium: true,
  },
  {
    id: 'personalized-advice',
    icon: '👨‍🌾',
    title: 'Personalized Advice',
    prompt: 'Can you provide personalized advice for my farm based on my current crops and fields?',
    isPremium: true,
  },
];

export default function AIAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { signOut } = useAuth();
  const router = useRouter();
  const { isPro, loading: proLoading } = useProStatus();

  // Reset to Quick Actions page whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('AI Assistant: Screen focused, resetting to Quick Actions');
      setShowQuickActions(true);
      setMessages([]);
      setInputText('');
      setSelectedImage(null);
      setLoading(false);
      return () => {
        console.log('AI Assistant: Screen unfocused');
      };
    }, [])
  );

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      console.log('Camera or media library permissions not granted');
    }
  };

  const loadConversationHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error loading conversation history:', error);
        return;
      }

      if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          imageUrl: msg.image_url,
          timestamp: new Date(msg.created_at),
        }));
        setMessages(loadedMessages);
        setShowQuickActions(false);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string, imageUrl?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('ai_conversations').insert({
        user_id: user.id,
        role,
        content,
        image_url: imageUrl || null,
      });

      if (error) {
        console.error('Error saving message:', error);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      let result;
      
      if (useCamera) {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose an option to add an image',
      [
        {
          text: 'Take Photo',
          onPress: () => pickImage(true),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => pickImage(false),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const uploadImageToSupabase = async (imageUri: string): Promise<string | null> => {
    try {
      setUploadingImage(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `ai-assistant-images/${fileName}`;

      const { data, error } = await supabase.storage
        .from('farm-images')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (error) {
        console.error('Error uploading image:', error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('farm-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const getUserContext = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const [cropsResult, fieldsResult, plantingsResult] = await Promise.all([
        supabase.from('crops').select('name, category').eq('user_id', user.id).limit(10),
        supabase.from('fields_beds').select('name, type, area_value, area_unit, soil_type, irrigation_type').eq('user_id', user.id).limit(10),
        supabase.from('plantings').select('crop_name, planting_date, harvest_date').eq('user_id', user.id).order('planting_date', { ascending: false }).limit(10),
      ]);

      return {
        crops: cropsResult.data || [],
        fields: fieldsResult.data || [],
        plantings: plantingsResult.data || [],
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return null;
    }
  };

  const isAdvancedQuery = (text: string): boolean => {
    // Check if the query is asking for advanced features
    const advancedKeywords = [
      'recommend crop',
      'crop recommendation',
      'yield optimization',
      'optimize yield',
      'planting plan',
      'fertilizer plan',
      'revenue',
      'profit',
      'market price',
      'sales forecast',
      'personalized',
      'my farm data',
      'my fields',
      'my crops',
      'rotation plan',
    ];

    const lowerText = text.toLowerCase();
    return advancedKeywords.some(keyword => lowerText.includes(keyword));
  };

  const sendMessage = async (text: string, imageUri?: string) => {
    if ((!text.trim() && !imageUri) || loading) return;

    // Check if this is an advanced query and user is not Pro
    if (!isPro && isAdvancedQuery(text)) {
      console.log('AI Assistant: Advanced query detected, user is not Pro, showing paywall');
      Alert.alert(
        'Upgrade to Farm Copilot Pro',
        'This advanced feature requires a Pro subscription. Upgrade now to get personalized recommendations based on your farm data!',
        [
          {
            text: 'Maybe Later',
            style: 'cancel',
          },
          {
            text: 'Upgrade Now',
            onPress: () => {
              router.push('/paywall');
            },
          },
        ]
      );
      return;
    }

    let imageUrl: string | null = null;

    if (imageUri) {
      imageUrl = await uploadImageToSupabase(imageUri);
      if (!imageUrl) {
        Alert.alert('Error', 'Failed to upload image. Please try again.');
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim() || 'Please analyze this image.',
      imageUrl: imageUrl || undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setSelectedImage(null);
    setLoading(true);
    setShowQuickActions(false);

    await saveMessage('user', text.trim() || 'Please analyze this image.', imageUrl || undefined);

    try {
      const context = await getUserContext();

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: text.trim() || 'Please analyze this image and help me identify any weeds, pest damage, or plant diseases.',
          conversationHistory: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
            imageUrl: m.imageUrl,
          })),
          userContext: context,
          imageUrl: imageUrl,
          isPro: isPro, // Pass Pro status to the AI function
        },
      });

      if (error) {
        throw error;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      await saveMessage('assistant', data.response);
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to get response from AI assistant. Please try again.');

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePress = () => {
    router.push('/paywall');
  };

  const buildQuickActionPrompt = async (type: 'crop' | 'diagnosis' | 'weather' | 'advice'): Promise<string> => {
    const context = await getUserContext();
    
    switch (type) {
      case 'crop':
        // Advanced crop planning prompt using the user's farm data
        let cropPrompt = 'Based on my farm data, please provide advanced crop recommendations:\n\n';
        
        if (context?.fields && context.fields.length > 0) {
          cropPrompt += 'My Fields:\n';
          context.fields.forEach((field: any) => {
            cropPrompt += `- ${field.name}: ${field.area_value} ${field.area_unit}, ${field.soil_type} soil, ${field.irrigation_type} irrigation\n`;
          });
          cropPrompt += '\n';
        }
        
        if (context?.plantings && context.plantings.length > 0) {
          cropPrompt += 'Current/Recent Plantings:\n';
          context.plantings.forEach((planting: any) => {
            cropPrompt += `- ${planting.crop_name}: planted ${planting.planting_date}, harvest ${planting.harvest_date}\n`;
          });
          cropPrompt += '\n';
        }
        
        cropPrompt += 'Please recommend:\n';
        cropPrompt += '1. What crops I should plant next based on my soil types and irrigation\n';
        cropPrompt += '2. Optimal planting schedule for the upcoming season\n';
        cropPrompt += '3. Crop rotation suggestions to maintain soil health\n';
        cropPrompt += '4. Expected yields and space optimization tips';
        
        return cropPrompt;
        
      case 'diagnosis':
        // Plant-problem diagnosis prompt
        let diagnosisPrompt = 'I need help diagnosing potential issues with my crops.\n\n';
        
        if (selectedImage) {
          diagnosisPrompt += 'I have attached an image of the plant showing the problem. ';
        }
        
        if (context?.plantings && context.plantings.length > 0) {
          diagnosisPrompt += 'My current crops include:\n';
          context.plantings.forEach((planting: any) => {
            diagnosisPrompt += `- ${planting.crop_name}\n`;
          });
          diagnosisPrompt += '\n';
        }
        
        diagnosisPrompt += 'Please help me:\n';
        diagnosisPrompt += '1. Identify any visible pests, diseases, or nutrient deficiencies\n';
        diagnosisPrompt += '2. Suggest immediate treatment options\n';
        diagnosisPrompt += '3. Recommend preventive measures for the future\n';
        diagnosisPrompt += '4. Advise on whether this issue might affect other crops';
        
        return diagnosisPrompt;
        
      case 'weather':
        // Weather risk + irrigation/planting adjustment prompt
        let weatherPrompt = 'Please provide weather-based farming insights for my operation:\n\n';
        
        if (context?.fields && context.fields.length > 0) {
          weatherPrompt += 'My irrigation systems:\n';
          const irrigationTypes = new Set(context.fields.map((f: any) => f.irrigation_type));
          irrigationTypes.forEach((type: any) => {
            weatherPrompt += `- ${type}\n`;
          });
          weatherPrompt += '\n';
        }
        
        if (context?.plantings && context.plantings.length > 0) {
          weatherPrompt += 'Current crops:\n';
          context.plantings.forEach((planting: any) => {
            weatherPrompt += `- ${planting.crop_name}\n`;
          });
          weatherPrompt += '\n';
        }
        
        weatherPrompt += 'Please advise on:\n';
        weatherPrompt += '1. Weather risks I should prepare for this week\n';
        weatherPrompt += '2. Irrigation adjustments based on forecasted conditions\n';
        weatherPrompt += '3. Optimal timing for planting or harvesting activities\n';
        weatherPrompt += '4. Protective measures I should take for my crops';
        
        return weatherPrompt;
        
      case 'advice':
        // Top 3-5 priorities for the farm this week
        let advicePrompt = 'Based on my complete farm data, what are the top 3-5 priorities I should focus on this week?\n\n';
        
        if (context?.fields && context.fields.length > 0) {
          advicePrompt += 'My Fields:\n';
          context.fields.forEach((field: any) => {
            advicePrompt += `- ${field.name}: ${field.area_value} ${field.area_unit}\n`;
          });
          advicePrompt += '\n';
        }
        
        if (context?.plantings && context.plantings.length > 0) {
          advicePrompt += 'Current Plantings:\n';
          context.plantings.forEach((planting: any) => {
            const daysUntilHarvest = Math.ceil((new Date(planting.harvest_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            advicePrompt += `- ${planting.crop_name}: ${daysUntilHarvest > 0 ? `${daysUntilHarvest} days until harvest` : 'ready to harvest'}\n`;
          });
          advicePrompt += '\n';
        }
        
        advicePrompt += 'Please provide:\n';
        advicePrompt += '1. Urgent tasks that need immediate attention\n';
        advicePrompt += '2. Maintenance activities I should schedule\n';
        advicePrompt += '3. Opportunities to optimize yields or revenue\n';
        advicePrompt += '4. Preparation tasks for upcoming planting or harvest\n';
        advicePrompt += '5. Any seasonal considerations specific to my crops';
        
        return advicePrompt;
        
      default:
        return 'How can I help you with your farm today?';
    }
  };

  const handleQuickAction = async (type: 'crop' | 'diagnosis' | 'weather' | 'advice') => {
    console.log('AI Assistant: Quick action pressed:', type);
    
    // Check if user is Pro
    if (!isPro) {
      console.log('AI Assistant: User is not Pro, showing paywall');
      handleUpgradePress();
      return;
    }
    
    // User is Pro - build and send the appropriate prompt
    console.log('AI Assistant: User is Pro, building prompt for:', type);
    
    try {
      const prompt = await buildQuickActionPrompt(type);
      console.log('AI Assistant: Sending quick action prompt');
      
      // For diagnosis, if there's a selected image, include it
      if (type === 'diagnosis' && selectedImage) {
        await sendMessage(prompt, selectedImage);
      } else {
        await sendMessage(prompt);
      }
    } catch (error) {
      console.error('AI Assistant: Error handling quick action:', error);
      Alert.alert('Error', 'Failed to process your request. Please try again.');
    }
  };

  const clearConversation = async () => {
    Alert.alert(
      'Clear Conversation',
      'Are you sure you want to clear the conversation history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              await supabase.from('ai_conversations').delete().eq('user_id', user.id);
              setMessages([]);
              setShowQuickActions(true);
              console.log('AI Assistant: Conversation cleared, returned to quick actions');
            } catch (error) {
              console.error('Error clearing conversation:', error);
              Alert.alert('Error', 'Failed to clear conversation');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    console.log('AI Assistant: Sign out button pressed');
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('AI Assistant: User confirmed sign out, calling signOut');
              await signOut();
              console.log('AI Assistant: Sign out completed successfully');
              // Navigation will be handled automatically by _layout.tsx
            } catch (error: any) {
              console.error('AI Assistant: Sign out error:', error);
              // The local state is already cleared in AuthContext
              // Just show a notice to the user
              Alert.alert('Signed Out', 'You have been signed out successfully.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>🤖 AI Assistant</Text>
        <View style={styles.headerRight}>
          {!proLoading && !isPro && (
            <TouchableOpacity 
              style={styles.upgradeButton} 
              onPress={handleUpgradePress}
              activeOpacity={0.7}
            >
              <Text style={styles.upgradeButtonText}>⭐ Upgrade</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.7}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {showQuickActions && (
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeTitle}>Welcome to Your AI Farm Assistant! 👋</Text>
                <Text style={styles.welcomeText}>
                  I&apos;m here to help you with crop recommendations, plant issue diagnosis, weather insights, and personalized farming advice. You can also upload images to identify weeds, pests, or diseases!
                </Text>
                {!isPro && (
                  <View style={styles.freeUserNotice}>
                    <Text style={styles.freeUserNoticeText}>
                      🆓 Free users can ask basic questions. Upgrade to Pro for advanced recommendations based on your farm data!
                    </Text>
                  </View>
                )}
                {isPro && (
                  <View style={styles.proUserNotice}>
                    <Text style={styles.proUserNoticeText}>
                      ⭐ Pro Active! Tap any tile below for instant personalized insights based on your farm data.
                    </Text>
                  </View>
                )}
                <Text style={styles.welcomeSubtext}>Choose a quick action below or ask me anything:</Text>

                <View style={styles.quickActionsGrid}>
                  {quickActions.map((action) => (
                    <TouchableOpacity
                      key={action.id}
                      style={[
                        styles.quickActionCard,
                        action.isPremium && styles.premiumActionCard,
                      ]}
                      onPress={() => {
                        if (action.id === 'crop-recommendation') {
                          handleQuickAction('crop');
                        } else if (action.id === 'identify-plant-issues') {
                          handleQuickAction('diagnosis');
                        } else if (action.id === 'weather-insights') {
                          handleQuickAction('weather');
                        } else if (action.id === 'personalized-advice') {
                          handleQuickAction('advice');
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      {action.isPremium && !isPro && (
                        <View style={styles.premiumBadge}>
                          <Text style={styles.premiumBadgeText}>PRO</Text>
                        </View>
                      )}
                      <Text style={styles.quickActionIcon}>{action.icon}</Text>
                      <Text style={styles.quickActionTitle}>{action.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {!showQuickActions && messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageContainer,
                  message.role === 'user' ? styles.userMessage : styles.assistantMessage,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  {message.imageUrl && (
                    <Image
                      source={{ uri: message.imageUrl }}
                      style={styles.messageImage}
                      resizeMode="cover"
                    />
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      message.role === 'user' ? styles.userText : styles.assistantText,
                    ]}
                  >
                    {message.content}
                  </Text>
                </View>
              </View>
            ))}

            {!showQuickActions && loading && (
              <View style={[styles.messageContainer, styles.assistantMessage]}>
                <View style={[styles.messageBubble, styles.assistantBubble]}>
                  <ActivityIndicator color="#2D5016" />
                  <Text style={styles.loadingText}>Analyzing...</Text>
                </View>
              </View>
            )}

            {!showQuickActions && messages.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={clearConversation} activeOpacity={0.7}>
                <Text style={styles.clearButtonText}>🗑️ Clear Conversation</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            {selectedImage && (
              <View style={styles.selectedImageContainer}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.selectedImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.inputRow}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={showImagePickerOptions}
                disabled={loading || uploadingImage}
                activeOpacity={0.7}
              >
                <Text style={styles.imageButtonText}>📷</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Ask me anything about farming..."
                placeholderTextColor="#999"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                editable={!loading && !uploadingImage}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  ((!inputText.trim() && !selectedImage) || loading || uploadingImage) && styles.sendButtonDisabled
                ]}
                onPress={() => sendMessage(inputText, selectedImage || undefined)}
                disabled={(!inputText.trim() && !selectedImage) || loading || uploadingImage}
                activeOpacity={0.7}
              >
                {uploadingImage ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.sendButtonText}>➤</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D5016',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingBottom: 16,
    backgroundColor: '#2D5016',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  upgradeButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#2D5016',
    fontWeight: 'bold',
    fontSize: 14,
  },
  signOutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 20,
  },
  welcomeContainer: {
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
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  freeUserNotice: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  freeUserNoticeText: {
    fontSize: 14,
    color: '#2D5016',
    textAlign: 'center',
    lineHeight: 20,
  },
  proUserNotice: {
    backgroundColor: '#E6F7E6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4A7C2C',
  },
  proUserNoticeText: {
    fontSize: 14,
    color: '#2D5016',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  quickActionCard: {
    backgroundColor: '#F0F8F0',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A7C2C',
    position: 'relative',
  },
  premiumActionCard: {
    borderColor: '#FFD700',
    backgroundColor: '#FFFEF0',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D5016',
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#4A7C2C',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomLeftRadius: 4,
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#333',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  clearButton: {
    backgroundColor: 'rgba(255, 82, 82, 0.9)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    padding: 16,
    paddingBottom: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  selectedImageContainer: {
    position: 'relative',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  selectedImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF5252',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  imageButton: {
    backgroundColor: '#F5F5F5',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButtonText: {
    fontSize: 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#4A7C2C',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
