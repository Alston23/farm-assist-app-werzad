
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useCropInfo, CropInfo } from '../hooks/useCropInfo';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AddCustomCropModal({ visible, onClose, onSuccess }: Props) {
  const [cropName, setCropName] = useState('');
  const [cropInfo, setCropInfo] = useState<CropInfo | null>(null);
  const [editedInfo, setEditedInfo] = useState<CropInfo | null>(null);
  const { generateCropInfo, saveCrop, loading, error } = useCropInfo();

  const handleGenerate = async () => {
    if (!cropName.trim()) {
      Alert.alert('Error', 'Please enter a crop name');
      return;
    }

    const info = await generateCropInfo(cropName);
    if (info) {
      setCropInfo(info);
      setEditedInfo(info);
    } else if (error) {
      Alert.alert('Error', error);
    }
  };

  const handleSave = async () => {
    if (!editedInfo) {
      Alert.alert('Error', 'No crop information to save');
      return;
    }

    const success = await saveCrop(editedInfo);
    if (success) {
      Alert.alert('Success', 'Crop added successfully!');
      handleClose();
      onSuccess();
    } else {
      Alert.alert('Error', 'Failed to save crop. Please try again.');
    }
  };

  const handleClose = () => {
    setCropName('');
    setCropInfo(null);
    setEditedInfo(null);
    onClose();
  };

  const updateField = (field: keyof CropInfo, value: string) => {
    if (editedInfo) {
      setEditedInfo({ ...editedInfo, [field]: value });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Custom Crop</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {!cropInfo ? (
            <View style={styles.inputSection}>
              <Text style={styles.label}>Crop Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter crop name (e.g., Kale, Blueberries)"
                placeholderTextColor="#999"
                value={cropName}
                onChangeText={setCropName}
                editable={!loading}
              />
              
              <TouchableOpacity
                style={[styles.generateButton, loading && styles.buttonDisabled]}
                onPress={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>✨ Generate Info with AI</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.infoText}>
                Our AI will automatically fill in growing requirements, care instructions, and other details for your crop.
              </Text>
            </View>
          ) : (
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Review & Edit Crop Information</Text>
              <Text style={styles.sectionSubtitle}>
                AI has generated the information below. You can edit any field before saving.
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Crop Name</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedInfo?.name}
                  onChangeText={(val) => updateField('name', val)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.categoryButtons}>
                  {(['vegetable', 'fruit', 'flower', 'herb'] as const).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryButton,
                        editedInfo?.category === cat && styles.categoryButtonActive,
                      ]}
                      onPress={() => updateField('category', cat)}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          editedInfo?.category === cat && styles.categoryButtonTextActive,
                        ]}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Scientific Name</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedInfo?.scientificName}
                  onChangeText={(val) => updateField('scientificName', val)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Sunlight Requirements</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedInfo?.sunlight}
                  onChangeText={(val) => updateField('sunlight', val)}
                  multiline
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Water Requirements</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedInfo?.water}
                  onChangeText={(val) => updateField('water', val)}
                  multiline
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Soil Type</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedInfo?.soilType}
                  onChangeText={(val) => updateField('soilType', val)}
                  multiline
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Soil pH</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedInfo?.soilPH}
                  onChangeText={(val) => updateField('soilPH', val)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Plant Spacing</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedInfo?.plantSpacing}
                  onChangeText={(val) => updateField('plantSpacing', val)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Row Spacing</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedInfo?.rowSpacing}
                  onChangeText={(val) => updateField('rowSpacing', val)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Days to Maturity</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedInfo?.daysToMaturity}
                  onChangeText={(val) => updateField('daysToMaturity', val)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Planting Depth</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedInfo?.plantingDepth}
                  onChangeText={(val) => updateField('plantingDepth', val)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Temperature Range</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedInfo?.temperature}
                  onChangeText={(val) => updateField('temperature', val)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Hardiness Zones</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedInfo?.hardiness}
                  onChangeText={(val) => updateField('hardiness', val)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Companion Plants</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedInfo?.companions}
                  onChangeText={(val) => updateField('companions', val)}
                  multiline
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Avoid Planting With</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedInfo?.avoid}
                  onChangeText={(val) => updateField('avoid', val)}
                  multiline
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Common Pests</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedInfo?.pests}
                  onChangeText={(val) => updateField('pests', val)}
                  multiline
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Common Diseases</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedInfo?.diseases}
                  onChangeText={(val) => updateField('diseases', val)}
                  multiline
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Harvest Instructions</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedInfo?.harvest}
                  onChangeText={(val) => updateField('harvest', val)}
                  multiline
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Storage Recommendations</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editedInfo?.storage}
                  onChangeText={(val) => updateField('storage', val)}
                  multiline
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Additional Notes</Text>
                <TextInput
                  style={[styles.fieldInput, styles.notesInput]}
                  value={editedInfo?.notes}
                  onChangeText={(val) => updateField('notes', val)}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setCropInfo(null);
                    setEditedInfo(null);
                  }}
                >
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.buttonText}>💾 Save Crop</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#4A7C2C',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  inputSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: '#4A7C2C',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  fieldInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A7C2C',
    backgroundColor: '#FFFFFF',
  },
  categoryButtonActive: {
    backgroundColor: '#4A7C2C',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A7C2C',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#4A7C2C',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
});
