
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
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
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
  const [plantingDate, setPlantingDate] = useState<Date>(new Date());
  const [harvestDate, setHarvestDate] = useState<Date>(new Date());
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
      console.log('Auto-calculated harvest date based on days to maturity:', newHarvestDate);
    }
  }, [plantingDate, daysToMaturity]);

  const handleCropSelect = (crop: { id: string; name: string }) => {
    console.log('Crop selected:', crop.name);
    setCropId(crop.id);
    setCropName(crop.name);
    setCropSearchQuery(crop.name);
    setShowCropDropdown(false);

    const cropDetail = getCropDetail(crop.id);
    if (cropDetail) {
      console.log('Days to maturity:', cropDetail.daysToMaturity);
      setDaysToMaturity(cropDetail.daysToMaturity);
    }
  };

  const handlePlantingDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    console.log('Planting date change - Event type:', event.type, 'Selected date:', selectedDate);
    
    // On Android, always hide the picker after interaction
    if (Platform.OS === 'android') {
      setShowPlantingDatePicker(false);
    }
    
    // Update the date if user confirmed selection
    if (event.type === 'set' && selectedDate) {
      console.log('Setting planting date to:', selectedDate);
      setPlantingDate(selectedDate);
      
      // If harvest date is before the new planting date, adjust it
      if (harvestDate < selectedDate) {
        console.log('Adjusting harvest date to match planting date');
        setHarvestDate(selectedDate);
      }
    }
  };

  const handleHarvestDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    console.log('Harvest date change - Event type:', event.type, 'Selected date:', selectedDate);
    
    // On Android, always hide the picker after interaction
    if (Platform.OS === 'android') {
      setShowHarvestDatePicker(false);
    }
    
    // Update the date if user confirmed selection
    if (event.type === 'set' && selectedDate) {
      console.log('Setting harvest date to:', selectedDate);
      setHarvestDate(selectedDate);
    }
  };

  // Web-specific date change handlers
  const handleWebPlantingDateChange = (dateString: string) => {
    console.log('Web planting date change:', dateString);
    if (dateString) {
      const newDate = new Date(dateString + 'T00:00:00');
      setPlantingDate(newDate);
      
      // If harvest date is before the new planting date, adjust it
      if (harvestDate < newDate) {
        console.log('Adjusting harvest date to match planting date');
        setHarvestDate(newDate);
      }
    }
  };

  const handleWebHarvestDateChange = (dateString: string) => {
    console.log('Web harvest date change:', dateString);
    if (dateString) {
      const newDate = new Date(dateString + 'T00:00:00');
      setHarvestDate(newDate);
    }
  };

  const closePlantingDatePicker = () => {
    console.log('Closing planting date picker');
    setShowPlantingDatePicker(false);
  };

  const closeHarvestDatePicker = () => {
    console.log('Closing harvest date picker');
    setShowHarvestDatePicker(false);
  };

  const handleSave = async () => {
    console.log('Save button pressed');
    console.log('Planting date:', plantingDate);
    console.log('Harvest date:', harvestDate);
    
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

      console.log('Creating field/bed...');
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

      console.log('Field/bed created, creating planting...');
      const plantingDateStr = plantingDate.toISOString().split('T')[0];
      const harvestDateStr = harvestDate.toISOString().split('T')[0];
      console.log('Saving planting_date:', plantingDateStr);
      console.log('Saving harvest_date:', harvestDateStr);

      const { error: plantingError } = await supabase
        .from('plantings')
        .insert({
          user_id: user.id,
          field_bed_id: fieldBedData.id,
          crop_id: cropId,
          crop_name: cropName,
          days_to_maturity: daysToMaturity || 0,
          planting_date: plantingDateStr,
          harvest_date: harvestDateStr,
        });

      if (plantingError) {
        console.error('Error creating planting:', plantingError);
        Alert.alert('Error', 'Failed to create planting');
        setSaving(false);
        return;
      }

      console.log('Success! Field/bed and planting created');
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
    console.log('Resetting form');
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
    const now = new Date();
    setPlantingDate(now);
    setHarvestDate(now);
    setShowPlantingDatePicker(false);
    setShowHarvestDatePicker(false);
  };

  const handleClose = () => {
    console.log('Modal close requested');
    resetForm();
    onClose();
  };

  const formatDate = (date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePlantingDatePress = () => {
    console.log('Planting date button pressed - Platform:', Platform.OS);
    if (Platform.OS === 'web') {
      console.log('Web platform - date input will be shown inline');
      setShowPlantingDatePicker(!showPlantingDatePicker);
    } else {
      console.log('Native platform - setting showPlantingDatePicker to true');
      setShowPlantingDatePicker(true);
    }
  };

  const handleHarvestDatePress = () => {
    console.log('Harvest date button pressed - Platform:', Platform.OS);
    if (Platform.OS === 'web') {
      console.log('Web platform - date input will be shown inline');
      setShowHarvestDatePicker(!showHarvestDatePicker);
    } else {
      console.log('Native platform - setting showHarvestDatePicker to true');
      setShowHarvestDatePicker(true);
    }
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalOverlayTouchable}
          activeOpacity={1} 
          onPress={handleClose}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Field/Bed</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled={true}
          >
            <View style={styles.section}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, type === 'field' && styles.toggleButtonActive]}
                  onPress={() => {
                    console.log('Field type selected');
                    setType('field');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.toggleText, type === 'field' && styles.toggleTextActive]}>
                    Field
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, type === 'bed' && styles.toggleButtonActive]}
                  onPress={() => {
                    console.log('Bed type selected');
                    setType('bed');
                  }}
                  activeOpacity={0.7}
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
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.unitText, areaUnit === 'acres' && styles.unitTextActive]}>
                      Acres
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.unitButton, areaUnit === 'sqft' && styles.unitButtonActive]}
                    onPress={() => setAreaUnit('sqft')}
                    activeOpacity={0.7}
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
                onPress={() => {
                  console.log('Soil dropdown toggled');
                  setShowSoilDropdown(!showSoilDropdown);
                }}
                activeOpacity={0.7}
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
                        console.log('Soil type selected:', soil);
                        setSoilType(soil);
                        setShowSoilDropdown(false);
                      }}
                      activeOpacity={0.7}
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
                        activeOpacity={0.7}
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
                onPress={() => {
                  console.log('Irrigation dropdown toggled');
                  setShowIrrigationDropdown(!showIrrigationDropdown);
                }}
                activeOpacity={0.7}
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
                        console.log('Irrigation type selected:', irrigation);
                        setIrrigationType(irrigation);
                        setShowIrrigationDropdown(false);
                      }}
                      activeOpacity={0.7}
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
                onPress={handlePlantingDatePress}
                activeOpacity={0.7}
              >
                <Text style={styles.dateText}>
                  📅 {formatDate(plantingDate)}
                </Text>
              </TouchableOpacity>
              
              {/* iOS Native Date Picker */}
              {showPlantingDatePicker && Platform.OS === 'ios' && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={plantingDate}
                    mode="date"
                    display="spinner"
                    onChange={handlePlantingDateChange}
                    themeVariant="light"
                    style={styles.datePicker}
                  />
                  <TouchableOpacity
                    style={styles.datePickerDoneButton}
                    onPress={closePlantingDatePicker}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Web Date Picker Fallback */}
              {showPlantingDatePicker && Platform.OS === 'web' && (
                <View style={styles.webDatePickerContainer}>
                  <TextInput
                    style={styles.webDateInput}
                    value={formatDateForInput(plantingDate)}
                    onChangeText={handleWebPlantingDateChange}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#999"
                  />
                  <Text style={styles.webDateHint}>
                    Enter date in format: YYYY-MM-DD (e.g., 2024-03-15)
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Harvest Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={handleHarvestDatePress}
                activeOpacity={0.7}
              >
                <Text style={styles.dateText}>
                  📅 {formatDate(harvestDate)}
                </Text>
              </TouchableOpacity>
              
              {/* iOS Native Date Picker */}
              {showHarvestDatePicker && Platform.OS === 'ios' && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={harvestDate}
                    mode="date"
                    display="spinner"
                    onChange={handleHarvestDateChange}
                    minimumDate={plantingDate}
                    themeVariant="light"
                    style={styles.datePicker}
                  />
                  <TouchableOpacity
                    style={styles.datePickerDoneButton}
                    onPress={closeHarvestDatePicker}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Web Date Picker Fallback */}
              {showHarvestDatePicker && Platform.OS === 'web' && (
                <View style={styles.webDatePickerContainer}>
                  <TextInput
                    style={styles.webDateInput}
                    value={formatDateForInput(harvestDate)}
                    onChangeText={handleWebHarvestDateChange}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#999"
                  />
                  <Text style={styles.webDateHint}>
                    Enter date in format: YYYY-MM-DD (e.g., 2024-06-15)
                  </Text>
                  <Text style={styles.webDateHint}>
                    Must be on or after planting date: {formatDateForInput(plantingDate)}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Android date pickers - rendered outside modal content to avoid z-index issues */}
      {showPlantingDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={plantingDate}
          mode="date"
          display="default"
          onChange={handlePlantingDateChange}
        />
      )}
      
      {showHarvestDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={harvestDate}
          mode="date"
          display="default"
          onChange={handleHarvestDateChange}
          minimumDate={plantingDate}
        />
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
  modalOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    backgroundColor: '#fff',
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
  datePickerContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#4A7C2C',
  },
  datePicker: {
    width: '100%',
  },
  datePickerDoneButton: {
    backgroundColor: '#4A7C2C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  datePickerDoneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  webDatePickerContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#4A7C2C',
  },
  webDateInput: {
    borderWidth: 1,
    borderColor: '#4A7C2C',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
    marginBottom: 8,
  },
  webDateHint: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
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
