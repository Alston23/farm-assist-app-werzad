
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
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AddStorageModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem?: any;
}

export default function AddStorageModal({ visible, onClose, onSuccess, editItem }: AddStorageModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [storageType, setStorageType] = useState(editItem?.type || 'dry');
  const [unit, setUnit] = useState(editItem?.unit || 'sqft');
  const [capacity, setCapacity] = useState(editItem?.capacity?.toString() || '');
  const [used, setUsed] = useState(editItem?.used?.toString() || '0');
  const [notes, setNotes] = useState(editItem?.notes || '');

  const handleSave = async () => {
    if (!capacity || parseFloat(capacity) <= 0) {
      Alert.alert('Error', 'Please enter a valid capacity');
      return;
    }

    if (parseFloat(used) < 0) {
      Alert.alert('Error', 'Used amount cannot be negative');
      return;
    }

    if (parseFloat(used) > parseFloat(capacity)) {
      Alert.alert('Error', 'Used amount cannot exceed capacity');
      return;
    }

    setLoading(true);
    try {
      const data = {
        user_id: user?.id,
        type: storageType,
        unit,
        capacity: parseFloat(capacity),
        used: parseFloat(used),
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (editItem) {
        const result = await supabase
          .from('storage_locations')
          .update(data)
          .eq('id', editItem.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('storage_locations')
          .insert([data]);
        error = result.error;
      }

      if (error) throw error;

      Alert.alert('Success', `Storage ${editItem ? 'updated' : 'added'} successfully`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving storage:', error);
      Alert.alert('Error', error.message || 'Failed to save storage');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStorageType('dry');
    setUnit('sqft');
    setCapacity('');
    setUsed('0');
    setNotes('');
  };

  const handleClose = () => {
    if (!editItem) resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editItem ? 'Edit' : 'Add'} Storage Space</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Storage Type *</Text>
            <View style={styles.buttonGroup}>
              {['dry', 'refrigerated', 'freezer'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.optionButton, storageType === type && styles.optionButtonActive]}
                  onPress={() => setStorageType(type)}
                >
                  <Text style={[styles.optionButtonText, storageType === type && styles.optionButtonTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Measurement Unit *</Text>
            <View style={styles.buttonGroup}>
              {['sqft', 'percentage'].map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.optionButton, unit === u && styles.optionButtonActive]}
                  onPress={() => setUnit(u)}
                >
                  <Text style={[styles.optionButtonText, unit === u && styles.optionButtonTextActive]}>
                    {u === 'sqft' ? 'Square Feet' : 'Percentage (%)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Total Capacity * {unit === 'percentage' ? '(%)' : '(sq ft)'}</Text>
            <TextInput
              style={styles.input}
              value={capacity}
              onChangeText={setCapacity}
              placeholder={unit === 'percentage' ? 'Enter 0-100' : 'Enter square footage'}
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Currently Used {unit === 'percentage' ? '(%)' : '(sq ft)'}</Text>
            <TextInput
              style={styles.input}
              value={used}
              onChangeText={setUsed}
              placeholder="0"
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes..."
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>{editItem ? 'Update' : 'Add'} Storage</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 40,
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
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
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionButton: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  optionButtonActive: {
    borderColor: '#4A7C2C',
    backgroundColor: '#E8F5E9',
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  optionButtonTextActive: {
    color: '#2D5016',
  },
  saveButton: {
    backgroundColor: '#4A7C2C',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
