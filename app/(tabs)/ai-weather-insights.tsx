
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert, ActivityIndicator, Image } from 'react-native';
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
  dt: number;
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

type WeatherTaskSuggestion = {
  id: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
};

// OpenWeatherMap API Key
const OPENWEATHER_API_KEY = '4aacadfe5ccd51d0c6df1f089434ecc0';

function AIWeatherInsightsContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [weatherForecast, setWeatherForecast] = useState<WeatherDay[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [suggestions, setSuggestions] = useState<WeatherTaskSuggestion[]>([]);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const router = useRouter();

  const { hasLocationPermission, requestLocationPermission, loading: locationContextLoading } = useLocation();

  const fetchWeatherForecast = useCallback(async (latitude: number, longitude: number) => {
    try {
      console.log('Weather Insights: Fetching weather forecast for:', latitude, longitude);

      // OpenWeatherMap 5-day forecast API
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=imperial&appid=${OPENWEATHER_API_KEY}`;

      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to load weather');
      }
      
      const data = await res.json();

      // OpenWeatherMap returns 3-hour intervals, we need to group by day
      const dailyForecasts: { [key: string]: any[] } = {};
      
      data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        if (!dailyForecasts[dateStr]) {
          dailyForecasts[dateStr] = [];
        }
        dailyForecasts[dateStr].push(item);
      });

      // Get the next 5 days
      const days: WeatherDay[] = Object.keys(dailyForecasts)
        .slice(0, 5)
        .map((dateStr) => {
          const dayData = dailyForecasts[dateStr];
          const dateObj = new Date(dateStr);
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          
          // Calculate high/low temps for the day
          const temps = dayData.map((d: any) => d.main.temp);
          const high = Math.round(Math.max(...temps));
          const low = Math.round(Math.min(...temps));
          
          // Get precipitation probability (max for the day)
          const precipProbs = dayData.map((d: any) => (d.pop || 0) * 100);
          const precipitation = Math.round(Math.max(...precipProbs));
          
          // Use the midday forecast for icon and condition
          const middayForecast = dayData[Math.floor(dayData.length / 2)] || dayData[0];
          const weatherIcon = middayForecast.weather[0].icon;
          const condition = middayForecast.weather[0].main;
          
          return {
            date: dateStr,
            dayName,
            high,
            low,
            condition,
            icon: weatherIcon,
            precipitation,
            dt: middayForecast.dt,
          };
        });

      setWeatherForecast(days);
      console.log('Weather Insights: Weather data loaded successfully', days.length, 'days');
    } catch (err: any) {
      console.error('Weather Insights: Error fetching weather:', err);
      setWeatherError(err.message ?? 'Error loading weather. Please try again.');
      throw err;
    }
  }, []);

  const loadLocationAndWeather = useCallback(async () => {
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
  }, [fetchWeatherForecast]);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    console.log('Weather Insights: Initializing screen');
    
    // Check if we have location permission
    if (!hasLocationPermission && !locationContextLoading) {
      console.log('Weather Insights: Requesting location permission');
      const granted = await requestLocationPermission();
      if (!granted) {
        setWeatherError('Location permission is required to show weather forecasts and smart suggestions.');
        return;
      }
    }

    // Get location and load data
    await loadLocationAndWeather();
    await loadUpcomingTasks();
  };

  const loadUpcomingTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('Weather Insights: No user found');
        return;
      }

      // Calculate date range for next 7 days
      const today = new Date();
      const in7Days = new Date();
      in7Days.setDate(today.getDate() + 7);

      console.log('Weather Insights: Loading tasks from', today.toISOString().split('T')[0], 'to', in7Days.toISOString().split('T')[0]);

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
        .gte('due_date', today.toISOString().split('T')[0])
        .lte('due_date', in7Days.toISOString().split('T')[0])
        .order('due_date', { ascending: true });

      if (tasksError) {
        console.error('Weather Insights: Error fetching tasks:', tasksError);
      } else {
        setUpcomingTasks(tasksData || []);
        console.log('Weather Insights: Loaded', tasksData?.length || 0, 'upcoming tasks');
      }
    } catch (error) {
      console.error('Weather Insights: Error loading upcoming tasks:', error);
    }
  };

  // Generate rule-based suggestions from weather + tasks
  useEffect(() => {
    if (!weatherForecast.length || !upcomingTasks.length) {
      setSuggestions([]);
      return;
    }

    console.log('Weather Insights: Generating rule-based suggestions');
    const newSuggestions: WeatherTaskSuggestion[] = [];

    // Helper to find forecast for a given date string (YYYY-MM-DD)
    const findDay = (dateStr: string) =>
      weatherForecast.find((d) => d.date === dateStr);

    for (const task of upcomingTasks) {
      const dueDate = task.due_date;
      const day = findDay(dueDate);
      if (!day) continue;

      const minF = day.low;
      const maxF = day.high;
      const rain = day.precipitation;
      const taskDate = new Date(dueDate);
      const dayOfWeek = taskDate.toLocaleDateString('en-US', { weekday: 'long' });
      const cropName = task.planting?.crop_name || 'crops';

      // Rule 1: Freeze risk (low temp below 34°F)
      if (minF <= 34) {
        newSuggestions.push({
          id: `freeze-${task.id}`,
          message: `❄️ Freeze expected ${dayOfWeek} — harvest ${cropName} early. Low temperature near ${minF}°F could damage tender crops.`,
          priority: 'high',
        });
      }

      // Rule 2: Heavy rain risk (precipitation > 60%)
      if (rain >= 60) {
        if (task.task_type === 'harvesting') {
          newSuggestions.push({
            id: `rain-harvest-${task.id}`,
            message: `🌧️ Rain expected ${dayOfWeek} (${rain}% chance) — delay ${cropName} harvest to avoid wet conditions.`,
            priority: 'medium',
          });
        } else if (task.task_type === 'watering') {
          newSuggestions.push({
            id: `rain-water-${task.id}`,
            message: `💧 Rain expected ${dayOfWeek} (${rain}% chance) — skip watering ${cropName}, let nature do the work!`,
            priority: 'low',
          });
        } else if (task.task_type === 'pest_control') {
          newSuggestions.push({
            id: `rain-pest-${task.id}`,
            message: `🌧️ Rain expected ${dayOfWeek} — avoid spraying pesticides on ${cropName}, wait for dry conditions.`,
            priority: 'medium',
          });
        }
      }

      // Rule 3: High winds (check condition for storms/wind)
      if (day.condition.toLowerCase().includes('wind') || day.condition.toLowerCase().includes('storm')) {
        if (task.task_type === 'pest_control') {
          newSuggestions.push({
            id: `wind-${task.id}`,
            message: `💨 High winds ${dayOfWeek} — avoid spraying pesticides on ${cropName} to prevent drift.`,
            priority: 'high',
          });
        }
      }

      // Rule 4: Extreme heat (high temp above 95°F)
      if (maxF >= 95) {
        if (task.task_type === 'watering') {
          newSuggestions.push({
            id: `heat-${task.id}`,
            message: `🌡️ Extreme heat ${dayOfWeek} (${maxF}°F) — increase watering frequency for ${cropName}.`,
            priority: 'high',
          });
        } else if (task.task_type === 'harvesting') {
          newSuggestions.push({
            id: `heat-harvest-${task.id}`,
            message: `🌡️ Extreme heat ${dayOfWeek} (${maxF}°F) — harvest ${cropName} early morning or evening to avoid heat stress.`,
            priority: 'medium',
          });
        }
      }

      // Rule 5: Ideal conditions (moderate temp, low rain)
      if (maxF >= 65 && maxF <= 80 && rain < 30) {
        if (task.task_type === 'fertilizing') {
          newSuggestions.push({
            id: `ideal-fertilize-${task.id}`,
            message: `🌱 Perfect conditions ${dayOfWeek} — ideal day for fertilizing ${cropName}.`,
            priority: 'low',
          });
        }
      }
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    newSuggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    setSuggestions(newSuggestions);
    console.log('Weather Insights: Generated', newSuggestions.length, 'rule-based suggestions');
  }, [weatherForecast, upcomingTasks]);

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

      // Omit conversation_type to avoid schema errors
      const { error } = await supabase.from('ai_conversations').insert({
        user_id: user.id,
        role,
        content,
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
          `${index === 0 ? 'Today' : day.dayName}: ${day.condition}, High: ${day.high}°F, Low: ${day.low}°F${day.precipitation > 0 ? `, Rain chance: ${day.precipitation}%` : ''}`
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

  const getWeatherIconUrl = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
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
          Weather Insights
        </Text>

        <View style={{ width: 50 }} />
      </View>
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Weather Forecast Section - At the top */}
          <View style={styles.forecastSection}>
            <Text style={styles.sectionTitle}>5-Day Forecast</Text>

            {locationContextLoading || weatherLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#4A7C2C" size="large" />
                <Text style={styles.helperText}>Loading forecast...</Text>
              </View>
            ) : weatherError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{weatherError}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={loadLocationAndWeather}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : weatherForecast.length === 0 ? (
              <Text style={styles.helperText}>No forecast data available</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScrollView}>
                <View style={styles.forecastRow}>
                  {weatherForecast.map((day, index) => (
                    <View key={day.date} style={styles.forecastCard}>
                      <Text style={styles.forecastDayName}>
                        {index === 0 ? 'Today' : day.dayName}
                      </Text>
                      <Image
                        source={{ uri: getWeatherIconUrl(day.icon) }}
                        style={styles.weatherIcon}
                      />
                      <Text style={styles.forecastCondition}>{day.condition}</Text>
                      <Text style={styles.forecastTemp}>
                        {day.high}° / {day.low}°F
                      </Text>
                      <Text style={styles.forecastRain}>
                        💧 {day.precipitation}%
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>

          {/* AI Weather-Based Task Suggestions Section */}
          <View style={styles.suggestionsSection}>
            <Text style={styles.sectionTitle}>AI Weather-Based Task Suggestions</Text>
            {weatherLoading || locationContextLoading ? (
              <Text style={styles.helperText}>Loading suggestions...</Text>
            ) : suggestions.length === 0 ? (
              <View style={styles.noSuggestionsContainer}>
                <Text style={styles.noSuggestionsIcon}>✅</Text>
                <Text style={styles.helperText}>
                  No weather issues detected for your upcoming tasks in the next few days.
                </Text>
                {upcomingTasks.length === 0 && (
                  <Text style={styles.helperTextSmall}>
                    Add tasks in the Tasks tab to get weather-based suggestions.
                  </Text>
                )}
              </View>
            ) : (
              <React.Fragment>
                {suggestions.map((s) => (
                  <View
                    key={s.id}
                    style={[
                      styles.suggestionCard,
                      { borderLeftColor: getPriorityColor(s.priority) },
                    ]}
                  >
                    <Text style={styles.suggestionText}>{s.message}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(s.priority) }]}>
                      <Text style={styles.priorityText}>{s.priority.toUpperCase()}</Text>
                    </View>
                  </View>
                ))}
              </React.Fragment>
            )}
          </View>

          {/* Pro Upsell Banner */}
          <ProUpsellBanner message="Want detailed weather-based task scheduling and alerts? Unlock Farm Copilot Pro." />

          {/* AI Chat Messages - Below weather sections */}
          {messages.length > 0 && (
            <View style={styles.chatSection}>
              <Text style={styles.chatSectionTitle}>Chat History</Text>
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
            </View>
          )}

          {loading && (
            <View style={[styles.messageContainer, styles.assistantMessage]}>
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <ActivityIndicator color="#2D5016" />
                <Text style={styles.loadingMessageText}>Analyzing weather and generating recommendations...</Text>
              </View>
            </View>
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
  forecastSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  helperTextSmall: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#4A7C2C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  forecastScrollView: {
    marginHorizontal: -8,
  },
  forecastRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 8,
  },
  forecastCard: {
    backgroundColor: '#F0F8F0',
    borderRadius: 12,
    padding: 12,
    width: 110,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A7C2C',
  },
  forecastDayName: {
    fontSize: 14,
    color: '#2D5016',
    marginBottom: 8,
    fontWeight: '600',
  },
  weatherIcon: {
    width: 50,
    height: 50,
    marginBottom: 4,
  },
  forecastCondition: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    textAlign: 'center',
  },
  forecastTemp: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 4,
  },
  forecastRain: {
    fontSize: 11,
    color: '#4A7C2C',
  },
  suggestionsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noSuggestionsContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  noSuggestionsIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  suggestionCard: {
    backgroundColor: '#FFF9E6',
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
  suggestionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  chatSection: {
    marginTop: 8,
  },
  chatSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    paddingHorizontal: 4,
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
