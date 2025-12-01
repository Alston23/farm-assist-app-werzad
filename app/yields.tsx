
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { router } from 'expo-router';
import { inventoryStorage } from '@/utils/inventoryStorage';
import { YieldItem } from '@/types/inventory';

export default function YieldsScreen() {
  const [yields, setYields] = useState<YieldItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingYield, setEditingYield] = useState<YieldItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStorage, setFilterStorage] = useState<'all' | 'dry' | 'refrigerated'>('all');

  // Form state
  const [formData, setFormData] = useState<Partial<YieldItem>>({
    cropName: '',
    variety: '',
    quantity: 0,
    unit: 'lbs',
    harvestDate: new Date().toISOString().split('T')[0],
    storageLocation: 'dry',
    quality: 'good',
    lotNumber: '',
    notes: '',
  });

  useEffect(() => {
    loadYields();
  }, []);

  const loadYields = async () => {
    const loadedYields = await inventoryStorage.getYields();
    setYields(loadedYields);
  };

  const handleSave = async () => {
    if (!formData.cropName || !formData.quantity || formData.quantity <= 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newYield: YieldItem = {
      id: editingYield?.id || Date.now().toString(),
      cropName: formData.cropName!,
      variety: formData.variety,
      quantity: formData.quantity!,
      unit: formData.unit || 'lbs',
      harvestDate: formData.harvestDate || new Date().toISOString().split('T')[0],
      storageLocation: formData.storageLocation || 'dry',
      quality: formData.quality,
      lotNumber: formData.lotNumber,
      notes: formData.notes,
    };

    let updatedYields: YieldItem[];
    if (editingYield) {
      updatedYields = yields.map(y => y.id === editingYield.id ? newYield : y);
    } else {
      updatedYields = [...yields, newYield];
    }

    await inventoryStorage.saveYields(updatedYields);
    setYields(updatedYields);
    resetForm();
    setShowAddModal(false);
  };

  const handleEdit = (yieldItem: YieldItem) => {
    setEditingYield(yieldItem);
    setFormData(yieldItem);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Yield',
      'Are you sure you want to delete this harvest yield?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedYields = yields.filter(y => y.id !== id);
            await inventoryStorage.saveYields(updatedYields);
            setYields(updatedYields);
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      cropName: '',
      variety: '',
      quantity: 0,
      unit: 'lbs',
      harvestDate: new Date().toISOString().split('T')[0],
      storageLocation: 'dry',
      quality: 'good',
      lotNumber: '',
      notes: '',
    });
    setEditingYield(null);
  };

  const filteredYields = yields.filter(yieldItem => {
    const matchesSearch = yieldItem.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      yieldItem.variety?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      yieldItem.lotNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStorage === 'all' || yieldItem.storageLocation === filterStorage;
    return matchesSearch && matchesFilter;
  });

  const getQualityColor = (quality?: string) => {
    switch (quality) {
      case 'excellent': return colors.success;
      case 'good': return colors.primary;
      case 'fair': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={commonStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Harvest Yields</Text>
          <Text style={styles.headerSubtitle}>{yields.length} items in storage</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            resetForm();
            setShowAddModal(true);
          }}
          style={styles.addButton}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <IconSymbol
            ios_icon_name="magnifyingglass"
            android_material_icon_name="search"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by crop, variety, or lot number..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filterStorage === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterStorage('all')}
          >
            <Text style={[styles.filterText, filterStorage === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStorage === 'dry' && styles.filterButtonActive]}
            onPress={() => setFilterStorage('dry')}
          >
            <IconSymbol
              ios_icon_name="cube.box.fill"
              android_material_icon_name="inventory"
              size={16}
              color={filterStorage === 'dry' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.filterText, filterStorage === 'dry' && styles.filterTextActive]}>
              Dry
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStorage === 'refrigerated' && styles.filterButtonActive]}
            onPress={() => setFilterStorage('refrigerated')}
          >
            <IconSymbol
              ios_icon_name="snowflake"
              android_material_icon_name="ac_unit"
              size={16}
              color={filterStorage === 'refrigerated' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.filterText, filterStorage === 'refrigerated' && styles.filterTextActive]}>
              Refrigerated
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Yields List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredYields.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="tray"
              android_material_icon_name="inventory_2"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No harvest yields found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || filterStorage !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add your first harvest yield to get started'}
            </Text>
          </View>
        ) : (
          filteredYields.map((yieldItem, index) => (
            <React.Fragment key={index}>
              <View style={[commonStyles.card, styles.yieldCard]}>
                <View style={styles.yieldHeader}>
                  <View style={styles.yieldTitleContainer}>
                    <Text style={styles.yieldCrop}>{yieldItem.cropName}</Text>
                    {yieldItem.variety && (
                      <Text style={styles.yieldVariety}>({yieldItem.variety})</Text>
                    )}
                  </View>
                  <View style={styles.yieldActions}>
                    <TouchableOpacity
                      onPress={() => handleEdit(yieldItem)}
                      style={styles.actionIcon}
                    >
                      <IconSymbol
                        ios_icon_name="pencil"
                        android_material_icon_name="edit"
                        size={20}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(yieldItem.id)}
                      style={styles.actionIcon}
                    >
                      <IconSymbol
                        ios_icon_name="trash"
                        android_material_icon_name="delete"
                        size={20}
                        color={colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.yieldDetails}>
                  <View style={styles.detailRow}>
                    <IconSymbol
                      ios_icon_name="scalemass.fill"
                      android_material_icon_name="scale"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.detailText}>
                      {yieldItem.quantity} {yieldItem.unit}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <IconSymbol
                      ios_icon_name="calendar"
                      android_material_icon_name="event"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.detailText}>
                      Harvested: {new Date(yieldItem.harvestDate).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <IconSymbol
                      ios_icon_name={yieldItem.storageLocation === 'dry' ? 'cube.box.fill' : 'snowflake'}
                      android_material_icon_name={yieldItem.storageLocation === 'dry' ? 'inventory' : 'ac_unit'}
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.detailText}>
                      {yieldItem.storageLocation === 'dry' ? 'Dry Storage' : 'Refrigerated'}
                    </Text>
                  </View>

                  {yieldItem.quality && (
                    <View style={styles.detailRow}>
                      <IconSymbol
                        ios_icon_name="star.fill"
                        android_material_icon_name="star"
                        size={16}
                        color={getQualityColor(yieldItem.quality)}
                      />
                      <Text style={[styles.detailText, { color: getQualityColor(yieldItem.quality) }]}>
                        Quality: {yieldItem.quality.charAt(0).toUpperCase() + yieldItem.quality.slice(1)}
                      </Text>
                    </View>
                  )}

                  {yieldItem.lotNumber && (
                    <View style={[styles.detailRow, styles.lotNumberRow]}>
                      <IconSymbol
                        ios_icon_name="number.circle.fill"
                        android_material_icon_name="tag"
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={[styles.detailText, styles.lotNumberText]}>
                        Lot #: {yieldItem.lotNumber}
                      </Text>
                    </View>
                  )}

                  {yieldItem.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesText}>{yieldItem.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            </React.Fragment>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          resetForm();
          setShowAddModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingYield ? 'Edit Harvest Yield' : 'Add Harvest Yield'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setShowAddModal(false);
                }}
              >
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Crop Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Tomatoes"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.cropName}
                  onChangeText={(text) => setFormData({ ...formData, cropName: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Variety</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Roma, Cherry"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.variety}
                  onChangeText={(text) => setFormData({ ...formData, variety: text })}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={formData.quantity?.toString()}
                    onChangeText={(text) => setFormData({ ...formData, quantity: parseFloat(text) || 0 })}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Unit</Text>
                  <View style={styles.unitSelector}>
                    {(['lbs', 'kg', 'bushels', 'units'] as const).map((unit, index) => (
                      <React.Fragment key={index}>
                        <TouchableOpacity
                          style={[
                            styles.unitButton,
                            formData.unit === unit && styles.unitButtonActive,
                          ]}
                          onPress={() => setFormData({ ...formData, unit })}
                        >
                          <Text
                            style={[
                              styles.unitButtonText,
                              formData.unit === unit && styles.unitButtonTextActive,
                            ]}
                          >
                            {unit}
                          </Text>
                        </TouchableOpacity>
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Harvest Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.harvestDate}
                  onChangeText={(text) => setFormData({ ...formData, harvestDate: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Storage Location</Text>
                <View style={styles.storageSelector}>
                  <TouchableOpacity
                    style={[
                      styles.storageButton,
                      formData.storageLocation === 'dry' && styles.storageButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, storageLocation: 'dry' })}
                  >
                    <IconSymbol
                      ios_icon_name="cube.box.fill"
                      android_material_icon_name="inventory"
                      size={20}
                      color={formData.storageLocation === 'dry' ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.storageButtonText,
                        formData.storageLocation === 'dry' && styles.storageButtonTextActive,
                      ]}
                    >
                      Dry Storage
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.storageButton,
                      formData.storageLocation === 'refrigerated' && styles.storageButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, storageLocation: 'refrigerated' })}
                  >
                    <IconSymbol
                      ios_icon_name="snowflake"
                      android_material_icon_name="ac_unit"
                      size={20}
                      color={formData.storageLocation === 'refrigerated' ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.storageButtonText,
                        formData.storageLocation === 'refrigerated' && styles.storageButtonTextActive,
                      ]}
                    >
                      Refrigerated
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Quality</Text>
                <View style={styles.qualitySelector}>
                  {(['excellent', 'good', 'fair'] as const).map((quality, index) => (
                    <React.Fragment key={index}>
                      <TouchableOpacity
                        style={[
                          styles.qualityButton,
                          formData.quality === quality && styles.qualityButtonActive,
                        ]}
                        onPress={() => setFormData({ ...formData, quality })}
                      >
                        <Text
                          style={[
                            styles.qualityButtonText,
                            formData.quality === quality && styles.qualityButtonTextActive,
                          ]}
                        >
                          {quality.charAt(0).toUpperCase() + quality.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.labelWithInfo}>
                  <Text style={styles.label}>Lot Number</Text>
                  <View style={styles.infoContainer}>
                    <IconSymbol
                      ios_icon_name="info.circle"
                      android_material_icon_name="info"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.infoText}>For food safety tracking</Text>
                  </View>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., LOT-2024-001"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.lotNumber}
                  onChangeText={(text) => setFormData({ ...formData, lotNumber: text })}
                />
                <Text style={styles.helpText}>
                  Important for restaurant sales and traceability
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Additional notes..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingYield ? 'Update Yield' : 'Add Yield'}
                </Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 60 : 60,
    paddingBottom: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.highlight,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
    gap: 4,
  },
  filterButtonActive: {
    backgroundColor: colors.primary + '20',
  },
  filterText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.primary,
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
    paddingHorizontal: 32,
  },
  yieldCard: {
    marginBottom: 12,
    padding: 16,
  },
  yieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  yieldTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  yieldCrop: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginRight: 6,
  },
  yieldVariety: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  yieldActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: {
    padding: 4,
  },
  yieldDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
  },
  lotNumberRow: {
    backgroundColor: colors.primary + '10',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  lotNumberText: {
    fontWeight: '600',
    color: colors.primary,
  },
  notesContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.highlight,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.highlight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalScroll: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  labelWithInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.highlight,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.highlight,
  },
  unitButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  unitButtonTextActive: {
    color: '#FFFFFF',
  },
  storageSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  storageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.highlight,
  },
  storageButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  storageButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  storageButtonTextActive: {
    color: colors.primary,
  },
  qualitySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.highlight,
    alignItems: 'center',
  },
  qualityButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  qualityButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  qualityButtonTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
