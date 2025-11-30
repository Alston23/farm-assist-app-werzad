
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
import { RevenueEntry, Planting, Field } from '@/types/crop';
import { IconSymbol } from '@/components/IconSymbol';
import { storage } from '@/utils/storage';
import { cropDatabase } from '@/data/cropDatabase';

export default function RevenueScreen() {
  const [revenueEntries, setRevenueEntries] = useState<RevenueEntry[]>([]);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RevenueEntry | null>(null);

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

  const totalRevenue = revenueEntries.reduce((sum, entry) => sum + entry.totalRevenue, 0);
  const totalCosts = revenueEntries.reduce((sum, entry) => sum + entry.costs, 0);
  const totalProfit = totalRevenue - totalCosts;

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
  const [costs, setCosts] = useState('');
  const [salesChannel, setSalesChannel] = useState<RevenueEntry['salesChannel']>('farmers-market');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (entry) {
      setSelectedPlantingId(entry.plantingId);
      setHarvestAmount(entry.harvestAmount.toString());
      setMarketPrice(entry.marketPrice.toString());
      setCosts(entry.costs.toString());
      setSalesChannel(entry.salesChannel);
      setDate(entry.date);
      setNotes(entry.notes);
    } else {
      setSelectedPlantingId('');
      setHarvestAmount('');
      setMarketPrice('');
      setCosts('');
      setSalesChannel('farmers-market');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [entry, visible]);

  const handleSave = () => {
    if (!selectedPlantingId || !harvestAmount || !marketPrice || !date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(harvestAmount);
    const price = parseFloat(marketPrice);
    const cost = parseFloat(costs) || 0;
    const revenue = amount * price;
    const profit = revenue - cost;

    const entryData = {
      ...(entry || {}),
      plantingId: selectedPlantingId,
      harvestAmount: amount,
      marketPrice: price,
      totalRevenue: revenue,
      costs: cost,
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
            <Text style={styles.formLabel}>Costs ($)</Text>
            <TextInput
              style={styles.formInput}
              value={costs}
              onChangeText={setCosts}
              placeholder="e.g., 25.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
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
    marginBottom: 16,
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
