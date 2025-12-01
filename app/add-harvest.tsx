
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface StorageLocation {
  id: string;
  type: 'dry' | 'refrigerated' | 'freezer';
  capacity: number;
  used: number;
  unit: string;
}

export default function AddHarvestScreen() {
  const [loading, setLoading] = useState(false);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  // Form state
  const [cropName, setCropName] = useState('');
  const [yieldAmount, setYieldAmount] = useState('');
  const [unit, setUnit] = useState<'lbs' | 'kg' | 'bushels' | 'boxes' | 'units'>('lbs');
  const [plantedAmount, setPlantedAmount] = useState('');
  const [storageLocationId, setStorageLocationId] = useState<string | null>(null);

  useEffect(() => {
    loadStorageLocations();
  }, []);

  const loadStorageLocations = async () => {
    setLoadingLocations(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        setLoadingLocations(false);
        return;
      }

      const { data, error } = await supabase
        .from('storage_locations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading storage locations:', error);
      } else {
        setStorageLocations(data || []);
      }
    } catch (error) {
      console.error('Error loading storage locations:', error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleSubmit = async () => {
    if (!cropName.trim() || !yieldAmount) {
      Alert.alert('Error', 'Please fill in crop name and yield amount');
      return;
    }

    const yieldAmt = parseFloat(yieldAmount);
    if (isNaN(yieldAmt) || yieldAmt <= 0) {
      Alert.alert('Error', 'Please enter a valid yield amount');
      return;
    }

    const plantedAmt = plantedAmount ? parseFloat(plantedAmount) : null;
    if (plantedAmount && (isNaN(plantedAmt!) || plantedAmt! < 0)) {
      Alert.alert('Error', 'Please enter a valid planted amount');
      return;
    }

    if (!storageLocationId) {
      Alert.alert('Error', 'Please select a storage location');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in');
        setLoading(false);
        return;
      }

      // Insert harvest
      const { error: harvestError } = await supabase
        .from('harvests')
        .insert({
          user_id: user.id,
          crop_name: cropName.trim(),
          yield_amount: yieldAmt,
          unit,
          planted_amount: plantedAmt,
          storage_location_id: storageLocationId,
        });

      if (harvestError) {
        console.error('Error adding harvest:', harvestError);
        Alert.alert('Error', 'Failed to add harvest');
        setLoading(false);
        return;
      }

      // Update storage location used space
      const selectedLocation = storageLocations.find(loc => loc.id === storageLocationId);
      if (selectedLocation) {
        const newUsed = (selectedLocation.used || 0) + yieldAmt;
        
        const { error: updateError } = await supabase
          .from('storage_locations')
          .update({
            used: newUsed,
            updated_at: new Date().toISOString(),
          })
          .eq('id', storageLocationId)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating storage location:', updateError);
          // Don't fail the whole operation, just log the error
        }
      }

      Alert.alert('Success', 'Harvest added successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error adding harvest:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStorageLocationLabel = (location: StorageLocation) => {
    const typeLabel = location.type.charAt(0).toUpperCase() + location.type.slice(1);
    const available = location.capacity - (location.used || 0);
    return `${typeLabel} Storage (${available.toFixed(0)} ${location.unit} available)`;
  };

  const calculateLoss = () => {
    const yieldAmt = parseFloat(yieldAmount);
    const plantedAmt = parseFloat(plantedAmount);
    
    if (!isNaN(yieldAmt) && !isNaN(plantedAmt) && plantedAmt > 0) {
      const loss = plantedAmt - yieldAmt;
      const lossPercentage = (loss / plantedAmt) * 100;
      return { loss, lossPercentage };
    }
    return null;
  };

  const lossData = calculateLoss();

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
        <Text style={styles.headerTitle}>Add Harvest</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[commonStyles.card, styles.infoCard]}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            Record your harvest and automatically update storage capacity
          </Text>
        </View>

        {/* Crop Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Crop Name *</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="e.g., Tomatoes, Lettuce, Carrots"
            placeholderTextColor={colors.textSecondary}
            value={cropName}
            onChangeText={setCropName}
          />
        </View>

        {/* Yield Amount */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Yield Amount *</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[commonStyles.input, styles.quantityInput]}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              value={yieldAmount}
              onChangeText={setYieldAmount}
              keyboardType="decimal-pad"
            />
            <View style={styles.unitSelector}>
              {(['lbs', 'kg', 'bushels', 'boxes', 'units'] as const).map((u, idx) => (
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
                      {u}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>

        {/* Planted Amount (Optional) */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Planted Amount (Optional)</Text>
            <Text style={styles.labelHint}>For loss calculation</Text>
          </View>
          <TextInput
            style={commonStyles.input}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            value={plantedAmount}
            onChangeText={setPlantedAmount}
            keyboardType="decimal-pad"
          />
          {lossData && (
            <View style={styles.lossCard}>
              <View style={styles.lossRow}>
                <Text style={styles.lossLabel}>Calculated Loss:</Text>
                <Text style={[styles.lossValue, lossData.loss > 0 ? styles.lossNegative : styles.lossPositive]}>
                  {lossData.loss.toFixed(1)} {unit} ({lossData.lossPercentage.toFixed(1)}%)
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Storage Location */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Storage Location *</Text>
          {loadingLocations ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Loading storage locations...</Text>
            </View>
          ) : storageLocations.length === 0 ? (
            <View style={styles.emptyStorageCard}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={32}
                color={colors.warning}
              />
              <Text style={styles.emptyStorageText}>No storage locations found</Text>
              <Text style={styles.emptyStorageSubtext}>
                Please add storage locations first
              </Text>
              <TouchableOpacity
                style={styles.addStorageButton}
                onPress={() => router.push('/storage-locations')}
              >
                <Text style={styles.addStorageButtonText}>Add Storage Location</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.storageList}>
              {storageLocations.map((location, idx) => {
                const available = location.capacity - (location.used || 0);
                const isSelected = storageLocationId === location.id;
                const hasSpace = available > 0;
                
                return (
                  <React.Fragment key={idx}>
                    <TouchableOpacity
                      style={[
                        styles.storageCard,
                        isSelected && styles.storageCardSelected,
                        !hasSpace && styles.storageCardDisabled,
                      ]}
                      onPress={() => hasSpace && setStorageLocationId(location.id)}
                      disabled={!hasSpace}
                    >
                      <View style={styles.storageCardHeader}>
                        <View style={styles.storageCardTitle}>
                          <IconSymbol
                            ios_icon_name={
                              location.type === 'dry' ? 'cube.box.fill' :
                              location.type === 'refrigerated' ? 'snowflake' :
                              'thermometer.snowflake'
                            }
                            android_material_icon_name={
                              location.type === 'dry' ? 'inventory' : 'ac_unit'
                            }
                            size={20}
                            color={isSelected ? colors.primary : colors.textSecondary}
                          />
                          <Text style={[styles.storageCardName, isSelected && styles.storageCardNameSelected]}>
                            {getStorageLocationLabel(location)}
                          </Text>
                        </View>
                        {isSelected && (
                          <IconSymbol
                            ios_icon_name="checkmark.circle.fill"
                            android_material_icon_name="check_circle"
                            size={24}
                            color={colors.primary}
                          />
                        )}
                      </View>
                      
                      {/* Progress Bar */}
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${Math.min(((location.used || 0) / location.capacity) * 100, 100)}%`,
                                backgroundColor:
                                  ((location.used || 0) / location.capacity) > 0.9
                                    ? colors.error
                                    : ((location.used || 0) / location.capacity) > 0.7
                                    ? colors.warning
                                    : colors.success,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressText}>
                          {(location.used || 0).toFixed(0)} / {location.capacity.toFixed(0)} {location.unit} used
                        </Text>
                      </View>

                      {!hasSpace && (
                        <View style={styles.fullBadge}>
                          <Text style={styles.fullBadgeText}>FULL</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[commonStyles.button, styles.submitButton]}
          onPress={handleSubmit}
          disabled={loading || storageLocations.length === 0}
        >
          {loading ? (
            <ActivityIndicator color={colors.card} />
          ) : (
            <Text style={commonStyles.buttonText}>Add Harvest</Text>
          )}
        </TouchableOpacity>
      </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 24,
    backgroundColor: colors.primary + '10',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelHint: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  quantityInput: {
    flex: 1,
  },
  unitSelector: {
    flexDirection: 'column',
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  unitOption: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
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
  lossCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.highlight,
    borderRadius: 8,
  },
  lossRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lossLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  lossValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  lossNegative: {
    color: colors.error,
  },
  lossPositive: {
    color: colors.success,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyStorageCard: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  emptyStorageText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
  },
  emptyStorageSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  addStorageButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  addStorageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.card,
  },
  storageList: {
    gap: 12,
  },
  storageCard: {
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  storageCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  storageCardDisabled: {
    opacity: 0.5,
  },
  storageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  storageCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  storageCardName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  storageCardNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.highlight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  fullBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.error,
    borderRadius: 4,
  },
  fullBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.card,
  },
  actionContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    width: '100%',
  },
});
