
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';

interface CropRecommendationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (criteria: {
    region: string;
    soilType: string;
    irrigationType: string;
    cropType: string;
    desiredYield: string;
    desiredRevenue: string;
    acreage: string;
  }) => void;
}

const regions = [
  'Northeast US',
  'Southeast US',
  'Midwest US',
  'Southwest US',
  'West Coast US',
  'Pacific Northwest US',
  'Canada - Eastern',
  'Canada - Western',
  'Mexico',
  'Central America',
  'South America',
  'Europe - Northern',
  'Europe - Southern',
  'Africa - Northern',
  'Africa - Sub-Saharan',
  'Middle East',
  'Asia - East',
  'Asia - South',
  'Asia - Southeast',
  'Australia',
  'New Zealand',
  'Other',
];

const soilTypes = [
  'Clay',
  'Sandy',
  'Loamy',
  'Silty',
  'Peaty',
  'Chalky',
  'Clay Loam',
  'Sandy Loam',
  'Silt Loam',
];

const irrigationTypes = [
  'Drip Irrigation',
  'Sprinkler',
  'Surface/Flood',
  'Soaker Hose',
  'Hand Watering',
  'Rain-fed',
  'Subsurface Drip',
  'Center Pivot',
  'Furrow Irrigation',
];

const cropTypes = [
  'Vegetables',
  'Fruits',
  'Flowers',
  'Herbs',
  'Spices',
  'Aromatics',
  'Mixed (Multiple Types)',
];

export default function CropRecommendationModal({
  visible,
  onClose,
  onSubmit,
}: CropRecommendationModalProps) {
  const [region, setRegion] = useState('');
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [soilType, setSoilType] = useState('');
  const [showSoilDropdown, setShowSoilDropdown] = useState(false);
  const [irrigationType, setIrrigationType] = useState('');
  const [showIrrigationDropdown, setShowIrrigationDropdown] = useState(false);
  const [cropType, setCropType] = useState('');
  const [showCropTypeDropdown, setShowCropTypeDropdown] = useState(false);
  const [desiredYield, setDesiredYield] = useState('');
  const [desiredRevenue, setDesiredRevenue] = useState('');
  const [acreage, setAcreage] = useState('');

  const handleSubmit = () => {
    if (!region) {
      Alert.alert('Missing Information', 'Please select your region');
      return;
    }
    if (!soilType) {
      Alert.alert('Missing Information', 'Please select your soil type');
      return;
    }
    if (!irrigationType) {
      Alert.alert('Missing Information', 'Please select your irrigation type');
      return;
    }
    if (!cropType) {
      Alert.alert('Missing Information', 'Please select your desired crop type');
      return;
    }
    if (!desiredYield.trim()) {
      Alert.alert('Missing Information', 'Please enter your desired yield');
      return;
    }
    if (!desiredRevenue.trim()) {
      Alert.alert('Missing Information', 'Please enter your desired revenue');
      return;
    }
    if (!acreage.trim()) {
      Alert.alert('Missing Information', 'Please enter your available acreage/bed space');
      return;
    }

    onSubmit({
      region,
      soilType,
      irrigationType,
      cropType,
      desiredYield: desiredYield.trim(),
      desiredRevenue: desiredRevenue.trim(),
      acreage: acreage.trim(),
    });

    resetForm();
  };

  const resetForm = () => {
    setRegion('');
    setSoilType('');
    setIrrigationType('');
    setCropType('');
    setDesiredYield('');
    setDesiredRevenue('');
    setAcreage('');
    setShowRegionDropdown(false);
    setShowSoilDropdown(false);
    setShowIrrigationDropdown(false);
    setShowCropTypeDropdown(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Crop Recommendations</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Text style={styles.description}>
              Tell us about your farm conditions and goals to get personalized crop recommendations.
            </Text>

            <View style={styles.section}>
              <Text style={styles.label}>Region *</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  setShowRegionDropdown(!showRegionDropdown);
                  setShowSoilDropdown(false);
                  setShowIrrigationDropdown(false);
                  setShowCropTypeDropdown(false);
                }}
              >
                <Text style={region ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {region || 'Select your region'}
                </Text>
              </TouchableOpacity>
              {showRegionDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled>
                    {regions.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setRegion(item);
                          setShowRegionDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Soil Type *</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  setShowSoilDropdown(!showSoilDropdown);
                  setShowRegionDropdown(false);
                  setShowIrrigationDropdown(false);
                  setShowCropTypeDropdown(false);
                }}
              >
                <Text style={soilType ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {soilType || 'Select your soil type'}
                </Text>
              </TouchableOpacity>
              {showSoilDropdown && (
                <View style={styles.dropdownList}>
                  {soilTypes.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSoilType(item);
                        setShowSoilDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Irrigation Type *</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  setShowIrrigationDropdown(!showIrrigationDropdown);
                  setShowRegionDropdown(false);
                  setShowSoilDropdown(false);
                  setShowCropTypeDropdown(false);
                }}
              >
                <Text style={irrigationType ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {irrigationType || 'Select your irrigation type'}
                </Text>
              </TouchableOpacity>
              {showIrrigationDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled>
                    {irrigationTypes.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setIrrigationType(item);
                          setShowIrrigationDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Crop Type Desired *</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  setShowCropTypeDropdown(!showCropTypeDropdown);
                  setShowRegionDropdown(false);
                  setShowSoilDropdown(false);
                  setShowIrrigationDropdown(false);
                }}
              >
                <Text style={cropType ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {cropType || 'Select crop type'}
                </Text>
              </TouchableOpacity>
              {showCropTypeDropdown && (
                <View style={styles.dropdownList}>
                  {cropTypes.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setCropType(item);
                        setShowCropTypeDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Desired Yield *</Text>
              <TextInput
                style={styles.input}
                value={desiredYield}
                onChangeText={setDesiredYield}
                placeholder="e.g., 5000 lbs per acre, High, Medium"
                placeholderTextColor="#999"
                multiline
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Desired Revenue *</Text>
              <View style={styles.revenueInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.revenueInput}
                  value={desiredRevenue}
                  onChangeText={setDesiredRevenue}
                  placeholder="e.g., 50000"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Available Acreage/Bed Space *</Text>
              <TextInput
                style={styles.input}
                value={acreage}
                onChangeText={setAcreage}
                placeholder="e.g., 5 acres, 2000 sq ft, 10 beds"
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Get Recommendations</Text>
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
  description: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
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
  dropdownScrollView: {
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  revenueInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingLeft: 12,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginRight: 4,
  },
  revenueInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#4A7C2C',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
