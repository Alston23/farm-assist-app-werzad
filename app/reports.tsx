
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
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
  SaleRecord,
  UsageRecord,
} from '@/types/inventory';

type ReportType = 
  | 'crops'
  | 'fertilizers'
  | 'seeds'
  | 'packaging'
  | 'yields'
  | 'sales'
  | 'usage'
  | 'payment_methods';

export default function ReportsScreen() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('crops');
  const [fertilizers, setFertilizers] = useState<FertilizerItem[]>([]);
  const [seeds, setSeeds] = useState<SeedItem[]>([]);
  const [packaging, setPackaging] = useState<PackagingItem[]>([]);
  const [yields, setYields] = useState<YieldItem[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [
      loadedFertilizers,
      loadedSeeds,
      loadedPackaging,
      loadedYields,
      loadedSales,
      loadedUsage,
    ] = await Promise.all([
      inventoryStorage.getFertilizers(),
      inventoryStorage.getSeeds(),
      inventoryStorage.getPackaging(),
      inventoryStorage.getYields(),
      inventoryStorage.getSales(),
      inventoryStorage.getUsageRecords(),
    ]);

    setFertilizers(loadedFertilizers);
    setSeeds(loadedSeeds);
    setPackaging(loadedPackaging);
    setYields(loadedYields);
    setSales(loadedSales);
    setUsageRecords(loadedUsage);
  };

  const reportCategories = [
    { id: 'crops' as const, label: 'By Crop', icon: 'agriculture' },
    { id: 'fertilizers' as const, label: 'Fertilizers', icon: 'science' },
    { id: 'seeds' as const, label: 'Seeds', icon: 'eco' },
    { id: 'packaging' as const, label: 'Packaging', icon: 'inventory_2' },
    { id: 'yields' as const, label: 'Harvest Yields', icon: 'agriculture' },
    { id: 'sales' as const, label: 'Sales', icon: 'sell' },
    { id: 'usage' as const, label: 'Usage', icon: 'remove_circle' },
    { id: 'payment_methods' as const, label: 'Payment Methods', icon: 'payment' },
  ];

  // Crop Report
  const getCropReport = () => {
    const cropData: Record<string, {
      totalYield: number;
      totalSales: number;
      revenue: number;
      yieldPercentage: number;
    }> = {};

    yields.forEach(yieldItem => {
      if (!cropData[yieldItem.cropName]) {
        cropData[yieldItem.cropName] = {
          totalYield: 0,
          totalSales: 0,
          revenue: 0,
          yieldPercentage: 0,
        };
      }
      cropData[yieldItem.cropName].totalYield += yieldItem.quantity;
    });

    sales.forEach(sale => {
      if (cropData[sale.cropName]) {
        cropData[sale.cropName].totalSales += sale.quantity;
        cropData[sale.cropName].revenue += sale.price || 0;
      }
    });

    Object.keys(cropData).forEach(crop => {
      if (cropData[crop].totalYield > 0) {
        cropData[crop].yieldPercentage = 
          (cropData[crop].totalSales / cropData[crop].totalYield) * 100;
      }
    });

    return cropData;
  };

  // Fertilizer Report
  const getFertilizerReport = () => {
    const fertilizerUsage: Record<string, { used: number; remaining: number; unit: string }> = {};

    fertilizers.forEach(fert => {
      fertilizerUsage[fert.name] = {
        used: 0,
        remaining: fert.quantity,
        unit: fert.unit,
      };
    });

    usageRecords
      .filter(record => record.itemType === 'fertilizer')
      .forEach(record => {
        if (fertilizerUsage[record.itemName]) {
          fertilizerUsage[record.itemName].used += record.quantity;
        }
      });

    return fertilizerUsage;
  };

  // Seed Report
  const getSeedReport = () => {
    const seedUsage: Record<string, { used: number; remaining: number; unit: string; type: string }> = {};

    seeds.forEach(seed => {
      const key = `${seed.cropName} - ${seed.variety}`;
      seedUsage[key] = {
        used: 0,
        remaining: seed.quantity,
        unit: seed.unit,
        type: seed.itemType || 'seed',
      };
    });

    usageRecords
      .filter(record => record.itemType === 'seed')
      .forEach(record => {
        if (seedUsage[record.itemName]) {
          seedUsage[record.itemName].used += record.quantity;
        }
      });

    return seedUsage;
  };

  // Packaging Report
  const getPackagingReport = () => {
    const packagingUsage: Record<string, { used: number; remaining: number; type: string }> = {};

    packaging.forEach(pack => {
      packagingUsage[pack.name] = {
        used: 0,
        remaining: pack.quantity,
        type: pack.type,
      };
    });

    usageRecords
      .filter(record => record.itemType === 'packaging')
      .forEach(record => {
        if (packagingUsage[record.itemName]) {
          packagingUsage[record.itemName].used += record.quantity;
        }
      });

    return packagingUsage;
  };

  // Payment Method Report
  const getPaymentMethodReport = () => {
    const paymentData: Record<string, { count: number; revenue: number }> = {
      cash: { count: 0, revenue: 0 },
      credit_debit: { count: 0, revenue: 0 },
      payment_app: { count: 0, revenue: 0 },
    };

    sales.forEach(sale => {
      const method = sale.paymentMethod || 'cash';
      paymentData[method].count += 1;
      paymentData[method].revenue += sale.price || 0;
    });

    return paymentData;
  };

  const renderReport = () => {
    switch (selectedReport) {
      case 'crops':
        const cropReport = getCropReport();
        return (
          <View>
            <Text style={styles.reportTitle}>Crop Performance Report</Text>
            <Text style={styles.reportSubtitle}>
              Breakdown by crop with yield and sales data
            </Text>
            {Object.entries(cropReport).map(([crop, data], index) => (
              <React.Fragment key={index}>
                <View style={[commonStyles.card, styles.reportCard]}>
                  <Text style={styles.reportItemTitle}>{crop}</Text>
                  <View style={styles.reportItemDetails}>
                    <View style={styles.reportRow}>
                      <Text style={styles.reportLabel}>Total Yield:</Text>
                      <Text style={styles.reportValue}>{data.totalYield.toFixed(1)} lbs</Text>
                    </View>
                    <View style={styles.reportRow}>
                      <Text style={styles.reportLabel}>Total Sales:</Text>
                      <Text style={styles.reportValue}>{data.totalSales.toFixed(1)} lbs</Text>
                    </View>
                    <View style={styles.reportRow}>
                      <Text style={styles.reportLabel}>Revenue:</Text>
                      <Text style={[styles.reportValue, styles.revenueText]}>
                        ${data.revenue.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.reportRow}>
                      <Text style={styles.reportLabel}>Yield Sold:</Text>
                      <Text style={styles.reportValue}>{data.yieldPercentage.toFixed(1)}%</Text>
                    </View>
                  </View>
                </View>
              </React.Fragment>
            ))}
            {Object.keys(cropReport).length === 0 && (
              <Text style={styles.emptyText}>No crop data available</Text>
            )}
          </View>
        );

      case 'fertilizers':
        const fertilizerReport = getFertilizerReport();
        return (
          <View>
            <Text style={styles.reportTitle}>Fertilizer Usage Report</Text>
            <Text style={styles.reportSubtitle}>
              Track fertilizer consumption and remaining inventory
            </Text>
            {Object.entries(fertilizerReport).map(([name, data], index) => (
              <React.Fragment key={index}>
                <View style={[commonStyles.card, styles.reportCard]}>
                  <Text style={styles.reportItemTitle}>{name}</Text>
                  <View style={styles.reportItemDetails}>
                    <View style={styles.reportRow}>
                      <Text style={styles.reportLabel}>Used:</Text>
                      <Text style={styles.reportValue}>{data.used.toFixed(1)} {data.unit}</Text>
                    </View>
                    <View style={styles.reportRow}>
                      <Text style={styles.reportLabel}>Remaining:</Text>
                      <Text style={styles.reportValue}>{data.remaining.toFixed(1)} {data.unit}</Text>
                    </View>
                  </View>
                </View>
              </React.Fragment>
            ))}
            {Object.keys(fertilizerReport).length === 0 && (
              <Text style={styles.emptyText}>No fertilizer data available</Text>
            )}
          </View>
        );

      case 'seeds':
        const seedReport = getSeedReport();
        return (
          <View>
            <Text style={styles.reportTitle}>Seed/Transplant Usage Report</Text>
            <Text style={styles.reportSubtitle}>
              Track seed and transplant consumption
            </Text>
            {Object.entries(seedReport).map(([name, data], index) => (
              <React.Fragment key={index}>
                <View style={[commonStyles.card, styles.reportCard]}>
                  <View style={styles.reportItemHeader}>
                    <Text style={styles.reportItemTitle}>{name}</Text>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>
                        {data.type === 'seed' ? 'Seed' : 'Transplant'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.reportItemDetails}>
                    <View style={styles.reportRow}>
                      <Text style={styles.reportLabel}>Used:</Text>
                      <Text style={styles.reportValue}>{data.used.toFixed(1)} {data.unit}</Text>
                    </View>
                    <View style={styles.reportRow}>
                      <Text style={styles.reportLabel}>Remaining:</Text>
                      <Text style={styles.reportValue}>{data.remaining.toFixed(1)} {data.unit}</Text>
                    </View>
                  </View>
                </View>
              </React.Fragment>
            ))}
            {Object.keys(seedReport).length === 0 && (
              <Text style={styles.emptyText}>No seed data available</Text>
            )}
          </View>
        );

      case 'packaging':
        const packagingReport = getPackagingReport();
        return (
          <View>
            <Text style={styles.reportTitle}>Packaging Usage Report</Text>
            <Text style={styles.reportSubtitle}>
              Track packaging material consumption
            </Text>
            {Object.entries(packagingReport).map(([name, data], index) => (
              <React.Fragment key={index}>
                <View style={[commonStyles.card, styles.reportCard]}>
                  <View style={styles.reportItemHeader}>
                    <Text style={styles.reportItemTitle}>{name}</Text>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{data.type}</Text>
                    </View>
                  </View>
                  <View style={styles.reportItemDetails}>
                    <View style={styles.reportRow}>
                      <Text style={styles.reportLabel}>Used:</Text>
                      <Text style={styles.reportValue}>{data.used} units</Text>
                    </View>
                    <View style={styles.reportRow}>
                      <Text style={styles.reportLabel}>Remaining:</Text>
                      <Text style={styles.reportValue}>{data.remaining} units</Text>
                    </View>
                  </View>
                </View>
              </React.Fragment>
            ))}
            {Object.keys(packagingReport).length === 0 && (
              <Text style={styles.emptyText}>No packaging data available</Text>
            )}
          </View>
        );

      case 'yields':
        return (
          <View>
            <Text style={styles.reportTitle}>Harvest Yields Report</Text>
            <Text style={styles.reportSubtitle}>
              All harvest yields by crop and date
            </Text>
            {yields.map((yieldItem, index) => (
              <React.Fragment key={index}>
                <View style={[commonStyles.card, styles.reportCard]}>
                  <Text style={styles.reportItemTitle}>
                    {yieldItem.cropName}
                    {yieldItem.variety && ` - ${yieldItem.variety}`}
                  </Text>
                  <View style={styles.reportItemDetails}>
                    <View style={styles.reportRow}>
                      <Text style={styles.reportLabel}>Quantity:</Text>
                      <Text style={styles.reportValue}>
                        {yieldItem.quantity} {yieldItem.unit}
                      </Text>
                    </View>
                    <View style={styles.reportRow}>
                      <Text style={styles.reportLabel}>Harvest Date:</Text>
                      <Text style={styles.reportValue}>
                        {new Date(yieldItem.harvestDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.reportRow}>
                      <Text style={styles.reportLabel}>Storage:</Text>
                      <Text style={styles.reportValue}>
                        {yieldItem.storageLocation === 'dry' ? 'Dry' : 'Refrigerated'}
                      </Text>
                    </View>
                    {yieldItem.quality && (
                      <View style={styles.reportRow}>
                        <Text style={styles.reportLabel}>Quality:</Text>
                        <Text style={styles.reportValue}>
                          {yieldItem.quality.charAt(0).toUpperCase() + yieldItem.quality.slice(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </React.Fragment>
            ))}
            {yields.length === 0 && (
              <Text style={styles.emptyText}>No yield data available</Text>
            )}
          </View>
        );

      case 'sales':
        const totalRevenue = sales.reduce((sum, sale) => sum + (sale.price || 0), 0);
        const totalQuantitySold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
        return (
          <View>
            <Text style={styles.reportTitle}>Sales Report</Text>
            <Text style={styles.reportSubtitle}>
              All sales transactions and revenue
            </Text>
            
            <View style={[commonStyles.card, styles.summaryCard]}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Sales</Text>
                  <Text style={styles.summaryValue}>{sales.length}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Revenue</Text>
                  <Text style={[styles.summaryValue, styles.revenueText]}>
                    ${totalRevenue.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {sales.map((sale, index) => (
              <React.Fragment key={index}>
                <View style={[commonStyles.card, styles.reportCard]}>
                  <Text style={styles.reportItemTitle}>{sale.cropName}</Text>
                  <View style={styles.reportItemDetails}>
                    <View style={styles.reportRow}>
                      <Text style={styles.reportLabel}>Quantity:</Text>
                      <Text style={styles.reportValue}>
                        {sale.quantity} {sale.unit}
                      </Text>
                    </View>
                    <View style={styles.reportRow}>
                      <Text style={styles.reportLabel}>Sale Date:</Text>
                      <Text style={styles.reportValue}>
                        {new Date(sale.saleDate).toLocaleDateString()}
                      </Text>
                    </View>
                    {sale.price && (
                      <View style={styles.reportRow}>
                        <Text style={styles.reportLabel}>Price:</Text>
                        <Text style={[styles.reportValue, styles.revenueText]}>
                          ${sale.price.toFixed(2)}
                        </Text>
                      </View>
                    )}
                    {sale.paymentMethod && (
                      <View style={styles.reportRow}>
                        <Text style={styles.reportLabel}>Payment:</Text>
                        <Text style={styles.reportValue}>
                          {sale.paymentMethod === 'cash' ? 'Cash' :
                           sale.paymentMethod === 'credit_debit' ? 'Credit/Debit' :
                           'Payment App'}
                        </Text>
                      </View>
                    )}
                    {sale.customer && (
                      <View style={styles.reportRow}>
                        <Text style={styles.reportLabel}>Customer:</Text>
                        <Text style={styles.reportValue}>{sale.customer}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </React.Fragment>
            ))}
            {sales.length === 0 && (
              <Text style={styles.emptyText}>No sales data available</Text>
            )}
          </View>
        );

      case 'usage':
        return (
          <View>
            <Text style={styles.reportTitle}>Usage Records Report</Text>
            <Text style={styles.reportSubtitle}>
              All recorded usage of fertilizers, seeds, and packaging
            </Text>
            {usageRecords.map((record, index) => (
              <React.Fragment key={index}>
                <View style={[commonStyles.card, styles.reportCard]}>
                  <View style={styles.reportItemHeader}>
                    <Text style={styles.reportItemTitle}>{record.itemName}</Text>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>
                        {record.itemType.charAt(0).toUpperCase() + record.itemType.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.reportItemDetails}>
                    <View style={styles.reportRow}>
                      <Text style={styles.reportLabel}>Quantity Used:</Text>
                      <Text style={styles.reportValue}>
                        {record.quantity} {record.unit}
                      </Text>
                    </View>
                    <View style={styles.reportRow}>
                      <Text style={styles.reportLabel}>Date:</Text>
                      <Text style={styles.reportValue}>
                        {new Date(record.usageDate).toLocaleDateString()}
                      </Text>
                    </View>
                    {record.usedFor && (
                      <View style={styles.reportRow}>
                        <Text style={styles.reportLabel}>Used For:</Text>
                        <Text style={styles.reportValue}>{record.usedFor}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </React.Fragment>
            ))}
            {usageRecords.length === 0 && (
              <Text style={styles.emptyText}>No usage records available</Text>
            )}
          </View>
        );

      case 'payment_methods':
        const paymentReport = getPaymentMethodReport();
        const totalSales = Object.values(paymentReport).reduce((sum, data) => sum + data.count, 0);
        const totalPaymentRevenue = Object.values(paymentReport).reduce((sum, data) => sum + data.revenue, 0);
        return (
          <View>
            <Text style={styles.reportTitle}>Payment Methods Report</Text>
            <Text style={styles.reportSubtitle}>
              Breakdown of sales by payment method
            </Text>

            <View style={[commonStyles.card, styles.summaryCard]}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Transactions</Text>
                  <Text style={styles.summaryValue}>{totalSales}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Revenue</Text>
                  <Text style={[styles.summaryValue, styles.revenueText]}>
                    ${totalPaymentRevenue.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {Object.entries(paymentReport).map(([method, data], index) => (
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
                      <Text style={[styles.reportValue, styles.revenueText]}>
                        ${data.revenue.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.reportRow}>
                      <Text style={styles.reportLabel}>Percentage:</Text>
                      <Text style={styles.reportValue}>
                        {totalSales > 0 ? ((data.count / totalSales) * 100).toFixed(1) : 0}%
                      </Text>
                    </View>
                  </View>
                </View>
              </React.Fragment>
            ))}
          </View>
        );

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderReport()}
        <View style={{ height: 100 }} />
      </ScrollView>
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
  reportCard: {
    marginBottom: 12,
    padding: 16,
  },
  reportItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
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
  revenueText: {
    color: colors.success,
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'capitalize',
  },
  summaryCard: {
    marginBottom: 20,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },
});
