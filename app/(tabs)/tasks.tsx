
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PageHeader from '../../components/PageHeader';
import { supabase } from '../../lib/supabase';

interface Planting {
  id: string;
  crop_name: string;
  planting_date: string;
  harvest_date: string;
  days_to_maturity: number;
  field_bed: {
    name: string;
  };
}

interface Task {
  id: string;
  title: string;
  description: string;
  task_type: 'watering' | 'fertilizing' | 'weeding' | 'pest_control' | 'pruning' | 'harvesting' | 'other';
  due_date: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  planting_id: string;
  planting?: Planting;
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Load plantings
      const { data: plantingsData, error: plantingsError } = await supabase
        .from('plantings')
        .select(`
          *,
          field_bed:fields_beds(name)
        `)
        .eq('user_id', user.id)
        .order('planting_date', { ascending: true });

      if (plantingsError) {
        console.error('Error fetching plantings:', plantingsError);
      } else {
        setPlantings(plantingsData || []);
      }

      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
      } else {
        // Merge planting data with tasks
        const tasksWithPlantings = (tasksData || []).map(task => {
          const planting = plantingsData?.find(p => p.id === task.planting_id);
          return { ...task, planting };
        });
        setTasks(tasksWithPlantings);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const generateTasksForPlanting = async (planting: Planting) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const plantingDate = new Date(planting.planting_date);
      const harvestDate = new Date(planting.harvest_date);
      const today = new Date();

      // Only generate tasks for active plantings (not yet harvested)
      if (harvestDate < today) {
        return;
      }

      const tasksToCreate = [];

      // Calculate task schedule based on days to maturity
      const daysToMaturity = planting.days_to_maturity;
      
      // Watering tasks - every 3 days for vegetables/herbs, weekly for others
      const wateringInterval = ['vegetable', 'herb'].includes(planting.crop_name.toLowerCase()) ? 3 : 7;
      let wateringDate = new Date(plantingDate);
      while (wateringDate < harvestDate) {
        if (wateringDate >= today) {
          tasksToCreate.push({
            user_id: user.id,
            planting_id: planting.id,
            title: `Water ${planting.crop_name}`,
            description: `Water ${planting.crop_name} in ${planting.field_bed.name}`,
            task_type: 'watering',
            due_date: wateringDate.toISOString().split('T')[0],
            priority: 'high',
          });
        }
        wateringDate.setDate(wateringDate.getDate() + wateringInterval);
      }

      // Fertilizing tasks - at 25%, 50%, and 75% of growth period
      const fertilizingPoints = [0.25, 0.5, 0.75];
      fertilizingPoints.forEach(point => {
        const fertilizeDate = new Date(plantingDate);
        fertilizeDate.setDate(fertilizeDate.getDate() + Math.floor(daysToMaturity * point));
        if (fertilizeDate >= today && fertilizeDate < harvestDate) {
          tasksToCreate.push({
            user_id: user.id,
            planting_id: planting.id,
            title: `Fertilize ${planting.crop_name}`,
            description: `Apply fertilizer to ${planting.crop_name} in ${planting.field_bed.name}`,
            task_type: 'fertilizing',
            due_date: fertilizeDate.toISOString().split('T')[0],
            priority: 'medium',
          });
        }
      });

      // Weeding tasks - every 2 weeks
      let weedingDate = new Date(plantingDate);
      weedingDate.setDate(weedingDate.getDate() + 14);
      while (weedingDate < harvestDate) {
        if (weedingDate >= today) {
          tasksToCreate.push({
            user_id: user.id,
            planting_id: planting.id,
            title: `Weed ${planting.field_bed.name}`,
            description: `Remove weeds around ${planting.crop_name}`,
            task_type: 'weeding',
            due_date: weedingDate.toISOString().split('T')[0],
            priority: 'medium',
          });
        }
        weedingDate.setDate(weedingDate.getDate() + 14);
      }

      // Pest control - at 30% and 60% of growth
      [0.3, 0.6].forEach(point => {
        const pestDate = new Date(plantingDate);
        pestDate.setDate(pestDate.getDate() + Math.floor(daysToMaturity * point));
        if (pestDate >= today && pestDate < harvestDate) {
          tasksToCreate.push({
            user_id: user.id,
            planting_id: planting.id,
            title: `Check for pests on ${planting.crop_name}`,
            description: `Inspect ${planting.crop_name} for pests and diseases`,
            task_type: 'pest_control',
            due_date: pestDate.toISOString().split('T')[0],
            priority: 'medium',
          });
        }
      });

      // Harvest task - 3 days before harvest date
      const harvestReminderDate = new Date(harvestDate);
      harvestReminderDate.setDate(harvestReminderDate.getDate() - 3);
      if (harvestReminderDate >= today) {
        tasksToCreate.push({
          user_id: user.id,
          planting_id: planting.id,
          title: `Prepare to harvest ${planting.crop_name}`,
          description: `${planting.crop_name} will be ready for harvest soon`,
          task_type: 'harvesting',
          due_date: harvestReminderDate.toISOString().split('T')[0],
          priority: 'high',
        });
      }

      // Harvest task - on harvest date
      if (harvestDate >= today) {
        tasksToCreate.push({
          user_id: user.id,
          planting_id: planting.id,
          title: `Harvest ${planting.crop_name}`,
          description: `${planting.crop_name} is ready to harvest from ${planting.field_bed.name}`,
          task_type: 'harvesting',
          due_date: harvestDate.toISOString().split('T')[0],
          priority: 'high',
        });
      }

      // Insert tasks in batches
      if (tasksToCreate.length > 0) {
        const { error } = await supabase
          .from('tasks')
          .insert(tasksToCreate);

        if (error) {
          console.error('Error creating tasks:', error);
          throw error;
        }
      }

      return tasksToCreate.length;
    } catch (error) {
      console.error('Error generating tasks:', error);
      throw error;
    }
  };

  const generateAllTasks = async () => {
    try {
      Alert.alert(
        'Generate Tasks',
        'This will create tasks for all your plantings. Existing tasks will not be duplicated.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Generate',
            onPress: async () => {
              setLoading(true);
              let totalTasks = 0;
              
              for (const planting of plantings) {
                const count = await generateTasksForPlanting(planting);
                totalTasks += count || 0;
              }

              await loadData();
              Alert.alert('Success', `Generated ${totalTasks} tasks for your plantings!`);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error generating all tasks:', error);
      Alert.alert('Error', 'Failed to generate tasks');
    }
  };

  const toggleTaskComplete = async (taskId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task:', error);
        Alert.alert('Error', 'Failed to update task');
      } else {
        await loadData();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

              if (error) {
                console.error('Error deleting task:', error);
                Alert.alert('Error', 'Failed to delete task');
              } else {
                await loadData();
              }
            } catch (error) {
              console.error('Error:', error);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTaskIcon = (taskType: string) => {
    const icons: Record<string, string> = {
      watering: '💧',
      fertilizing: '🌱',
      weeding: '🌿',
      pest_control: '🐛',
      pruning: '✂️',
      harvesting: '🌾',
      other: '📋',
    };
    return icons[taskType] || '📋';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#F44336',
    };
    return colors[priority] || '#999';
  };

  const filteredTasks = showCompleted ? tasks : tasks.filter(t => !t.completed);
  const upcomingTasks = filteredTasks.filter(t => getDaysUntil(t.due_date) >= 0);
  const overdueTasks = filteredTasks.filter(t => getDaysUntil(t.due_date) < 0);

  return (
    <View style={styles.container}>
      <PageHeader title="✅ Tasks" />
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
        >
          {loading ? (
            <View style={styles.card}>
              <Text style={styles.loadingText}>Loading tasks...</Text>
            </View>
          ) : (
            <React.Fragment>
              {/* Harvest Countdown Section */}
              {plantings.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>🌾 Harvest Countdown</Text>
                  {plantings.map((planting, index) => {
                    const daysUntilHarvest = getDaysUntil(planting.harvest_date);
                    const isReady = daysUntilHarvest <= 0;
                    const isUpcoming = daysUntilHarvest > 0 && daysUntilHarvest <= 7;

                    return (
                      <View key={index} style={styles.countdownItem}>
                        <View style={styles.countdownHeader}>
                          <Text style={styles.countdownCrop}>{planting.crop_name}</Text>
                          <Text style={styles.countdownField}>{planting.field_bed.name}</Text>
                        </View>
                        <View
                          style={[
                            styles.countdownBadge,
                            isReady && styles.countdownReady,
                            isUpcoming && styles.countdownUpcoming,
                          ]}
                        >
                          <Text style={styles.countdownText}>
                            {isReady
                              ? '🎉 Ready to Harvest!'
                              : `${daysUntilHarvest} day${daysUntilHarvest !== 1 ? 's' : ''} until harvest`}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Generate Tasks Button */}
              {plantings.length > 0 && (
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={generateAllTasks}
                  activeOpacity={0.8}
                >
                  <Text style={styles.generateButtonText}>🔄 Generate Tasks for All Plantings</Text>
                </TouchableOpacity>
              )}

              {/* Toggle Completed Tasks */}
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setShowCompleted(!showCompleted)}
                activeOpacity={0.8}
              >
                <Text style={styles.toggleButtonText}>
                  {showCompleted ? '✓ Hide Completed Tasks' : '○ Show Completed Tasks'}
                </Text>
              </TouchableOpacity>

              {/* Overdue Tasks */}
              {overdueTasks.length > 0 && (
                <View style={styles.card}>
                  <Text style={[styles.sectionTitle, styles.overdueTitle]}>⚠️ Overdue Tasks</Text>
                  {overdueTasks.map((task, index) => (
                    <View key={index} style={[styles.taskItem, styles.overdueTask]}>
                      <View style={styles.taskHeader}>
                        <Text style={styles.taskIcon}>{getTaskIcon(task.task_type)}</Text>
                        <View style={styles.taskInfo}>
                          <Text style={styles.taskTitle}>{task.title}</Text>
                          {task.description && (
                            <Text style={styles.taskDescription}>{task.description}</Text>
                          )}
                          <Text style={styles.taskDueDate}>
                            Due: {formatDate(task.due_date)} ({Math.abs(getDaysUntil(task.due_date))} days overdue)
                          </Text>
                        </View>
                        <View
                          style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}
                        >
                          <Text style={styles.priorityText}>{task.priority}</Text>
                        </View>
                      </View>
                      <View style={styles.taskActions}>
                        <TouchableOpacity
                          style={styles.completeButton}
                          onPress={() => toggleTaskComplete(task.id, task.completed)}
                        >
                          <Text style={styles.completeButtonText}>
                            {task.completed ? '↩️ Undo' : '✓ Complete'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => deleteTask(task.id)}
                        >
                          <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Upcoming Tasks */}
              {upcomingTasks.length > 0 ? (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>📅 Upcoming Tasks</Text>
                  {upcomingTasks.map((task, index) => (
                    <View
                      key={index}
                      style={[styles.taskItem, task.completed && styles.completedTask]}
                    >
                      <View style={styles.taskHeader}>
                        <Text style={styles.taskIcon}>{getTaskIcon(task.task_type)}</Text>
                        <View style={styles.taskInfo}>
                          <Text style={[styles.taskTitle, task.completed && styles.completedText]}>
                            {task.title}
                          </Text>
                          {task.description && (
                            <Text style={[styles.taskDescription, task.completed && styles.completedText]}>
                              {task.description}
                            </Text>
                          )}
                          <Text style={styles.taskDueDate}>
                            Due: {formatDate(task.due_date)}
                            {getDaysUntil(task.due_date) === 0 && ' (Today)'}
                            {getDaysUntil(task.due_date) === 1 && ' (Tomorrow)'}
                            {getDaysUntil(task.due_date) > 1 && ` (in ${getDaysUntil(task.due_date)} days)`}
                          </Text>
                        </View>
                        <View
                          style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}
                        >
                          <Text style={styles.priorityText}>{task.priority}</Text>
                        </View>
                      </View>
                      <View style={styles.taskActions}>
                        <TouchableOpacity
                          style={styles.completeButton}
                          onPress={() => toggleTaskComplete(task.id, task.completed)}
                        >
                          <Text style={styles.completeButtonText}>
                            {task.completed ? '↩️ Undo' : '✓ Complete'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => deleteTask(task.id)}
                        >
                          <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.card}>
                  <Text style={styles.emptyTitle}>No Tasks Yet</Text>
                  <Text style={styles.emptyText}>
                    {plantings.length > 0
                      ? 'Tap "Generate Tasks" to create tasks for your plantings!'
                      : 'Add plantings in the Fields/Beds tab to start generating tasks.'}
                  </Text>
                </View>
              )}
            </React.Fragment>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D5016',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 16,
  },
  overdueTitle: {
    color: '#F44336',
  },
  countdownItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  countdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  countdownCrop: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  countdownField: {
    fontSize: 14,
    color: '#666',
  },
  countdownBadge: {
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  countdownReady: {
    backgroundColor: '#C8E6C9',
  },
  countdownUpcoming: {
    backgroundColor: '#FFF3E0',
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  generateButton: {
    backgroundColor: '#4A7C2C',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  taskItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  overdueTask: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  completedTask: {
    opacity: 0.6,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  taskDueDate: {
    fontSize: 13,
    color: '#999',
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#F44336',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
