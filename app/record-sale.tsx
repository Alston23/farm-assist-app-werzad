
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

export default function RecordSaleScreen() {
  const [loading, setLoading] = useState(false);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  // Form state
  const [cropName, setCropName] = useState('');
  const [amountSold, setAmountSold] = useState('');
  const [unit, setUnit] = useState<'lbs' | 'kg' | 'bushels' | 'boxes' | 'units'>('lbs');
  const [storageLocationId, setStorageLocationId] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_debit' | 'payment_app'>('cash');
  const [customer, setCustomer] = useState('');
  const [notes, setNotes] = useState('');

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
    if (!cropName.trim() || !amountSold) {
      Alert.alert('Error', 'Please fill in crop name and amount sold');
      return;
    }

    const amount = parseFloat(amountSold);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const priceValue = price ? parseFloat(price) : null;
    if (price && (isNaN(priceValue!) || priceValue! < 0)) {
      Alert.alert('Error', 'Please enter a valid price');
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

      // Insert sale
      const { error: saleError } = await supabase
        .from('sales')
        .insert({
          user_id: user.id,
          crop_name: cropName.trim(),
          amount_sold: amount,
          unit,
          storage_location_id: storageLocationId,
          price: priceValue,
          payment_method: paymentMethod,
          customer: customer.trim() || null,
          notes: notes.trim() || null,
        });

      if (saleError) {
        console.error('Error recording sale:', saleError);
        Alert.alert('Error', 'Failed to record sale');
        setLoading(false);
        return;
      }

      // Update storage location used space (decrease)
      const selectedLocation = storageLocations.find(loc => loc.id === storageLocationId);
      if (selectedLocation) {
        const newUsed = Math.max((selectedLocation.used || 0) - amount, 0);
        
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

      Alert.alert('Success', 'Sale recorded successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error recording sale:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStorageLocationLabel = (location: StorageLocation) => {
    const typeLabel = location.type.charAt(0).toUpperCase() + location.type.slice(1);
    const used = location.used || 0;
    return `${typeLabel} Storage (${used.toFixed(0)} ${location.unit} in stock)`;
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
        <Text style={styles.headerTitle}>Record Sale</Text>
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
            Record your sale and automatically update storage capacity
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

        {/* Amount Sold */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Amount Sold *</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[commonStyles.input, styles.quantityInput]}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              value={amountSold}
              onChangeText={setAmountSold}
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
                const isSelected = storageLocationId === location.id;
                const hasStock = (location.used || 0) > 0;
                
                return (
                  <React.Fragment key={idx}>
                    <TouchableOpacity
                      style={[
                        styles.storageCard,
                        isSelected && styles.storageCardSelected,
                        !hasStock && styles.storageCardDisabled,
                      ]}
                      onPress={() => hasStock && setStorageLocationId(location.id)}
                      disabled={!hasStock}
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

                      {!hasStock && (
                        <View style={styles.emptyBadge}>
                          <Text style={styles.emptyBadgeText}>EMPTY</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </View>
          )}
        </View>

        {/* Price */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Sale Price (Optional)</Text>
            <Text style={styles.labelHint}>Total revenue</Text>
          </View>
          <View style={styles.priceInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={[commonStyles.input, styles.priceInput]}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.paymentSelector}>
            {([
              { value: 'cash' as const, label: 'Cash', icon: 'payments' },
              { value: 'credit_debit' as const, label: 'Credit/Debit', icon: 'credit_card' },
              { value: 'payment_app' as const, label: 'Payment App', icon: 'smartphone' },
            ]).map((method, idx) => (
              <React.Fragment key={idx}>
                <TouchableOpacity
                  style={[
                    styles.paymentButton,
                    paymentMethod === method.value && styles.paymentButtonActive,
                  ]}
                  onPress={() => setPaymentMethod(method.value)}
                >
                  <IconSymbol
                    ios_icon_name={method.icon}
                    android_material_icon_name={method.icon}
                    size={20}
                    color={paymentMethod === method.value ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.paymentButtonText,
                      paymentMethod === method.value && styles.paymentButtonTextActive,
                    ]}
                  >
                    {method.label}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Customer */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Customer (Optional)</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="Customer name or business"
            placeholderTextColor={colors.textSecondary}
            value={customer}
            onChangeText={setCustomer}
          />
        </View>

        {/* Notes */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[commonStyles.input, styles.notesInput]}
            placeholder="Additional notes..."
            placeholderTextColor={colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
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
            <Text style={commonStyles.buttonText}>Record Sale</Text>
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
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
  },
  paymentSelector: {
    gap: 12,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    gap: 12,
  },
  paymentButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  paymentButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  paymentButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
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
  emptyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.textSecondary,
    borderRadius: 4,
  },
  emptyBadgeText: {
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
