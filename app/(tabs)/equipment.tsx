
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
import { IconSymbol } from '@/components/IconSymbol';
import { equipmentStorage } from '@/utils/equipmentStorage';
import { Equipment, MaintenanceSchedule, MaintenanceRecord } from '@/types/equipment';

export default function EquipmentScreen() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<MaintenanceSchedule | null>(null);
  const [filter, setFilter] = useState<'all' | 'due-soon' | 'overdue'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [loadedEquipment, loadedSchedules, loadedRecords] = await Promise.all([
      equipmentStorage.getEquipment(),
      equipmentStorage.getMaintenanceSchedules(),
      equipmentStorage.getMaintenanceRecords(),
    ]);
    setEquipment(loadedEquipment);
    setSchedules(loadedSchedules);
    setRecords(loadedRecords);
  };

  const saveEquipment = async (newEquipment: Equipment[]) => {
    await equipmentStorage.saveEquipment(newEquipment);
    setEquipment(newEquipment);
  };

  const saveSchedules = async (newSchedules: MaintenanceSchedule[]) => {
    await equipmentStorage.saveMaintenanceSchedules(newSchedules);
    setSchedules(newSchedules);
  };

  const saveRecords = async (newRecords: MaintenanceRecord[]) => {
    await equipmentStorage.saveMaintenanceRecords(newRecords);
    setRecords(newRecords);
  };

  const addEquipment = (item: Omit<Equipment, 'id'>) => {
    const newItem: Equipment = {
      ...item,
      id: Date.now().toString(),
    };
    const newEquipment = [...equipment, newItem];
    saveEquipment(newEquipment);
    setShowAddEquipmentModal(false);
  };

  const updateEquipment = (item: Equipment) => {
    const newEquipment = equipment.map((e) => (e.id === item.id ? item : e));
    saveEquipment(newEquipment);
    setSelectedEquipment(null);
  };

  const deleteEquipment = (id: string) => {
    Alert.alert(
      'Delete Equipment',
      'Are you sure? This will also delete all associated maintenance schedules and records.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const newEquipment = equipment.filter((e) => e.id !== id);
            const newSchedules = schedules.filter((s) => s.equipmentId !== id);
            const newRecords = records.filter((r) => r.equipmentId !== id);
            await saveEquipment(newEquipment);
            await saveSchedules(newSchedules);
            await saveRecords(newRecords);
            setSelectedEquipment(null);
          },
        },
      ]
    );
  };

  const addSchedule = (schedule: Omit<MaintenanceSchedule, 'id'>) => {
    const newSchedule: MaintenanceSchedule = {
      ...schedule,
      id: Date.now().toString(),
    };
    const newSchedules = [...schedules, newSchedule];
    saveSchedules(newSchedules);
    setShowAddScheduleModal(false);
  };

  const updateSchedule = (schedule: MaintenanceSchedule) => {
    const newSchedules = schedules.map((s) => (s.id === schedule.id ? schedule : s));
    saveSchedules(newSchedules);
    setSelectedSchedule(null);
  };

  const deleteSchedule = (id: string) => {
    Alert.alert('Delete Schedule', 'Are you sure you want to delete this maintenance schedule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const newSchedules = schedules.filter((s) => s.id !== id);
          await saveSchedules(newSchedules);
          setSelectedSchedule(null);
        },
      },
    ]);
  };

  const completeMaintenanceTask = (schedule: MaintenanceSchedule) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Create maintenance record
    const newRecord: MaintenanceRecord = {
      id: Date.now().toString(),
      equipmentId: schedule.equipmentId,
      scheduleId: schedule.id,
      taskName: schedule.taskName,
      description: schedule.description,
      dateCompleted: today,
      cost: 0,
      notes: '',
    };

    // Calculate next due date
    let nextDue = new Date();
    switch (schedule.frequency) {
      case 'daily':
        nextDue.setDate(nextDue.getDate() + 1);
        break;
      case 'weekly':
        nextDue.setDate(nextDue.getDate() + 7);
        break;
      case 'monthly':
        nextDue.setMonth(nextDue.getMonth() + 1);
        break;
      case 'quarterly':
        nextDue.setMonth(nextDue.getMonth() + 3);
        break;
      case 'annually':
        nextDue.setFullYear(nextDue.getFullYear() + 1);
        break;
      default:
        nextDue.setMonth(nextDue.getMonth() + 1);
    }

    // Update schedule
    const updatedSchedule: MaintenanceSchedule = {
      ...schedule,
      lastCompleted: today,
      nextDue: nextDue.toISOString().split('T')[0],
    };

    const newSchedules = schedules.map((s) => (s.id === schedule.id ? updatedSchedule : s));
    const newRecords = [...records, newRecord];

    saveSchedules(newSchedules);
    saveRecords(newRecords);
  };

  const getFilteredSchedules = () => {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    return schedules.filter((schedule) => {
      const dueDate = new Date(schedule.nextDue);
      
      if (filter === 'overdue') {
        return dueDate < today;
      } else if (filter === 'due-soon') {
        return dueDate >= today && dueDate <= sevenDaysFromNow;
      }
      return true;
    }).sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime());
  };

  const filteredSchedules = getFilteredSchedules();

  const getEquipmentStatus = (equipmentId: string) => {
    const equipmentSchedules = schedules.filter((s) => s.equipmentId === equipmentId);
    const today = new Date();
    
    const overdue = equipmentSchedules.some((s) => new Date(s.nextDue) < today);
    const dueSoon = equipmentSchedules.some((s) => {
      const dueDate = new Date(s.nextDue);
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);
      return dueDate >= today && dueDate <= sevenDaysFromNow;
    });

    if (overdue) return { status: 'overdue', color: colors.error };
    if (dueSoon) return { status: 'due soon', color: colors.warning };
    return { status: 'up to date', color: colors.success };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Equipment</Text>
          <Text style={styles.headerSubtitle}>
            {equipment.length} items • {filteredSchedules.length} maintenance tasks
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddEquipmentModal(true)}
        >
          <IconSymbol
            ios_icon_name="plus.circle.fill"
            android_material_icon_name="add-circle"
            size={32}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'due-soon', 'overdue'] as const).map((f) => (
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
              {f === 'due-soon' ? 'Due Soon' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Equipment List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Equipment</Text>
            <TouchableOpacity onPress={() => setShowAddEquipmentModal(true)}>
              <Text style={styles.addLink}>Add Equipment</Text>
            </TouchableOpacity>
          </View>
          
          {equipment.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="wrench.and.screwdriver"
                android_material_icon_name="build"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateTitle}>No Equipment</Text>
              <Text style={styles.emptyStateText}>
                Add your farm equipment to track maintenance
              </Text>
            </View>
          ) : (
            equipment.map((item) => {
              const status = getEquipmentStatus(item.id);
              const itemSchedules = schedules.filter((s) => s.equipmentId === item.id);
              
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.equipmentCard}
                  onPress={() => setSelectedEquipment(item)}
                >
                  <View style={styles.equipmentHeader}>
                    <View style={styles.equipmentInfo}>
                      <Text style={styles.equipmentName}>{item.name}</Text>
                      <Text style={styles.equipmentCategory}>{item.category}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                      <Text style={styles.statusBadgeText}>{status.status}</Text>
                    </View>
                  </View>
                  
                  {item.model && (
                    <Text style={styles.equipmentDetail}>
                      {item.manufacturer} {item.model}
                    </Text>
                  )}
                  
                  <View style={styles.equipmentFooter}>
                    <Text style={styles.equipmentSchedules}>
                      {itemSchedules.length} maintenance {itemSchedules.length === 1 ? 'task' : 'tasks'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedEquipment(item);
                        setShowAddScheduleModal(true);
                      }}
                    >
                      <Text style={styles.addScheduleLink}>Add Schedule</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Maintenance Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maintenance Schedule</Text>
          
          {filteredSchedules.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="calendar.badge.clock"
                android_material_icon_name="schedule"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateTitle}>No Scheduled Maintenance</Text>
              <Text style={styles.emptyStateText}>
                {filter === 'all'
                  ? 'Add maintenance schedules for your equipment'
                  : `No ${filter.replace('-', ' ')} maintenance tasks`}
              </Text>
            </View>
          ) : (
            filteredSchedules.map((schedule) => {
              const equipmentItem = equipment.find((e) => e.id === schedule.equipmentId);
              const dueDate = new Date(schedule.nextDue);
              const today = new Date();
              const isOverdue = dueDate < today;
              
              return (
                <TouchableOpacity
                  key={schedule.id}
                  style={styles.scheduleCard}
                  onPress={() => setSelectedSchedule(schedule)}
                >
                  <View style={styles.scheduleHeader}>
                    <View style={styles.scheduleInfo}>
                      <Text style={styles.scheduleTask}>{schedule.taskName}</Text>
                      <Text style={styles.scheduleEquipment}>
                        {equipmentItem?.name || 'Unknown Equipment'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(schedule.priority) },
                      ]}
                    >
                      <Text style={styles.priorityBadgeText}>{schedule.priority}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.scheduleDescription} numberOfLines={2}>
                    {schedule.description}
                  </Text>
                  
                  <View style={styles.scheduleMeta}>
                    <View style={styles.scheduleMetaItem}>
                      <IconSymbol
                        ios_icon_name="calendar"
                        android_material_icon_name="event"
                        size={16}
                        color={isOverdue ? colors.error : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.scheduleMetaText,
                          isOverdue && { color: colors.error, fontWeight: '600' },
                        ]}
                      >
                        {isOverdue ? 'Overdue: ' : 'Due: '}
                        {formatDate(schedule.nextDue)}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={() => completeMaintenanceTask(schedule)}
                    >
                      <IconSymbol
                        ios_icon_name="checkmark.circle"
                        android_material_icon_name="check-circle"
                        size={20}
                        color={colors.success}
                      />
                      <Text style={styles.completeButtonText}>Complete</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <EquipmentFormModal
        visible={showAddEquipmentModal || selectedEquipment !== null}
        equipment={selectedEquipment || undefined}
        onClose={() => {
          setShowAddEquipmentModal(false);
          setSelectedEquipment(null);
        }}
        onSave={(item) => {
          if (selectedEquipment) {
            updateEquipment(item);
          } else {
            addEquipment(item);
          }
        }}
        onDelete={selectedEquipment ? deleteEquipment : undefined}
      />

      <MaintenanceScheduleFormModal
        visible={showAddScheduleModal || selectedSchedule !== null}
        schedule={selectedSchedule || undefined}
        equipment={equipment}
        selectedEquipmentId={selectedEquipment?.id}
        onClose={() => {
          setShowAddScheduleModal(false);
          setSelectedSchedule(null);
        }}
        onSave={(schedule) => {
          if (selectedSchedule) {
            updateSchedule(schedule);
          } else {
            addSchedule(schedule);
          }
        }}
        onDelete={selectedSchedule ? deleteSchedule : undefined}
      />
    </SafeAreaView>
  );
}

