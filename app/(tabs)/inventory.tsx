
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function InventoryScreen() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    fertilizers: 0,
    seeds: 0,
    packaging: 0,
    storageLocations: 0,
  });

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        setLoading(false);
        return;
      }

      const [fertilizersRes, seedsRes, packagingRes, storageRes] = await Promise.all([
        supabase.from('fertilizers').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('seeds').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('packaging').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('storage_locations').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      setCounts({
        fertilizers: fertilizersRes.count || 0,
        seeds: seedsRes.count || 0,
        packaging: packagingRes.count || 0,
        storageLocations: storageRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    {
      id: 'fertilizers',
      title: 'Fertilizers',
      icon: 'science' as const,
      count: counts.fertilizers,
      color: colors.primary,
      route: '/fertilizers',
    },
    {
      id: 'seeds',
      title: 'Seeds',
      icon: 'eco' as const,
      count: counts.seeds,
      color: '#8FBC8F',
      route: '/seeds',
    },
    {
      id: 'packaging',
      title: 'Packaging',
      icon: 'inventory_2' as const,
      count: counts.packaging,
      color: '#A0826D',
      route: '/packaging',
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
            Track your farm supplies and storage
          </Text>
        </View>

        {/* Storage Management */}
        <View style={[commonStyles.card, styles.storageCard]}>
          <View style={styles.storageHeader}>
            <IconSymbol
              ios_icon_name="archivebox.fill"
              android_material_icon_name="warehouse"
              size={28}
              color={colors.primary}
            />
            <Text style={styles.storageTitle}>Storage Management</Text>
          </View>
          <Text style={styles.storageSubtitle}>
            {counts.storageLocations} storage locations configured
          </Text>
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
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
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/record-usage')}
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
              onPress={() => router.push('/add-harvest')}
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
              onPress={() => router.push('/record-sale')}
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
              onPress={() => router.push('/reports')}
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
    marginBottom: 8,
  },
  storageTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  storageSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  manageStorageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  manageStorageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
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
