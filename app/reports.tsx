
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

type ReportType = 
  | 'inventory'
  | 'storage'
  | 'harvests'
  | 'sales'
  | 'crop_loss';

interface Harvest {
  id: string;
  crop_name: string;
  yield_amount: number;
  unit: string;
  planted_amount: number | null;
  loss: number | null;
  created_at: string;
}

interface Sale {
  id: string;
  crop_name: string;
  amount_sold: number;
  unit: string;
  price: number | null;
  payment_method: string | null;
  customer: string | null;
  created_at: string;
}

interface StorageLocation {
  id: string;
  type: string;
  capacity: number;
  used: number;
  unit: string;
}

interface InventoryItem {
  name: string;
  quantity: number;
  unit: string;
}

export default function ReportsScreen() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('inventory');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [fertilizers, setFertilizers] = useState<InventoryItem[]>([]);
  const [seeds, setSeeds] = useState<InventoryItem[]>([]);
  const [packaging, setPackaging] = useState<InventoryItem[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        setLoading(false);
        return;
      }

      const [
        fertilizersRes,
        seedsRes,
        packagingRes,
        storageRes,
        harvestsRes,
        salesRes,
      ] = await Promise.all([
        supabase.from('fertilizers').select('*').eq('user_id', user.id),
        supabase.from('seeds').select('*').eq('user_id', user.id),
        supabase.from('packaging').select('*').eq('user_id', user.id),
        supabase.from('storage_locations').select('*').eq('user_id', user.id),
        supabase.from('harvests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('sales').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      if (fertilizersRes.error) console.error('Error loading fertilizers:', fertilizersRes.error);
      else setFertilizers(fertilizersRes.data || []);

      if (seedsRes.error) console.error('Error loading seeds:', seedsRes.error);
      else setSeeds(seedsRes.data || []);

      if (packagingRes.error) console.error('Error loading packaging:', packagingRes.error);
      else setPackaging(packagingRes.data || []);

      if (storageRes.error) console.error('Error loading storage:', storageRes.error);
      else setStorageLocations(storageRes.data || []);

      if (harvestsRes.error) console.error('Error loading harvests:', harvestsRes.error);
      else setHarvests(harvestsRes.data || []);

      if (salesRes.error) console.error('Error loading sales:', salesRes.error);
      else setSales(salesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const reportCategories = [
    { id: 'inventory' as const, label: 'Inventory Levels', icon: 'inventory_2' },
    { id: 'storage' as const, label: 'Storage Usage', icon: 'warehouse' },
    { id: 'harvests' as const, label: 'Harvests', icon: 'agriculture' },
    { id: 'sales' as const, label: 'Sales', icon: 'sell' },
    { id: 'crop_loss' as const, label: 'Crop Loss', icon: 'warning' },
  ];

  const renderInventoryReport = () => {
    const totalFertilizers = fertilizers.reduce((sum, f) => sum + f.quantity, 0);
    const totalSeeds = seeds.reduce((sum, s) => sum + s.quantity, 0);
    const totalPackaging = packaging.reduce((sum, p) => sum + p.quantity, 0);

    return (
      <View>
        <Text style={styles.reportTitle}>Inventory Levels Report</Text>
        <Text style={styles.reportSubtitle}>
          Current stock of fertilizers, seeds, and packaging
        </Text>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[commonStyles.card, styles.summaryCard]}>
            <IconSymbol
              ios_icon_name="science"
              android_material_icon_name="science"
              size={32}
              color={colors.primary}
            />
            <Text style={styles.summaryLabel}>Fertilizers</Text>
            <Text style={styles.summaryValue}>{fertilizers.length}</Text>
            <Text style={styles.summarySubtext}>types</Text>
          </View>

          <View style={[commonStyles.card, styles.summaryCard]}>
            <IconSymbol
              ios_icon_name="eco"
              android_material_icon_name="eco"
              size={32}
              color="#8FBC8F"
            />
            <Text style={styles.summaryLabel}>Seeds</Text>
            <Text style={styles.summaryValue}>{seeds.length}</Text>
            <Text style={styles.summarySubtext}>types</Text>
          </View>

          <View style={[commonStyles.card, styles.summaryCard]}>
            <IconSymbol
              ios_icon_name="inventory_2"
              android_material_icon_name="inventory_2"
              size={32}
              color="#A0826D"
            />
            <Text style={styles.summaryLabel}>Packaging</Text>
            <Text style={styles.summaryValue}>{packaging.length}</Text>
            <Text style={styles.summarySubtext}>types</Text>
          </View>
        </View>

        {/* Fertilizers */}
        {fertilizers.length > 0 && (
          <React.Fragment>
            <Text style={styles.sectionTitle}>Fertilizers</Text>
            {fertilizers.map((item, index) => (
              <React.Fragment key={index}>
                <View style={[commonStyles.card, styles.reportCard]}>
                  <Text style={styles.reportItemTitle}>{item.name}</Text>
                  <Text style={styles.reportItemValue}>
                    {item.quantity} {item.unit}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </React.Fragment>
        )}

        {/* Seeds */}
        {seeds.length > 0 && (
          <React.Fragment>
            <Text style={styles.sectionTitle}>Seeds</Text>
            {seeds.map((item, index) => (
              <React.Fragment key={index}>
                <View style={[commonStyles.card, styles.reportCard]}>
                  <Text style={styles.reportItemTitle}>{item.name}</Text>
                  <Text style={styles.reportItemValue}>
                    {item.quantity} {item.unit}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </React.Fragment>
        )}

        {/* Packaging */}
        {packaging.length > 0 && (
          <React.Fragment>
            <Text style={styles.sectionTitle}>Packaging</Text>
            {packaging.map((item, index) => (
              <React.Fragment key={index}>
                <View style={[commonStyles.card, styles.reportCard]}>
                  <Text style={styles.reportItemTitle}>{item.name}</Text>
                  <Text style={styles.reportItemValue}>
                    {item.quantity} {item.unit}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </React.Fragment>
        )}

        {fertilizers.length === 0 && seeds.length === 0 && packaging.length === 0 && (
          <Text style={styles.emptyText}>No inventory data available</Text>
        )}
      </View>
    );
  };

  const renderStorageReport = () => {
    const totalCapacity = storageLocations.reduce((sum, loc) => sum + loc.capacity, 0);
    const totalUsed = storageLocations.reduce((sum, loc) => sum + (loc.used || 0), 0);
    const utilizationRate = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;

    return (
      <View>
        <Text style={styles.reportTitle}>Storage Usage Report</Text>
        <Text style={styles.reportSubtitle}>
          Current storage capacity and utilization
        </Text>

        {/* Summary */}
        <View style={[commonStyles.card, styles.storageOverviewCard]}>
          <View style={styles.storageOverviewRow}>
            <View style={styles.storageOverviewItem}>
              <Text style={styles.storageOverviewLabel}>Total Capacity</Text>
              <Text style={styles.storageOverviewValue}>{totalCapacity.toFixed(0)}</Text>
            </View>
            <View style={styles.storageOverviewItem}>
              <Text style={styles.storageOverviewLabel}>Used</Text>
              <Text style={[styles.storageOverviewValue, { color: colors.primary }]}>
                {totalUsed.toFixed(0)}
              </Text>
            </View>
            <View style={styles.storageOverviewItem}>
              <Text style={styles.storageOverviewLabel}>Utilization</Text>
              <Text style={[styles.storageOverviewValue, { color: colors.success }]}>
                {utilizationRate.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Storage Locations */}
        {storageLocations.map((location, index) => {
          const usagePercent = (location.used / location.capacity) * 100;
          return (
            <React.Fragment key={index}>
              <View style={[commonStyles.card, styles.reportCard]}>
                <View style={styles.storageCardHeader}>
                  <IconSymbol
                    ios_icon_name={
                      location.type === 'dry' ? 'cube.box.fill' :
                      location.type === 'refrigerated' ? 'snowflake' :
                      'thermometer.snowflake'
                    }
                    android_material_icon_name={
                      location.type === 'dry' ? 'inventory' : 'ac_unit'
                    }
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.reportItemTitle}>
                    {location.type.charAt(0).toUpperCase() + location.type.slice(1)} Storage
                  </Text>
                </View>
                <View style={styles.storageDetails}>
                  <Text style={styles.storageDetailText}>
                    {location.used.toFixed(0)} / {location.capacity.toFixed(0)} {location.unit} used
                  </Text>
                  <Text style={styles.storageDetailText}>
                    {usagePercent.toFixed(1)}% utilized
                  </Text>
                </View>
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
              </View>
            </React.Fragment>
          );
        })}

        {storageLocations.length === 0 && (
          <Text style={styles.emptyText}>No storage locations configured</Text>
        )}
      </View>
    );
  };

  const renderHarvestsReport = () => {
    const totalYield = harvests.reduce((sum, h) => sum + h.yield_amount, 0);
    const harvestsByCrop: Record<string, { yield: number; count: number; unit: string }> = {};

    harvests.forEach(harvest => {
      if (!harvestsByCrop[harvest.crop_name]) {
        harvestsByCrop[harvest.crop_name] = { yield: 0, count: 0, unit: harvest.unit };
      }
      harvestsByCrop[harvest.crop_name].yield += harvest.yield_amount;
      harvestsByCrop[harvest.crop_name].count += 1;
    });

    return (
      <View>
        <Text style={styles.reportTitle}>Harvests Report</Text>
        <Text style={styles.reportSubtitle}>
          All harvest records and yields by crop
        </Text>

        {/* Summary */}
        <View style={[commonStyles.card, styles.summaryCard]}>
          <Text style={styles.summaryLabel}>Total Harvests</Text>
          <Text style={styles.summaryValue}>{harvests.length}</Text>
          <Text style={styles.summarySubtext}>records</Text>
        </View>

        {/* By Crop */}
        {Object.entries(harvestsByCrop).map(([crop, data], index) => (
          <React.Fragment key={index}>
            <View style={[commonStyles.card, styles.reportCard]}>
              <Text style={styles.reportItemTitle}>{crop}</Text>
              <View style={styles.reportItemDetails}>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Total Yield:</Text>
                  <Text style={styles.reportValue}>{data.yield.toFixed(1)} {data.unit}</Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Harvests:</Text>
                  <Text style={styles.reportValue}>{data.count}</Text>
                </View>
              </View>
            </View>
          </React.Fragment>
        ))}

        {harvests.length === 0 && (
          <Text style={styles.emptyText}>No harvest data available</Text>
        )}
      </View>
    );
  };

  const renderSalesReport = () => {
    const totalRevenue = sales.reduce((sum, s) => sum + (s.price || 0), 0);
    const totalQuantity = sales.reduce((sum, s) => sum + s.amount_sold, 0);
    
    const salesByCrop: Record<string, { quantity: number; revenue: number; count: number; unit: string }> = {};
    const salesByPayment: Record<string, { count: number; revenue: number }> = {
      cash: { count: 0, revenue: 0 },
      credit_debit: { count: 0, revenue: 0 },
      payment_app: { count: 0, revenue: 0 },
    };

    sales.forEach(sale => {
      // By crop
      if (!salesByCrop[sale.crop_name]) {
        salesByCrop[sale.crop_name] = { quantity: 0, revenue: 0, count: 0, unit: sale.unit };
      }
      salesByCrop[sale.crop_name].quantity += sale.amount_sold;
      salesByCrop[sale.crop_name].revenue += sale.price || 0;
      salesByCrop[sale.crop_name].count += 1;

      // By payment method
      const method = sale.payment_method || 'cash';
      if (salesByPayment[method]) {
        salesByPayment[method].count += 1;
        salesByPayment[method].revenue += sale.price || 0;
      }
    });

    return (
      <View>
        <Text style={styles.reportTitle}>Sales Report</Text>
        <Text style={styles.reportSubtitle}>
          Sales transactions and revenue breakdown
        </Text>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[commonStyles.card, styles.summaryCard]}>
            <Text style={styles.summaryLabel}>Total Sales</Text>
            <Text style={styles.summaryValue}>{sales.length}</Text>
            <Text style={styles.summarySubtext}>transactions</Text>
          </View>

          <View style={[commonStyles.card, styles.summaryCard]}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              ${totalRevenue.toFixed(2)}
            </Text>
            <Text style={styles.summarySubtext}>earned</Text>
          </View>
        </View>

        {/* By Crop */}
        <Text style={styles.sectionTitle}>Sales by Crop</Text>
        {Object.entries(salesByCrop).map(([crop, data], index) => (
          <React.Fragment key={index}>
            <View style={[commonStyles.card, styles.reportCard]}>
              <Text style={styles.reportItemTitle}>{crop}</Text>
              <View style={styles.reportItemDetails}>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Quantity Sold:</Text>
                  <Text style={styles.reportValue}>{data.quantity.toFixed(1)} {data.unit}</Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Revenue:</Text>
                  <Text style={[styles.reportValue, { color: colors.success }]}>
                    ${data.revenue.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Transactions:</Text>
                  <Text style={styles.reportValue}>{data.count}</Text>
                </View>
              </View>
            </View>
          </React.Fragment>
        ))}

        {/* By Payment Method */}
        <Text style={styles.sectionTitle}>Sales by Payment Method</Text>
        {Object.entries(salesByPayment).map(([method, data], index) => (
          <React.Fragment key={index}>
            <View style={[commonStyles.card, styles.reportCard]}>
              <Text style={styles.reportItemTitle}>
                {method === 'cash' ? 'Cash' :
                 method === 'credit_debit' ? 'Credit/Debit Card' :
                 'Payment App'}
              </Text>
              <View style={styles.reportItemDetails}>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Transactions:</Text>
                  <Text style={styles.reportValue}>{data.count}</Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Revenue:</Text>
                  <Text style={[styles.reportValue, { color: colors.success }]}>
                    ${data.revenue.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Percentage:</Text>
                  <Text style={styles.reportValue}>
                    {sales.length > 0 ? ((data.count / sales.length) * 100).toFixed(1) : 0}%
                  </Text>
                </View>
              </View>
            </View>
          </React.Fragment>
        ))}

        {sales.length === 0 && (
          <Text style={styles.emptyText}>No sales data available</Text>
        )}
      </View>
    );
  };

  const renderCropLossReport = () => {
    const harvestsWithLoss = harvests.filter(h => h.planted_amount !== null && h.planted_amount > 0);
    
    const lossByCrop: Record<string, { planted: number; yield: number; loss: number; count: number }> = {};

    harvestsWithLoss.forEach(harvest => {
      if (!lossByCrop[harvest.crop_name]) {
        lossByCrop[harvest.crop_name] = { planted: 0, yield: 0, loss: 0, count: 0 };
      }
      lossByCrop[harvest.crop_name].planted += harvest.planted_amount || 0;
      lossByCrop[harvest.crop_name].yield += harvest.yield_amount;
      lossByCrop[harvest.crop_name].loss += harvest.loss || 0;
      lossByCrop[harvest.crop_name].count += 1;
    });

    return (
      <View>
        <Text style={styles.reportTitle}>Crop Loss Report</Text>
        <Text style={styles.reportSubtitle}>
          Harvests vs planted amount analysis
        </Text>

        {Object.entries(lossByCrop).map(([crop, data], index) => {
          const lossPercentage = (data.loss / data.planted) * 100;
          return (
            <React.Fragment key={index}>
              <View style={[commonStyles.card, styles.reportCard]}>
                <Text style={styles.reportItemTitle}>{crop}</Text>
                <View style={styles.reportItemDetails}>
                  <View style={styles.reportRow}>
                    <Text style={styles.reportLabel}>Planted:</Text>
                    <Text style={styles.reportValue}>{data.planted.toFixed(1)}</Text>
                  </View>
                  <View style={styles.reportRow}>
                    <Text style={styles.reportLabel}>Harvested:</Text>
                    <Text style={styles.reportValue}>{data.yield.toFixed(1)}</Text>
                  </View>
                  <View style={styles.reportRow}>
                    <Text style={styles.reportLabel}>Loss:</Text>
                    <Text style={[styles.reportValue, { color: data.loss > 0 ? colors.error : colors.success }]}>
                      {data.loss.toFixed(1)} ({lossPercentage.toFixed(1)}%)
                    </Text>
                  </View>
                  <View style={styles.reportRow}>
                    <Text style={styles.reportLabel}>Harvests:</Text>
                    <Text style={styles.reportValue}>{data.count}</Text>
                  </View>
                </View>
              </View>
            </React.Fragment>
          );
        })}

        {harvestsWithLoss.length === 0 && (
          <Text style={styles.emptyText}>
            No crop loss data available. Add planted amounts to your harvests to track loss.
          </Text>
        )}
      </View>
    );
  };

  const renderReport = () => {
    switch (selectedReport) {
      case 'inventory':
        return renderInventoryReport();
      case 'storage':
        return renderStorageReport();
      case 'harvests':
        return renderHarvestsReport();
      case 'sales':
        return renderSalesReport();
      case 'crop_loss':
        return renderCropLossReport();
      default:
        return null;
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
        <Text style={styles.headerTitle}>Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Report Category Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {reportCategories.map((category, index) => (
          <React.Fragment key={index}>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedReport === category.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedReport(category.id)}
            >
              <IconSymbol
                ios_icon_name={category.icon}
                android_material_icon_name={category.icon}
                size={20}
                color={selectedReport === category.id ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedReport === category.id && styles.categoryButtonTextActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </ScrollView>

      {/* Report Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading report data...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderReport()}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: colors.highlight,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  categoryScroll: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.highlight,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.highlight,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
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
  reportTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  reportSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  summarySubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reportCard: {
    marginBottom: 12,
    padding: 16,
  },
  reportItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  reportItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  reportItemDetails: {
    gap: 8,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  reportValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  storageOverviewCard: {
    padding: 16,
    marginBottom: 20,
  },
  storageOverviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  storageOverviewItem: {
    alignItems: 'center',
  },
  storageOverviewLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  storageOverviewValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  storageCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  storageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  storageDetailText: {
    fontSize: 14,
    color: colors.textSecondary,
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
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
    paddingHorizontal: 32,
  },
});