function EquipmentFormModal({
  visible,
  equipment,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  equipment?: Equipment;
  onClose: () => void;
  onSave: (equipment: any) => void;
  onDelete?: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Equipment['category']>('tools');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [hoursUsed, setHoursUsed] = useState('');
  const [status, setStatus] = useState<Equipment['status']>('operational');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (equipment) {
      setName(equipment.name);
      setCategory(equipment.category);
      setManufacturer(equipment.manufacturer || '');
      setModel(equipment.model || '');
      setSerialNumber(equipment.serialNumber || '');
      setPurchaseDate(equipment.purchaseDate || '');
      setPurchasePrice(equipment.purchasePrice?.toString() || '');
      setHoursUsed(equipment.hoursUsed?.toString() || '');
      setStatus(equipment.status);
      setLocation(equipment.location || '');
      setNotes(equipment.notes || '');
    } else {
      setName('');
      setCategory('tools');
      setManufacturer('');
      setModel('');
      setSerialNumber('');
      setPurchaseDate('');
      setPurchasePrice('');
      setHoursUsed('');
      setStatus('operational');
      setLocation('');
      setNotes('');
    }
  }, [equipment, visible]);

  const handleSave = () => {
    if (!name) {
      Alert.alert('Error', 'Please enter equipment name');
      return;
    }

    const equipmentData = {
      ...(equipment || {}),
      name,
      category,
      manufacturer: manufacturer || undefined,
      model: model || undefined,
      serialNumber: serialNumber || undefined,
      purchaseDate: purchaseDate || undefined,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      hoursUsed: hoursUsed ? parseFloat(hoursUsed) : undefined,
      status,
      location: location || undefined,
      notes: notes || undefined,
    };

    onSave(equipmentData);
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
          <Text style={styles.modalTitle}>
            {equipment ? 'Edit Equipment' : 'Add Equipment'}
          </Text>
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
            <Text style={styles.formLabel}>Name *</Text>
            <TextInput
              style={styles.formInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g., John Deere Tractor"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Category</Text>
            <View style={styles.categorySelector}>
              {(['tractors', 'implements', 'tillage', 'planting', 'harvesting', 'irrigation', 'tools', 'other'] as const).map(
                (c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.categoryOption, category === c && styles.categoryOptionActive]}
                    onPress={() => setCategory(c)}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        category === c && styles.categoryOptionTextActive,
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Manufacturer</Text>
            <TextInput
              style={styles.formInput}
              value={manufacturer}
              onChangeText={setManufacturer}
              placeholder="e.g., John Deere"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Model</Text>
            <TextInput
              style={styles.formInput}
              value={model}
              onChangeText={setModel}
              placeholder="e.g., 5075E"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Serial Number</Text>
            <TextInput
              style={styles.formInput}
              value={serialNumber}
              onChangeText={setSerialNumber}
              placeholder="Serial number"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Purchase Date</Text>
            <TextInput
              style={styles.formInput}
              value={purchaseDate}
              onChangeText={setPurchaseDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Purchase Price ($)</Text>
            <TextInput
              style={styles.formInput}
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Hours Used</Text>
            <TextInput
              style={styles.formInput}
              value={hoursUsed}
              onChangeText={setHoursUsed}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Status</Text>
            <View style={styles.statusSelector}>
              {(['operational', 'needs-maintenance', 'in-repair', 'retired'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusOption, status === s && styles.statusOptionActive]}
                  onPress={() => setStatus(s)}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      status === s && styles.statusOptionTextActive,
                    ]}
                  >
                    {s.replace('-', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Location</Text>
            <TextInput
              style={styles.formInput}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Main barn"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Notes</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {equipment ? 'Update Equipment' : 'Add Equipment'}
            </Text>
          </TouchableOpacity>

          {equipment && onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDelete(equipment.id)}
            >
              <Text style={styles.deleteButtonText}>Delete Equipment</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function MaintenanceScheduleFormModal({
  visible,
  schedule,
  equipment,
  selectedEquipmentId,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  schedule?: MaintenanceSchedule;
  equipment: Equipment[];
  selectedEquipmentId?: string;
  onClose: () => void;
  onSave: (schedule: any) => void;
  onDelete?: (id: string) => void;
}) {
  const [equipmentId, setEquipmentId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<MaintenanceSchedule['frequency']>('monthly');
  const [frequencyValue, setFrequencyValue] = useState('');
  const [nextDue, setNextDue] = useState('');
  const [priority, setPriority] = useState<MaintenanceSchedule['priority']>('medium');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (schedule) {
      setEquipmentId(schedule.equipmentId);
      setTaskName(schedule.taskName);
      setDescription(schedule.description);
      setFrequency(schedule.frequency);
      setFrequencyValue(schedule.frequencyValue?.toString() || '');
      setNextDue(schedule.nextDue);
      setPriority(schedule.priority);
      setEstimatedCost(schedule.estimatedCost?.toString() || '');
      setEstimatedDuration(schedule.estimatedDuration?.toString() || '');
      setNotes(schedule.notes || '');
    } else {
      setEquipmentId(selectedEquipmentId || '');
      setTaskName('');
      setDescription('');
      setFrequency('monthly');
      setFrequencyValue('');
      setNextDue(new Date().toISOString().split('T')[0]);
      setPriority('medium');
      setEstimatedCost('');
      setEstimatedDuration('');
      setNotes('');
    }
  }, [schedule, selectedEquipmentId, visible]);

  const handleSave = () => {
    if (!equipmentId || !taskName || !nextDue) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const scheduleData = {
      ...(schedule || {}),
      equipmentId,
      taskName,
      description,
      frequency,
      frequencyValue: frequencyValue ? parseInt(frequencyValue) : undefined,
      nextDue,
      priority,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
      notes: notes || undefined,
    };

    onSave(scheduleData);
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
          <Text style={styles.modalTitle}>
            {schedule ? 'Edit Schedule' : 'Add Maintenance Schedule'}
          </Text>
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
            <Text style={styles.formLabel}>Equipment *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.equipmentSelector}>
                {equipment.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.equipmentOption,
                      equipmentId === item.id && styles.equipmentOptionActive,
                    ]}
                    onPress={() => setEquipmentId(item.id)}
                  >
                    <Text
                      style={[
                        styles.equipmentOptionText,
                        equipmentId === item.id && styles.equipmentOptionTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Task Name *</Text>
            <TextInput
              style={styles.formInput}
              value={taskName}
              onChangeText={setTaskName}
              placeholder="e.g., Oil change"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Task details..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Frequency</Text>
            <View style={styles.frequencySelector}>
              {(['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'hours-based', 'one-time'] as const).map(
                (f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.frequencyOption, frequency === f && styles.frequencyOptionActive]}
                    onPress={() => setFrequency(f)}
                  >
                    <Text
                      style={[
                        styles.frequencyOptionText,
                        frequency === f && styles.frequencyOptionTextActive,
                      ]}
                    >
                      {f.replace('-', ' ')}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>

          {frequency === 'hours-based' && (
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Every X Hours</Text>
              <TextInput
                style={styles.formInput}
                value={frequencyValue}
                onChangeText={setFrequencyValue}
                placeholder="e.g., 50"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Next Due Date *</Text>
            <TextInput
              style={styles.formInput}
              value={nextDue}
              onChangeText={setNextDue}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Priority</Text>
            <View style={styles.prioritySelector}>
              {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.priorityOption, priority === p && styles.priorityOptionActive]}
                  onPress={() => setPriority(p)}
                >
                  <Text
                    style={[
                      styles.priorityOptionText,
                      priority === p && styles.priorityOptionTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Estimated Cost ($)</Text>
            <TextInput
              style={styles.formInput}
              value={estimatedCost}
              onChangeText={setEstimatedCost}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Estimated Duration (minutes)</Text>
            <TextInput
              style={styles.formInput}
              value={estimatedDuration}
              onChangeText={setEstimatedDuration}
              placeholder="e.g., 60"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Notes</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {schedule ? 'Update Schedule' : 'Add Schedule'}
            </Text>
          </TouchableOpacity>

          {schedule && onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDelete(schedule.id)}
            >
              <Text style={styles.deleteButtonText}>Delete Schedule</Text>
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
    critical: '#8B0000',
  };
  return colors_map[priority] || colors.secondary;
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  addLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  equipmentCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  equipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  equipmentCategory: {
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  equipmentDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  equipmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  equipmentSchedules: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  addScheduleLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
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
  scheduleCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTask: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  scheduleEquipment: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  scheduleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  scheduleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleMetaText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
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
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  categoryOptionTextActive: {
    color: colors.card,
  },
  statusSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  statusOptionTextActive: {
    color: colors.card,
  },
  equipmentSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  equipmentOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 120,
  },
  equipmentOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  equipmentOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  equipmentOptionTextActive: {
    color: colors.card,
  },
  frequencySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  frequencyOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  frequencyOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  frequencyOptionTextActive: {
    color: colors.card,
  },
  prioritySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priorityOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  priorityOptionTextActive: {
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
