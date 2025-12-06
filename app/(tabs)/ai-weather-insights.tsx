
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

type WeatherTaskSuggestion = {
  id: string;
  message: string;
};

function AIWeatherInsightsContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [weatherForecast, setWeatherForecast] = useState<WeatherDay[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [suggestions, setSuggestions] = useState<WeatherTaskSuggestion[]>([]);
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
    await loadUpcomingTasks();
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
          date,
          dayName,
          high: Math.round(maxTempC * 9 / 5 + 32),
          low: Math.round(minTempC * 9 / 5 + 32),
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

      const minF = day.minTempC * 9 / 5 + 32;
      const maxF = day.maxTempC * 9 / 5 + 32;
      const rain = day.precipProb;

      // Rule 1: Freeze risk (min below 34°F)
      if (minF <= 34) {
        newSuggestions.push({
          id: `freeze-${task.id}`,
          message: `Freeze risk around ${dueDate} (low near ${Math.round(minF)}°F). Consider doing "${task.title}" earlier, especially if it involves tender crops like tomatoes or peppers.`,
        });
      }

      // Rule 2: Heavy rain risk (precipitation > 60%)
      if (rain >= 60) {
        newSuggestions.push({
          id: `rain-${task.id}`,
          message: `High chance of rain (~${rain}% on ${dueDate}) for "${task.title}". If this is a harvest or field work task, consider shifting it by a day for better conditions.`,
        });
      }
    }

    setSuggestions(newSuggestions);
    console.log('Weather Insights: Generated', newSuggestions.length, 'rule-based suggestions');
  }, [weatherForecast, upcomingTasks]);

  useEffect(() => {
    if (weatherForecast.length > 0 && upcomingTasks.length > 0) {
      generateSmartSuggestions();
    }
  }, [weatherForecast, upcomingTasks]);

  const generateSmartSuggestions = () => {
    const smartSuggs: SmartSuggestion[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check for freeze warnings
    weatherForecast.forEach((day, index) => {
      const freezeTemp = 32; // 32°F = 0°C
      if (day.low <= freezeTemp) {
        const daysUntil = index;
        const affectedTasks = upcomingTasks.filter(task => {
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
            smartSuggs.push({
              id: `freeze-${task.id}`,
              icon: '❄️',
              title: `Freeze Warning: Harvest ${task.planting?.crop_name} Early`,
              description: `Freeze expected in ${daysUntil} day${daysUntil !== 1 ? 's' : ''} (${day.dayName}). Consider harvesting ${task.planting?.crop_name} before ${day.date} to avoid frost damage.`,
              priority: 'high',
              actionable: true,
            });
          });
        } else {
          smartSuggs.push({
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
    upcomingTasks.forEach(task => {
      const taskDate = new Date(task.due_date);
      taskDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil >= 0 && daysUntil < 5) {
        const weatherDay = weatherForecast[daysUntil];
        if (weatherDay && weatherDay.precipProb > 60) {
          // High chance of rain on task date
          if (task.task_type === 'harvesting') {
            smartSuggs.push({
              id: `rain-harvest-${task.id}`,
              icon: '🌧️',
              title: `Rain on Harvest Date: ${task.planting?.crop_name}`,
              description: `${weatherDay.precipProb}% chance of rain on ${weatherDay.date}. Consider harvesting ${task.planting?.crop_name} a day earlier or later to avoid wet conditions.`,
              priority: 'medium',
              actionable: true,
            });
          } else if (task.task_type === 'fertilizing') {
            smartSuggs.push({
              id: `rain-fertilize-${task.id}`,
              icon: '🌧️',
              title: `Rain Before Fertilizing`,
              description: `Rain expected on ${weatherDay.date}. This is ideal timing for fertilizing ${task.planting?.crop_name} - nutrients will be absorbed better.`,
              priority: 'low',
              actionable: false,
            });
          } else if (task.task_type === 'watering') {
            smartSuggs.push({
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
        const wateringTasks = upcomingTasks.filter(task => task.task_type === 'watering');
        if (wateringTasks.length > 0) {
          smartSuggs.push({
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
          smartSuggs.push({
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
    smartSuggs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    setSmartSuggestions(smartSuggs);
    console.log('Weather Insights: Generated', smartSuggs.length, 'smart suggestions');
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
          {/* Weather Forecast Section - At the top */}
          <View style={styles.forecastSection}>
            <Text style={styles.sectionTitle}>5-Day Forecast</Text>

            {locationContextLoading || weatherLoading ? (
              <Text style={styles.helperText}>Loading forecast...</Text>
            ) : weatherError ? (
              <Text style={styles.errorText}>{weatherError}</Text>
            ) : (
              <View style={styles.forecastRow}>
                {weatherForecast.map((day) => {
                  const minF = day.minTempC * 9 / 5 + 32;
                  const maxF = day.maxTempC * 9 / 5 + 32;
                  return (
                    <View key={day.date} style={styles.forecastCard}>
                      <Text style={styles.forecastDate}>
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                      <Text style={styles.forecastTemp}>
                        {Math.round(minF)}°–{Math.round(maxF)}°F
                      </Text>
                      <Text style={styles.forecastRain}>
                        Rain: {day.precipProb}%
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Weather-Aware Task Suggestions Section */}
          <View style={styles.suggestionsSection}>
            <Text style={styles.sectionTitle}>Weather-Aware Task Suggestions</Text>
            {suggestions.length === 0 ? (
              <Text style={styles.helperText}>
                No weather issues detected for your upcoming tasks in the next few days.
              </Text>
            ) : (
              <React.Fragment>
                {suggestions.map((s) => (
                  <View key={s.id} style={styles.suggestionCard}>
                    <Text style={styles.suggestionText}>{s.message}</Text>
                  </View>
                ))}
              </React.Fragment>
            )}
          </View>

          {/* Pro Upsell Banner */}
          <ProUpsellBanner message="Want detailed weather-based task scheduling and alerts? Unlock Farm Copilot Pro." />

          {/* AI Chat Messages - Below weather sections */}
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
  forecastSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 12,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
    paddingVertical: 12,
  },
  forecastRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  forecastCard: {
    backgroundColor: '#F0F8F0',
    borderRadius: 12,
    padding: 12,
    minWidth: '18%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A7C2C',
  },
  forecastDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
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
  },
  suggestionCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
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
