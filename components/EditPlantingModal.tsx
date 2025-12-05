
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

interface EditPlantingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planting: any;
}

export default function EditPlantingModal({ visible, onClose, onSuccess, planting }: EditPlantingModalProps) {
  const [cropId, setCropId] = useState('');
  const [cropName, setCropName] = useState('');
  const [showCropDropdown, setShowCropDropdown] = useState(false);
  const [cropSearchQuery, setCropSearchQuery] = useState('');
  const [daysToMaturity, setDaysToMaturity] = useState<number | null>(null);
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
    if (planting) {
      console.log('Editing planting:', planting);
      setCropId(planting.crop_id);
      setCropName(planting.crop_name);
      setCropSearchQuery(planting.crop_name);
      setDaysToMaturity(planting.days_to_maturity);
      
      const pDate = new Date(planting.planting_date + 'T00:00:00');
      const hDate = new Date(planting.harvest_date + 'T00:00:00');
      setPlantingDate(pDate);
      setHarvestDate(hDate);
      setPlantingDateInput(formatDateForInput(pDate));
      setHarvestDateInput(formatDateForInput(hDate));
    }
  }, [planting]);

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

  const handleSave = async () => {
    console.log('Save button pressed');
    
    if (!cropId) {
      Alert.alert('Error', 'Please select a crop');
      return;
    }
    if (!plantingDate || isNaN(plantingDate.getTime())) {
      Alert.alert('Error', 'Please select a valid planting date');
      return;
    }
    if (!harvestDate || isNaN(harvestDate.getTime())) {
      Alert.alert('Error', 'Please select a valid harvest date');
      return;
    }

    setSaving(true);

    try {
      const plantingDateStr = plantingDate.toISOString().split('T')[0];
      const harvestDateStr = harvestDate.toISOString().split('T')[0];
      console.log('Updating planting_date:', plantingDateStr);
      console.log('Updating harvest_date:', harvestDateStr);

      const { error } = await supabase
        .from('plantings')
        .update({
          crop_id: cropId,
          crop_name: cropName,
          days_to_maturity: daysToMaturity || 0,
          planting_date: plantingDateStr,
          harvest_date: harvestDateStr,
        })
        .eq('id', planting.id);

      if (error) {
        console.error('Error updating planting:', error);
        Alert.alert('Error', 'Failed to update planting');
        setSaving(false);
        return;
      }

      console.log('Success! Planting updated');
      Alert.alert(
        'Success',
        'Planting updated successfully!',
        [{ text: 'OK', onPress: () => {
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
      setShowPlantingDatePicker(!showPlantingDatePicker);
    } else {
      setShowPlantingDatePicker(true);
    }
  };

  const handleHarvestDatePress = () => {
    console.log('Harvest date button pressed - Platform:', Platform.OS);
    if (Platform.OS === 'web') {
      setShowHarvestDatePicker(!showHarvestDatePicker);
    } else {
      setShowHarvestDatePicker(true);
    }
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalOverlayTouchable}
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Planting</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
                    value={plantingDateInput}
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
                    value={harvestDateInput}
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

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Updating...' : 'Update Planting'}
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
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
