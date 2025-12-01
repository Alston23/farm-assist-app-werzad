
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
import { SeedItem } from '@/types/inventory';

export default function SeedsScreen() {
  const [seeds, setSeeds] = useState<SeedItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<SeedItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [cropName, setCropName] = useState('');
  const [variety, setVariety] = useState('');
  const [itemType, setItemType] = useState<SeedItem['itemType']>('seed');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<SeedItem['unit']>('packets');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadSeeds();
  }, []);

  const loadSeeds = async () => {
    const data = await inventoryStorage.getSeeds();
    setSeeds(data);
  };

  const openAddModal = () => {
    setEditingItem(null);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (item: SeedItem) => {
    setEditingItem(item);
    setCropName(item.cropName);
    setVariety(item.variety);
    setItemType(item.itemType || 'seed');
    setQuantity(item.quantity.toString());
    setUnit(item.unit);
    setLowStockThreshold(item.lowStockThreshold.toString());
    setNotes(item.notes || '');
    setModalVisible(true);
  };

  const resetForm = () => {
    setCropName('');
    setVariety('');
    setItemType('seed');
    setQuantity('');
    setUnit('packets');
    setLowStockThreshold('');
    setNotes('');
  };

  const handleSave = async () => {
    if (!cropName.trim() || !variety.trim() || !quantity || !lowStockThreshold) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newItem: SeedItem = {
      id: editingItem?.id || Date.now().toString(),
      cropName: cropName.trim(),
      variety: variety.trim(),
      itemType,
      quantity: parseFloat(quantity),
      unit,
      purchaseDate: editingItem?.purchaseDate || new Date().toISOString(),
      lowStockThreshold: parseFloat(lowStockThreshold),
      notes: notes.trim(),
    };

    let updatedSeeds;
    if (editingItem) {
      updatedSeeds = seeds.map(item =>
        item.id === editingItem.id ? newItem : item
      );
    } else {
      updatedSeeds = [...seeds, newItem];
    }

    await inventoryStorage.saveSeeds(updatedSeeds);
    setSeeds(updatedSeeds);
    setModalVisible(false);
    resetForm();
  };

  const handleDelete = (item: SeedItem) => {
    Alert.alert(
      'Delete Seed',
      `Are you sure you want to delete ${item.cropName} - ${item.variety}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedSeeds = seeds.filter(s => s.id !== item.id);
            await inventoryStorage.saveSeeds(updatedSeeds);
            setSeeds(updatedSeeds);
          },
        },
      ]
    );
  };

  const filteredSeeds = seeds.filter(item =>
    item.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.variety.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Text style={styles.headerTitle}>Seeds</Text>
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <IconSymbol
          ios_icon_name="magnifyingglass"
          android_material_icon_name="search"
          size={20}
          color={colors.textSecondary}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search seeds..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Seeds List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredSeeds.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="tray"
              android_material_icon_name="inventory_2"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No seeds found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Add your first seed inventory to get started'}
            </Text>
          </View>
        ) : (
          filteredSeeds.map((item, index) => {
            const isLowStock = item.quantity <= item.lowStockThreshold;
            return (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={[commonStyles.card, styles.itemCard]}
                  onPress={() => openEditModal(item)}
                >
                  <View style={styles.itemHeader}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemName}>{item.cropName}</Text>
                      {isLowStock && (
                        <View style={styles.lowStockBadge}>
                          <IconSymbol
                            ios_icon_name="exclamationmark.triangle.fill"
                            android_material_icon_name="warning"
                            size={14}
                            color={colors.warning}
                          />
                        </View>
                      )}
                    </View>
                    <Text style={styles.varietyText}>{item.variety}</Text>
                  </View>

                  <View style={styles.itemDetails}>
                    <View style={styles.detailRow}>
                      <IconSymbol
                        ios_icon_name="number"
                        android_material_icon_name="tag"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.detailText}>
                        {item.quantity} {item.unit}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <IconSymbol
                        ios_icon_name="chart.line.downtrend.xyaxis"
                        android_material_icon_name="trending_down"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.detailText}>
                        Low stock: {item.lowStockThreshold} {item.unit}
                      </Text>
                    </View>
                  </View>

                  {item.notes && (
                    <Text style={styles.itemNotes} numberOfLines={2}>
                      {item.notes}
                    </Text>
                  )}

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
                </TouchableOpacity>
              </React.Fragment>
            );
          })
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
                {editingItem ? 'Edit Seed' : 'Add Seed'}
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
              <Text style={styles.label}>Type *</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    itemType === 'seed' && styles.typeButtonActive,
                  ]}
                  onPress={() => {
                    setItemType('seed');
                    setUnit('packets');
                  }}
                >
                  <IconSymbol
                    ios_icon_name="leaf.fill"
                    android_material_icon_name="eco"
                    size={20}
                    color={itemType === 'seed' ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      itemType === 'seed' && styles.typeButtonTextActive,
                    ]}
                  >
                    Seeds
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    itemType === 'transplant' && styles.typeButtonActive,
                  ]}
                  onPress={() => {
                    setItemType('transplant');
                    setUnit('plants');
                  }}
                >
                  <IconSymbol
                    ios_icon_name="tree.fill"
                    android_material_icon_name="local_florist"
                    size={20}
                    color={itemType === 'transplant' ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      itemType === 'transplant' && styles.typeButtonTextActive,
                    ]}
                  >
                    Transplants
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Crop Name *</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="e.g., Tomato"
                placeholderTextColor={colors.textSecondary}
                value={cropName}
                onChangeText={setCropName}
              />

              <Text style={styles.label}>Variety *</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="e.g., Cherokee Purple"
                placeholderTextColor={colors.textSecondary}
                value={variety}
                onChangeText={setVariety}
              />

              <Text style={styles.label}>Quantity *</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[commonStyles.input, styles.quantityInput]}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                />
                <View style={styles.unitSelector}>
                  {(itemType === 'seed' 
                    ? (['seeds', 'packets', 'lbs', 'kg'] as const)
                    : (['plants', 'trays', 'lbs', 'kg'] as const)
                  ).map((u, idx) => (
                    <React.Fragment key={idx}>
                      <TouchableOpacity
                        style={[
                          styles.unitOption,
                          unit === u && styles.unitOptionSelected,
                        ]}
                        onPress={() => setUnit(u as SeedItem['unit'])}
                      >
                        <Text
                          style={[
                            styles.unitOptionText,
                            unit === u && styles.unitOptionTextSelected,
                          ]}
                        >
                          {u}
                        </Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  ))}
                </View>
              </View>

              <Text style={styles.label}>Low Stock Threshold *</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="Alert when below this amount"
                placeholderTextColor={colors.textSecondary}
                value={lowStockThreshold}
                onChangeText={setLowStockThreshold}
                keyboardType="decimal-pad"
              />

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
                  {editingItem ? 'Update' : 'Add'} Seed
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
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
    position: 'relative',
  },
  itemHeader: {
    marginBottom: 12,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  varietyText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  lowStockBadge: {
    marginLeft: 8,
  },
  itemDetails: {
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
  itemNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
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
  quantityInput: {
    flex: 1,
    marginRight: 12,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 2,
  },
  unitOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  unitOptionSelected: {
    backgroundColor: colors.card,
  },
  unitOptionText: {
    fontSize: 12,
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
