
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { RevenueEntry, Planting, Field, InputCosts } from '@/types/crop';
import { IconSymbol } from '@/components/IconSymbol';
import { storage } from '@/utils/storage';
import { cropDatabase } from '@/data/cropDatabase';

interface SeasonData {
  season: string;
  totalYield: number;
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  entryCount: number;
}

interface CropRevenueData {
  cropId: string;
  cropName: string;
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  totalYield: number;
  averagePrice: number;
  entryCount: number;
  profitMargin: number;
}

export default function RevenueScreen() {
  const [revenueEntries, setRevenueEntries] = useState<RevenueEntry[]>([]);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RevenueEntry | null>(null);
  const [showCropBreakdown, setShowCropBreakdown] = useState(true);
  const [showCostCalculator, setShowCostCalculator] = useState(false);
  const [selectedCropForCalculator, setSelectedCropForCalculator] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [loadedRevenue, loadedPlantings, loadedFields] = await Promise.all([
      storage.getRevenue(),
      storage.getPlantings(),
      storage.getFields(),
    ]);
    setRevenueEntries(loadedRevenue);
    setPlantings(loadedPlantings);
    setFields(loadedFields);
  };

  const saveRevenue = async (newRevenue: RevenueEntry[]) => {
    await storage.saveRevenue(newRevenue);
    setRevenueEntries(newRevenue);
  };

  const addEntry = (entry: Omit<RevenueEntry, 'id'>) => {
    const newEntry: RevenueEntry = {
      ...entry,
      id: Date.now().toString(),
    };
    const newEntries = [...revenueEntries, newEntry];
    saveRevenue(newEntries);
    setShowAddModal(false);
  };

  const updateEntry = (entry: RevenueEntry) => {
    const newEntries = revenueEntries.map((e) => (e.id === entry.id ? entry : e));
    saveRevenue(newEntries);
    setEditingEntry(null);
  };

  const deleteEntry = (entryId: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const newEntries = revenueEntries.filter((e) => e.id !== entryId);
          saveRevenue(newEntries);
        },
      },
    ]);
  };

  // Calculate season from date (Spring: Mar-May, Summer: Jun-Aug, Fall: Sep-Nov, Winter: Dec-Feb)
  const getSeason = (dateString: string): string => {
    const date = new Date(dateString);
    const month = date.getMonth();
    const year = date.getFullYear();
    
    let season = '';
    if (month >= 2 && month <= 4) season = 'Spring';
    else if (month >= 5 && month <= 7) season = 'Summer';
    else if (month >= 8 && month <= 10) season = 'Fall';
    else season = 'Winter';
    
    return `${season} ${year}`;
  };

  // Group entries by season and calculate totals
  const getSeasonData = (): SeasonData[] => {
    const seasonMap = new Map<string, SeasonData>();
    
    revenueEntries.forEach((entry) => {
      const season = getSeason(entry.date);
      
      if (!seasonMap.has(season)) {
        seasonMap.set(season, {
          season,
          totalYield: 0,
          totalRevenue: 0,
          totalCosts: 0,
          totalProfit: 0,
          entryCount: 0,
        });
      }
      
      const data = seasonMap.get(season)!;
      data.totalYield += entry.harvestAmount;
      data.totalRevenue += entry.totalRevenue;
      data.totalCosts += entry.costs;
      data.totalProfit += entry.profit;
      data.entryCount += 1;
    });
    
    // Sort by date (most recent first)
    return Array.from(seasonMap.values()).sort((a, b) => {
      const dateA = new Date(a.season.split(' ')[1] + '-' + getMonthFromSeason(a.season.split(' ')[0]));
      const dateB = new Date(b.season.split(' ')[1] + '-' + getMonthFromSeason(b.season.split(' ')[0]));
      return dateB.getTime() - dateA.getTime();
    });
  };

  const getMonthFromSeason = (season: string): string => {
    const seasonMonths: { [key: string]: string } = {
      'Spring': '04',
      'Summer': '07',
      'Fall': '10',
      'Winter': '01',
    };
    return seasonMonths[season] || '01';
  };

  // Calculate per-crop revenue breakdown
  const getCropRevenueData = (): CropRevenueData[] => {
    const cropMap = new Map<string, CropRevenueData>();
    
    revenueEntries.forEach((entry) => {
      const planting = plantings.find((p) => p.id === entry.plantingId);
      if (!planting) return;
      
      const crop = cropDatabase.find((c) => c.id === planting.cropId);
      if (!crop) return;
      
      if (!cropMap.has(crop.id)) {
        cropMap.set(crop.id, {
          cropId: crop.id,
          cropName: crop.name,
          totalRevenue: 0,
          totalCosts: 0,
          totalProfit: 0,
          totalYield: 0,
          averagePrice: 0,
          entryCount: 0,
          profitMargin: 0,
        });
      }
      
      const data = cropMap.get(crop.id)!;
      data.totalRevenue += entry.totalRevenue;
      data.totalCosts += entry.costs;
      data.totalProfit += entry.profit;
      data.totalYield += entry.harvestAmount;
      data.entryCount += 1;
    });
    
    // Calculate averages and profit margins
    cropMap.forEach((data) => {
      data.averagePrice = data.totalYield > 0 ? data.totalRevenue / data.totalYield : 0;
      data.profitMargin = data.totalRevenue > 0 ? (data.totalProfit / data.totalRevenue) * 100 : 0;
    });
    
    // Sort by total profit (highest first)
    return Array.from(cropMap.values()).sort((a, b) => b.totalProfit - a.totalProfit);
  };

  // Calculate percentage change
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const seasonData = getSeasonData();
  const currentSeason = seasonData[0];
  const previousSeason = seasonData[1];

  const totalRevenue = revenueEntries.reduce((sum, entry) => sum + entry.totalRevenue, 0);
  const totalCosts = revenueEntries.reduce((sum, entry) => sum + entry.costs, 0);
  const totalProfit = totalRevenue - totalCosts;

  // Calculate total input costs by category
  const totalInputCosts = revenueEntries.reduce(
    (acc, entry) => {
      if (entry.inputCosts) {
        acc.fertilizer += entry.inputCosts.fertilizer || 0;
        acc.fuel += entry.inputCosts.fuel || 0;
        acc.seed += entry.inputCosts.seed || 0;
        acc.equipment += entry.inputCosts.equipment || 0;
        acc.packaging += entry.inputCosts.packaging || 0;
        acc.miscellaneous += entry.inputCosts.miscellaneous || 0;
      }
      return acc;
    },
    { fertilizer: 0, fuel: 0, seed: 0, equipment: 0, packaging: 0, miscellaneous: 0 }
  );

  const cropRevenueData = getCropRevenueData();
  const harvestedPlantings = plantings.filter((p) => p.status === 'harvested');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Revenue</Text>
          <Text style={styles.headerSubtitle}>{revenueEntries.length} entries</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <IconSymbol
            ios_icon_name="plus.circle.fill"
            android_material_icon_name="add-circle"
            size={32}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Financial Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Revenue:</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              ${totalRevenue.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Costs:</Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              ${totalCosts.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowTotal]}>
            <Text style={styles.summaryLabelTotal}>Net Profit:</Text>
            <Text
              style={[
                styles.summaryValueTotal,
                { color: totalProfit >= 0 ? colors.success : colors.error },
              ]}
            >
              ${totalProfit.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Per-Crop Revenue Breakdown */}
        <View style={styles.summaryCard}>
          <TouchableOpacity
            style={styles.sectionHeaderButton}
            onPress={() => setShowCropBreakdown(!showCropBreakdown)}
          >
            <View style={styles.sectionHeaderLeft}>
              <IconSymbol
                ios_icon_name="chart.bar.fill"
                android_material_icon_name="bar-chart"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.summaryTitle}>Per-Crop Revenue Breakdown</Text>
            </View>
            <IconSymbol
              ios_icon_name={showCropBreakdown ? 'chevron.up' : 'chevron.down'}
              android_material_icon_name={showCropBreakdown ? 'expand-less' : 'expand-more'}
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>

          {showCropBreakdown && (
            <View style={styles.cropBreakdownContainer}>
              {cropRevenueData.length === 0 ? (
                <Text style={styles.emptyText}>No crop data available yet</Text>
              ) : (
                cropRevenueData.map((cropData, index) => (
                  <View key={cropData.cropId} style={styles.cropBreakdownItem}>
                    <View style={styles.cropBreakdownHeader}>
                      <Text style={styles.cropBreakdownName}>{cropData.cropName}</Text>
                      <Text
                        style={[
                          styles.cropBreakdownProfit,
                          { color: cropData.totalProfit >= 0 ? colors.success : colors.error },
                        ]}
                      >
                        ${cropData.totalProfit.toFixed(2)}
                      </Text>
                    </View>
                    
                    <View style={styles.cropBreakdownStats}>
                      <View style={styles.cropStat}>
                        <Text style={styles.cropStatLabel}>Revenue</Text>
                        <Text style={styles.cropStatValue}>${cropData.totalRevenue.toFixed(2)}</Text>
                      </View>
                      <View style={styles.cropStat}>
                        <Text style={styles.cropStatLabel}>Costs</Text>
                        <Text style={styles.cropStatValue}>${cropData.totalCosts.toFixed(2)}</Text>
                      </View>
                      <View style={styles.cropStat}>
                        <Text style={styles.cropStatLabel}>Yield</Text>
                        <Text style={styles.cropStatValue}>{cropData.totalYield.toFixed(1)} lbs</Text>
                      </View>
                      <View style={styles.cropStat}>
                        <Text style={styles.cropStatLabel}>Avg Price</Text>
                        <Text style={styles.cropStatValue}>${cropData.averagePrice.toFixed(2)}/lb</Text>
                      </View>
                    </View>

                    <View style={styles.cropBreakdownFooter}>
                      <View
                        style={[
                          styles.profitMarginBadge,
                          {
                            backgroundColor:
                              cropData.profitMargin >= 50
                                ? colors.success + '20'
                                : cropData.profitMargin >= 20
                                ? colors.primary + '20'
                                : colors.error + '20',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.profitMarginText,
                            {
                              color:
                                cropData.profitMargin >= 50
                                  ? colors.success
                                  : cropData.profitMargin >= 20
                                  ? colors.primary
                                  : colors.error,
                            },
                          ]}
                        >
                          {cropData.profitMargin.toFixed(1)}% margin
                        </Text>
                      </View>
                      <Text style={styles.cropEntryCount}>{cropData.entryCount} entries</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* Cost of Production Calculator */}
        <View style={styles.summaryCard}>
          <TouchableOpacity
            style={styles.sectionHeaderButton}
            onPress={() => setShowCostCalculator(!showCostCalculator)}
          >
            <View style={styles.sectionHeaderLeft}>
              <IconSymbol
                ios_icon_name="calculator.fill"
                android_material_icon_name="calculate"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.summaryTitle}>Cost of Production Calculator</Text>
            </View>
            <IconSymbol
              ios_icon_name={showCostCalculator ? 'chevron.up' : 'chevron.down'}
              android_material_icon_name={showCostCalculator ? 'expand-less' : 'expand-more'}
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>

          {showCostCalculator && (
            <View style={styles.calculatorContainer}>
              <Text style={styles.calculatorDescription}>
                Calculate cost per pound and break-even price for each crop
              </Text>
              
              {cropRevenueData.length === 0 ? (
                <Text style={styles.emptyText}>Add revenue entries to see calculations</Text>
              ) : (
                cropRevenueData.map((cropData) => {
                  const costPerPound = cropData.totalYield > 0 ? cropData.totalCosts / cropData.totalYield : 0;
                  const breakEvenPrice = costPerPound;
                  const targetPrice20 = costPerPound * 1.2; // 20% margin
                  const targetPrice50 = costPerPound * 1.5; // 50% margin
                  
                  return (
                    <View key={cropData.cropId} style={styles.calculatorItem}>
                      <Text style={styles.calculatorCropName}>{cropData.cropName}</Text>
                      
                      <View style={styles.calculatorMetrics}>
                        <View style={styles.calculatorMetric}>
                          <Text style={styles.calculatorMetricLabel}>Cost per lb</Text>
                          <Text style={styles.calculatorMetricValue}>
                            ${costPerPound.toFixed(2)}
                          </Text>
                        </View>
                        
                        <View style={styles.calculatorMetric}>
                          <Text style={styles.calculatorMetricLabel}>Break-even</Text>
                          <Text style={styles.calculatorMetricValue}>
                            ${breakEvenPrice.toFixed(2)}/lb
                          </Text>
                        </View>
                      </View>

                      <View style={styles.targetPricesContainer}>
                        <Text style={styles.targetPricesTitle}>Target Prices:</Text>
                        <View style={styles.targetPriceRow}>
                          <Text style={styles.targetPriceLabel}>20% margin:</Text>
                          <Text style={styles.targetPriceValue}>${targetPrice20.toFixed(2)}/lb</Text>
                        </View>
                        <View style={styles.targetPriceRow}>
                          <Text style={styles.targetPriceLabel}>50% margin:</Text>
                          <Text style={styles.targetPriceValue}>${targetPrice50.toFixed(2)}/lb</Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.currentPriceIndicator,
                          {
                            backgroundColor:
                              cropData.averagePrice >= targetPrice50
                                ? colors.success + '20'
                                : cropData.averagePrice >= targetPrice20
                                ? colors.primary + '20'
                                : cropData.averagePrice >= breakEvenPrice
                                ? colors.accent + '20'
                                : colors.error + '20',
                          },
                        ]}
                      >
                        <Text style={styles.currentPriceLabel}>Current avg price:</Text>
                        <Text
                          style={[
                            styles.currentPriceValue,
                            {
                              color:
                                cropData.averagePrice >= targetPrice50
                                  ? colors.success
                                  : cropData.averagePrice >= targetPrice20
                                  ? colors.primary
                                  : cropData.averagePrice >= breakEvenPrice
                                  ? colors.accent
                                  : colors.error,
                            },
                          ]}
                        >
                          ${cropData.averagePrice.toFixed(2)}/lb
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>

        {currentSeason && previousSeason && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Season-over-Season Change</Text>
            <Text style={styles.seasonComparisonSubtitle}>
              {currentSeason.season} vs {previousSeason.season}
            </Text>
            
            <View style={styles.changeContainer}>
              <View style={styles.changeItem}>
                <View style={styles.changeHeader}>
                  <IconSymbol
                    ios_icon_name="scalemass.fill"
                    android_material_icon_name="scale"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.changeLabel}>Total Yield</Text>
                </View>
                <View style={styles.changeValues}>
                  <Text style={styles.changeCurrentValue}>
                    {currentSeason.totalYield.toFixed(1)} lbs
                  </Text>
                  <Text style={styles.changePreviousValue}>
                    was {previousSeason.totalYield.toFixed(1)} lbs
                  </Text>
                </View>
                <PercentageChangeIndicator
                  change={calculatePercentageChange(
                    currentSeason.totalYield,
                    previousSeason.totalYield
                  )}
                />
              </View>

              <View style={styles.changeDivider} />

              <View style={styles.changeItem}>
                <View style={styles.changeHeader}>
                  <IconSymbol
                    ios_icon_name="dollarsign.circle.fill"
                    android_material_icon_name="attach-money"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.changeLabel}>Total Revenue</Text>
                </View>
                <View style={styles.changeValues}>
                  <Text style={styles.changeCurrentValue}>
                    ${currentSeason.totalRevenue.toFixed(2)}
                  </Text>
                  <Text style={styles.changePreviousValue}>
                    was ${previousSeason.totalRevenue.toFixed(2)}
                  </Text>
                </View>
                <PercentageChangeIndicator
                  change={calculatePercentageChange(
                    currentSeason.totalRevenue,
                    previousSeason.totalRevenue
                  )}
                />
              </View>

              <View style={styles.changeDivider} />

              <View style={styles.changeItem}>
                <View style={styles.changeHeader}>
                  <IconSymbol
                    ios_icon_name="chart.line.uptrend.xyaxis"
                    android_material_icon_name="trending-up"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.changeLabel}>Net Profit</Text>
                </View>
                <View style={styles.changeValues}>
                  <Text style={styles.changeCurrentValue}>
                    ${currentSeason.totalProfit.toFixed(2)}
                  </Text>
                  <Text style={styles.changePreviousValue}>
                    was ${previousSeason.totalProfit.toFixed(2)}
                  </Text>
                </View>
                <PercentageChangeIndicator
                  change={calculatePercentageChange(
                    currentSeason.totalProfit,
                    previousSeason.totalProfit
                  )}
                />
              </View>
            </View>
          </View>
        )}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Input Costs Breakdown</Text>
          <View style={styles.costBreakdown}>
            <CostBreakdownItem
              label="Fertilizer"
              amount={totalInputCosts.fertilizer}
              icon="leaf.fill"
              androidIcon="eco"
            />
            <CostBreakdownItem
              label="Fuel"
              amount={totalInputCosts.fuel}
              icon="fuelpump.fill"
              androidIcon="local-gas-station"
            />
            <CostBreakdownItem
              label="Seed"
              amount={totalInputCosts.seed}
              icon="circle.grid.3x3.fill"
              androidIcon="grain"
            />
            <CostBreakdownItem
              label="Equipment"
              amount={totalInputCosts.equipment}
              icon="wrench.and.screwdriver.fill"
              androidIcon="build"
            />
            <CostBreakdownItem
              label="Packaging"
              amount={totalInputCosts.packaging}
              icon="shippingbox.fill"
              androidIcon="inventory"
            />
            <CostBreakdownItem
              label="Miscellaneous"
              amount={totalInputCosts.miscellaneous}
              icon="ellipsis.circle.fill"
              androidIcon="more-horiz"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Entries</Text>
          {revenueEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="dollarsign.circle"
                android_material_icon_name="attach-money"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateTitle}>No Revenue Entries</Text>
              <Text style={styles.emptyStateText}>
                Add your first revenue entry to track your farm income
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.emptyStateButtonText}>Add Entry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            revenueEntries
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((entry) => {
                const planting = plantings.find((p) => p.id === entry.plantingId);
                const crop = cropDatabase.find((c) => c.id === planting?.cropId);
                const field = fields.find((f) => f.id === planting?.fieldId);
                return (
                  <TouchableOpacity
                    key={entry.id}
                    style={styles.entryCard}
                    onPress={() => setEditingEntry(entry)}
                  >
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryCrop}>{crop?.name || 'Unknown Crop'}</Text>
                      <Text
                        style={[
                          styles.entryProfit,
                          { color: entry.profit >= 0 ? colors.success : colors.error },
                        ]}
                      >
                        ${entry.profit.toFixed(2)}
                      </Text>
                    </View>
                    <Text style={styles.entryField}>{field?.name || 'Unknown Field'}</Text>
                    <View style={styles.entryDetails}>
                      <View style={styles.entryDetailItem}>
                        <Text style={styles.entryDetailLabel}>Harvest:</Text>
                        <Text style={styles.entryDetailValue}>
                          {entry.harvestAmount} lbs
                        </Text>
                      </View>
                      <View style={styles.entryDetailItem}>
                        <Text style={styles.entryDetailLabel}>Price:</Text>
                        <Text style={styles.entryDetailValue}>
                          ${entry.marketPrice}/lb
                        </Text>
                      </View>
                      <View style={styles.entryDetailItem}>
                        <Text style={styles.entryDetailLabel}>Revenue:</Text>
                        <Text style={styles.entryDetailValue}>
                          ${entry.totalRevenue.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.entryFooter}>
                      <View
                        style={[
                          styles.channelBadge,
                          { backgroundColor: getChannelColor(entry.salesChannel) },
                        ]}
                      >
                        <Text style={styles.channelBadgeText}>
                          {entry.salesChannel.replace('-', ' ')}
                        </Text>
                      </View>
                      <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
          )}
        </View>
      </ScrollView>

      <RevenueFormModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={addEntry}
        plantings={harvestedPlantings}
        fields={fields}
      />

      <RevenueFormModal
        visible={editingEntry !== null}
        entry={editingEntry || undefined}
        onClose={() => setEditingEntry(null)}
        onSave={updateEntry}
        onDelete={deleteEntry}
        plantings={harvestedPlantings}
        fields={fields}
      />
    </SafeAreaView>
  );
}

function PercentageChangeIndicator({ change }: { change: number }) {
  const isPositive = change >= 0;
  const isNeutral = Math.abs(change) < 0.01;
  
  return (
    <View
      style={[
        styles.percentageChangeContainer,
        {
          backgroundColor: isNeutral
            ? colors.textSecondary + '20'
            : isPositive
            ? colors.success + '20'
            : colors.error + '20',
        },
      ]}
    >
      <IconSymbol
        ios_icon_name={isNeutral ? 'minus' : isPositive ? 'arrow.up' : 'arrow.down'}
        android_material_icon_name={
          isNeutral ? 'remove' : isPositive ? 'arrow-upward' : 'arrow-downward'
        }
        size={20}
        color={isNeutral ? colors.textSecondary : isPositive ? colors.success : colors.error}
      />
      <Text
        style={[
          styles.percentageChangeText,
          {
            color: isNeutral ? colors.textSecondary : isPositive ? colors.success : colors.error,
          },
        ]}
      >
        {Math.abs(change).toFixed(1)}%
      </Text>
    </View>
  );
}

function CostBreakdownItem({
  label,
  amount,
  icon,
  androidIcon,
}: {
  label: string;
  amount: number;
  icon: string;
  androidIcon: string;
}) {
  return (
    <View style={styles.costBreakdownItem}>
      <View style={styles.costBreakdownLeft}>
        <IconSymbol
          ios_icon_name={icon}
          android_material_icon_name={androidIcon}
          size={20}
          color={colors.primary}
        />
        <Text style={styles.costBreakdownLabel}>{label}:</Text>
      </View>
      <Text style={styles.costBreakdownValue}>${amount.toFixed(2)}</Text>
    </View>
  );
}

function RevenueFormModal({
  visible,
  entry,
  onClose,
  onSave,
  onDelete,
  plantings,
  fields,
}: {
  visible: boolean;
  entry?: RevenueEntry;
  onClose: () => void;
  onSave: (entry: any) => void;
  onDelete?: (id: string) => void;
  plantings: Planting[];
  fields: Field[];
}) {
  const [selectedPlantingId, setSelectedPlantingId] = useState('');
  const [harvestAmount, setHarvestAmount] = useState('');
  const [marketPrice, setMarketPrice] = useState('');
  const [inputCosts, setInputCosts] = useState<InputCosts>({
    fertilizer: 0,
    fuel: 0,
    seed: 0,
    equipment: 0,
    packaging: 0,
    miscellaneous: 0,
  });
  const [salesChannel, setSalesChannel] = useState<RevenueEntry['salesChannel']>('farmers-market');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [showInputCosts, setShowInputCosts] = useState(false);

  useEffect(() => {
    if (entry) {
      setSelectedPlantingId(entry.plantingId);
      setHarvestAmount(entry.harvestAmount.toString());
      setMarketPrice(entry.marketPrice.toString());
      setInputCosts(
        entry.inputCosts || {
          fertilizer: 0,
          fuel: 0,
          seed: 0,
          equipment: 0,
          packaging: 0,
          miscellaneous: 0,
        }
      );
      setSalesChannel(entry.salesChannel);
      setDate(entry.date);
      setNotes(entry.notes);
    } else {
      setSelectedPlantingId('');
      setHarvestAmount('');
      setMarketPrice('');
      setInputCosts({
        fertilizer: 0,
        fuel: 0,
        seed: 0,
        equipment: 0,
        packaging: 0,
        miscellaneous: 0,
      });
      setSalesChannel('farmers-market');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [entry, visible]);

  const updateInputCost = (key: keyof InputCosts, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputCosts((prev) => ({ ...prev, [key]: numValue }));
  };

  const totalInputCosts =
    inputCosts.fertilizer +
    inputCosts.fuel +
    inputCosts.seed +
    inputCosts.equipment +
    inputCosts.packaging +
    inputCosts.miscellaneous;

  const handleSave = () => {
    if (!selectedPlantingId || !harvestAmount || !marketPrice || !date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(harvestAmount);
    const price = parseFloat(marketPrice);
    const revenue = amount * price;
    const profit = revenue - totalInputCosts;

    const entryData = {
      ...(entry || {}),
      plantingId: selectedPlantingId,
      harvestAmount: amount,
      marketPrice: price,
      totalRevenue: revenue,
      costs: totalInputCosts,
      inputCosts,
      profit,
      salesChannel,
      date,
      notes,
    };

    onSave(entryData);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer} edges={['top']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{entry ? 'Edit Entry' : 'Add Revenue Entry'}</Text>
          <TouchableOpacity onPress={onClose}>
            <IconSymbol
              ios_icon_name="xmark.circle.fill"
              android_material_icon_name="close"
              size={28}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentContainer}
        >
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Planting *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.plantingSelector}>
                {plantings.map((planting) => {
                  const crop = cropDatabase.find((c) => c.id === planting.cropId);
                  const field = fields.find((f) => f.id === planting.fieldId);
                  return (
                    <TouchableOpacity
                      key={planting.id}
                      style={[
                        styles.plantingOption,
                        selectedPlantingId === planting.id && styles.plantingOptionActive,
                      ]}
                      onPress={() => setSelectedPlantingId(planting.id)}
                    >
                      <Text
                        style={[
                          styles.plantingOptionText,
                          selectedPlantingId === planting.id &&
                            styles.plantingOptionTextActive,
                        ]}
                      >
                        {crop?.name}
                      </Text>
                      <Text
                        style={[
                          styles.plantingOptionSubtext,
                          selectedPlantingId === planting.id &&
                            styles.plantingOptionTextActive,
                        ]}
                      >
                        {field?.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Harvest Amount (lbs) *</Text>
            <TextInput
              style={styles.formInput}
              value={harvestAmount}
              onChangeText={setHarvestAmount}
              placeholder="e.g., 50"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Market Price ($/lb) *</Text>
            <TextInput
              style={styles.formInput}
              value={marketPrice}
              onChangeText={setMarketPrice}
              placeholder="e.g., 3.50"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <TouchableOpacity
              style={styles.inputCostsHeader}
              onPress={() => setShowInputCosts(!showInputCosts)}
            >
              <View style={styles.inputCostsHeaderLeft}>
                <Text style={styles.formLabel}>Input Costs</Text>
                <Text style={styles.inputCostsTotalBadge}>
                  Total: ${totalInputCosts.toFixed(2)}
                </Text>
              </View>
              <IconSymbol
                ios_icon_name={showInputCosts ? 'chevron.up' : 'chevron.down'}
                android_material_icon_name={showInputCosts ? 'expand-less' : 'expand-more'}
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>

            {showInputCosts && (
              <View style={styles.inputCostsContainer}>
                <View style={styles.inputCostRow}>
                  <View style={styles.inputCostLabelContainer}>
                    <IconSymbol
                      ios_icon_name="leaf.fill"
                      android_material_icon_name="eco"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.inputCostLabel}>Fertilizer ($)</Text>
                  </View>
                  <TextInput
                    style={styles.inputCostInput}
                    value={inputCosts.fertilizer.toString()}
                    onChangeText={(value) => updateInputCost('fertilizer', value)}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputCostRow}>
                  <View style={styles.inputCostLabelContainer}>
                    <IconSymbol
                      ios_icon_name="fuelpump.fill"
                      android_material_icon_name="local-gas-station"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.inputCostLabel}>Fuel ($)</Text>
                  </View>
                  <TextInput
                    style={styles.inputCostInput}
                    value={inputCosts.fuel.toString()}
                    onChangeText={(value) => updateInputCost('fuel', value)}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputCostRow}>
                  <View style={styles.inputCostLabelContainer}>
                    <IconSymbol
                      ios_icon_name="circle.grid.3x3.fill"
                      android_material_icon_name="grain"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.inputCostLabel}>Seed ($)</Text>
                  </View>
                  <TextInput
                    style={styles.inputCostInput}
                    value={inputCosts.seed.toString()}
                    onChangeText={(value) => updateInputCost('seed', value)}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputCostRow}>
                  <View style={styles.inputCostLabelContainer}>
                    <IconSymbol
                      ios_icon_name="wrench.and.screwdriver.fill"
                      android_material_icon_name="build"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.inputCostLabel}>Equipment ($)</Text>
                  </View>
                  <TextInput
                    style={styles.inputCostInput}
                    value={inputCosts.equipment.toString()}
                    onChangeText={(value) => updateInputCost('equipment', value)}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputCostRow}>
                  <View style={styles.inputCostLabelContainer}>
                    <IconSymbol
                      ios_icon_name="shippingbox.fill"
                      android_material_icon_name="inventory"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.inputCostLabel}>Packaging ($)</Text>
                  </View>
                  <TextInput
                    style={styles.inputCostInput}
                    value={inputCosts.packaging.toString()}
                    onChangeText={(value) => updateInputCost('packaging', value)}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputCostRow}>
                  <View style={styles.inputCostLabelContainer}>
                    <IconSymbol
                      ios_icon_name="ellipsis.circle.fill"
                      android_material_icon_name="more-horiz"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.inputCostLabel}>Miscellaneous ($)</Text>
                  </View>
                  <TextInput
                    style={styles.inputCostInput}
                    value={inputCosts.miscellaneous.toString()}
                    onChangeText={(value) => updateInputCost('miscellaneous', value)}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Sales Channel</Text>
            <View style={styles.typeSelector}>
              {(
                [
                  'self-sufficiency',
                  'roadside-stand',
                  'restaurant',
                  'csa',
                  'farmers-market',
                ] as const
              ).map((channel) => (
                <TouchableOpacity
                  key={channel}
                  style={[
                    styles.typeOption,
                    salesChannel === channel && styles.typeOptionActive,
                  ]}
                  onPress={() => setSalesChannel(channel)}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      salesChannel === channel && styles.typeOptionTextActive,
                    ]}
                  >
                    {channel.replace('-', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Date *</Text>
            <TextInput
              style={styles.formInput}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Notes</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{entry ? 'Update Entry' : 'Add Entry'}</Text>
          </TouchableOpacity>

          {entry && onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                onDelete(entry.id);
                onClose();
              }}
            >
              <Text style={styles.deleteButtonText}>Delete Entry</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getChannelColor(channel: string): string {
  const colors_map: { [key: string]: string } = {
    'self-sufficiency': colors.accent,
    'roadside-stand': colors.primary,
    restaurant: '#FF6B6B',
    csa: '#4ECDC4',
    'farmers-market': '#FFB6C1',
  };
  return colors_map[channel] || colors.secondary;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
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
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryRowTotal: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  summaryLabelTotal: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryValueTotal: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionHeaderButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cropBreakdownContainer: {
    gap: 16,
  },
  cropBreakdownItem: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cropBreakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cropBreakdownName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  cropBreakdownProfit: {
    fontSize: 18,
    fontWeight: '700',
  },
  cropBreakdownStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  cropStat: {
    flex: 1,
    minWidth: '45%',
  },
  cropStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  cropStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  cropBreakdownFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  profitMarginBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  profitMarginText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cropEntryCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  calculatorContainer: {
    gap: 16,
  },
  calculatorDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  calculatorItem: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calculatorCropName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  calculatorMetrics: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  calculatorMetric: {
    flex: 1,
  },
  calculatorMetricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  calculatorMetricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  targetPricesContainer: {
    backgroundColor: colors.highlight,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  targetPricesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  targetPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  targetPriceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  targetPriceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  currentPriceIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
  },
  currentPriceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  currentPriceValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  seasonComparisonSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  changeContainer: {
    gap: 16,
  },
  changeItem: {
    gap: 8,
  },
  changeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  changeValues: {
    marginLeft: 32,
  },
  changeCurrentValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  changePreviousValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  changeDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  percentageChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    marginLeft: 32,
  },
  percentageChangeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  costBreakdown: {
    gap: 12,
  },
  costBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costBreakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  costBreakdownLabel: {
    fontSize: 15,
    color: colors.text,
  },
  costBreakdownValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  entryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryCrop: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  entryProfit: {
    fontSize: 18,
    fontWeight: '700',
  },
  entryField: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  entryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  entryDetailItem: {
    flex: 1,
  },
  entryDetailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  entryDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  channelBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.card,
    textTransform: 'capitalize',
  },
  entryDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  plantingSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  plantingOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 120,
  },
  plantingOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  plantingOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  plantingOptionSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  plantingOptionTextActive: {
    color: colors.card,
  },
  inputCostsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  inputCostsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputCostsTotalBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.highlight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  inputCostsContainer: {
    marginTop: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    gap: 16,
  },
  inputCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputCostLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  inputCostLabel: {
    fontSize: 15,
    color: colors.text,
  },
  inputCostInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.text,
    minWidth: 100,
    textAlign: 'right',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  typeOptionTextActive: {
    color: colors.card,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
});
