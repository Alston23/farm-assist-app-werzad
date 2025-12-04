
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
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

interface AddEquipmentListingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddEquipmentListingModal({ visible, onClose, onSuccess }: AddEquipmentListingModalProps) {
  const [listingType, setListingType] = useState<'for_sale' | 'wanted'>('for_sale');
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [condition, setCondition] = useState('good');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [hoursUsed, setHoursUsed] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const conditions = ['new', 'excellent', 'good', 'fair', 'poor', 'parts_only'];

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setImages([...images, ...newImages].slice(0, 5)); // Max 5 images
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!equipmentName.trim() || !equipmentType.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (listingType === 'for_sale' && !price) {
      Alert.alert('Error', 'Please enter a price for items for sale');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const priceNum = price ? parseFloat(price) : null;
      const yearNum = year ? parseInt(year) : null;
      const hoursNum = hoursUsed ? parseFloat(hoursUsed) : null;

      if (price && (isNaN(priceNum!) || priceNum! < 0)) {
        Alert.alert('Error', 'Please enter a valid price');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('equipment_marketplace_listings')
        .insert({
          user_id: user.id,
          listing_type: listingType,
          equipment_name: equipmentName.trim(),
          equipment_type: equipmentType.trim(),
          manufacturer: manufacturer.trim() || null,
          model: model.trim() || null,
          year: yearNum,
          condition: listingType === 'for_sale' ? condition : null,
          price: priceNum,
          description: description.trim(),
          location: location.trim() || null,
          hours_used: hoursNum,
          images: images.length > 0 ? images : null,
          status: 'active',
        });

      if (error) throw error;

      Alert.alert('Success', 'Listing created successfully!');
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Error creating listing:', error);
      Alert.alert('Error', 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setListingType('for_sale');
    setEquipmentName('');
    setEquipmentType('');
    setManufacturer('');
    setModel('');
    setYear('');
    setCondition('good');
    setPrice('');
    setDescription('');
    setLocation('');
    setHoursUsed('');
    setImages([]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Equipment Listing</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Listing Type *</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.typeButton, listingType === 'for_sale' && styles.typeButtonActive]}
                onPress={() => setListingType('for_sale')}
              >
                <Text style={[styles.typeButtonText, listingType === 'for_sale' && styles.typeButtonTextActive]}>
                  For Sale
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, listingType === 'wanted' && styles.typeButtonActive]}
                onPress={() => setListingType('wanted')}
              >
                <Text style={[styles.typeButtonText, listingType === 'wanted' && styles.typeButtonTextActive]}>
                  Wanted
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Equipment Name *</Text>
            <TextInput
              style={styles.input}
              value={equipmentName}
              onChangeText={setEquipmentName}
              placeholder="e.g., John Deere 5075E Tractor"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Equipment Type *</Text>
            <TextInput
              style={styles.input}
              value={equipmentType}
              onChangeText={setEquipmentType}
              placeholder="e.g., Tractor, Plow, Harvester, Seeder, Baler, etc."
              placeholderTextColor="#999"
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Manufacturer</Text>
                <TextInput
                  style={styles.input}
                  value={manufacturer}
                  onChangeText={setManufacturer}
                  placeholder="e.g., John Deere"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.halfWidth}>
                <Text style={styles.label}>Model</Text>
                <TextInput
                  style={styles.input}
                  value={model}
                  onChangeText={setModel}
                  placeholder="e.g., 5075E"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Year</Text>
                <TextInput
                  style={styles.input}
                  value={year}
                  onChangeText={setYear}
                  placeholder="e.g., 2020"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.halfWidth}>
                <Text style={styles.label}>Hours Used</Text>
                <TextInput
                  style={styles.input}
                  value={hoursUsed}
                  onChangeText={setHoursUsed}
                  placeholder="e.g., 500"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {listingType === 'for_sale' && (
              <>
                <Text style={styles.label}>Condition *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {conditions.map((cond) => (
                    <TouchableOpacity
                      key={cond}
                      style={[styles.chip, condition === cond && styles.chipActive]}
                      onPress={() => setCondition(cond)}
                    >
                      <Text style={[styles.chipText, condition === cond && styles.chipTextActive]}>
                        {cond.charAt(0).toUpperCase() + cond.slice(1).replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.label}>Price * ($)</Text>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                />
              </>
            )}

            {listingType === 'wanted' && (
              <>
                <Text style={styles.label}>Budget ($)</Text>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="Optional - your budget"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                />
              </>
            )}

            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder={listingType === 'for_sale' 
                ? 'Describe the equipment condition, features, etc...' 
                : 'Describe what you are looking for...'}
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., City, State"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Images (up to 5)</Text>
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
              <Text style={styles.imagePickerButtonText}>+ Add Images</Text>
            </TouchableOpacity>

            {images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewScroll}>
                {images.map((uri, index) => (
                  <View key={index} style={styles.imagePreviewContainer}>
                    <Image source={{ uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Text style={styles.removeImageButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Create Listing</Text>
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
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  scrollView: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  typeButtonActive: {
    backgroundColor: '#4A7C2C',
    borderColor: '#4A7C2C',
  },
  typeButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  chipScroll: {
    marginBottom: 8,
  },
  chip: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipActive: {
    backgroundColor: '#4A7C2C',
    borderColor: '#4A7C2C',
  },
  chipText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  imagePickerButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A7C2C',
    borderStyle: 'dashed',
  },
  imagePickerButtonText: {
    color: '#4A7C2C',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreviewScroll: {
    marginTop: 12,
  },
  imagePreviewContainer: {
    marginRight: 12,
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#F44336',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#4A7C2C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
