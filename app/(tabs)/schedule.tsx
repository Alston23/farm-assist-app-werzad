
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { Task, Planting, Field } from '@/types/crop';
import { IconSymbol } from '@/components/IconSymbol';
import { storage } from '@/utils/storage';
import { cropDatabase } from '@/data/cropDatabase';

export default function ScheduleScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [loadedTasks, loadedPlantings, loadedFields] = await Promise.all([
      storage.getTasks(),
      storage.getPlantings(),
      storage.getFields(),
    ]);
    setTasks(loadedTasks);
    setPlantings(loadedPlantings);
    setFields(loadedFields);
  };

  const saveTasks = async (newTasks: Task[]) => {
    await storage.saveTasks(newTasks);
    setTasks(newTasks);
  };

  const addTask = (task: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
    };
    const newTasks = [...tasks, newTask];
    saveTasks(newTasks);
    setShowAddTaskModal(false);
  };

  const updateTask = (task: Task) => {
    const newTasks = tasks.map((t) => (t.id === task.id ? task : t));
    saveTasks(newTasks);
    setEditingTask(null);
  };

  const toggleTaskComplete = (taskId: string) => {
    const newTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    saveTasks(newTasks);
  };

  const deleteTask = (taskId: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const newTasks = tasks.filter((t) => t.id !== taskId);
          saveTasks(newTasks);
        },
      },
    ]);
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'pending') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const upcomingPlantings = plantings
    .filter((p) => p.status === 'planned' || p.status === 'planted')
    .sort((a, b) => new Date(a.plantDate).getTime() - new Date(b.plantDate).getTime())
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Schedule</Text>
          <Text style={styles.headerSubtitle}>
            {tasks.filter((t) => !t.completed).length} pending tasks
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddTaskModal(true)}>
          <IconSymbol
            ios_icon_name="plus.circle.fill"
            android_material_icon_name="add-circle"
            size={32}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'pending', 'completed'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === f && styles.filterButtonTextActive,
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {upcomingPlantings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Plantings</Text>
            {upcomingPlantings.map((planting) => {
              const crop = cropDatabase.find((c) => c.id === planting.cropId);
              const field = fields.find((f) => f.id === planting.fieldId);
              return (
                <View key={planting.id} style={styles.plantingCard}>
                  <View style={styles.plantingHeader}>
                    <Text style={styles.plantingCrop}>{crop?.name || 'Unknown Crop'}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(planting.status) },
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>{planting.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.plantingField}>{field?.name || 'Unknown Field'}</Text>
                  <View style={styles.plantingDates}>
                    <Text style={styles.plantingDate}>
                      Plant: {formatDate(planting.plantDate)}
                    </Text>
                    <Text style={styles.plantingDate}>
                      Harvest: {formatDate(planting.expectedHarvestDate)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tasks</Text>
          {sortedTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="checkmark.circle"
                android_material_icon_name="check-circle"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateTitle}>No Tasks</Text>
              <Text style={styles.emptyStateText}>
                {filter === 'completed'
                  ? 'No completed tasks yet'
                  : 'Add your first task to get started'}
              </Text>
            </View>
          ) : (
            sortedTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={styles.taskCard}
                onPress={() => setEditingTask(task)}
              >
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => toggleTaskComplete(task.id)}
                >
                  <IconSymbol
                    ios_icon_name={
                      task.completed ? 'checkmark.circle.fill' : 'circle'
                    }
                    android_material_icon_name={
                      task.completed ? 'check-circle' : 'radio-button-unchecked'
                    }
                    size={24}
                    color={task.completed ? colors.success : colors.textSecondary}
                  />
                </TouchableOpacity>
                <View style={styles.taskContent}>
                  <Text
                    style={[
                      styles.taskTitle,
                      task.completed && styles.taskTitleCompleted,
                    ]}
                  >
                    {task.title}
                  </Text>
                  {task.description && (
                    <Text style={styles.taskDescription} numberOfLines={2}>
                      {task.description}
                    </Text>
                  )}
                  <View style={styles.taskMeta}>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(task.priority) },
                      ]}
                    >
                      <Text style={styles.priorityBadgeText}>{task.priority}</Text>
                    </View>
                    <Text style={styles.taskDate}>{formatDate(task.dueDate)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <TaskFormModal
        visible={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSave={addTask}
        plantings={plantings}
      />

      <TaskFormModal
        visible={editingTask !== null}
        task={editingTask || undefined}
        onClose={() => setEditingTask(null)}
        onSave={updateTask}
        onDelete={deleteTask}
        plantings={plantings}
      />
    </SafeAreaView>
  );
}

function TaskFormModal({
  visible,
  task,
  onClose,
  onSave,
  onDelete,
  plantings,
}: {
  visible: boolean;
  task?: Task;
  onClose: () => void;
  onSave: (task: any) => void;
  onDelete?: (id: string) => void;
  plantings: Planting[];
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [type, setType] = useState<Task['type']>('other');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setDueDate(task.dueDate);
      setPriority(task.priority);
      setType(task.type);
    } else {
      setTitle('');
      setDescription('');
      setDueDate(new Date().toISOString().split('T')[0]);
      setPriority('medium');
      setType('other');
    }
  }, [task, visible]);

  const handleSave = () => {
    if (!title || !dueDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const taskData = {
      ...(task || { completed: false }),
      title,
      description,
      dueDate,
      priority,
      type,
    };

    onSave(taskData);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer} edges={['top']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{task ? 'Edit Task' : 'Add Task'}</Text>
          <TouchableOpacity onPress={onClose}>
            <IconSymbol
              ios_icon_name="xmark.circle.fill"
              android_material_icon_name="close"
              size={28}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentContainer}
        >
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Title *</Text>
            <TextInput
              style={styles.formInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Water tomatoes"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Additional details..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Due Date *</Text>
            <TextInput
              style={styles.formInput}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Priority</Text>
            <View style={styles.typeSelector}>
              {(['low', 'medium', 'high'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.typeOption, priority === p && styles.typeOptionActive]}
                  onPress={() => setPriority(p)}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      priority === p && styles.typeOptionTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Type</Text>
            <View style={styles.typeSelector}>
              {(['planting', 'watering', 'fertilizing', 'weeding', 'harvesting', 'other'] as const).map(
                (t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeOption, type === t && styles.typeOptionActive]}
                    onPress={() => setType(t)}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        type === t && styles.typeOptionTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{task ? 'Update Task' : 'Add Task'}</Text>
          </TouchableOpacity>

          {task && onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                onDelete(task.id);
                onClose();
              }}
            >
              <Text style={styles.deleteButtonText}>Delete Task</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getPriorityColor(priority: string): string {
  const colors_map: { [key: string]: string } = {
    low: colors.accent,
    medium: colors.warning,
    high: colors.error,
  };
  return colors_map[priority] || colors.secondary;
}

function getStatusColor(status: string): string {
  const colors_map: { [key: string]: string } = {
    planned: colors.accent,
    planted: colors.primary,
    growing: colors.success,
    harvested: colors.secondary,
  };
  return colors_map[status] || colors.secondary;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  addButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.card,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterButtonTextActive: {
    color: colors.card,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  plantingCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  plantingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  plantingCrop: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.card,
    textTransform: 'capitalize',
  },
  plantingField: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  plantingDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  plantingDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  checkbox: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  taskDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.card,
    textTransform: 'capitalize',
  },
  taskDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  typeOptionTextActive: {
    color: colors.card,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
});
