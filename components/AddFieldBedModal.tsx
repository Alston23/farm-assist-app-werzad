
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
import { allCrops } from '../data/crops';
import { getCropDetail } from '../data/cropDetails';

interface AddFieldBedModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const soilTypes = [
  'Clay',
  'Sandy',
  'Loamy',
  'Silty',
  'Peaty',
  'Chalky',
  'Clay Loam',
  'Sandy Loam',
];

const irrigationTypes = [
  'Drip Irrigation',
  'Sprinkler',
  'Surface/Flood',
  'Soaker Hose',
  'Hand Watering',
  'Rain-fed',
  'Subsurface Drip',
];

export default function AddFieldBedModal({ visible, onClose, onSuccess }: AddFieldBedModalProps) {
  const [type, setType] = useState<'field' | 'bed'>('field');
  const [name, setName] = useState('');
  const [areaValue, setAreaValue] = useState('');
  const [areaUnit, setAreaUnit] = useState<'acres' | 'sqft'>('acres');
  const [soilType, setSoilType] = useState('');
  const [showSoilDropdown, setShowSoilDropdown] = useState(false);
  const [cropId, setCropId] = useState('');
  const [cropName, setCropName] = useState('');
  const [showCropDropdown, setShowCropDropdown] = useState(false);
  const [cropSearchQuery, setCropSearchQuery] = useState('');
  const [daysToMaturity, setDaysToMaturity] = useState<number | null>(null);
  const [irrigationType, setIrrigationType] = useState('');
  const [showIrrigationDropdown, setShowIrrigationDropdown] = useState(false);
  const [plantingDate, setPlantingDate] = useState(new Date());
  const [harvestDate, setHarvestDate] = useState(new Date());
  const [showPlantingDatePicker, setShowPlantingDatePicker] = useState(false);
  const [showHarvestDatePicker, setShowHarvestDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredCrops = cropSearchQuery
    ? allCrops.filter(crop =>
        crop.name.toLowerCase().includes(cropSearchQuery.toLowerCase())
      )
    : allCrops;

  useEffect(() => {
    if (daysToMaturity !== null) {
      const newHarvestDate = new Date(plantingDate);
      newHarvestDate.setDate(newHarvestDate.getDate() + daysToMaturity);
      setHarvestDate(newHarvestDate);
    }
  }, [plantingDate, daysToMaturity]);

  const handleCropSelect = (crop: { id: string; name: string }) => {
    setCropId(crop.id);
    setCropName(crop.name);
    setCropSearchQuery(crop.name);
    setShowCropDropdown(false);

    const cropDetail = getCropDetail(crop.id);
    if (cropDetail) {
      setDaysToMaturity(cropDetail.daysToMaturity);
    }
  };

  const handlePlantingDateChange = (event: any, selectedDate?: Date) => {
    console.log('Planting date change event:', event.type, selectedDate);
    
    // On Android, the picker is dismissed automatically after selection
    if (Platform.OS === 'android') {
      setShowPlantingDatePicker(false);
    }
    
    // Update the date if user confirmed (not cancelled)
    if (event.type === 'set' && selectedDate) {
      setPlantingDate(selectedDate);
    } else if (event.type === 'dismissed') {
      // User cancelled, just close the picker
      setShowPlantingDatePicker(false);
    }
  };

  const handleHarvestDateChange = (event: any, selectedDate?: Date) => {
    console.log('Harvest date change event:', event.type, selectedDate);
    
    // On Android, the picker is dismissed automatically after selection
    if (Platform.OS === 'android') {
      setShowHarvestDatePicker(false);
    }
    
    // Update the date if user confirmed (not cancelled)
    if (event.type === 'set' && selectedDate) {
      setHarvestDate(selectedDate);
    } else if (event.type === 'dismissed') {
      // User cancelled, just close the picker
      setShowHarvestDatePicker(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!areaValue || parseFloat(areaValue) <= 0) {
      Alert.alert('Error', 'Please enter a valid area');
      return;
    }
    if (!soilType) {
      Alert.alert('Error', 'Please select a soil type');
      return;
    }
    if (!cropId) {
      Alert.alert('Error', 'Please select a crop');
      return;
    }
    if (!irrigationType) {
      Alert.alert('Error', 'Please select an irrigation type');
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

      const { data: fieldBedData, error: fieldBedError } = await supabase
        .from('fields_beds')
        .insert({
          user_id: user.id,
          type,
          name: name.trim(),
          area_value: parseFloat(areaValue),
          area_unit: areaUnit,
          soil_type: soilType,
          irrigation_type: irrigationType,
        })
        .select()
        .single();

      if (fieldBedError) {
        console.error('Error creating field/bed:', fieldBedError);
        Alert.alert('Error', 'Failed to create field/bed');
        setSaving(false);
        return;
      }

      const { error: plantingError } = await supabase
        .from('plantings')
        .insert({
          user_id: user.id,
          field_bed_id: fieldBedData.id,
          crop_id: cropId,
          crop_name: cropName,
          days_to_maturity: daysToMaturity || 0,
          planting_date: plantingDate.toISOString().split('T')[0],
          harvest_date: harvestDate.toISOString().split('T')[0],
        });

      if (plantingError) {
        console.error('Error creating planting:', plantingError);
        Alert.alert('Error', 'Failed to create planting');
        setSaving(false);
        return;
      }

      Alert.alert(
        'Success',
        `${type === 'field' ? 'Field' : 'Bed'} saved successfully! You can now view it in the Plantings tab.`,
        [{ text: 'OK', onPress: () => {
          resetForm();
          onSuccess();
          onClose();
        }}]
      );
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setType('field');
    setName('');
    setAreaValue('');
    setAreaUnit('acres');
    setSoilType('');
    setCropId('');
    setCropName('');
    setCropSearchQuery('');
    setDaysToMaturity(null);
    setIrrigationType('');
    setPlantingDate(new Date());
    setHarvestDate(new Date());
    setShowPlantingDatePicker(false);
    setShowHarvestDatePicker(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
            <Text style={styles.modalTitle}>Add Field/Bed</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, type === 'field' && styles.toggleButtonActive]}
                  onPress={() => setType('field')}
                >
                  <Text style={[styles.toggleText, type === 'field' && styles.toggleTextActive]}>
                    Field
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, type === 'bed' && styles.toggleButtonActive]}
                  onPress={() => setType('bed')}
                >
                  <Text style={[styles.toggleText, type === 'bed' && styles.toggleTextActive]}>
                    Bed
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={`Enter ${type} name`}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Area</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.areaInput]}
                  value={areaValue}
                  onChangeText={setAreaValue}
                  placeholder="0"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                />
                <View style={styles.unitToggle}>
                  <TouchableOpacity
                    style={[styles.unitButton, areaUnit === 'acres' && styles.unitButtonActive]}
                    onPress={() => setAreaUnit('acres')}
                  >
                    <Text style={[styles.unitText, areaUnit === 'acres' && styles.unitTextActive]}>
                      Acres
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.unitButton, areaUnit === 'sqft' && styles.unitButtonActive]}
                    onPress={() => setAreaUnit('sqft')}
                  >
                    <Text style={[styles.unitText, areaUnit === 'sqft' && styles.unitTextActive]}>
                      Sq Ft
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Soil Type</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowSoilDropdown(!showSoilDropdown)}
              >
                <Text style={soilType ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {soilType || 'Select soil type'}
                </Text>
              </TouchableOpacity>
              {showSoilDropdown && (
                <View style={styles.dropdownList}>
                  {soilTypes.map((soil, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSoilType(soil);
                        setShowSoilDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{soil}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Crop</Text>
              <TextInput
                style={styles.input}
                value={cropSearchQuery}
                onChangeText={(text) => {
                  setCropSearchQuery(text);
                  setShowCropDropdown(true);
                }}
                placeholder="Search for a crop"
                placeholderTextColor="#999"
                onFocus={() => setShowCropDropdown(true)}
              />
              {showCropDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView style={styles.cropScrollView} nestedScrollEnabled>
                    {filteredCrops.slice(0, 50).map((crop) => (
                      <TouchableOpacity
                        key={crop.id}
                        style={styles.dropdownItem}
                        onPress={() => handleCropSelect(crop)}
                      >
                        <Text style={styles.dropdownItemText}>{crop.name}</Text>
                        <Text style={styles.dropdownItemSubtext}>{crop.category}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {daysToMaturity !== null && (
              <View style={styles.maturityInfo}>
                <Text style={styles.maturityText}>
                  Days to Maturity: {daysToMaturity} days
                </Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.label}>Irrigation Type</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowIrrigationDropdown(!showIrrigationDropdown)}
              >
                <Text style={irrigationType ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {irrigationType || 'Select irrigation type'}
                </Text>
              </TouchableOpacity>
              {showIrrigationDropdown && (
                <View style={styles.dropdownList}>
                  {irrigationTypes.map((irrigation, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setIrrigationType(irrigation);
                        setShowIrrigationDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{irrigation}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Planting Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  console.log('Opening planting date picker');
                  setShowPlantingDatePicker(true);
                }}
              >
                <Text style={styles.dateText}>
                  📅 {formatDate(plantingDate)}
                </Text>
              </TouchableOpacity>
              {showPlantingDatePicker && (
                <>
                  {Platform.OS === 'ios' ? (
                    <View style={styles.datePickerWrapper}>
                      <DateTimePicker
                        value={plantingDate}
                        mode="date"
                        display="spinner"
                        onChange={handlePlantingDateChange}
                        themeVariant="light"
                      />
                      <TouchableOpacity
                        style={styles.datePickerDoneButton}
                        onPress={() => setShowPlantingDatePicker(false)}
                      >
                        <Text style={styles.datePickerDoneText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <DateTimePicker
                      value={plantingDate}
                      mode="date"
                      display="default"
                      onChange={handlePlantingDateChange}
                    />
                  )}
                </>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Harvest Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  console.log('Opening harvest date picker');
                  setShowHarvestDatePicker(true);
                }}
              >
                <Text style={styles.dateText}>
                  📅 {formatDate(harvestDate)}
                </Text>
              </TouchableOpacity>
              {showHarvestDatePicker && (
                <>
                  {Platform.OS === 'ios' ? (
                    <View style={styles.datePickerWrapper}>
                      <DateTimePicker
                        value={harvestDate}
                        mode="date"
                        display="spinner"
                        onChange={handleHarvestDateChange}
                        minimumDate={plantingDate}
                        themeVariant="light"
                      />
                      <TouchableOpacity
                        style={styles.datePickerDoneButton}
                        onPress={() => setShowHarvestDatePicker(false)}
                      >
                        <Text style={styles.datePickerDoneText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <DateTimePicker
                      value={harvestDate}
                      mode="date"
                      display="default"
                      onChange={handleHarvestDateChange}
                      minimumDate={plantingDate}
                    />
                  )}
                </>
              )}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
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
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#4A7C2C',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  toggleButtonActive: {
    backgroundColor: '#4A7C2C',
  },
  toggleText: {
    fontSize: 16,
    color: '#4A7C2C',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  areaInput: {
    flex: 1,
  },
  unitToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  unitButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  unitButtonActive: {
    backgroundColor: '#4A7C2C',
  },
  unitText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  unitTextActive: {
    color: '#fff',
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
  cropScrollView: {
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
  dropdownItemSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  maturityInfo: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  maturityText: {
    fontSize: 15,
    color: '#2D5016',
    fontWeight: '600',
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
  datePickerWrapper: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4A7C2C',
  },
  datePickerDoneButton: {
    marginTop: 12,
    backgroundColor: '#4A7C2C',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  datePickerDoneText: {
    color: '#FFFFFF',
    fontSize: 16,
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
});
