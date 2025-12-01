
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
  ActivityIndicator,
} from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { router } from 'expo-router';
import { StorageLocation } from '@/types/inventory';
import { supabase } from '@/lib/supabase';

export default function StorageLocationsScreen() {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<StorageLocation | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [type, setType] = useState<StorageLocation['type']>('dry');
  const [unit, setUnit] = useState<StorageLocation['unit']>('sqft');
  const [capacity, setCapacity] = useState('');

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('storage_locations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading storage locations:', error);
        Alert.alert('Error', 'Failed to load storage locations');
      } else {
        setLocations(data || []);
      }
    } catch (error) {
      console.error('Error loading storage locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (item: StorageLocation) => {
    setEditingItem(item);
    setType(item.type);
    setUnit(item.unit);
    setCapacity(item.capacity.toString());
    setModalVisible(true);
  };

  const resetForm = () => {
    setType('dry');
    setUnit('sqft');
    setCapacity('');
  };

  const handleSave = async () => {
    if (!capacity) {
      Alert.alert('Error', 'Please enter capacity');
      return;
    }

    const cap = parseFloat(capacity);
    if (isNaN(cap) || cap <= 0) {
      Alert.alert('Error', 'Please enter a valid capacity');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in');
        return;
      }

      if (editingItem) {
        // Update existing
        const { error } = await supabase
          .from('storage_locations')
          .update({
            type,
            unit,
            capacity: cap,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating storage location:', error);
          Alert.alert('Error', 'Failed to update storage location');
          return;
        }
      } else {
        // Insert new
        const { error } = await supabase
          .from('storage_locations')
          .insert({
            user_id: user.id,
            type,
            unit,
            capacity: cap,
            used: 0,
          });

        if (error) {
          console.error('Error adding storage location:', error);
          Alert.alert('Error', 'Failed to add storage location');
          return;
        }
      }

      setModalVisible(false);
      resetForm();
      loadLocations();
      Alert.alert('Success', `Storage location ${editingItem ? 'updated' : 'added'} successfully`);
    } catch (error) {
      console.error('Error saving storage location:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleDelete = (item: StorageLocation) => {
    Alert.alert(
      'Delete Storage Location',
      `Are you sure you want to delete this ${item.type} storage location?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                Alert.alert('Error', 'You must be logged in');
                return;
              }

              const { error } = await supabase
                .from('storage_locations')
                .delete()
                .eq('id', item.id)
                .eq('user_id', user.id);

              if (error) {
                console.error('Error deleting storage location:', error);
                Alert.alert('Error', 'Failed to delete storage location');
              } else {
                loadLocations();
                Alert.alert('Success', 'Storage location deleted successfully');
              }
            } catch (error) {
              console.error('Error deleting storage location:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
  };

  const dryLocations = locations.filter(l => l.type === 'dry');
  const refrigeratedLocations = locations.filter(l => l.type === 'refrigerated');
  const freezerLocations = locations.filter(l => l.type === 'freezer');

  const getTotalCapacity = (locs: StorageLocation[]) => {
    return locs.reduce((sum, l) => sum + l.capacity, 0);
  };

  const getTotalUsed = (locs: StorageLocation[]) => {
    return locs.reduce((sum, l) => sum + (l.used || 0), 0);
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
            {getTotalUsed(dryLocations).toFixed(0)} / {getTotalCapacity(dryLocations).toFixed(0)}
          </Text>
        </View>

        <View style={[commonStyles.card, styles.summaryCard]}>
          <IconSymbol
            ios_icon_name="snowflake"
            android_material_icon_name="ac_unit"
            size={28}
            color="#2196F3"
          />
          <Text style={styles.summaryTitle}>Refrigerated</Text>
          <Text style={styles.summaryValue}>{refrigeratedLocations.length} locations</Text>
          <Text style={styles.summaryCapacity}>
            {getTotalUsed(refrigeratedLocations).toFixed(0)} / {getTotalCapacity(refrigeratedLocations).toFixed(0)}
          </Text>
        </View>

        <View style={[commonStyles.card, styles.summaryCard]}>
          <IconSymbol
            ios_icon_name="thermometer.snowflake"
            android_material_icon_name="ac_unit"
            size={28}
            color="#00BCD4"
          />
          <Text style={styles.summaryTitle}>Freezer</Text>
          <Text style={styles.summaryValue}>{freezerLocations.length} locations</Text>
          <Text style={styles.summaryCapacity}>
            {getTotalUsed(freezerLocations).toFixed(0)} / {getTotalCapacity(freezerLocations).toFixed(0)}
          </Text>
        </View>
      </ScrollView>

      {/* Storage Locations List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading storage locations...</Text>
        </View>
      ) : (
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
                          <Text style={styles.locationName}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)} Storage</Text>
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
                              Capacity: {item.capacity} {item.unit}
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
                              Used: {item.used || 0} {item.unit}
                            </Text>
                          </View>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${Math.min(((item.used || 0) / item.capacity) * 100, 100)}%`,
                                  backgroundColor:
                                    ((item.used || 0) / item.capacity) > 0.9
                                      ? colors.error
                                      : ((item.used || 0) / item.capacity) > 0.7
                                      ? colors.warning
                                      : colors.success,
                                },
                              ]}
                            />
                          </View>
                        </View>
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
                          <Text style={styles.locationName}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)} Storage</Text>
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
                              Capacity: {item.capacity} {item.unit}
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
                              Used: {item.used || 0} {item.unit}
                            </Text>
                          </View>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${Math.min(((item.used || 0) / item.capacity) * 100, 100)}%`,
                                  backgroundColor:
                                    ((item.used || 0) / item.capacity) > 0.9
                                      ? colors.error
                                      : ((item.used || 0) / item.capacity) > 0.7
                                      ? colors.warning
                                      : colors.success,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      </TouchableOpacity>
                    </React.Fragment>
                  ))}
                </React.Fragment>
              )}

              {/* Freezer Storage Section */}
              {freezerLocations.length > 0 && (
                <React.Fragment>
                  <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                    <IconSymbol
                      ios_icon_name="thermometer.snowflake"
                      android_material_icon_name="ac_unit"
                      size={20}
                      color={colors.text}
                    />
                    <Text style={styles.sectionTitle}>Freezer Storage</Text>
                  </View>
                  {freezerLocations.map((item, index) => (
                    <React.Fragment key={index}>
                      <TouchableOpacity
                        style={[commonStyles.card, styles.locationCard]}
                        onPress={() => openEditModal(item)}
                      >
                        <View style={styles.locationHeader}>
                          <Text style={styles.locationName}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)} Storage</Text>
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
                              Capacity: {item.capacity} {item.unit}
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
                              Used: {item.used || 0} {item.unit}
                            </Text>
                          </View>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${Math.min(((item.used || 0) / item.capacity) * 100, 100)}%`,
                                  backgroundColor:
                                    ((item.used || 0) / item.capacity) > 0.9
                                      ? colors.error
                                      : ((item.used || 0) / item.capacity) > 0.7
                                      ? colors.warning
                                      : colors.success,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      </TouchableOpacity>
                    </React.Fragment>
                  ))}
                </React.Fragment>
              )}
            </React.Fragment>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

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
              <Text style={styles.label}>Storage Type *</Text>
              <View style={styles.typeSelector}>
                {(['dry', 'refrigerated', 'freezer'] as const).map((t, idx) => (
                  <React.Fragment key={idx}>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        type === t && styles.typeButtonActive,
                      ]}
                      onPress={() => setType(t)}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          type === t && styles.typeButtonTextActive,
                        ]}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>

              <Text style={styles.label}>Unit *</Text>
              <View style={styles.unitSelector}>
                {(['sqft', 'shelf'] as const).map((u, idx) => (
                  <React.Fragment key={idx}>
                    <TouchableOpacity
                      style={[
                        styles.unitButton,
                        unit === u && styles.unitButtonActive,
                      ]}
                      onPress={() => setUnit(u)}
                    >
                      <Text
                        style={[
                          styles.unitButtonText,
                          unit === u && styles.unitButtonTextActive,
                        ]}
                      >
                        {u === 'sqft' ? 'Square Feet' : 'Shelf'}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>

              <Text style={styles.label}>Capacity *</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                value={capacity}
                onChangeText={setCapacity}
                keyboardType="decimal-pad"
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
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
    marginBottom: 12,
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
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.highlight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
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
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
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
  unitSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  unitButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  unitButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  unitButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 16,
  },
});
