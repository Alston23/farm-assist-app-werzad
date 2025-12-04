
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { supabase } from '../lib/supabase';
import AddServiceModal from './AddServiceModal';

interface Equipment {
  id: string;
  name: string;
  type: string;
  brand?: string;
  model?: string;
  year?: number;
  hours: number;
  purchase_date?: string;
  purchase_price?: number;
  notes?: string;
}

interface Service {
  id: string;
  service_type: string;
  description: string;
  service_date: string;
  hours_at_service?: number;
  cost?: number;
  performed_by?: string;
  notes?: string;
}

interface EquipmentDetailModalProps {
  visible: boolean;
  onClose: () => void;
  equipment: Equipment;
  onUpdate: () => void;
}

export default function EquipmentDetailModal({ 
  visible, 
  onClose, 
  equipment,
  onUpdate 
}: EquipmentDetailModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [addServiceModalVisible, setAddServiceModalVisible] = useState(false);
  const [editingHours, setEditingHours] = useState(false);
  const [newHours, setNewHours] = useState(equipment.hours.toString());

  useEffect(() => {
    if (visible) {
      fetchServices();
      setNewHours(equipment.hours.toString());
    }
  }, [visible, equipment.id]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment_services')
        .select('*')
        .eq('equipment_id', equipment.id)
        .order('service_date', { ascending: false });

      if (error) {
        console.error('Error fetching services:', error);
      } else {
        setServices(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHours = async () => {
    const hoursValue = parseFloat(newHours);
    if (isNaN(hoursValue) || hoursValue < 0) {
      Alert.alert('Error', 'Please enter a valid number of hours');
      return;
    }

    try {
      const { error } = await supabase
        .from('equipment')
        .update({ hours: hoursValue, updated_at: new Date().toISOString() })
        .eq('id', equipment.id);

      if (error) {
        console.error('Error updating hours:', error);
        Alert.alert('Error', 'Failed to update hours');
      } else {
        setEditingHours(false);
        onUpdate();
        Alert.alert('Success', 'Hours updated successfully');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleDeleteService = (serviceId: string) => {
    Alert.alert(
      'Delete Service Record',
      'Are you sure you want to delete this service record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('equipment_services')
                .delete()
                .eq('id', serviceId);

              if (error) {
                console.error('Error deleting service:', error);
                Alert.alert('Error', 'Failed to delete service record');
              } else {
                fetchServices();
              }
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatCurrency = (amount?: number): string => {
    if (!amount) return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  const getServiceTypeColor = (type: string): string => {
    switch (type) {
      case 'maintenance': return '#4A7C2C';
      case 'repair': return '#D32F2F';
      case 'inspection': return '#1976D2';
      default: return '#757575';
    }
  };

  const totalServiceCost = services.reduce((sum, service) => sum + (service.cost || 0), 0);

  return (
    <React.Fragment>
      <Modal visible={visible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.titleContainer}>
                <Text style={styles.modalTitle}>{equipment.name}</Text>
                <Text style={styles.equipmentType}>{equipment.type}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.detailsCard}>
                <Text style={styles.sectionTitle}>Equipment Details</Text>
                
                {equipment.brand && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Brand:</Text>
                    <Text style={styles.detailValue}>{equipment.brand}</Text>
                  </View>
                )}
                
                {equipment.model && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Model:</Text>
                    <Text style={styles.detailValue}>{equipment.model}</Text>
                  </View>
                )}
                
                {equipment.year && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Year:</Text>
                    <Text style={styles.detailValue}>{equipment.year}</Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hours:</Text>
                  {editingHours ? (
                    <View style={styles.hoursEditContainer}>
                      <TextInput
                        style={styles.hoursInput}
                        value={newHours}
                        onChangeText={setNewHours}
                        keyboardType="decimal-pad"
                      />
                      <TouchableOpacity
                        style={styles.saveHoursButton}
                        onPress={handleUpdateHours}
                      >
                        <Text style={styles.saveHoursText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelHoursButton}
                        onPress={() => {
                          setEditingHours(false);
                          setNewHours(equipment.hours.toString());
                        }}
                      >
                        <Text style={styles.cancelHoursText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.hoursContainer}>
                      <Text style={styles.detailValue}>{equipment.hours}</Text>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setEditingHours(true)}
                      >
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {equipment.purchase_date && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Purchase Date:</Text>
                    <Text style={styles.detailValue}>{formatDate(equipment.purchase_date)}</Text>
                  </View>
                )}

                {equipment.purchase_price && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Purchase Price:</Text>
                    <Text style={styles.detailValue}>{formatCurrency(equipment.purchase_price)}</Text>
                  </View>
                )}

                {equipment.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.detailLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{equipment.notes}</Text>
                  </View>
                )}
              </View>

              <View style={styles.servicesSection}>
                <View style={styles.servicesSectionHeader}>
                  <Text style={styles.sectionTitle}>Service History</Text>
                  <TouchableOpacity
                    style={styles.addServiceButton}
                    onPress={() => setAddServiceModalVisible(true)}
                  >
                    <Text style={styles.addServiceButtonText}>+ Add Service</Text>
                  </TouchableOpacity>
                </View>

                {services.length > 0 && (
                  <View style={styles.totalCostCard}>
                    <Text style={styles.totalCostLabel}>Total Service Cost:</Text>
                    <Text style={styles.totalCostValue}>{formatCurrency(totalServiceCost)}</Text>
                  </View>
                )}

                {loading ? (
                  <Text style={styles.loadingText}>Loading services...</Text>
                ) : services.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No service records yet</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Tap &quot;Add Service&quot; to record maintenance and repairs
                    </Text>
                  </View>
                ) : (
                  <React.Fragment>
                    {services.map((service, index) => (
                      <View key={index} style={styles.serviceCard}>
                        <View style={styles.serviceHeader}>
                          <View style={[styles.serviceTypeBadge, { backgroundColor: getServiceTypeColor(service.service_type) }]}>
                            <Text style={styles.serviceTypeBadgeText}>
                              {service.service_type.charAt(0).toUpperCase() + service.service_type.slice(1)}
                            </Text>
                          </View>
                          <Text style={styles.serviceDate}>{formatDate(service.service_date)}</Text>
                        </View>

                        <Text style={styles.serviceDescription}>{service.description}</Text>

                        {service.hours_at_service !== null && service.hours_at_service !== undefined && (
                          <Text style={styles.serviceDetail}>
                            Hours: {service.hours_at_service}
                          </Text>
                        )}

                        {service.cost !== null && service.cost !== undefined && (
                          <Text style={styles.serviceDetail}>
                            Cost: {formatCurrency(service.cost)}
                          </Text>
                        )}

                        {service.performed_by && (
                          <Text style={styles.serviceDetail}>
                            Performed by: {service.performed_by}
                          </Text>
                        )}

                        {service.notes && (
                          <Text style={styles.serviceNotes}>{service.notes}</Text>
                        )}

                        <TouchableOpacity
                          style={styles.deleteServiceButton}
                          onPress={() => handleDeleteService(service.id)}
                        >
                          <Text style={styles.deleteServiceButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </React.Fragment>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <AddServiceModal
        visible={addServiceModalVisible}
        onClose={() => setAddServiceModalVisible(false)}
        onSuccess={() => {
          fetchServices();
          onUpdate();
        }}
        equipmentId={equipment.id}
        equipmentName={equipment.name}
      />
    </React.Fragment>
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
  titleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  equipmentType: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  detailsCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hoursEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  hoursInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 6,
    fontSize: 15,
    width: 80,
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: '#4A7C2C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  saveHoursButton: {
    backgroundColor: '#4A7C2C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveHoursText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelHoursButton: {
    backgroundColor: '#999',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelHoursText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
    lineHeight: 20,
  },
  servicesSection: {
    marginBottom: 40,
  },
  servicesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addServiceButton: {
    backgroundColor: '#4A7C2C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addServiceButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  totalCostCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalCostLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
  },
  totalCostValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  loadingText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  serviceCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A7C2C',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  serviceTypeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  serviceDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  serviceDescription: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  serviceDetail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  serviceNotes: {
    fontSize: 13,
    color: '#777',
    marginTop: 8,
    fontStyle: 'italic',
  },
  deleteServiceButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffebee',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  deleteServiceButtonText: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '600',
  },
});
