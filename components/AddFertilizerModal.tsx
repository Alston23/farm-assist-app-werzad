
import React, { useState, useEffect } from 'react';
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
import { commonFertilizers } from '../data/fertilizers';

interface AddFertilizerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem?: any;
}

export default function AddFertilizerModal({ visible, onClose, onSuccess, editItem }: AddFertilizerModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('lbs');
  const [notes, setNotes] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (editItem) {
      setName(editItem.name || '');
      setQuantity(editItem.quantity?.toString() || '');
      setUnit(editItem.unit || 'lbs');
      setNotes(editItem.notes || '');
      setSearchQuery('');
    } else if (!visible) {
      resetForm();
    }
  }, [editItem, visible]);

  const filteredFertilizers = commonFertilizers.filter(f =>
    f.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a fertilizer name');
      return;
    }

    if (!quantity || parseFloat(quantity) < 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      const data = {
        user_id: user?.id,
        name: name.trim(),
        quantity: parseFloat(quantity),
        unit,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (editItem) {
        const result = await supabase
          .from('fertilizers')
          .update(data)
          .eq('id', editItem.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('fertilizers')
          .insert([data]);
        error = result.error;
      }

      if (error) throw error;

      Alert.alert('Success', `Fertilizer ${editItem ? 'updated' : 'added'} successfully`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving fertilizer:', error);
      Alert.alert('Error', error.message || 'Failed to save fertilizer');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setQuantity('');
    setUnit('lbs');
    setNotes('');
    setSearchQuery('');
  };

  const handleClose = () => {
    if (!editItem) resetForm();
    setShowDropdown(false);
    onClose();
  };

  const selectFertilizer = (fertilizer: string) => {
    setName(fertilizer);
    setSearchQuery(fertilizer);
    setShowDropdown(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editItem ? 'Edit' : 'Add'} Fertilizer</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Fertilizer Name *</Text>
            <TextInput
              style={styles.input}
              value={searchQuery || name}
              onChangeText={(text) => {
                setSearchQuery(text);
                setName(text);
                setShowDropdown(text.length > 0);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search or enter fertilizer name"
              placeholderTextColor="#999"
            />

            {showDropdown && filteredFertilizers.length > 0 && (
              <View style={styles.dropdown}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {filteredFertilizers.slice(0, 10).map((fertilizer, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.dropdownItem}
                      onPress={() => selectFertilizer(fertilizer)}
                    >
                      <Text style={styles.dropdownItemText}>{fertilizer}</Text>
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

            <Text style={styles.label}>Unit *</Text>
            <View style={styles.buttonGroup}>
              {['lbs', 'bags'].map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.optionButton, unit === u && styles.optionButtonActive]}
                  onPress={() => setUnit(u)}
                >
                  <Text style={[styles.optionButtonText, unit === u && styles.optionButtonTextActive]}>
                    {u === 'lbs' ? 'Pounds' : 'Bags'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
                <Text style={styles.saveButtonText}>{editItem ? 'Update' : 'Add'} Fertilizer</Text>
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
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
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
