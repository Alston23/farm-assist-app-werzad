
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Location from 'expo-location';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface WeatherDay {
  date: string;
  dayName: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
  precipitation: number;
}

export default function AIWeatherInsightsScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [weatherForecast, setWeatherForecast] = useState<WeatherDay[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    requestLocationAndFetchWeather();
  }, []);

  const requestLocationAndFetchWeather = async () => {
    try {
      console.log('Weather Insights: Requesting location permissions');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Weather Insights: Location permission denied');
        setLocationError('Location permission denied. Please enable location access to get weather forecasts.');
        setLocationLoading(false);
        
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I need access to your location to provide accurate weather forecasts and farming recommendations. Please enable location permissions in your device settings and try again.',
          timestamp: new Date(),
        };
        setMessages([errorMessage]);
        return;
      }

      console.log('Weather Insights: Getting current location');
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setLocation(currentLocation);
      console.log('Weather Insights: Location obtained:', currentLocation.coords.latitude, currentLocation.coords.longitude);

      await fetchWeatherForecast(currentLocation.coords.latitude, currentLocation.coords.longitude);
      
      setLocationLoading(false);
    } catch (error) {
      console.error('Weather Insights: Error getting location:', error);
      setLocationError('Failed to get your location. Please try again.');
      setLocationLoading(false);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I encountered an error getting your location. Please make sure location services are enabled on your device and try again.',
        timestamp: new Date(),
      };
      setMessages([errorMessage]);
    }
  };

  const fetchWeatherForecast = async (latitude: number, longitude: number) => {
    try {
      console.log('Weather Insights: Fetching weather forecast for:', latitude, longitude);
      
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&temperature_unit=fahrenheit&timezone=auto&forecast_days=5`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      console.log('Weather Insights: Weather data received');

      const forecast: WeatherDay[] = data.daily.time.map((date: string, index: number) => {
        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const weatherCode = data.daily.weathercode[index];
        
        return {
          date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dayName,
          high: Math.round(data.daily.temperature_2m_max[index]),
          low: Math.round(data.daily.temperature_2m_min[index]),
          condition: getWeatherCondition(weatherCode),
          icon: getWeatherIcon(weatherCode),
          precipitation: Math.round(data.daily.precipitation_sum[index] * 10) / 10,
        };
      });

      setWeatherForecast(forecast);

      const initialPrompt = `Based on the 5-day weather forecast for your location, here's what you should know:

${forecast.map((day, index) => 
  `${index === 0 ? 'Today' : day.dayName}: ${day.condition}, High: ${day.high}°F, Low: ${day.low}°F${day.precipitation > 0 ? `, Rain: ${day.precipitation}"` : ''}`
).join('\n')}

Now, let me provide you with specific farming tasks and recommendations based on this forecast. What can I help you with regarding your crops and the upcoming weather?`;

      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: initialPrompt,
        timestamp: new Date(),
      };
      
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Weather Insights: Error fetching weather:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I encountered an error fetching the weather forecast. Please try again later.',
        timestamp: new Date(),
      };
      setMessages([errorMessage]);
    }
  };

  const getWeatherCondition = (code: number): string => {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 57) return 'Drizzle';
    if (code <= 67) return 'Rain';
    if (code <= 77) return 'Snow';
    if (code <= 82) return 'Rain Showers';
    if (code <= 86) return 'Snow Showers';
    if (code <= 99) return 'Thunderstorm';
    return 'Unknown';
  };

  const getWeatherIcon = (code: number): string => {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 57) return '🌦️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    if (code <= 82) return '🌧️';
    if (code <= 86) return '🌨️';
    if (code <= 99) return '⛈️';
    return '🌤️';
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

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('ai_conversations').insert({
        user_id: user.id,
        role,
        content,
        conversation_type: 'weather_insights',
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

      let weatherContext = '';
      if (weatherForecast.length > 0) {
        weatherContext = `\n\nCurrent 5-day weather forecast:\n${weatherForecast.map((day, index) => 
          `${index === 0 ? 'Today' : day.dayName}: ${day.condition}, High: ${day.high}°F, Low: ${day.low}°F${day.precipitation > 0 ? `, Rain: ${day.precipitation}"` : ''}`
        ).join('\n')}`;
      }

      const enhancedMessage = `${text.trim()}${weatherContext}\n\nPlease provide specific farming task recommendations based on this weather forecast.`;

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: enhancedMessage,
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

  const handleBack = () => {
    console.log('Weather Insights: Back button pressed');
    router.push('/(tabs)/ai-assistant');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🌤️ Weather Insights</Text>
        <View style={styles.placeholder} />
      </View>
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {locationLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Getting your location and weather forecast...</Text>
            </View>
          ) : locationError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>📍</Text>
              <Text style={styles.errorText}>{locationError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={requestLocationAndFetchWeather}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {weatherForecast.length > 0 && (
                <View style={styles.forecastContainer}>
                  <Text style={styles.forecastTitle}>5-Day Forecast</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
                    {weatherForecast.map((day, index) => (
                      <View key={index} style={styles.forecastCard}>
                        <Text style={styles.forecastDay}>{index === 0 ? 'Today' : day.dayName}</Text>
                        <Text style={styles.forecastDate}>{day.date}</Text>
                        <Text style={styles.forecastIcon}>{day.icon}</Text>
                        <Text style={styles.forecastCondition}>{day.condition}</Text>
                        <Text style={styles.forecastTemp}>{day.high}°</Text>
                        <Text style={styles.forecastTempLow}>{day.low}°</Text>
                        {day.precipitation > 0 && (
                          <Text style={styles.forecastPrecip}>💧 {day.precipitation}"</Text>
                        )}
                      </View>
                    ))}
                  </ScrollView>
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
                    <Text style={styles.loadingMessageText}>Analyzing weather and generating recommendations...</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {!locationLoading && !locationError && (
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Ask about specific weather concerns..."
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
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#4A7C2C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  forecastContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  forecastTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 12,
  },
  forecastScroll: {
    marginHorizontal: -8,
  },
  forecastCard: {
    backgroundColor: '#F0F8F0',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 6,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A7C2C',
  },
  forecastDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D5016',
    marginBottom: 2,
  },
  forecastDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  forecastIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  forecastCondition: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  forecastTemp: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  forecastTempLow: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  forecastPrecip: {
    fontSize: 11,
    color: '#4A7C2C',
    marginTop: 4,
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
  loadingMessageText: {
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
