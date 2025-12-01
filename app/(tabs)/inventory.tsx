
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
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
} from '@/types/inventory';

export default function InventoryScreen() {
  const [fertilizers, setFertilizers] = useState<FertilizerItem[]>([]);
  const [seeds, setSeeds] = useState<SeedItem[]>([]);
  const [packaging, setPackaging] = useState<PackagingItem[]>([]);
  const [yields, setYields] = useState<YieldItem[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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
      if (type === 'yield') return false; // Yields don't have low stock threshold
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
            onPress={() => Alert.alert('Coming Soon', 'Storage management feature will be available soon!')}
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
                onPress={() => {
                  if (category.id === 'yields') {
                    router.push('/yields');
                  } else {
                    Alert.alert('Coming Soon', `${category.title} management will be available soon!`);
                  }
                }}
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
              onPress={() => Alert.alert('Coming Soon', 'Record usage feature will be available soon!')}
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
              onPress={() => Alert.alert('Coming Soon', 'Record sale feature will be available soon!')}
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
});
