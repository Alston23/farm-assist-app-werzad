
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';

interface Equipment {
  id: string;
  name: string;
  type: string;
  brand?: string;
  model?: string;
  year?: number;
  hours: number;
  purchase_date?: string;
  purchase_price?: number;
  notes?: string;
  created_at: string;
}

interface AddEquipmentModalProps {
  visible: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  initialEquipment?: Equipment | null;
  onSaved?: (equipment: any) => void;
}

const equipmentTypes = [
  'Tractor',
  'Plow',
  'Cultivator',
  'Seeder/Planter',
  'Sprayer',
  'Harvester',
  'Mower',
  'Tiller',
  'Trailer',
  'Irrigation Equipment',
  'Hand Tools',
  'Other',
];

export default function AddEquipmentModal({ 
  visible, 
  onClose, 
  onSuccess, 
  initialEquipment,
  onSaved 
}: AddEquipmentModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [hours, setHours] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditMode = !!initialEquipment;

  // Populate form when editing
  useEffect(() => {
    if (initialEquipment) {
      console.log('Equipment: Populating form with', initialEquipment);
      setName(initialEquipment.name || '');
      setType(initialEquipment.type || '');
      setBrand(initialEquipment.brand || '');
      setModel(initialEquipment.model || '');
      setYear(initialEquipment.year ? String(initialEquipment.year) : '');
      setHours(String(initialEquipment.hours || 0));
      setPurchasePrice(initialEquipment.purchase_price ? String(initialEquipment.purchase_price) : '');
      setNotes(initialEquipment.notes || '');
      
      if (initialEquipment.purchase_date) {
        setPurchaseDate(new Date(initialEquipment.purchase_date));
      }
    } else {
      resetForm();
    }
  }, [initialEquipment, visible]);

  const handlePurchaseDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPurchaseDatePicker(false);
    }
    
    if (event.type === 'set' && selectedDate) {
      setPurchaseDate(selectedDate);
    } else if (event.type === 'dismissed') {
      setShowPurchaseDatePicker(false);
    }
  };

  const handleSaveEquipment = async () => {
    console.log('Equipment: Save pressed');
    console.log('Equipment: form values', {
      name,
      type,
      brand,
      model,
      year,
      hours,
      purchaseDate,
      purchasePrice,
      notes,
    });

    // Validate required fields
    if (!name.trim() || !hours) {
      Alert.alert('Missing information', 'Please fill in all required fields.');
      return;
    }

    if (!type) {
      Alert.alert('Missing information', 'Please fill in all required fields.');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in');
        setSaving(false);
        return;
      }

      // Build payload
      const payload: any = {
        user_id: user.id,
        name: name.trim(),
        type,
        hours: hours ? parseFloat(hours) : 0,
      };

      if (brand.trim()) payload.brand = brand.trim();
      if (model.trim()) payload.model = model.trim();
      if (year) payload.year = parseInt(year);
      if (purchasePrice) payload.purchase_price = parseFloat(purchasePrice);
      if (notes.trim()) payload.notes = notes.trim();
      payload.purchase_date = purchaseDate.toISOString().split('T')[0];

      console.log('Equipment: Saving with payload', payload);

      let data, error;

      // Perform insert or update based on whether initialEquipment.id exists
      if (initialEquipment?.id) {
        console.log('Equipment: Updating equipment with id', initialEquipment.id);
        const result = await supabase
          .from('equipment')
          .update(payload)
          .eq('id', initialEquipment.id)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      } else {
        console.log('Equipment: Creating new equipment');
        const result = await supabase
          .from('equipment')
          .insert(payload)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Equipment: Save error', error);
        Alert.alert('Error saving equipment', error.message || 'Something went wrong.');
        setSaving(false);
        return;
      }

      console.log('Equipment: Save success', data);

      // Call onSaved callback if provided
      onSaved?.(data);

      // Show success alert
      Alert.alert('Success', 'Equipment saved successfully.');

      // Call onClose callback
      onClose?.();

      // Also call onSuccess for backward compatibility
      onSuccess?.();

      // Reset form
      resetForm();
      setSaving(false);
    } catch (error) {
      console.error('Equipment: Unexpected save error', error);
      Alert.alert('Error saving equipment', 'Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setType('');
    setBrand('');
    setModel('');
    setYear('');
    setHours('');
    setPurchaseDate(new Date());
    setPurchasePrice('');
    setNotes('');
    setShowPurchaseDatePicker(false);
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  const formatDate = (date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditMode ? 'Edit Equipment' : 'Add Equipment'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.label}>Equipment Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., John Deere Tractor"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Type *</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowTypeDropdown(!showTypeDropdown)}
              >
                <Text style={type ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {type || 'Select equipment type'}
                </Text>
              </TouchableOpacity>
              {showTypeDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView style={styles.typeScrollView} nestedScrollEnabled>
                    {equipmentTypes.map((equipType, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setType(equipType);
                          setShowTypeDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{equipType}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Brand</Text>
              <TextInput
                style={styles.input}
                value={brand}
                onChangeText={setBrand}
                placeholder="e.g., John Deere"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Model</Text>
              <TextInput
                style={styles.input}
                value={model}
                onChangeText={setModel}
                placeholder="e.g., 5075E"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Year</Text>
              <TextInput
                style={styles.input}
                value={year}
                onChangeText={setYear}
                placeholder="e.g., 2020"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Current Hours *</Text>
              <TextInput
                style={styles.input}
                value={hours}
                onChangeText={setHours}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Purchase Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowPurchaseDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  📅 {formatDate(purchaseDate)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Purchase Price ($)</Text>
              <TextInput
                style={styles.input}
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Additional information..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveEquipment}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : isEditMode ? 'Update Equipment' : 'Save Equipment'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {showPurchaseDatePicker && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={showPurchaseDatePicker}
          onRequestClose={() => setShowPurchaseDatePicker(false)}
        >
          <TouchableOpacity
            style={styles.datePickerOverlay}
            activeOpacity={1}
            onPress={() => setShowPurchaseDatePicker(false)}
          >
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select Purchase Date</Text>
                <TouchableOpacity
                  onPress={() => setShowPurchaseDatePicker(false)}
                  style={styles.datePickerCloseButton}
                >
                  <Text style={styles.datePickerCloseText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={purchaseDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                onChange={handlePurchaseDateChange}
                style={styles.datePicker}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  scrollView: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  textArea: {
    minHeight: 100,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  dropdownList: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 200,
  },
  typeScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#4A7C2C',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#2D5016',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4A7C2C',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  datePickerCloseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4A7C2C',
    borderRadius: 8,
  },
  datePickerCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  datePicker: {
    width: '100%',
    height: 200,
  },
});
