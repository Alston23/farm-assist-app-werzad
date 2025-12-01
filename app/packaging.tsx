
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
import { PackagingItem } from '@/types/inventory';

export default function PackagingScreen() {
  const [packaging, setPackaging] = useState<PackagingItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<PackagingItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<PackagingItem['type']>('box');
  const [quantity, setQuantity] = useState('');
  const [size, setSize] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadPackaging();
  }, []);

  const loadPackaging = async () => {
    const data = await inventoryStorage.getPackaging();
    setPackaging(data);
  };

  const openAddModal = () => {
    setEditingItem(null);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (item: PackagingItem) => {
    setEditingItem(item);
    setName(item.name);
    setType(item.type);
    setQuantity(item.quantity.toString());
    setSize(item.size || '');
    setLowStockThreshold(item.lowStockThreshold.toString());
    setNotes(item.notes || '');
    setModalVisible(true);
  };

  const resetForm = () => {
    setName('');
    setType('box');
    setQuantity('');
    setSize('');
    setLowStockThreshold('');
    setNotes('');
  };

  const handleSave = async () => {
    if (!name.trim() || !quantity || !lowStockThreshold) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newItem: PackagingItem = {
      id: editingItem?.id || Date.now().toString(),
      name: name.trim(),
      type,
      quantity: parseFloat(quantity),
      size: size.trim(),
      lowStockThreshold: parseFloat(lowStockThreshold),
      notes: notes.trim(),
    };

    let updatedPackaging;
    if (editingItem) {
      updatedPackaging = packaging.map(item =>
        item.id === editingItem.id ? newItem : item
      );
    } else {
      updatedPackaging = [...packaging, newItem];
    }

    await inventoryStorage.savePackaging(updatedPackaging);
    setPackaging(updatedPackaging);
    setModalVisible(false);
    resetForm();
  };

  const handleDelete = (item: PackagingItem) => {
    Alert.alert(
      'Delete Packaging',
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedPackaging = packaging.filter(p => p.id !== item.id);
            await inventoryStorage.savePackaging(updatedPackaging);
            setPackaging(updatedPackaging);
          },
        },
      ]
    );
  };

  const filteredPackaging = packaging.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeColor = (itemType: string) => {
    const colors_map: Record<string, string> = {
      box: '#FF9800',
      bag: '#4CAF50',
      container: '#2196F3',
      crate: '#795548',
      basket: '#FFC107',
      other: '#757575',
    };
    return colors_map[itemType] || colors.text;
  };

  const getTypeIcon = (itemType: string) => {
    const icons: Record<string, { ios: string; android: string }> = {
      box: { ios: 'shippingbox.fill', android: 'inventory_2' },
      bag: { ios: 'bag.fill', android: 'shopping_bag' },
      container: { ios: 'cube.box.fill', android: 'inventory' },
      crate: { ios: 'square.stack.3d.up.fill', android: 'view_in_ar' },
      basket: { ios: 'basket.fill', android: 'shopping_basket' },
      other: { ios: 'square.fill', android: 'category' },
    };
    return icons[itemType] || icons.other;
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
        <Text style={styles.headerTitle}>Packaging</Text>
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
          placeholder="Search packaging..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Packaging List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredPackaging.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="tray"
              android_material_icon_name="inventory_2"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No packaging found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Add your first packaging item to get started'}
            </Text>
          </View>
        ) : (
          filteredPackaging.map((item, index) => {
            const isLowStock = item.quantity <= item.lowStockThreshold;
            const typeIcon = getTypeIcon(item.type);
            return (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={[commonStyles.card, styles.itemCard]}
                  onPress={() => openEditModal(item)}
                >
                  <View style={styles.itemHeader}>
                    <View style={[styles.typeIconContainer, { backgroundColor: getTypeColor(item.type) + '20' }]}>
                      <IconSymbol
                        ios_icon_name={typeIcon.ios}
                        android_material_icon_name={typeIcon.android}
                        size={24}
                        color={getTypeColor(item.type)}
                      />
                    </View>
                    <View style={styles.itemInfo}>
                      <View style={styles.itemTitleRow}>
                        <Text style={styles.itemName}>{item.name}</Text>
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
                      <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '20' }]}>
                        <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>
                          {item.type}
                        </Text>
                      </View>
                    </View>
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
                        Quantity: {item.quantity}
                      </Text>
                    </View>
                    {item.size && (
                      <View style={styles.detailRow}>
                        <IconSymbol
                          ios_icon_name="ruler"
                          android_material_icon_name="straighten"
                          size={16}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.detailText}>
                          Size: {item.size}
                        </Text>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <IconSymbol
                        ios_icon_name="chart.line.downtrend.xyaxis"
                        android_material_icon_name="trending_down"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.detailText}>
                        Low stock: {item.lowStockThreshold}
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
                {editingItem ? 'Edit Packaging' : 'Add Packaging'}
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
                placeholder="e.g., Small Produce Box"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Type *</Text>
              <View style={styles.typeSelector}>
                {(['box', 'bag', 'container', 'crate', 'basket', 'other'] as const).map((t, idx) => {
                  const typeIcon = getTypeIcon(t);
                  return (
                    <React.Fragment key={idx}>
                      <TouchableOpacity
                        style={[
                          styles.typeOption,
                          type === t && styles.typeOptionSelected,
                          { borderColor: getTypeColor(t) },
                        ]}
                        onPress={() => setType(t)}
                      >
                        <IconSymbol
                          ios_icon_name={typeIcon.ios}
                          android_material_icon_name={typeIcon.android}
                          size={20}
                          color={type === t ? getTypeColor(t) : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.typeOptionText,
                            type === t && { color: getTypeColor(t), fontWeight: '600' },
                          ]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  );
                })}
              </View>

              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Size</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="e.g., Small, Medium, Large, or 12x8x6 inches"
                placeholderTextColor={colors.textSecondary}
                value={size}
                onChangeText={setSize}
              />

              <Text style={styles.label}>Low Stock Threshold *</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="Alert when below this amount"
                placeholderTextColor={colors.textSecondary}
                value={lowStockThreshold}
                onChangeText={setLowStockThreshold}
                keyboardType="numeric"
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
                  {editingItem ? 'Update' : 'Add'} Packaging
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  lowStockBadge: {
    marginLeft: 8,
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
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
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    margin: 4,
  },
  typeOptionSelected: {
    borderWidth: 2,
  },
  typeOptionText: {
    fontSize: 14,
    color: colors.text,
    textTransform: 'capitalize',
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
</write file>

Now let's create the storage locations management screen:

<write file="app/storage-locations.tsx">
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

    const newItem: StorageLocation = {
      id: editingItem?.id || Date.now().toString(),
      name: name.trim(),
      type,
      totalCapacity: parseFloat(totalCapacity),
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
