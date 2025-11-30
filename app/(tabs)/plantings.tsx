
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
import { Planting, Field } from '@/types/crop';
import { IconSymbol } from '@/components/IconSymbol';
import { storage } from '@/utils/storage';
import { cropDatabase } from '@/data/cropDatabase';

export default function PlantingsScreen() {
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlanting, setEditingPlanting] = useState<Planting | null>(null);
  const [filter, setFilter] = useState<'all' | 'planned' | 'planted' | 'growing' | 'harvested'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [loadedPlantings, loadedFields] = await Promise.all([
      storage.getPlantings(),
      storage.getFields(),
    ]);
    setPlantings(loadedPlantings);
    setFields(loadedFields);
  };

  const savePlantings = async (newPlantings: Planting[]) => {
    await storage.savePlantings(newPlantings);
    setPlantings(newPlantings);
  };

  const addPlanting = (planting: Omit<Planting, 'id'>) => {
    const newPlanting: Planting = {
      ...planting,
      id: Date.now().toString(),
    };
    const newPlantings = [...plantings, newPlanting];
    savePlantings(newPlantings);
    setShowAddModal(false);
  };

  const updatePlanting = (planting: Planting) => {
    const newPlantings = plantings.map((p) => (p.id === planting.id ? planting : p));
    savePlantings(newPlantings);
    setEditingPlanting(null);
  };

  const deletePlanting = (plantingId: string) => {
    Alert.alert('Delete Planting', 'Are you sure you want to delete this planting?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const newPlantings = plantings.filter((p) => p.id !== plantingId);
          savePlantings(newPlantings);
          setEditingPlanting(null);
        },
      },
    ]);
  };

  const filteredPlantings = plantings.filter((planting) => {
    if (filter === 'all') return true;
    return planting.status === filter;
  });

  const sortedPlantings = [...filteredPlantings].sort((a, b) => {
    return new Date(b.plantDate).getTime() - new Date(a.plantDate).getTime();
  });

  const activePlantings = plantings.filter((p) => p.status === 'planted' || p.status === 'growing');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Plantings</Text>
          <Text style={styles.headerSubtitle}>
            {plantings.length} total • {activePlantings.length} active
          </Text>
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

      <View style={styles.filterContainer}>
        {(['all', 'planned', 'planted', 'growing', 'harvested'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === f && styles.filterButtonTextActive,
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {sortedPlantings.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="leaf.fill"
              android_material_icon_name="eco"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateTitle}>No Plantings</Text>
            <Text style={styles.emptyStateText}>
              {filter === 'all'
                ? 'Add your first planting to start tracking your crops'
                : `No ${filter} plantings yet`}
            </Text>
            {filter === 'all' && (
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.emptyStateButtonText}>Add Planting</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          sortedPlantings.map((planting) => {
            const crop = cropDatabase.find((c) => c.id === planting.cropId);
            const field = fields.find((f) => f.id === planting.fieldId);
            const daysUntilHarvest = Math.ceil(
              (new Date(planting.expectedHarvestDate).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            );

            return (
              <TouchableOpacity
                key={planting.id}
                style={styles.plantingCard}
                onPress={() => setEditingPlanting(planting)}
              >
                <View style={styles.plantingHeader}>
                  <View style={styles.plantingTitleContainer}>
                    <Text style={styles.plantingCrop}>{crop?.name || 'Unknown Crop'}</Text>
                    <Text style={styles.plantingField}>{field?.name || 'Unknown Field'}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(planting.status) },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>{planting.status}</Text>
                  </View>
                </View>

                <View style={styles.plantingInfo}>
                  <View style={styles.plantingInfoItem}>
                    <IconSymbol
                      ios_icon_name="calendar"
                      android_material_icon_name="event"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.plantingInfoText}>
                      Planted: {formatDate(planting.plantDate)}
                    </Text>
                  </View>
                  <View style={styles.plantingInfoItem}>
                    <IconSymbol
                      ios_icon_name="calendar.badge.clock"
                      android_material_icon_name="schedule"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.plantingInfoText}>
                      Harvest: {formatDate(planting.expectedHarvestDate)}
                    </Text>
                  </View>
                </View>

                {planting.status !== 'harvested' && daysUntilHarvest > 0 && (
                  <View style={styles.harvestCountdown}>
                    <Text style={styles.harvestCountdownText}>
                      {daysUntilHarvest} days until harvest
                    </Text>
                  </View>
                )}

                {planting.status === 'harvested' && planting.actualHarvestDate && (
                  <View style={styles.harvestInfo}>
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={16}
                      color={colors.success}
                    />
                    <Text style={styles.harvestInfoText}>
                      Harvested: {formatDate(planting.actualHarvestDate)}
                    </Text>
                  </View>
                )}

                <View style={styles.plantingFooter}>
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>{planting.quantity} plants</Text>
                  </View>
                  {crop && (
                    <Text style={styles.yieldEstimate}>
                      Est. yield: {calculateYield(crop.yieldPerPlant, planting.quantity)}
                    </Text>
                  )}
                </View>

                {planting.notes && (
                  <Text style={styles.plantingNotes} numberOfLines={2}>
                    {planting.notes}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <PlantingFormModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={addPlanting}
        fields={fields}
      />

      <PlantingFormModal
        visible={editingPlanting !== null}
        planting={editingPlanting || undefined}
        onClose={() => setEditingPlanting(null)}
        onSave={updatePlanting}
        onDelete={deletePlanting}
        fields={fields}
      />
    </SafeAreaView>
  );
}

function PlantingFormModal({
  visible,
  planting,
  onClose,
  onSave,
  onDelete,
  fields,
}: {
  visible: boolean;
  planting?: Planting;
  onClose: () => void;
  onSave: (planting: any) => void;
  onDelete?: (id: string) => void;
  fields: Field[];
}) {
  const [selectedCropId, setSelectedCropId] = useState('');
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [plantDate, setPlantDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [status, setStatus] = useState<Planting['status']>('planned');
  const [notes, setNotes] = useState('');
  const [actualHarvestDate, setActualHarvestDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (planting) {
      setSelectedCropId(planting.cropId);
      setSelectedFieldId(planting.fieldId);
      setPlantDate(planting.plantDate);
      setQuantity(planting.quantity.toString());
      setStatus(planting.status);
      setNotes(planting.notes);
      setActualHarvestDate(planting.actualHarvestDate || '');
    } else {
      setSelectedCropId('');
      setSelectedFieldId('');
      setPlantDate(new Date().toISOString().split('T')[0]);
      setQuantity('');
      setStatus('planned');
      setNotes('');
      setActualHarvestDate('');
    }
  }, [planting, visible]);

  const handleSave = () => {
    if (!selectedCropId || !selectedFieldId || !plantDate || !quantity) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const crop = cropDatabase.find((c) => c.id === selectedCropId);
    if (!crop) {
      Alert.alert('Error', 'Invalid crop selected');
      return;
    }

    const daysToMaturity = parseInt(crop.daysToMaturity.split('-')[1] || crop.daysToMaturity);
    const expectedHarvestDate = new Date(plantDate);
    expectedHarvestDate.setDate(expectedHarvestDate.getDate() + daysToMaturity);

    const plantingData = {
      ...(planting || {}),
      cropId: selectedCropId,
      fieldId: selectedFieldId,
      plantDate,
      expectedHarvestDate: expectedHarvestDate.toISOString().split('T')[0],
      quantity: parseInt(quantity),
      status,
      notes,
      ...(actualHarvestDate && { actualHarvestDate }),
    };

    onSave(plantingData);
  };

  const filteredCrops = cropDatabase.filter((crop) =>
    crop.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer} edges={['top']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {planting ? 'Edit Planting' : 'Add Planting'}
          </Text>
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
            <Text style={styles.formLabel}>Crop *</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search crops..."
              placeholderTextColor={colors.textSecondary}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.cropScrollView}
            >
              <View style={styles.cropSelector}>
                {filteredCrops.slice(0, 20).map((crop) => (
                  <TouchableOpacity
                    key={crop.id}
                    style={[
                      styles.cropOption,
                      selectedCropId === crop.id && styles.cropOptionActive,
                    ]}
                    onPress={() => {
                      setSelectedCropId(crop.id);
                      setSearchQuery('');
                    }}
                  >
                    <Text
                      style={[
                        styles.cropOptionText,
                        selectedCropId === crop.id && styles.cropOptionTextActive,
                      ]}
                    >
                      {crop.name}
                    </Text>
                    <Text
                      style={[
                        styles.cropOptionSubtext,
                        selectedCropId === crop.id && styles.cropOptionTextActive,
                      ]}
                    >
                      {crop.category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Field *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.fieldSelector}>
                {fields.map((field) => (
                  <TouchableOpacity
                    key={field.id}
                    style={[
                      styles.fieldOption,
                      selectedFieldId === field.id && styles.fieldOptionActive,
                    ]}
                    onPress={() => setSelectedFieldId(field.id)}
                  >
                    <Text
                      style={[
                        styles.fieldOptionText,
                        selectedFieldId === field.id && styles.fieldOptionTextActive,
                      ]}
                    >
                      {field.name}
                    </Text>
                    <Text
                      style={[
                        styles.fieldOptionSubtext,
                        selectedFieldId === field.id && styles.fieldOptionTextActive,
                      ]}
                    >
                      {field.size} sq ft
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Plant Date *</Text>
            <TextInput
              style={styles.formInput}
              value={plantDate}
              onChangeText={setPlantDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Quantity (number of plants) *</Text>
            <TextInput
              style={styles.formInput}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="e.g., 10"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Status</Text>
            <View style={styles.typeSelector}>
              {(['planned', 'planted', 'growing', 'harvested'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.typeOption, status === s && styles.typeOptionActive]}
                  onPress={() => setStatus(s)}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      status === s && styles.typeOptionTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {status === 'harvested' && (
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Actual Harvest Date</Text>
              <TextInput
                style={styles.formInput}
                value={actualHarvestDate}
                onChangeText={setActualHarvestDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          )}

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
            <Text style={styles.saveButtonText}>
              {planting ? 'Update Planting' : 'Add Planting'}
            </Text>
          </TouchableOpacity>

          {planting && onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDelete(planting.id)}
            >
              <Text style={styles.deleteButtonText}>Delete Planting</Text>
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

function getStatusColor(status: string): string {
  const colorsMap: { [key: string]: string } = {
    planned: colors.accent,
    planted: colors.primary,
    growing: colors.success,
    harvested: colors.secondary,
  };
  return colorsMap[status] || colors.secondary;
}

function calculateYield(yieldPerPlant: string, quantity: number): string {
  const match = yieldPerPlant.match(/(\d+)-?(\d+)?/);
  if (!match) return 'N/A';
  
  const min = parseInt(match[1]);
  const max = match[2] ? parseInt(match[2]) : min;
  const avg = (min + max) / 2;
  const totalYield = avg * quantity;
  
  return `${totalYield.toFixed(1)} lbs`;
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.card,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterButtonTextActive: {
    color: colors.card,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  plantingCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  plantingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  plantingTitleContainer: {
    flex: 1,
  },
  plantingCrop: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  plantingField: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.card,
    textTransform: 'capitalize',
  },
  plantingInfo: {
    marginBottom: 12,
  },
  plantingInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  plantingInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  harvestCountdown: {
    backgroundColor: colors.highlight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  harvestCountdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  harvestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  harvestInfoText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  plantingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  yieldEstimate: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  plantingNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
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
  searchInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  cropScrollView: {
    maxHeight: 200,
  },
  cropSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  cropOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 120,
  },
  cropOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cropOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  cropOptionSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  cropOptionTextActive: {
    color: colors.card,
  },
  fieldSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  fieldOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 120,
  },
  fieldOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  fieldOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  fieldOptionSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  fieldOptionTextActive: {
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
