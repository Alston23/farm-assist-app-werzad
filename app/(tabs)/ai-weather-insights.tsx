
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as Location from 'expo-location';
import { useLocation } from '../../contexts/LocationContext';
import PremiumGuard from '../../components/PremiumGuard';
import ProUpsellBanner from '../../components/ProUpsellBanner';

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
  minTempC: number;
  maxTempC: number;
  precipProb: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  task_type: string;
  due_date: string;
  completed: boolean;
  priority: string;
  planting_id: string;
  planting?: {
    crop_name: string;
    field_bed: {
      name: string;
    };
  };
}

interface SmartSuggestion {
  id: string;
  icon: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
}

function AIWeatherInsightsContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [weatherForecast, setWeatherForecast] = useState<WeatherDay[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const router = useRouter();

  const { hasLocationPermission, requestLocationPermission, loading: locationContextLoading } = useLocation();

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    // Check if we have location permission
    if (!hasLocationPermission && !locationContextLoading) {
      const granted = await requestLocationPermission();
      if (!granted) {
        setWeatherError('Location permission is required to show weather forecasts and smart suggestions.');
        return;
      }
    }

    // Get location and load data
    await loadLocationAndWeather();
    await loadTasks();
  };

  const loadLocationAndWeather = async () => {
    try {
      setWeatherLoading(true);
      setWeatherError(null);

      console.log('Weather Insights: Getting current location');
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation(currentLocation);
      console.log('Weather Insights: Location obtained:', currentLocation.coords.latitude, currentLocation.coords.longitude);

      await fetchWeatherForecast(currentLocation.coords.latitude, currentLocation.coords.longitude);
    } catch (error: any) {
      console.error('Weather Insights: Error getting location:', error);
      setWeatherError(error.message ?? 'Error loading weather');
    } finally {
      setWeatherLoading(false);
    }
  };

  const fetchWeatherForecast = async (latitude: number, longitude: number) => {
    try {
      console.log('Weather Insights: Fetching weather forecast for:', latitude, longitude);

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&forecast_days=5`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load weather');
      const data = await res.json();

      const days = data.daily.time.map((date: string, index: number) => {
        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const weatherCode = data.daily.weathercode[index];
        const minTempC = data.daily.temperature_2m_min[index];
        const maxTempC = data.daily.temperature_2m_max[index];
        const precipProb = data.daily.precipitation_probability_max[index];

        return {
          date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dayName,
          high: Math.round(minTempC * 9 / 5 + 32),
          low: Math.round(maxTempC * 9 / 5 + 32),
          condition: getWeatherCondition(weatherCode),
          icon: getWeatherIcon(weatherCode),
          precipitation: precipProb,
          minTempC,
          maxTempC,
          precipProb,
        };
      });

      setWeatherForecast(days);
      console.log('Weather Insights: Weather data loaded successfully');
    } catch (err: any) {
      console.error('Weather Insights: Error fetching weather:', err);
      setWeatherError(err.message ?? 'Error loading weather');
    }
  };

  const loadTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load tasks with planting information
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          planting:plantings(
            crop_name,
            field_bed:fields_beds(name)
          )
        `)
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('due_date', { ascending: true });

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
      } else {
        setTasks(tasksData || []);
        console.log('Weather Insights: Loaded', tasksData?.length || 0, 'tasks');
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  useEffect(() => {
    if (weatherForecast.length > 0 && tasks.length > 0) {
      generateSmartSuggestions();
    }
  }, [weatherForecast, tasks]);

  const generateSmartSuggestions = () => {
    const suggestions: SmartSuggestion[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check for freeze warnings
    weatherForecast.forEach((day, index) => {
      const freezeTemp = 32; // 32°F = 0°C
      if (day.low <= freezeTemp) {
        const daysUntil = index;
        const affectedTasks = tasks.filter(task => {
          if (task.task_type === 'harvesting' && task.planting?.crop_name) {
            const taskDate = new Date(task.due_date);
            const dayDate = new Date(today);
            dayDate.setDate(dayDate.getDate() + index);
            return taskDate >= dayDate;
          }
          return false;
        });

        if (affectedTasks.length > 0) {
          affectedTasks.forEach(task => {
            suggestions.push({
              id: `freeze-${task.id}`,
              icon: '❄️',
              title: `Freeze Warning: Harvest ${task.planting?.crop_name} Early`,
              description: `Freeze expected in ${daysUntil} day${daysUntil !== 1 ? 's' : ''} (${day.dayName}). Consider harvesting ${task.planting?.crop_name} before ${day.date} to avoid frost damage.`,
              priority: 'high',
              actionable: true,
            });
          });
        } else {
          suggestions.push({
            id: `freeze-general-${index}`,
            icon: '❄️',
            title: `Freeze Warning on ${day.dayName}`,
            description: `Temperature will drop to ${day.low}°F on ${day.date}. Protect sensitive crops and consider covering plants.`,
            priority: 'high',
            actionable: true,
          });
        }
      }
    });

    // Check for rain on scheduled task dates
    tasks.forEach(task => {
      const taskDate = new Date(task.due_date);
      taskDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil >= 0 && daysUntil < 5) {
        const weatherDay = weatherForecast[daysUntil];
        if (weatherDay && weatherDay.precipProb > 60) {
          // High chance of rain on task date
          if (task.task_type === 'harvesting') {
            suggestions.push({
              id: `rain-harvest-${task.id}`,
              icon: '🌧️',
              title: `Rain on Harvest Date: ${task.planting?.crop_name}`,
              description: `${weatherDay.precipProb}% chance of rain on ${weatherDay.date}. Consider harvesting ${task.planting?.crop_name} a day earlier or later to avoid wet conditions.`,
              priority: 'medium',
              actionable: true,
            });
          } else if (task.task_type === 'fertilizing') {
            suggestions.push({
              id: `rain-fertilize-${task.id}`,
              icon: '🌧️',
              title: `Rain Before Fertilizing`,
              description: `Rain expected on ${weatherDay.date}. This is ideal timing for fertilizing ${task.planting?.crop_name} - nutrients will be absorbed better.`,
              priority: 'low',
              actionable: false,
            });
          } else if (task.task_type === 'watering') {
            suggestions.push({
              id: `rain-water-${task.id}`,
              icon: '💧',
              title: `Skip Watering on ${weatherDay.date}`,
              description: `${weatherDay.precipProb}% chance of rain. You can skip watering ${task.planting?.crop_name} and let nature do the work!`,
              priority: 'low',
              actionable: true,
            });
          }
        }
      }
    });

    // Check for extreme heat
    weatherForecast.forEach((day, index) => {
      if (day.high >= 95) {
        const wateringTasks = tasks.filter(task => task.task_type === 'watering');
        if (wateringTasks.length > 0) {
          suggestions.push({
            id: `heat-${index}`,
            icon: '🌡️',
            title: `Extreme Heat Warning on ${day.dayName}`,
            description: `Temperature will reach ${day.high}°F on ${day.date}. Increase watering frequency and consider providing shade for sensitive crops.`,
            priority: 'high',
            actionable: true,
          });
        }
      }
    });

    // Check for ideal planting conditions
    weatherForecast.forEach((day, index) => {
      if (day.high >= 65 && day.high <= 75 && day.precipProb < 30) {
        if (index <= 2) {
          suggestions.push({
            id: `ideal-${index}`,
            icon: '🌱',
            title: `Ideal Planting Conditions on ${day.dayName}`,
            description: `Perfect weather on ${day.date} (${day.high}°F, low rain chance). Great day for transplanting or direct seeding.`,
            priority: 'low',
            actionable: false,
          });
        }
      }
    });

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    setSmartSuggestions(suggestions);
    console.log('Weather Insights: Generated', suggestions.length, 'smart suggestions');
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
          `${index === 0 ? 'Today' : day.dayName}: ${day.condition}, High: ${day.high}°F, Low: ${day.low}°F${day.precipProb > 0 ? `, Rain chance: ${day.precipProb}%` : ''}`
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

  const handleBackToAssistant = () => {
    router.replace('/(tabs)/ai-assistant');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#F44336';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={handleBackToAssistant}
          style={{ paddingHorizontal: 8, paddingVertical: 4 }}
        >
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weather Insights</Text>
        <View style={styles.placeholder} />
      </View>
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {weatherLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Getting your location and weather forecast...</Text>
            </View>
          ) : weatherError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>📍</Text>
              <Text style={styles.errorText}>{weatherError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadLocationAndWeather}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <React.Fragment>
              <ProUpsellBanner message="Want detailed weather-based task scheduling and alerts? Unlock Farm Copilot Pro." />

              {/* 5-Day Forecast */}
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
                        {day.precipProb > 0 && (
                          <Text style={styles.forecastPrecip}>💧 {day.precipProb}%</Text>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Smart Task Suggestions */}
              {smartSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>🧠 Smart Task Suggestions</Text>
                  <Text style={styles.suggestionsSubtitle}>
                    Based on your upcoming tasks and weather forecast
                  </Text>
                  {smartSuggestions.map((suggestion) => (
                    <View
                      key={suggestion.id}
                      style={[
                        styles.suggestionCard,
                        { borderLeftColor: getPriorityColor(suggestion.priority) },
                      ]}
                    >
                      <View style={styles.suggestionHeader}>
                        <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
                        <View style={styles.suggestionContent}>
                          <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                          <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.priorityBadge,
                          { backgroundColor: getPriorityColor(suggestion.priority) },
                        ]}
                      >
                        <Text style={styles.priorityText}>{suggestion.priority.toUpperCase()}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* AI Chat Messages */}
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
            </React.Fragment>
          )}
        </ScrollView>

        {!weatherLoading && !weatherError && (
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

export default function AIWeatherInsightsScreen() {
  return (
    <PremiumGuard>
      <AIWeatherInsightsContent />
    </PremiumGuard>
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
  suggestionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 4,
  },
  suggestionsSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  suggestionCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  suggestionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
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
