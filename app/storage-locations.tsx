
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
import { supabase } from '@/lib/supabase';

interface StorageLocation {
  id: string;
  type: 'dry' | 'refrigerated' | 'freezer';
  unit: 'sqft' | 'shelf' | 'lbs';
  capacity: number;
  used: number;
  created_at: string;
}

export default function StorageLocations() {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<StorageLocation | null>(null);
  const [loading, setLoading] = useState(true);

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
              console.log("Attempting to delete storage location with id:", item.id);
              
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                Alert.alert('Error', 'You must be logged in');
                return;
              }

              console.log("User ID:", user.id);

              const { error } = await supabase
                .from('storage_locations')
                .delete()
                .eq('id', item.id)
                .eq('user_id', user.id);

              if (error) {
                console.error('Error deleting storage location:', error);
                Alert.alert('Error', 'Failed to delete storage location: ' + (error.message || 'Unknown error'));
              } else {
                console.log("Delete successful");
                loadLocations();
                Alert.alert('Success', 'Storage location deleted successfully');
              }
            } catch (error: any) {
              console.error('Error deleting storage location:', error);
              Alert.alert('Error', 'An unexpected error occurred: ' + (error.message || 'Unknown error'));
            }
          },
        },
      ]
    );
  };

  const getTypeLabel = (type: StorageLocation['type']) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getTypeIcon = (type: StorageLocation['type']) => {
    switch (type) {
      case 'dry':
        return { ios: 'cube.box.fill', android: 'inventory' };
      case 'refrigerated':
        return { ios: 'snowflake', android: 'ac_unit' };
      case 'freezer':
        return { ios: 'thermometer.snowflake', android: 'ac_unit' };
    }
  };

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

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
                ios_icon_name="tray"
                android_material_icon_name="inventory_2"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No storage locations found</Text>
              <Text style={styles.emptySubtext}>
                Add your first storage location to get started
              </Text>
            </View>
          ) : (
            locations.map((item, index) => {
              const usagePercent = (item.used / item.capacity) * 100;
              const icon = getTypeIcon(item.type);
              
              return (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    style={[commonStyles.card, styles.itemCard]}
                    onPress={() => openEditModal(item)}
                  >
                    <View style={styles.itemHeader}>
                      <View style={styles.itemTitleRow}>
                        <IconSymbol
                          ios_icon_name={icon.ios}
                          android_material_icon_name={icon.android}
                          size={24}
                          color={colors.primary}
                        />
                        <Text style={styles.itemName}>{getTypeLabel(item.type)} Storage</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => {
                          console.log("Delete button pressed for storage location:", item.id);
                          handleDelete(item);
                        }}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                      >
                        <IconSymbol
                          ios_icon_name="trash.fill"
                          android_material_icon_name="delete"
                          size={22}
                          color={colors.error}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.itemDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Capacity:</Text>
                        <Text style={styles.detailValue}>
                          {item.capacity} {item.unit}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Used:</Text>
                        <Text style={styles.detailValue}>
                          {item.used.toFixed(1)} {item.unit}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Available:</Text>
                        <Text style={[styles.detailValue, { color: colors.success }]}>
                          {(item.capacity - item.used).toFixed(1)} {item.unit}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${Math.min(usagePercent, 100)}%`,
                              backgroundColor:
                                usagePercent > 90 ? colors.error :
                                usagePercent > 70 ? colors.warning :
                                colors.success,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {usagePercent.toFixed(1)}% utilized
                      </Text>
                    </View>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

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
                        {getTypeLabel(t)}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>

              <Text style={styles.label}>Unit *</Text>
              <View style={styles.unitSelector}>
                {(['sqft', 'shelf', 'lbs'] as const).map((u, idx) => (
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
                        {u}
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
                  {editingItem ? 'Update' : 'Add'} Storage Location
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
  itemCard: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  deleteButton: {
    padding: 8,
  },
  itemDetails: {
    marginBottom: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.highlight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
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
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.highlight,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: colors.primary,
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  unitButtonTextActive: {
    color: colors.card,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 16,
  },
});
