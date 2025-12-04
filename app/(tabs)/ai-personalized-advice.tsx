
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIPersonalizedAdviceScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const router = useRouter();

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

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('ai_conversations').insert({
        user_id: user.id,
        role,
        content,
        conversation_type: 'personalized_advice',
      });

      if (error) {
        console.error('Error saving message:', error);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    setShowWelcome(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    await saveMessage('user', text.trim());

    try {
      const context = await getUserContext();

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: text.trim(),
          conversationHistory: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userContext: context,
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

  const handleBack = () => {
    console.log('Personalized Advice: Back button pressed');
    router.push('/(tabs)/ai-assistant');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👨‍🌾 Personalized Advice</Text>
        <View style={styles.placeholder} />
      </View>
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {showWelcome && messages.length === 0 && (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>Get Personalized Farming Advice 🌾</Text>
              <Text style={styles.welcomeText}>
                I can provide customized recommendations based on your specific farm setup, crops, and growing conditions. Ask me anything!
              </Text>
              <Text style={styles.welcomeSubtext}>Try asking about:</Text>
              <View style={styles.quickQuestionsContainer}>
                <TouchableOpacity 
                  style={styles.quickQuestionButton}
                  onPress={() => handleQuickQuestion('Can you provide personalized advice for my farm based on my current crops and fields?')}
                >
                  <Text style={styles.quickQuestionText}>📊 Overall Farm Analysis</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickQuestionButton}
                  onPress={() => handleQuickQuestion('What crops should I rotate next season based on what I\'m currently growing?')}
                >
                  <Text style={styles.quickQuestionText}>🔄 Crop Rotation Plan</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickQuestionButton}
                  onPress={() => handleQuickQuestion('How can I improve my soil health and fertility?')}
                >
                  <Text style={styles.quickQuestionText}>🌱 Soil Improvement</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickQuestionButton}
                  onPress={() => handleQuickQuestion('What are the best irrigation practices for my farm setup?')}
                >
                  <Text style={styles.quickQuestionText}>💧 Irrigation Tips</Text>
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
                <Text style={styles.loadingText}>Analyzing your farm data...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Ask for personalized farming advice..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!loading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || loading) && styles.sendButtonDisabled
              ]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || loading}
            >
              <Text style={styles.sendButtonText}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  placeholder: {
    width: 80,
  },
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
    marginBottom: 16,
  },
  welcomeSubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A7C2C',
    marginBottom: 12,
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
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
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
