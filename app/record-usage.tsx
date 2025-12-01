
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
import { FertilizerItem, SeedItem, PackagingItem } from '@/types/inventory';
import { supabase } from '@/lib/supabase';

export default function RecordUsageScreen() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Choose usage type
  const [usageType, setUsageType] = useState<'fertilizer' | 'seed' | 'packaging'>('fertilizer');

  // Step 2: Choose item
  const [items, setItems] = useState<(FertilizerItem | SeedItem | PackagingItem)[]>([]);
  const [selectedItem, setSelectedItem] = useState<FertilizerItem | SeedItem | PackagingItem | null>(null);

  // Step 3: Enter amount
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (step === 2) {
      loadItems();
    }
  }, [step, usageType]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        setLoading(false);
        return;
      }

      const tableName = usageType === 'fertilizer' ? 'fertilizers' : usageType === 'seed' ? 'seeds' : 'packaging';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`Error loading ${usageType}:`, error);
        Alert.alert('Error', `Failed to load ${usageType}`);
      } else {
        setItems(data || []);
      }
    } catch (error) {
      console.error(`Error loading ${usageType}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!selectedItem) {
        Alert.alert('Error', 'Please select an item');
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!selectedItem || !amount) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    const qty = parseFloat(amount);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (qty > selectedItem.quantity) {
      Alert.alert('Error', 'Not enough quantity available');
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

      const tableName = usageType === 'fertilizer' ? 'fertilizers' : usageType === 'seed' ? 'seeds' : 'packaging';
      
      // Update quantity
      const { error } = await supabase
        .from(tableName)
        .update({
          quantity: selectedItem.quantity - qty,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedItem.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating quantity:', error);
        Alert.alert('Error', 'Failed to record usage');
        setLoading(false);
        return;
      }

      Alert.alert('Success', 'Usage recorded successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error recording usage:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={commonStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Usage</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressSteps}>
          {[1, 2, 3].map((s, idx) => (
            <React.Fragment key={idx}>
              <View
                style={[
                  styles.progressStep,
                  step >= s && styles.progressStepActive,
                ]}
              >
                <Text
                  style={[
                    styles.progressStepText,
                    step >= s && styles.progressStepTextActive,
                  ]}
                >
                  {s}
                </Text>
              </View>
              {s < 3 && (
                <View
                  style={[
                    styles.progressLine,
                    step > s && styles.progressLineActive,
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>
        <Text style={styles.progressLabel}>
          {step === 1 ? 'Choose Type' : step === 2 ? 'Select Item' : 'Enter Amount'}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What type of item did you use?</Text>
            <View style={styles.typeSelector}>
              {(['fertilizer', 'seed', 'packaging'] as const).map((type, idx) => (
                <React.Fragment key={idx}>
                  <TouchableOpacity
                    style={[
                      styles.typeCard,
                      usageType === type && styles.typeCardActive,
                    ]}
                    onPress={() => setUsageType(type)}
                  >
                    <IconSymbol
                      ios_icon_name={
                        type === 'fertilizer' ? 'science' : type === 'seed' ? 'eco' : 'inventory_2'
                      }
                      android_material_icon_name={
                        type === 'fertilizer' ? 'science' : type === 'seed' ? 'eco' : 'inventory_2'
                      }
                      size={48}
                      color={usageType === type ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.typeCardText,
                        usageType === type && styles.typeCardTextActive,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Select the item you used</Text>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : items.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No {usageType}s found</Text>
                <Text style={styles.emptySubtext}>
                  Add some {usageType}s first before recording usage
                </Text>
              </View>
            ) : (
              items.map((item, idx) => (
                <React.Fragment key={idx}>
                  <TouchableOpacity
                    style={[
                      commonStyles.card,
                      styles.itemCard,
                      selectedItem?.id === item.id && styles.itemCardActive,
                    ]}
                    onPress={() => setSelectedItem(item)}
                  >
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemQuantity}>
                      Available: {item.quantity} {item.unit}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))
            )}
          </View>
        )}

        {step === 3 && selectedItem && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>How much did you use?</Text>
            <View style={[commonStyles.card, styles.selectedItemCard]}>
              <Text style={styles.selectedItemName}>{selectedItem.name}</Text>
              <Text style={styles.selectedItemQuantity}>
                Available: {selectedItem.quantity} {selectedItem.unit}
              </Text>
            </View>

            <Text style={styles.label}>Amount Used *</Text>
            <View style={styles.amountInputContainer}>
              <TextInput
                style={[commonStyles.input, styles.amountInput]}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              <Text style={styles.unitText}>{selectedItem.unit}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {step < 3 ? (
          <TouchableOpacity
            style={[commonStyles.button, styles.nextButton]}
            onPress={handleNext}
          >
            <Text style={commonStyles.buttonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[commonStyles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.card} />
            ) : (
              <Text style={commonStyles.buttonText}>Record Usage</Text>
            )}
          </TouchableOpacity>
        )}
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
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: colors.card,
    marginBottom: 16,
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  progressStep: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepActive: {
    backgroundColor: colors.primary,
  },
  progressStepText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  progressStepTextActive: {
    color: colors.card,
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: colors.highlight,
  },
  progressLineActive: {
    backgroundColor: colors.primary,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  typeSelector: {
    gap: 16,
  },
  typeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  typeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  typeCardText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
  },
  typeCardTextActive: {
    color: colors.primary,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  itemCard: {
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  selectedItemCard: {
    marginBottom: 24,
  },
  selectedItemName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  selectedItemQuantity: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountInput: {
    flex: 1,
  },
  unitText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  actionContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextButton: {
    width: '100%',
  },
  submitButton: {
    width: '100%',
  },
});
