
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import PremiumGuard from '../../components/PremiumGuard';
import ProUpsellBanner from '../../components/ProUpsellBanner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: Date;
}

function AIProblemDiagnosisContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const router = useRouter();

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

  const saveMessage = async (role: 'user' | 'assistant', content: string, imageUrl?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('ai_conversations').insert({
        user_id: user.id,
        role,
        content,
        image_url: imageUrl || null,
        conversation_type: 'problem_diagnosis',
      });

      if (error) {
        console.error('Error saving message:', error);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const sendMessage = async (text: string, imageUri?: string) => {
    if ((!text.trim() && !imageUri) || loading) return;

    setShowWelcome(false);

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
      content: text.trim() || 'Please analyze this image and help me identify any plant issues, weeds, pests, or diseases.',
      imageUrl: imageUrl || undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setSelectedImageUri(null);
    setLoading(true);

    await saveMessage('user', text.trim() || 'Please analyze this image.', imageUrl || undefined);

    try {
      const context = await getUserContext();

      const payload = {
        message: text.trim() || 'Please analyze this image and help me identify any plant issues, weeds, pests, or diseases.',
        conversationHistory: messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
          imageUrl: m.imageUrl,
        })),
        userContext: context,
        imageUrl: imageUrl,
      };

      console.log('AI Assistant: submitting issue payload', payload);

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: payload,
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

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleBackToAssistant = () => {
    router.replace('/(tabs)/ai-assistant');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0b4f25' }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 12
      }}>
        <TouchableOpacity onPress={handleBackToAssistant}>
          <Text style={{ color: 'white', fontSize: 16 }}>Back</Text>
        </TouchableOpacity>

        <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
          Identify Plant Issues
        </Text>

        <View style={{ width: 50 }} />
      </View>

      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <ProUpsellBanner message="Want advanced image analysis with treatment recommendations? Unlock Farm Copilot Pro." />
          
          {showWelcome && messages.length === 0 && (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>Identify Plant Problems 🔍</Text>
              <Text style={styles.welcomeText}>
                I can help you diagnose issues with your crops including diseases, pests, nutrient deficiencies, and more. Upload a photo or describe the problem!
              </Text>
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={() => {
                  Alert.alert('TEST', 'AI Assistant button pressed');
                }}
              >
                <Text style={styles.uploadButtonIcon}>📷</Text>
                <Text style={styles.uploadButtonText}>Upload Photo for Analysis</Text>
              </TouchableOpacity>
              <Text style={styles.orText}>or ask about:</Text>
              <View style={styles.quickQuestionsContainer}>
                <TouchableOpacity 
                  style={styles.quickQuestionButton}
                  onPress={() => handleQuickQuestion('My tomato leaves are turning yellow. What could be causing this?')}
                >
                  <Text style={styles.quickQuestionText}>🍅 Yellowing Leaves</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickQuestionButton}
                  onPress={() => handleQuickQuestion('I see small holes in my plant leaves. What pest might be causing this?')}
                >
                  <Text style={styles.quickQuestionText}>🐛 Leaf Damage</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickQuestionButton}
                  onPress={() => handleQuickQuestion('My plants are wilting even though I water them regularly. What\'s wrong?')}
                >
                  <Text style={styles.quickQuestionText}>💧 Wilting Plants</Text>
                </TouchableOpacity>
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
                <Text style={styles.loadingText}>Analyzing plant issue...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          {selectedImageUri && (
            <View style={styles.selectedImageContainer}>
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.selectedImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImageUri(null)}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={() => {
                Alert.alert('TEST', 'AI Assistant button pressed');
              }}
              disabled={loading || uploadingImage}
            >
              <Text style={styles.imageButtonText}>📷</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Describe the problem or upload a photo..."
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
                ((!inputText.trim() && !selectedImageUri) || loading || uploadingImage) && styles.sendButtonDisabled
              ]}
              onPress={() => sendMessage(inputText, selectedImageUri || undefined)}
              disabled={(!inputText.trim() && !selectedImageUri) || loading || uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.sendButtonText}>➤</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

export default function AIProblemDiagnosisScreen() {
  return (
    <PremiumGuard>
      <AIProblemDiagnosisContent />
    </PremiumGuard>
  );
}

const styles = StyleSheet.create({
  gradient: {
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
  },
  welcomeTitle: {
    fontSize: 22,
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
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#4A7C2C',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadButtonIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  orText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A7C2C',
    marginBottom: 12,
    textAlign: 'center',
  },
  quickQuestionsContainer: {
    gap: 10,
  },
  quickQuestionButton: {
    backgroundColor: '#F0F8F0',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#4A7C2C',
  },
  quickQuestionText: {
    fontSize: 14,
    color: '#2D5016',
    fontWeight: '500',
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
