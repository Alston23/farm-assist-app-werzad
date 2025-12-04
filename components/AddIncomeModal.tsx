
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';

interface AddIncomeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SALES_CHANNELS = [
  { value: 'roadside_stand', label: 'Roadside Stand' },
  { value: 'csa', label: 'CSA' },
  { value: 'farmers_market', label: 'Farmers Market' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'online', label: 'Online' },
  { value: 'other', label: 'Other' },
];

const UNITS = [
  { value: 'lbs', label: 'Pounds' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'bushels', label: 'Bushels' },
  { value: 'boxes', label: 'Boxes' },
  { value: 'units', label: 'Units' },
  { value: 'bunches', label: 'Bunches' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_debit', label: 'Credit/Debit' },
  { value: 'check', label: 'Check' },
  { value: 'payment_app', label: 'Payment App' },
  { value: 'other', label: 'Other' },
];

export default function AddIncomeModal({ visible, onClose, onSuccess }: AddIncomeModalProps) {
  const [cropName, setCropName] = useState('');
  const [salesChannel, setSalesChannel] = useState('');
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('lbs');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [saleDate, setSaleDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!cropName.trim()) {
      Alert.alert('Error', 'Please enter a crop name');
      return;
    }
    if (!salesChannel) {
      Alert.alert('Error', 'Please select a sales channel');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase.from('income').insert({
        user_id: user.id,
        crop_name: cropName.trim(),
        sales_channel: salesChannel,
        amount: parseFloat(amount),
        quantity: quantity ? parseFloat(quantity) : null,
        unit: quantity ? unit : null,
        price_per_unit: pricePerUnit ? parseFloat(pricePerUnit) : null,
        sale_date: saleDate.toISOString().split('T')[0],
        customer_name: customerName.trim() || null,
        payment_method: paymentMethod || null,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      Alert.alert('Success', 'Income added successfully');
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error adding income:', error);
      Alert.alert('Error', error.message || 'Failed to add income');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCropName('');
    setSalesChannel('');
    setAmount('');
    setQuantity('');
    setUnit('lbs');
    setPricePerUnit('');
    setSaleDate(new Date());
    setCustomerName('');
    setPaymentMethod('');
    setNotes('');
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSaleDate(selectedDate);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Income</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Crop Name *</Text>
            <TextInput
              style={styles.input}
              value={cropName}
              onChangeText={setCropName}
              placeholder="e.g., Tomatoes"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Sales Channel *</Text>
            <View style={styles.chipContainer}>
              {SALES_CHANNELS.map((channel) => (
                <TouchableOpacity
                  key={channel.value}
                  style={[
                    styles.chip,
                    salesChannel === channel.value && styles.chipSelected,
                  ]}
                  onPress={() => setSalesChannel(channel.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      salesChannel === channel.value && styles.chipTextSelected,
                    ]}
                  >
                    {channel.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Total Amount ($) *</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Quantity (Optional)</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.flexInput]}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
              <View style={styles.unitPicker}>
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u.value}
                    style={[
                      styles.unitOption,
                      unit === u.value && styles.unitOptionSelected,
                    ]}
                    onPress={() => setUnit(u.value)}
                  >
                    <Text
                      style={[
                        styles.unitText,
                        unit === u.value && styles.unitTextSelected,
                      ]}
                    >
                      {u.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={styles.label}>Price Per Unit (Optional)</Text>
            <TextInput
              style={styles.input}
              value={pricePerUnit}
              onChangeText={setPricePerUnit}
              placeholder="0.00"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Sale Date *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {saleDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={saleDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}

            <Text style={styles.label}>Customer Name (Optional)</Text>
            <TextInput
              style={styles.input}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Customer name"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Payment Method (Optional)</Text>
            <View style={styles.chipContainer}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.value}
                  style={[
                    styles.chip,
                    paymentMethod === method.value && styles.chipSelected,
                  ]}
                  onPress={() => setPaymentMethod(method.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      paymentMethod === method.value && styles.chipTextSelected,
                    ]}
                  >
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Adding...' : 'Add Income'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flexInput: {
    flex: 1,
  },
  unitPicker: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    maxHeight: 150,
  },
  unitOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  unitOptionSelected: {
    backgroundColor: '#4A7C2C',
  },
  unitText: {
    fontSize: 14,
    color: '#333',
  },
  unitTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4A7C2C',
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#4A7C2C',
  },
  chipText: {
    fontSize: 14,
    color: '#4A7C2C',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#f9f9f9',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#4A7C2C',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
