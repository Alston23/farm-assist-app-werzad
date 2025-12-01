
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { router } from 'expo-router';
import { inventoryStorage } from '@/utils/inventoryStorage';
import { StorageLocation } from '@/types/inventory';

export default function StorageLocationsScreen() {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<StorageLocation | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<StorageLocation['type']>('dry');
  const [capacityType, setCapacityType] = useState<StorageLocation['capacityType']>('fixed');
  const [totalCapacity, setTotalCapacity] = useState('');
  const [unit, setUnit] = useState<StorageLocation['unit']>('sq_ft');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    const data = await inventoryStorage.getStorageLocations();
    setLocations(data);
  };

  const openAddModal = () => {
    setEditingItem(null);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (item: StorageLocation) => {
    setEditingItem(item);
    setName(item.name);
    setType(item.type);
    setCapacityType(item.capacityType);
    setTotalCapacity(item.totalCapacity.toString());
    setUnit(item.unit);
    setNotes(item.notes || '');
    setModalVisible(true);
  };

  const resetForm = () => {
    setName('');
    setType('dry');
    setCapacityType('fixed');
    setTotalCapacity('');
    setUnit('sq_ft');
    setNotes('');
  };

  const handleSave = async () => {
    if (!name.trim() || !totalCapacity) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const capacity = parseFloat(totalCapacity);
    if (isNaN(capacity) || capacity <= 0) {
      Alert.alert('Error', 'Please enter a valid capacity');
      return;
    }

    if (capacityType === 'percentage' && capacity > 100) {
      Alert.alert('Error', 'Percentage cannot exceed 100%');
      return;
    }

    const newItem: StorageLocation = {
      id: editingItem?.id || Date.now().toString(),
      name: name.trim(),
      type,
      capacityType,
      totalCapacity: capacity,
      unit: capacityType === 'percentage' ? 'percentage' : unit,
      notes: notes.trim(),
    };

    let updatedLocations;
    if (editingItem) {
      updatedLocations = locations.map(item =>
        item.id === editingItem.id ? newItem : item
      );
    } else {
      updatedLocations = [...locations, newItem];
    }

    await inventoryStorage.saveStorageLocations(updatedLocations);
    setLocations(updatedLocations);
    setModalVisible(false);
    resetForm();
    Alert.alert('Success', `Storage location ${editingItem ? 'updated' : 'added'} successfully`);
  };

  const handleDelete = (item: StorageLocation) => {
    Alert.alert(
      'Delete Storage Location',
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedLocations = locations.filter(l => l.id !== item.id);
            await inventoryStorage.saveStorageLocations(updatedLocations);
            setLocations(updatedLocations);
            Alert.alert('Success', 'Storage location deleted successfully');
          },
        },
      ]
    );
  };

  const dryLocations = locations.filter(l => l.type === 'dry');
  const coldLocations = locations.filter(l => l.type === 'cold');
  const frozenLocations = locations.filter(l => l.type === 'frozen');

  const getTotalCapacity = (locs: StorageLocation[]) => {
    const fixedLocs = locs.filter(l => l.capacityType === 'fixed');
    return fixedLocs.reduce((sum, l) => sum + l.totalCapacity, 0);
  };

  return (
    <View style={commonStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Storage Locations</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.summaryScroll}
        contentContainerStyle={styles.summaryContainer}
      >
        <View style={[commonStyles.card, styles.summaryCard]}>
          <IconSymbol
            ios_icon_name="cube.box.fill"
            android_material_icon_name="inventory"
            size={28}
            color={colors.primary}
          />
          <Text style={styles.summaryTitle}>Dry Storage</Text>
          <Text style={styles.summaryValue}>{dryLocations.length} locations</Text>
          <Text style={styles.summaryCapacity}>
            {getTotalCapacity(dryLocations).toFixed(0)} sq ft
          </Text>
        </View>

        <View style={[commonStyles.card, styles.summaryCard]}>
          <IconSymbol
            ios_icon_name="snowflake"
            android_material_icon_name="ac_unit"
            size={28}
            color="#2196F3"
          />
          <Text style={styles.summaryTitle}>Cold Storage</Text>
          <Text style={styles.summaryValue}>{coldLocations.length} locations</Text>
          <Text style={styles.summaryCapacity}>
            {getTotalCapacity(coldLocations).toFixed(0)} sq ft
          </Text>
        </View>

        <View style={[commonStyles.card, styles.summaryCard]}>
          <IconSymbol
            ios_icon_name="thermometer.snowflake"
            android_material_icon_name="ac_unit"
            size={28}
            color="#00BCD4"
          />
          <Text style={styles.summaryTitle}>Frozen Storage</Text>
          <Text style={styles.summaryValue}>{frozenLocations.length} locations</Text>
          <Text style={styles.summaryCapacity}>
            {getTotalCapacity(frozenLocations).toFixed(0)} sq ft
          </Text>
        </View>
      </ScrollView>

      {/* Storage Locations List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {locations.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="archivebox"
              android_material_icon_name="warehouse"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No storage locations</Text>
            <Text style={styles.emptySubtext}>
              Add your first storage location to track capacity
            </Text>
          </View>
        ) : (
          <React.Fragment>
            {/* Dry Storage Section */}
            {dryLocations.length > 0 && (
              <React.Fragment>
                <View style={styles.sectionHeader}>
                  <IconSymbol
                    ios_icon_name="cube.box.fill"
                    android_material_icon_name="inventory"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles.sectionTitle}>Dry Storage</Text>
                </View>
                {dryLocations.map((item, index) => (
                  <React.Fragment key={index}>
                    <TouchableOpacity
                      style={[commonStyles.card, styles.locationCard]}
                      onPress={() => openEditModal(item)}
                    >
                      <View style={styles.locationHeader}>
                        <Text style={styles.locationName}>{item.name}</Text>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDelete(item)}
                        >
                          <IconSymbol
                            ios_icon_name="trash.fill"
                            android_material_icon_name="delete"
                            size={20}
                            color={colors.error}
                          />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.locationDetails}>
                        <View style={styles.detailRow}>
                          <IconSymbol
                            ios_icon_name="scalemass.fill"
                            android_material_icon_name="scale"
                            size={16}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.detailText}>
                            Capacity: {item.totalCapacity} {item.unit === 'percentage' ? '%' : item.unit}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <IconSymbol
                            ios_icon_name="chart.bar.fill"
                            android_material_icon_name="bar_chart"
                            size={16}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.detailText}>
                            Type: {item.capacityType === 'fixed' ? 'Fixed' : 'Percentage'}
                          </Text>
                        </View>
                      </View>

                      {item.notes && (
                        <Text style={styles.locationNotes} numberOfLines={2}>
                          {item.notes}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </React.Fragment>
            )}

            {/* Cold Storage Section */}
            {coldLocations.length > 0 && (
              <React.Fragment>
                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                  <IconSymbol
                    ios_icon_name="snowflake"
                    android_material_icon_name="ac_unit"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles.sectionTitle}>Cold Storage</Text>
                </View>
                {coldLocations.map((item, index) => (
                  <React.Fragment key={index}>
                    <TouchableOpacity
                      style={[commonStyles.card, styles.locationCard]}
                      onPress={() => openEditModal(item)}
                    >
                      <View style={styles.locationHeader}>
                        <Text style={styles.locationName}>{item.name}</Text>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDelete(item)}
                        >
                          <IconSymbol
                            ios_icon_name="trash.fill"
                            android_material_icon_name="delete"
                            size={20}
                            color={colors.error}
                          />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.locationDetails}>
                        <View style={styles.detailRow}>
                          <IconSymbol
                            ios_icon_name="scalemass.fill"
                            android_material_icon_name="scale"
                            size={16}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.detailText}>
                            Capacity: {item.totalCapacity} {item.unit === 'percentage' ? '%' : item.unit}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <IconSymbol
                            ios_icon_name="chart.bar.fill"
                            android_material_icon_name="bar_chart"
                            size={16}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.detailText}>
                            Type: {item.capacityType === 'fixed' ? 'Fixed' : 'Percentage'}
                          </Text>
                        </View>
                      </View>

                      {item.notes && (
                        <Text style={styles.locationNotes} numberOfLines={2}>
                          {item.notes}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </React.Fragment>
            )}

            {/* Frozen Storage Section */}
            {frozenLocations.length > 0 && (
              <React.Fragment>
                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                  <IconSymbol
                    ios_icon_name="thermometer.snowflake"
                    android_material_icon_name="ac_unit"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles.sectionTitle}>Frozen Storage</Text>
                </View>
                {frozenLocations.map((item, index) => (
                  <React.Fragment key={index}>
                    <TouchableOpacity
                      style={[commonStyles.card, styles.locationCard]}
                      onPress={() => openEditModal(item)}
                    >
                      <View style={styles.locationHeader}>
                        <Text style={styles.locationName}>{item.name}</Text>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDelete(item)}
                        >
                          <IconSymbol
                            ios_icon_name="trash.fill"
                            android_material_icon_name="delete"
                            size={20}
                            color={colors.error}
                          />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.locationDetails}>
                        <View style={styles.detailRow}>
                          <IconSymbol
                            ios_icon_name="scalemass.fill"
                            android_material_icon_name="scale"
                            size={16}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.detailText}>
                            Capacity: {item.totalCapacity} {item.unit === 'percentage' ? '%' : item.unit}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <IconSymbol
                            ios_icon_name="chart.bar.fill"
                            android_material_icon_name="bar_chart"
                            size={16}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.detailText}>
                            Type: {item.capacityType === 'fixed' ? 'Fixed' : 'Percentage'}
                          </Text>
                        </View>
                      </View>

                      {item.notes && (
                        <Text style={styles.locationNotes} numberOfLines={2}>
                          {item.notes}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </React.Fragment>
            )}
          </React.Fragment>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Storage Location' : 'Add Storage Location'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="e.g., Main Barn, Walk-in Cooler"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Storage Type *</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === 'dry' && styles.typeButtonActive,
                  ]}
                  onPress={() => setType('dry')}
                >
                  <IconSymbol
                    ios_icon_name="cube.box.fill"
                    android_material_icon_name="inventory"
                    size={20}
                    color={type === 'dry' ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === 'dry' && styles.typeButtonTextActive,
                    ]}
                  >
                    Dry
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === 'cold' && styles.typeButtonActive,
                  ]}
                  onPress={() => setType('cold')}
                >
                  <IconSymbol
                    ios_icon_name="snowflake"
                    android_material_icon_name="ac_unit"
                    size={20}
                    color={type === 'cold' ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === 'cold' && styles.typeButtonTextActive,
                    ]}
                  >
                    Cold
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === 'frozen' && styles.typeButtonActive,
                  ]}
                  onPress={() => setType('frozen')}
                >
                  <IconSymbol
                    ios_icon_name="thermometer.snowflake"
                    android_material_icon_name="ac_unit"
                    size={20}
                    color={type === 'frozen' ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === 'frozen' && styles.typeButtonTextActive,
                    ]}
                  >
                    Frozen
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Capacity Type *</Text>
              <View style={styles.capacityTypeSelector}>
                <TouchableOpacity
                  style={[
                    styles.capacityTypeButton,
                    capacityType === 'fixed' && styles.capacityTypeButtonActive,
                  ]}
                  onPress={() => {
                    setCapacityType('fixed');
                    setUnit('sq_ft');
                  }}
                >
                  <Text
                    style={[
                      styles.capacityTypeButtonText,
                      capacityType === 'fixed' && styles.capacityTypeButtonTextActive,
                    ]}
                  >
                    Fixed (sq ft)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.capacityTypeButton,
                    capacityType === 'percentage' && styles.capacityTypeButtonActive,
                  ]}
                  onPress={() => {
                    setCapacityType('percentage');
                    setUnit('percentage');
                  }}
                >
                  <Text
                    style={[
                      styles.capacityTypeButtonText,
                      capacityType === 'percentage' && styles.capacityTypeButtonTextActive,
                    ]}
                  >
                    Percentage (%)
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>
                {capacityType === 'percentage' ? 'Percentage *' : 'Total Capacity (sq ft) *'}
              </Text>
              <TextInput
                style={commonStyles.input}
                placeholder={capacityType === 'percentage' ? '0-100' : '0'}
                placeholderTextColor={colors.textSecondary}
                value={totalCapacity}
                onChangeText={setTotalCapacity}
                keyboardType="decimal-pad"
              />
              {capacityType === 'percentage' && (
                <Text style={styles.helpText}>
                  Enter the percentage of total farm storage capacity
                </Text>
              )}

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[commonStyles.input, styles.notesInput]}
                placeholder="Additional information..."
                placeholderTextColor={colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[commonStyles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={commonStyles.buttonText}>
                  {editingItem ? 'Update' : 'Add'} Location
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 60 : 60,
    paddingBottom: 16,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  summaryScroll: {
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  summaryCard: {
    minWidth: 140,
    alignItems: 'center',
    padding: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  summaryCapacity: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  locationCard: {
    marginBottom: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  locationDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  locationNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalScroll: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
  },
  typeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  typeButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  capacityTypeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  capacityTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  capacityTypeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  capacityTypeButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  capacityTypeButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 16,
  },
});
