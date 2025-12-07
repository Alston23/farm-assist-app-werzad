
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { useProStatus } from '../../hooks/useProStatus';
import * as ImagePicker from 'expo-image-picker';

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

// Mapping for quick action prompts as specified in the requirements
const AI_PROMPT_MAP: Record<string, string> = {
  'crop-recommendation': "Use my farm's data to recommend what crops I should plant next.",
  'identify-plant-issues': "Help me diagnose plant problems.",
  'weather-insights': "Give me weather insights for my farm this week.",
  'personalized-advice': "Give me personalized farm advice.",
};

export default function AIAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const router = useRouter();
  const { signOut } = useAuth();
  const { isPro, loading: proLoading } = useProStatus();

  const handleSignOut = async () => {
    try {
      await signOut();
      // After sign out, send the user back to the auth flow
      router.replace('/auth');
    } catch (error) {
      console.error('Error signing out from AI Assistant screen:', error);
    }
  };

  // Reset to Quick Actions page whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setShowQuickActions(true);
      setMessages([]);
      setInputText('');
      setSelectedImage(null);
      setLoading(false);
      return () => {
        // Cleanup on unfocus
      };
    }, [])
  );

  useEffect(() => {
    if (messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

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

  // Shared helper for camera permissions
  const ensureCameraPermission = async () => {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    if (status === 'granted') return true;

    const { status: newStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (newStatus !== 'granted') {
      Alert.alert(
        'Camera permission needed',
        'Please enable camera access in your settings to take photos.'
      );
      return false;
    }
    return true;
  };

  // Shared helper for taking photos
  const handleTakePhoto = async (onImagePicked: (uri: string) => void) => {
    console.log('Camera: take photo pressed');
    console.log('AI Assistant: camera button pressed');

    if (Platform.OS === 'web') {
      Alert.alert('Camera not supported', 'On web, please use the upload button instead.');
      return;
    }

    const ok = await ensureCameraPermission();
    if (!ok) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) {
      console.log('Camera: user cancelled');
      return;
    }

    const uri = result.assets?.[0]?.uri;
    console.log('Camera: got image uri', uri);
    if (uri) onImagePicked(uri);
  };

  // Handler for image selection (used by both camera and gallery)
  const handleImageSelected = (uri: string) => {
    setSelectedImage(uri);
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Upload Photo',
      'Choose how to add a photo',
      [
        {
          text: 'Take Photo',
          onPress: () => handleTakePhoto(handleImageSelected),
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            console.log('Library button pressed');

            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Photo library permission required');
              return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              quality: 0.8,
            });

            if (!result.canceled && result.assets?.[0]?.uri) {
              const uri = result.assets[0].uri;
              console.log('Library image selected', uri);
              handleImageSelected(uri);
            }
          },
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
      console.log('Image upload: started with uri', imageUri);
      
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

      console.log('Image upload: finished');
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

      console.log('Sending message to AI assistant...');
      console.log('Message:', text.trim() || 'Please analyze this image.');
      console.log('Has image:', !!imageUrl);
      console.log('Is Pro:', isPro);

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
          isPro: isPro,
        },
      });

      if (error) {
        console.error('Error from AI assistant edge function:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      if (!data || !data.response) {
        console.error('No response data from AI assistant');
        console.error('Full data object:', JSON.stringify(data, null, 2));
        throw new Error('No response received from AI assistant');
      }

      console.log('Successfully received AI response');
      console.log('Response length:', data.response.length);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      await saveMessage('assistant', data.response);
    } catch (error: any) {
      console.error('Error sending message to AI assistant:', error);
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      let errorMessage = 'I apologize, but I encountered an error processing your request. Please try again.';
      let shouldShowAlert = true;

      // Check for specific error types
      if (error?.message?.includes('AI service is not configured')) {
        errorMessage = 'The AI service is currently not configured. Please contact support.';
        Alert.alert('Configuration Error', 'The AI assistant is not properly configured. Please contact support for assistance.');
        shouldShowAlert = false;
      } else if (error?.message?.includes('Unauthorized')) {
        errorMessage = 'Authentication error. Please try signing out and back in.';
        Alert.alert('Authentication Error', 'There was an authentication issue. Please try signing out and back in.');
        shouldShowAlert = false;
      } else if (error?.message?.includes('AI service error')) {
        errorMessage = 'The AI service encountered an error. Please try again in a moment.';
      }

      if (shouldShowAlert) {
        Alert.alert(
          'Error', 
          'Failed to get response from AI assistant. Please check your internet connection and try again.'
        );
      }

      const errorMessageObj: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessageObj]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePress = () => {
    router.push('/paywall');
  };

  const handleQuickAction = (actionId: string) => {
    console.log('AI Assistant: Quick action pressed:', actionId);
    
    // Check if user is Pro
    if (!isPro) {
      console.log('AI Assistant: User is not Pro, navigating to paywall');
      handleUpgradePress();
      return;
    }
    
    // User is Pro - navigate to the appropriate screen
    console.log('AI Assistant: User is Pro, navigating to screen');
    
    switch (actionId) {
      case 'crop-recommendation':
        router.push('/(tabs)/ai-crop-recommendations');
        break;
      case 'identify-plant-issues':
        router.push('/(tabs)/ai-problem-diagnosis');
        break;
      case 'weather-insights':
        router.push('/(tabs)/ai-weather-insights');
        break;
      case 'personalized-advice':
        router.push('/(tabs)/ai-personalized-advice');
        break;
      default:
        console.error('AI Assistant: Unknown action:', actionId);
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
            } catch (error) {
              console.error('Error clearing conversation:', error);
              Alert.alert('Error', 'Failed to clear conversation');
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
          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: '#166534',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
              Sign Out
            </Text>
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
                      onPress={() => handleQuickAction(action.id)}
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
                ref={inputRef}
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
