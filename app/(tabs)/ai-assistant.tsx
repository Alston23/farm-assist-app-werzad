
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

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
}

const quickActions: QuickAction[] = [
  {
    id: 'crop-recommendation',
    icon: '🌱',
    title: 'Crop Recommendations',
    prompt: 'Based on my farm location and current season, what crops would you recommend I plant?',
  },
  {
    id: 'problem-diagnosis',
    icon: '🔍',
    title: 'Problem Diagnosis',
    prompt: 'I need help diagnosing a problem with my crops. Can you help me identify what might be wrong?',
  },
  {
    id: 'image-identification',
    icon: '📸',
    title: 'Identify Plant Issue',
    prompt: 'Please analyze this image and help me identify any weeds, pest damage, or plant diseases.',
    requiresImage: true,
  },
  {
    id: 'growing-tips',
    icon: '💡',
    title: 'Growing Tips',
    prompt: 'What are some best practices and tips for successful crop cultivation on a small farm?',
  },
  {
    id: 'weather-insights',
    icon: '🌤️',
    title: 'Weather Insights',
    prompt: 'How should I adjust my farming practices based on current weather conditions?',
  },
  {
    id: 'personalized-advice',
    icon: '👨‍🌾',
    title: 'Personalized Advice',
    prompt: 'Can you provide personalized advice for my farm based on my current crops and fields?',
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

  useEffect(() => {
    loadConversationHistory();
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

  const sendMessage = async (text: string, imageUri?: string) => {
    if ((!text.trim() && !imageUri) || loading) return;

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

  const handleQuickAction = (action: QuickAction) => {
    if (action.requiresImage) {
      showImagePickerOptions();
      setInputText(action.prompt);
    } else {
      sendMessage(action.prompt);
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

  const handleBack = () => {
    console.log('AI Assistant: Back button pressed, navigating to crops');
    router.push('/(tabs)/crops');
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
              console.log('AI Assistant: Calling signOut');
              await signOut();
              console.log('AI Assistant: Sign out completed, redirecting to auth');
              router.replace('/auth');
            } catch (error: any) {
              console.error('AI Assistant: Sign out failed:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🤖 AI Assistant</Text>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
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
            {messages.length === 0 && showQuickActions && (
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeTitle}>Welcome to Your AI Farm Assistant! 👋</Text>
                <Text style={styles.welcomeText}>
                  I&apos;m here to help you with crop recommendations, problem diagnosis, growing tips, and personalized farming advice. You can also upload images to identify weeds, pests, or diseases!
                </Text>
                <Text style={styles.welcomeSubtext}>Choose a quick action below or ask me anything:</Text>

                <View style={styles.quickActionsGrid}>
                  {quickActions.map((action) => (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.quickActionCard}
                      onPress={() => handleQuickAction(action)}
                    >
                      <Text style={styles.quickActionIcon}>{action.icon}</Text>
                      <Text style={styles.quickActionTitle}>{action.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {messages.map((message) => (
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

            {loading && (
              <View style={[styles.messageContainer, styles.assistantMessage]}>
                <View style={[styles.messageBubble, styles.assistantBubble]}>
                  <ActivityIndicator color="#2D5016" />
                  <Text style={styles.loadingText}>Analyzing...</Text>
                </View>
              </View>
            )}

            {messages.length > 0 && !showQuickActions && (
              <TouchableOpacity style={styles.clearButton} onPress={clearConversation}>
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
  backButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#2D5016',
    fontWeight: '600',
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  signOutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
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
