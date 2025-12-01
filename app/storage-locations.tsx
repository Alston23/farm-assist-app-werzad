
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
  const [totalCapacity, setTotalCapacity] = useState('');
  const [unit, setUnit] = useState<StorageLocation['unit']>('lbs');
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
    setTotalCapacity(item.totalCapacity.toString());
    setUnit(item.unit);
    setNotes(item.notes || '');
    setModalVisible(true);
  };

  const resetForm = () => {
    setName('');
    setType('dry');
    setTotalCapacity('');
    setUnit('lbs');
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

    const newItem: StorageLocation = {
      id: editingItem?.id || Date.now().toString(),
      name: name.trim(),
      type,
      totalCapacity: capacity,
      unit,
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
  const refrigeratedLocations = locations.filter(l => l.type === 'refrigerated');

  const getTotalCapacity = (locs: StorageLocation[]) => {
    return locs.reduce((sum, l) => sum + l.totalCapacity, 0);
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
      <View style={styles.summaryContainer}>
        <View style={[commonStyles.card, styles.summaryCard]}>
          <IconSymbol
            ios_icon_name="cube.box.fill"
            android_material_icon_name="inventory"
            size={32}
            color={colors.primary}
          />
          <Text style={styles.summaryTitle}>Dry Storage</Text>
          <Text style={styles.summaryValue}>{dryLocations.length} locations</Text>
          <Text style={styles.summaryCapacity}>
            {getTotalCapacity(dryLocations).toFixed(0)} lbs total
          </Text>
        </View>

        <View style={[commonStyles.card, styles.summaryCard]}>
          <IconSymbol
            ios_icon_name="snowflake"
            android_material_icon_name="ac_unit"
            size={32}
            color="#2196F3"
          />
          <Text style={styles.summaryTitle}>Refrigerated</Text>
          <Text style={styles.summaryValue}>{refrigeratedLocations.length} locations</Text>
          <Text style={styles.summaryCapacity}>
            {getTotalCapacity(refrigeratedLocations).toFixed(0)} lbs total
          </Text>
        </View>
      </View>

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
                            Capacity: {item.totalCapacity} {item.unit}
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

            {/* Refrigerated Storage Section */}
            {refrigeratedLocations.length > 0 && (
              <React.Fragment>
                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                  <IconSymbol
                    ios_icon_name="snowflake"
                    android_material_icon_name="ac_unit"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles.sectionTitle}>Refrigerated Storage</Text>
                </View>
                {refrigeratedLocations.map((item, index) => (
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
                            Capacity: {item.totalCapacity} {item.unit}
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

              <Text style={styles.label}>Type *</Text>
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
                    size={24}
                    color={type === 'dry' ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === 'dry' && styles.typeButtonTextActive,
                    ]}
                  >
                    Dry Storage
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === 'refrigerated' && styles.typeButtonActive,
                  ]}
                  onPress={() => setType('refrigerated')}
                >
                  <IconSymbol
                    ios_icon_name="snowflake"
                    android_material_icon_name="ac_unit"
                    size={24}
                    color={type === 'refrigerated' ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === 'refrigerated' && styles.typeButtonTextActive,
                    ]}
                  >
                    Refrigerated
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Total Capacity *</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[commonStyles.input, styles.capacityInput]}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  value={totalCapacity}
                  onChangeText={setTotalCapacity}
                  keyboardType="decimal-pad"
                />
                <View style={styles.unitSelector}>
                  {(['lbs', 'kg', 'cubic_feet', 'cubic_meters'] as const).map((u, idx) => (
                    <React.Fragment key={idx}>
                      <TouchableOpacity
                        style={[
                          styles.unitOption,
                          unit === u && styles.unitOptionSelected,
                        ]}
                        onPress={() => setUnit(u)}
                      >
                        <Text
                          style={[
                            styles.unitOptionText,
                            unit === u && styles.unitOptionTextSelected,
                          ]}
                        >
                          {u === 'cubic_feet' ? 'ft³' : u === 'cubic_meters' ? 'm³' : u}
                        </Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  ))}
                </View>
              </View>

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
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
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
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
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
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capacityInput: {
    flex: 1,
    marginRight: 12,
  },
  unitSelector: {
    flexDirection: 'column',
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 2,
  },
  unitOption: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  unitOptionSelected: {
    backgroundColor: colors.card,
  },
  unitOptionText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  unitOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
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
