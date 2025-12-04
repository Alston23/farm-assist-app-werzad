
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
import { packagingTypes } from '../data/fertilizers';

interface AddPackagingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem?: any;
}

export default function AddPackagingModal({ visible, onClose, onSuccess, editItem }: AddPackagingModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(editItem?.name || '');
  const [quantity, setQuantity] = useState(editItem?.quantity?.toString() || '');
  const [unit, setUnit] = useState(editItem?.unit || 'units');
  const [reorderThreshold, setReorderThreshold] = useState(editItem?.reorder_threshold?.toString() || '');
  const [notes, setNotes] = useState(editItem?.notes || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPackaging = packagingTypes.filter(p =>
    p.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a packaging name');
      return;
    }

    if (!quantity || parseFloat(quantity) < 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (reorderThreshold && parseFloat(reorderThreshold) < 0) {
      Alert.alert('Error', 'Reorder threshold cannot be negative');
      return;
    }

    setLoading(true);
    try {
      const data = {
        user_id: user?.id,
        name: name.trim(),
        quantity: parseFloat(quantity),
        unit,
        reorder_threshold: reorderThreshold ? parseFloat(reorderThreshold) : null,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (editItem) {
        const result = await supabase
          .from('packaging')
          .update(data)
          .eq('id', editItem.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('packaging')
          .insert([data]);
        error = result.error;
      }

      if (error) throw error;

      Alert.alert('Success', `Packaging ${editItem ? 'updated' : 'added'} successfully`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving packaging:', error);
      Alert.alert('Error', error.message || 'Failed to save packaging');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setQuantity('');
    setUnit('units');
    setReorderThreshold('');
    setNotes('');
    setSearchQuery('');
  };

  const handleClose = () => {
    if (!editItem) resetForm();
    setShowDropdown(false);
    onClose();
  };

  const selectPackaging = (packaging: string) => {
    setName(packaging);
    setSearchQuery(packaging);
    setShowDropdown(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editItem ? 'Edit' : 'Add'} Packaging</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Packaging Type *</Text>
            <TextInput
              style={styles.input}
              value={searchQuery || name}
              onChangeText={(text) => {
                setSearchQuery(text);
                setName(text);
                setShowDropdown(text.length > 0);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search or enter packaging type"
              placeholderTextColor="#999"
            />

            {showDropdown && filteredPackaging.length > 0 && (
              <View style={styles.dropdown}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {filteredPackaging.slice(0, 10).map((packaging, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.dropdownItem}
                      onPress={() => selectPackaging(packaging)}
                    >
                      <Text style={styles.dropdownItemText}>{packaging}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Enter quantity"
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Unit</Text>
            <TextInput
              style={styles.input}
              value={unit}
              onChangeText={setUnit}
              placeholder="units, boxes, rolls, etc."
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Reorder Threshold (Optional)</Text>
            <Text style={styles.helperText}>
              Get reminded when quantity falls below this amount
            </Text>
            <TextInput
              style={styles.input}
              value={reorderThreshold}
              onChangeText={setReorderThreshold}
              placeholder="Enter minimum quantity"
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
                <Text style={styles.saveButtonText}>{editItem ? 'Update' : 'Add'} Packaging</Text>
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
  helperText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
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
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#333',
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
