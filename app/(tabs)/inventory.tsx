
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { router } from 'expo-router';
import { inventoryStorage } from '@/utils/inventoryStorage';
import {
  FertilizerItem,
  SeedItem,
  PackagingItem,
  YieldItem,
  StorageLocation,
  UsageRecord,
  SaleRecord,
} from '@/types/inventory';

export default function InventoryScreen() {
  const [fertilizers, setFertilizers] = useState<FertilizerItem[]>([]);
  const [seeds, setSeeds] = useState<SeedItem[]>([]);
  const [packaging, setPackaging] = useState<PackagingItem[]>([]);
  const [yields, setYields] = useState<YieldItem[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);

  // Usage form state
  const [usageItemType, setUsageItemType] = useState<'fertilizer' | 'seed' | 'packaging'>('fertilizer');
  const [usageItemId, setUsageItemId] = useState('');
  const [usageQuantity, setUsageQuantity] = useState('');
  const [usageUsedFor, setUsageUsedFor] = useState('');
  const [usageNotes, setUsageNotes] = useState('');

  // Sale form state
  const [saleYieldId, setSaleYieldId] = useState('');
  const [saleQuantity, setSaleQuantity] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [saleCustomer, setSaleCustomer] = useState('');
  const [saleNotes, setSaleNotes] = useState('');

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    setRefreshing(true);
    try {
      const [
        loadedFertilizers,
        loadedSeeds,
        loadedPackaging,
        loadedYields,
        loadedLocations,
      ] = await Promise.all([
        inventoryStorage.getFertilizers(),
        inventoryStorage.getSeeds(),
        inventoryStorage.getPackaging(),
        inventoryStorage.getYields(),
        inventoryStorage.getStorageLocations(),
      ]);

      setFertilizers(loadedFertilizers);
      setSeeds(loadedSeeds);
      setPackaging(loadedPackaging);
      setYields(loadedYields);
      setStorageLocations(loadedLocations);
    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate low stock items
  const getLowStockCount = (items: any[], type: string) => {
    return items.filter(item => {
      if (type === 'yield') return false;
      return item.quantity <= item.lowStockThreshold;
    }).length;
  };

  // Calculate storage capacity
  const calculateStorageUsage = () => {
    const dryStorage = storageLocations.filter(loc => loc.type === 'dry');
    const refrigeratedStorage = storageLocations.filter(loc => loc.type === 'refrigerated');

    const dryYields = yields.filter(y => y.storageLocation === 'dry');
    const refrigeratedYields = yields.filter(y => y.storageLocation === 'refrigerated');

    const dryUsed = dryYields.reduce((sum, y) => sum + y.quantity, 0);
    const refrigeratedUsed = refrigeratedYields.reduce((sum, y) => sum + y.quantity, 0);

    const dryTotal = dryStorage.reduce((sum, s) => sum + s.totalCapacity, 0);
    const refrigeratedTotal = refrigeratedStorage.reduce((sum, s) => sum + s.totalCapacity, 0);

    return {
      dry: { used: dryUsed, total: dryTotal, percentage: dryTotal > 0 ? (dryUsed / dryTotal) * 100 : 0 },
      refrigerated: { used: refrigeratedUsed, total: refrigeratedTotal, percentage: refrigeratedTotal > 0 ? (refrigeratedUsed / refrigeratedTotal) * 100 : 0 },
    };
  };

  const storageUsage = calculateStorageUsage();

  const handleRecordUsage = async () => {
    if (!usageItemId || !usageQuantity) {
      Alert.alert('Error', 'Please select an item and enter quantity');
      return;
    }

    const quantity = parseFloat(usageQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    let itemName = '';
    let unit = '';
    let updatedItems: any[] = [];

    // Get the item and update quantity
    if (usageItemType === 'fertilizer') {
      const item = fertilizers.find(f => f.id === usageItemId);
      if (!item) {
        Alert.alert('Error', 'Item not found');
        return;
      }
      if (item.quantity < quantity) {
        Alert.alert('Error', 'Not enough quantity available');
        return;
      }
      itemName = item.name;
      unit = item.unit;
      updatedItems = fertilizers.map(f =>
        f.id === usageItemId ? { ...f, quantity: f.quantity - quantity } : f
      );
      await inventoryStorage.saveFertilizers(updatedItems);
      setFertilizers(updatedItems);
    } else if (usageItemType === 'seed') {
      const item = seeds.find(s => s.id === usageItemId);
      if (!item) {
        Alert.alert('Error', 'Item not found');
        return;
      }
      if (item.quantity < quantity) {
        Alert.alert('Error', 'Not enough quantity available');
        return;
      }
      itemName = `${item.cropName} - ${item.variety}`;
      unit = item.unit;
      updatedItems = seeds.map(s =>
        s.id === usageItemId ? { ...s, quantity: s.quantity - quantity } : s
      );
      await inventoryStorage.saveSeeds(updatedItems);
      setSeeds(updatedItems);
    } else if (usageItemType === 'packaging') {
      const item = packaging.find(p => p.id === usageItemId);
      if (!item) {
        Alert.alert('Error', 'Item not found');
        return;
      }
      if (item.quantity < quantity) {
        Alert.alert('Error', 'Not enough quantity available');
        return;
      }
      itemName = item.name;
      unit = 'units';
      updatedItems = packaging.map(p =>
        p.id === usageItemId ? { ...p, quantity: p.quantity - quantity } : p
      );
      await inventoryStorage.savePackaging(updatedItems);
      setPackaging(updatedItems);
    }

    // Save usage record
    const usageRecord: UsageRecord = {
      id: Date.now().toString(),
      itemType: usageItemType,
      itemId: usageItemId,
      itemName,
      quantity,
      unit,
      usageDate: new Date().toISOString(),
      usedFor: usageUsedFor.trim(),
      notes: usageNotes.trim(),
    };

    const usageRecords = await inventoryStorage.getUsageRecords();
    await inventoryStorage.saveUsageRecords([...usageRecords, usageRecord]);

    Alert.alert('Success', 'Usage recorded successfully');
    resetUsageForm();
    setShowUsageModal(false);
  };

  const handleRecordSale = async () => {
    if (!saleYieldId || !saleQuantity) {
      Alert.alert('Error', 'Please select a yield and enter quantity');
      return;
    }

    const quantity = parseFloat(saleQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    const yieldItem = yields.find(y => y.id === saleYieldId);
    if (!yieldItem) {
      Alert.alert('Error', 'Yield not found');
      return;
    }

    if (yieldItem.quantity < quantity) {
      Alert.alert('Error', 'Not enough quantity available');
      return;
    }

    // Update yield quantity
    const updatedYields = yields.map(y =>
      y.id === saleYieldId ? { ...y, quantity: y.quantity - quantity } : y
    );
    await inventoryStorage.saveYields(updatedYields);
    setYields(updatedYields);

    // Save sale record
    const saleRecord: SaleRecord = {
      id: Date.now().toString(),
      yieldItemId: saleYieldId,
      cropName: yieldItem.cropName,
      quantity,
      unit: yieldItem.unit,
      saleDate: new Date().toISOString(),
      price: salePrice ? parseFloat(salePrice) : undefined,
      customer: saleCustomer.trim(),
      notes: saleNotes.trim(),
    };

    const salesRecords = await inventoryStorage.getSales();
    await inventoryStorage.saveSales([...salesRecords, saleRecord]);

    Alert.alert('Success', 'Sale recorded successfully');
    resetSaleForm();
    setShowSaleModal(false);
  };

  const resetUsageForm = () => {
    setUsageItemType('fertilizer');
    setUsageItemId('');
    setUsageQuantity('');
    setUsageUsedFor('');
    setUsageNotes('');
  };

  const resetSaleForm = () => {
    setSaleYieldId('');
    setSaleQuantity('');
    setSalePrice('');
    setSaleCustomer('');
    setSaleNotes('');
  };

  const getAvailableItems = () => {
    switch (usageItemType) {
      case 'fertilizer':
        return fertilizers;
      case 'seed':
        return seeds;
      case 'packaging':
        return packaging;
      default:
        return [];
    }
  };

  const getItemDisplayName = (item: any) => {
    if (usageItemType === 'seed') {
      return `${item.cropName} - ${item.variety}`;
    }
    return item.name;
  };

  const categories = [
    {
      id: 'fertilizers',
      title: 'Fertilizers',
      icon: 'science' as const,
      count: fertilizers.length,
      lowStock: getLowStockCount(fertilizers, 'fertilizer'),
      color: colors.primary,
      route: '/fertilizers',
    },
    {
      id: 'seeds',
      title: 'Seeds',
      icon: 'eco' as const,
      count: seeds.length,
      lowStock: getLowStockCount(seeds, 'seed'),
      color: '#8FBC8F',
      route: '/seeds',
    },
    {
      id: 'packaging',
      title: 'Packaging',
      icon: 'inventory_2' as const,
      count: packaging.length,
      lowStock: getLowStockCount(packaging, 'packaging'),
      color: '#A0826D',
      route: '/packaging',
    },
    {
      id: 'yields',
      title: 'Harvest Yields',
      icon: 'agriculture' as const,
      count: yields.length,
      lowStock: 0,
      color: '#D4AF37',
      route: '/yields',
    },
  ];

  return (
    <View style={commonStyles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Inventory</Text>
          <Text style={styles.headerSubtitle}>
            Track your farm supplies and yields
          </Text>
        </View>

        {/* Storage Capacity Overview */}
        <View style={[commonStyles.card, styles.storageCard]}>
          <View style={styles.storageHeader}>
            <IconSymbol
              ios_icon_name="archivebox.fill"
              android_material_icon_name="warehouse"
              size={28}
              color={colors.primary}
            />
            <Text style={styles.storageTitle}>Storage Capacity</Text>
          </View>

          {/* Dry Storage */}
          <View style={styles.storageItem}>
            <View style={styles.storageInfo}>
              <IconSymbol
                ios_icon_name="cube.box.fill"
                android_material_icon_name="inventory"
                size={20}
                color={colors.text}
              />
              <Text style={styles.storageLabel}>Dry Storage</Text>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(storageUsage.dry.percentage, 100)}%`,
                      backgroundColor:
                        storageUsage.dry.percentage > 90
                          ? colors.error
                          : storageUsage.dry.percentage > 70
                          ? colors.warning
                          : colors.success,
                    },
                  ]}
                />
              </View>
              <Text style={styles.storageText}>
                {storageUsage.dry.used.toFixed(0)} / {storageUsage.dry.total.toFixed(0)} lbs
                {storageUsage.dry.total > 0 && ` (${storageUsage.dry.percentage.toFixed(0)}%)`}
              </Text>
            </View>
          </View>

          {/* Refrigerated Storage */}
          <View style={styles.storageItem}>
            <View style={styles.storageInfo}>
              <IconSymbol
                ios_icon_name="snowflake"
                android_material_icon_name="ac_unit"
                size={20}
                color={colors.text}
              />
              <Text style={styles.storageLabel}>Refrigerated</Text>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(storageUsage.refrigerated.percentage, 100)}%`,
                      backgroundColor:
                        storageUsage.refrigerated.percentage > 90
                          ? colors.error
                          : storageUsage.refrigerated.percentage > 70
                          ? colors.warning
                          : colors.success,
                    },
                  ]}
                />
              </View>
              <Text style={styles.storageText}>
                {storageUsage.refrigerated.used.toFixed(0)} / {storageUsage.refrigerated.total.toFixed(0)} lbs
                {storageUsage.refrigerated.total > 0 && ` (${storageUsage.refrigerated.percentage.toFixed(0)}%)`}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.manageStorageButton}
            onPress={() => router.push('/storage-locations')}
          >
            <Text style={styles.manageStorageText}>Manage Storage Locations</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Inventory Categories */}
        <View style={styles.categoriesContainer}>
          {categories.map((category, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={[commonStyles.card, styles.categoryCard]}
                onPress={() => router.push(category.route as any)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                  <IconSymbol
                    ios_icon_name={category.icon}
                    android_material_icon_name={category.icon}
                    size={32}
                    color={category.color}
                  />
                </View>
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryCount}>
                    {category.count} {category.count === 1 ? 'item' : 'items'}
                  </Text>
                  {category.lowStock > 0 && (
                    <View style={styles.lowStockBadge}>
                      <IconSymbol
                        ios_icon_name="exclamationmark.triangle.fill"
                        android_material_icon_name="warning"
                        size={14}
                        color={colors.warning}
                      />
                      <Text style={styles.lowStockText}>
                        {category.lowStock} low stock
                      </Text>
                    </View>
                  )}
                </View>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron_right"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                resetUsageForm();
                setShowUsageModal(true);
              }}
            >
              <IconSymbol
                ios_icon_name="minus.circle.fill"
                android_material_icon_name="remove_circle"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.actionText}>Record Usage</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                resetSaleForm();
                setShowSaleModal(true);
              }}
            >
              <IconSymbol
                ios_icon_name="dollarsign.circle.fill"
                android_material_icon_name="sell"
                size={24}
                color={colors.success}
              />
              <Text style={styles.actionText}>Record Sale</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/yields')}
            >
              <IconSymbol
                ios_icon_name="plus.circle.fill"
                android_material_icon_name="add_circle"
                size={24}
                color={colors.accent}
              />
              <Text style={styles.actionText}>Add Harvest</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Coming Soon', 'View reports feature will be available soon!')}
            >
              <IconSymbol
                ios_icon_name="chart.bar.fill"
                android_material_icon_name="bar_chart"
                size={24}
                color={colors.text}
              />
              <Text style={styles.actionText}>View Reports</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Padding for Tab Bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Record Usage Modal */}
      <Modal
        visible={showUsageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUsageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Usage</Text>
              <TouchableOpacity onPress={() => setShowUsageModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Item Type</Text>
              <View style={styles.typeSelector}>
                {(['fertilizer', 'seed', 'packaging'] as const).map((type, idx) => (
                  <React.Fragment key={idx}>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        usageItemType === type && styles.typeButtonActive,
                      ]}
                      onPress={() => {
                        setUsageItemType(type);
                        setUsageItemId('');
                      }}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          usageItemType === type && styles.typeButtonTextActive,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>

              <Text style={styles.label}>Select Item *</Text>
              <ScrollView style={styles.itemSelector} nestedScrollEnabled>
                {getAvailableItems().map((item, idx) => (
                  <React.Fragment key={idx}>
                    <TouchableOpacity
                      style={[
                        styles.itemOption,
                        usageItemId === item.id && styles.itemOptionSelected,
                      ]}
                      onPress={() => setUsageItemId(item.id)}
                    >
                      <Text style={styles.itemOptionName}>
                        {getItemDisplayName(item)}
                      </Text>
                      <Text style={styles.itemOptionQuantity}>
                        Available: {item.quantity} {item.unit || 'units'}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </ScrollView>

              <Text style={styles.label}>Quantity Used *</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="Enter quantity"
                placeholderTextColor={colors.textSecondary}
                value={usageQuantity}
                onChangeText={setUsageQuantity}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Used For</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="e.g., Field A, Tomato Crop"
                placeholderTextColor={colors.textSecondary}
                value={usageUsedFor}
                onChangeText={setUsageUsedFor}
              />

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[commonStyles.input, styles.textArea]}
                placeholder="Additional notes..."
                placeholderTextColor={colors.textSecondary}
                value={usageNotes}
                onChangeText={setUsageNotes}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[commonStyles.button, styles.saveButton]}
                onPress={handleRecordUsage}
              >
                <Text style={commonStyles.buttonText}>Record Usage</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Record Sale Modal */}
      <Modal
        visible={showSaleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSaleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Sale</Text>
              <TouchableOpacity onPress={() => setShowSaleModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Select Yield *</Text>
              <ScrollView style={styles.itemSelector} nestedScrollEnabled>
                {yields.map((yieldItem, idx) => (
                  <React.Fragment key={idx}>
                    <TouchableOpacity
                      style={[
                        styles.itemOption,
                        saleYieldId === yieldItem.id && styles.itemOptionSelected,
                      ]}
                      onPress={() => setSaleYieldId(yieldItem.id)}
                    >
                      <Text style={styles.itemOptionName}>
                        {yieldItem.cropName}
                        {yieldItem.variety && ` - ${yieldItem.variety}`}
                      </Text>
                      <Text style={styles.itemOptionQuantity}>
                        Available: {yieldItem.quantity} {yieldItem.unit}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </ScrollView>

              <Text style={styles.label}>Quantity Sold *</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="Enter quantity"
                placeholderTextColor={colors.textSecondary}
                value={saleQuantity}
                onChangeText={setSaleQuantity}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Sale Price</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="Enter price (optional)"
                placeholderTextColor={colors.textSecondary}
                value={salePrice}
                onChangeText={setSalePrice}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Customer</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="Customer name (optional)"
                placeholderTextColor={colors.textSecondary}
                value={saleCustomer}
                onChangeText={setSaleCustomer}
              />

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[commonStyles.input, styles.textArea]}
                placeholder="Additional notes..."
                placeholderTextColor={colors.textSecondary}
                value={saleNotes}
                onChangeText={setSaleNotes}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[commonStyles.button, styles.saveButton]}
                onPress={handleRecordSale}
              >
                <Text style={commonStyles.buttonText}>Record Sale</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 60 : 60,
  },
  header: {
    marginBottom: 24,
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
  storageCard: {
    marginBottom: 24,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  storageTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  storageItem: {
    marginBottom: 16,
  },
  storageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  storageLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 8,
  },
  progressContainer: {
    marginLeft: 28,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.highlight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  storageText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  manageStorageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  manageStorageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 4,
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  lowStockText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
    marginLeft: 4,
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  actionButton: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: '1%',
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
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
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.highlight,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  itemSelector: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: colors.highlight,
    borderRadius: 12,
    padding: 8,
  },
  itemOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.card,
  },
  itemOptionSelected: {
    backgroundColor: colors.primary + '20',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  itemOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  itemOptionQuantity: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 16,
  },
});
