
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
import { supabase } from '../lib/supabase';
import { pickMultipleImages } from '../utils/imagePicker';

interface AddCustomerListingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCustomerListingModal({ visible, onClose, onSuccess }: AddCustomerListingModalProps) {
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('lbs');
  const [category, setCategory] = useState('vegetables');
  const [pickupLocation, setPickupLocation] = useState('');
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});

  const units = ['lbs', 'kg', 'bushels', 'boxes', 'units', 'bunches', 'each'];
  const categories = ['vegetables', 'fruits', 'flowers', 'herbs', 'spices', 'aromatics', 'other'];

  const showImagePickerOptions = () => {
    Alert.alert(
      'Add Images',
      'Choose how to add images',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const uris = await pickMultipleImages('camera');
            if (uris.length > 0) {
              setImages([...images, ...uris].slice(0, 5));
            }
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            const uris = await pickMultipleImages('library');
            if (uris.length > 0) {
              setImages([...images, ...uris].slice(0, 5));
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const newErrors: { [key: string]: boolean } = {};

    // Mark required fields
    if (!productName.trim()) newErrors.productName = true;
    if (!description.trim()) newErrors.description = true;
    if (!price) newErrors.price = true;
    if (!quantity) newErrors.quantity = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert('Missing information', 'Please fill in all required fields.');
      return; // do NOT call Supabase yet
    }

    setErrors({});

    const priceNum = parseFloat(price);
    const quantityNum = parseFloat(quantity);

    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    if (isNaN(quantityNum) || quantityNum < 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Determine availability status based on quantity
      let availabilityStatus = 'available';
      if (quantityNum === 0) {
        availabilityStatus = 'sold_out';
      } else if (quantityNum < 10) {
        availabilityStatus = 'low_stock';
      }

      const { error } = await supabase
        .from('customer_marketplace_listings')
        .insert({
          user_id: user.id,
          product_name: productName.trim(),
          description: description.trim(),
          price: priceNum,
          quantity: quantityNum,
          unit,
          category,
          availability_status: availabilityStatus,
          pickup_location: pickupLocation.trim() || null,
          delivery_available: deliveryAvailable,
          images: images.length > 0 ? images : null,
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
    setProductName('');
    setDescription('');
    setPrice('');
    setQuantity('');
    setUnit('lbs');
    setCategory('vegetables');
    setPickupLocation('');
    setDeliveryAvailable(false);
    setImages([]);
    setErrors({});
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Product Listing</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={[
                styles.input,
                errors.productName && { borderColor: 'red', borderWidth: 2 },
              ]}
              value={productName}
              onChangeText={setProductName}
              placeholder="e.g., Organic Tomatoes"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, category === cat && styles.chipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                errors.description && { borderColor: 'red', borderWidth: 2 },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your product..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Price * ($)</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.price && { borderColor: 'red', borderWidth: 2 },
                  ]}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.halfWidth}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.quantity && { borderColor: 'red', borderWidth: 2 },
                  ]}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="0"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <Text style={styles.label}>Unit *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {units.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.chip, unit === u && styles.chipActive]}
                  onPress={() => setUnit(u)}
                >
                  <Text style={[styles.chipText, unit === u && styles.chipTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Pickup Location</Text>
            <TextInput
              style={styles.input}
              value={pickupLocation}
              onChangeText={setPickupLocation}
              placeholder="e.g., 123 Farm Road, City, State"
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setDeliveryAvailable(!deliveryAvailable)}
            >
              <View style={[styles.checkbox, deliveryAvailable && styles.checkboxChecked]}>
                {deliveryAvailable && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Delivery Available</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Images (up to 5)</Text>
            <TouchableOpacity style={styles.imagePickerButton} onPress={showImagePickerOptions}>
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4A7C2C',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4A7C2C',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
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
