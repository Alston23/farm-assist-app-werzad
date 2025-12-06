
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
  editItem?: any;
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

export default function AddFieldBedModal({ visible, onClose, onSuccess, editItem }: AddFieldBedModalProps) {
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
  const [plantingDate, setPlantingDate] = useState<Date | null>(new Date());
  const [harvestDate, setHarvestDate] = useState<Date | null>(new Date());
  const [showPlantingDatePicker, setShowPlantingDatePicker] = useState(false);
  const [showHarvestDatePicker, setShowHarvestDatePicker] = useState(false);
  const [plantingDateInput, setPlantingDateInput] = useState('');
  const [harvestDateInput, setHarvestDateInput] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredCrops = cropSearchQuery
    ? allCrops.filter(crop =>
        crop.name.toLowerCase().includes(cropSearchQuery.toLowerCase())
      )
    : allCrops;

  useEffect(() => {
    if (editItem) {
      console.log('Editing field/bed:', editItem);
      setType(editItem.type);
      setName(editItem.name);
      setAreaValue(editItem.area_value?.toString() || '');
      setAreaUnit(editItem.area_unit);
      setSoilType(editItem.soil_type);
      setIrrigationType(editItem.irrigation_type);
    }
  }, [editItem]);

  useEffect(() => {
    if (daysToMaturity !== null && plantingDate) {
      const newHarvestDate = new Date(plantingDate);
      newHarvestDate.setDate(newHarvestDate.getDate() + daysToMaturity);
      setHarvestDate(newHarvestDate);
      setHarvestDateInput(formatDateForInput(newHarvestDate));
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
    
    if (Platform.OS === 'android') {
      setShowPlantingDatePicker(false);
    }
    
    if (event.type === 'set' && selectedDate) {
      console.log('Setting planting date to:', selectedDate);
      setPlantingDate(selectedDate);
      setPlantingDateInput(formatDateForInput(selectedDate));
      
      if (harvestDate && harvestDate < selectedDate) {
        console.log('Adjusting harvest date to match planting date');
        setHarvestDate(selectedDate);
        setHarvestDateInput(formatDateForInput(selectedDate));
      }
    }
  };

  const handleHarvestDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    console.log('Harvest date change - Event type:', event.type, 'Selected date:', selectedDate);
    
    if (Platform.OS === 'android') {
      setShowHarvestDatePicker(false);
    }
    
    if (event.type === 'set' && selectedDate) {
      console.log('Setting harvest date to:', selectedDate);
      setHarvestDate(selectedDate);
      setHarvestDateInput(formatDateForInput(selectedDate));
    }
  };

  const handleWebPlantingDateChange = (dateString: string) => {
    console.log('Web planting date change:', dateString);
    setPlantingDateInput(dateString);
    
    if (dateString && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const newDate = new Date(dateString + 'T00:00:00');
      if (!isNaN(newDate.getTime())) {
        setPlantingDate(newDate);
        
        if (harvestDate && harvestDate < newDate) {
          console.log('Adjusting harvest date to match planting date');
          setHarvestDate(newDate);
          setHarvestDateInput(dateString);
        }
      }
    }
  };

  const handleWebHarvestDateChange = (dateString: string) => {
    console.log('Web harvest date change:', dateString);
    setHarvestDateInput(dateString);
    
    if (dateString && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const newDate = new Date(dateString + 'T00:00:00');
      if (!isNaN(newDate.getTime())) {
        setHarvestDate(newDate);
      }
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

  const handleSaveField = async () => {
    // Log button press and current form values
    console.log('Fields: Save button pressed');
    console.log('Fields: current form values', {
      type,
      name,
      areaValue,
      areaUnit,
      soilType,
      cropId,
      cropName,
      cropSearchQuery,
      daysToMaturity,
      irrigationType,
      plantingDate: plantingDate ? plantingDate.toISOString() : null,
      harvestDate: harvestDate ? harvestDate.toISOString() : null,
      plantingDateInput,
      harvestDateInput,
      editMode: !!editItem,
    });

    // Validate required fields
    const trimmedName = name.trim();
    const parsedAreaValue = parseFloat(areaValue);

    if (!trimmedName) {
      console.log('Fields: validation failed', { name: trimmedName, size: areaValue });
      Alert.alert('Missing information', 'Please enter a name and size for this field/bed.');
      return;
    }

    if (!areaValue || isNaN(parsedAreaValue) || parsedAreaValue <= 0) {
      console.log('Fields: validation failed', { name: trimmedName, size: areaValue });
      Alert.alert('Missing information', 'Please enter a name and size for this field/bed.');
      return;
    }

    if (!soilType) {
      console.log('Fields: validation failed - missing soil type');
      Alert.alert('Missing information', 'Please select a soil type.');
      return;
    }

    if (!irrigationType) {
      console.log('Fields: validation failed - missing irrigation type');
      Alert.alert('Missing information', 'Please select an irrigation type.');
      return;
    }

    // If editing, we don't need crop/planting info
    if (!editItem) {
      if (!cropId) {
        console.log('Fields: validation failed - missing crop');
        Alert.alert('Missing information', 'Please select a crop.');
        return;
      }
      if (!plantingDate || isNaN(plantingDate.getTime())) {
        console.log('Fields: validation failed - invalid planting date');
        Alert.alert('Missing information', 'Please select a valid planting date.');
        return;
      }
      if (!harvestDate || isNaN(harvestDate.getTime())) {
        console.log('Fields: validation failed - invalid harvest date');
        Alert.alert('Missing information', 'Please select a valid harvest date.');
        return;
      }
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in');
        setSaving(false);
        return;
      }

      // Build payload for fields_beds table
      const payload: any = {
        type,
        name: trimmedName,
        area_value: parsedAreaValue,
        area_unit: areaUnit,
        soil_type: soilType,
        irrigation_type: irrigationType,
      };

      // Only include user_id for insert operations
      if (!editItem) {
        payload.user_id = user.id;
      }

      // Add id for update operations
      if (editItem?.id) {
        payload.id = editItem.id;
      }

      console.log('Fields: Saving with payload', payload);

      if (editItem?.id) {
        // Update existing field/bed
        console.log('Fields: Updating field/bed with id:', editItem.id);
        const { data, error } = await supabase
          .from('fields_beds')
          .update(payload)
          .eq('id', editItem.id)
          .select()
          .single();

        if (error) {
          console.error('Fields: Save error', error);
          Alert.alert('Error saving field', error.message || 'Something went wrong saving this field/bed.');
          setSaving(false);
          return;
        }

        console.log('Fields: Save success', data);
        Alert.alert(
          'Success',
          `${type === 'field' ? 'Field' : 'Bed'} updated successfully!`,
          [{ text: 'OK', onPress: () => {
            resetForm();
            onSuccess();
            onClose();
          }}]
        );
      } else {
        // Create new field/bed with planting
        console.log('Fields: Creating new field/bed');
        const { data: newFieldBed, error: fieldBedError } = await supabase
          .from('fields_beds')
          .insert(payload)
          .select()
          .single();

        if (fieldBedError) {
          console.error('Fields: Save error', fieldBedError);
          Alert.alert('Error saving field', fieldBedError.message || 'Something went wrong saving this field/bed.');
          setSaving(false);
          return;
        }

        console.log('Fields: Save success', newFieldBed);
        console.log('Field/bed created, creating planting...');
        
        const plantingDateStr = plantingDate!.toISOString().split('T')[0];
        const harvestDateStr = harvestDate!.toISOString().split('T')[0];
        console.log('Saving planting_date:', plantingDateStr);
        console.log('Saving harvest_date:', harvestDateStr);

        const { error: plantingError } = await supabase
          .from('plantings')
          .insert({
            user_id: user.id,
            field_bed_id: newFieldBed.id,
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
      }
    } catch (error) {
      console.error('Fields: Save error', error);
      Alert.alert('Error saving field', 'An unexpected error occurred');
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
    setPlantingDateInput('');
    setHarvestDateInput('');
    setShowPlantingDatePicker(false);
    setShowHarvestDatePicker(false);
    setSaving(false);
  };

  const handleClose = () => {
    console.log('Modal close requested');
    if (!editItem) {
      resetForm();
    }
    onClose();
  };

  const formatDate = (date: Date | null): string => {
    if (!date || isNaN(date.getTime())) {
      return 'Select date';
    }
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatDateForInput = (date: Date | null): string => {
    if (!date || isNaN(date.getTime())) {
      return '';
    }
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
            <Text style={styles.modalTitle}>
              {editItem ? 'Edit' : 'Add'} Field/Bed
            </Text>
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

            {!editItem && (
              <React.Fragment>
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
              </React.Fragment>
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

            {!editItem && (
              <React.Fragment>
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
                  
                  {showPlantingDatePicker && Platform.OS === 'ios' && (
                    <View style={styles.datePickerContainer}>
                      <DateTimePicker
                        value={plantingDate || new Date()}
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

                  {showPlantingDatePicker && Platform.OS === 'web' && (
                    <View style={styles.webDatePickerContainer}>
                      <TextInput
                        style={styles.webDateInput}
                        value={plantingDateInput || formatDateForInput(plantingDate)}
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
                  
                  {showHarvestDatePicker && Platform.OS === 'ios' && (
                    <View style={styles.datePickerContainer}>
                      <DateTimePicker
                        value={harvestDate || new Date()}
                        mode="date"
                        display="spinner"
                        onChange={handleHarvestDateChange}
                        minimumDate={plantingDate || undefined}
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

                  {showHarvestDatePicker && Platform.OS === 'web' && (
                    <View style={styles.webDatePickerContainer}>
                      <TextInput
                        style={styles.webDateInput}
                        value={harvestDateInput || formatDateForInput(harvestDate)}
                        onChangeText={handleWebHarvestDateChange}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#999"
                      />
                      <Text style={styles.webDateHint}>
                        Enter date in format: YYYY-MM-DD (e.g., 2024-06-15)
                      </Text>
                      {plantingDate && (
                        <Text style={styles.webDateHint}>
                          Must be on or after planting date: {formatDateForInput(plantingDate)}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </React.Fragment>
            )}

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveField}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : editItem ? 'Update' : 'Save'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {showPlantingDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={plantingDate || new Date()}
          mode="date"
          display="default"
          onChange={handlePlantingDateChange}
        />
      )}
      
      {showHarvestDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={harvestDate || new Date()}
          mode="date"
          display="default"
          onChange={handleHarvestDateChange}
          minimumDate={plantingDate || undefined}
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
