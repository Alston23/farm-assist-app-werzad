
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../../components/PageHeader';
import EditPlantingModal from '../../components/EditPlantingModal';
import NotificationPermissionModal from '../../components/NotificationPermissionModal';
import { supabase } from '../../lib/supabase';
import { useNotificationCheck } from '../../hooks/useNotificationCheck';
import { scheduleHarvestReminder } from '../../utils/notificationScheduler';

interface Planting {
  id: string;
  field_bed_id: string;
  crop_id: string;
  crop_name: string;
  days_to_maturity: number;
  planting_date: string;
  harvest_date: string;
  created_at: string;
  field_bed: {
    name: string;
    type: 'field' | 'bed';
    area_value: number;
    area_unit: 'acres' | 'sqft';
  };
}

export default function PlantingsScreen() {
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPlanting, setEditingPlanting] = useState<Planting | null>(null);
  
  const {
    showNotificationModal,
    checkAndShowModal,
    closeNotificationModal,
  } = useNotificationCheck();

  useEffect(() => {
    fetchPlantings();
  }, []);

  const fetchPlantings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, skipping fetch');
        setLoading(false);
        return;
      }

      console.log('Fetching plantings for user:', user.id);

      const { data, error } = await supabase
        .from('plantings')
        .select(`
          *,
          field_bed:fields_beds(name, type, area_value, area_unit)
        `)
        .eq('user_id', user.id)
        .order('planting_date', { ascending: true });

      if (error) {
        console.error('Error fetching plantings:', error);
        Alert.alert('Error', 'Failed to load plantings');
      } else {
        console.log('Fetched plantings:', data?.length || 0);
        setPlantings(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlantings();
  };

  const handleEdit = (planting: Planting) => {
    console.log('Editing planting:', planting);
    setEditingPlanting(planting);
    setEditModalVisible(true);
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setEditingPlanting(null);
  };

  const handleSetReminder = async (planting: Planting) => {
    console.log('Setting reminder for planting:', planting.crop_name);
    
    // Check if notifications are enabled
    const hasPermission = await checkAndShowModal();
    
    if (!hasPermission) {
      console.log('Notification permission not granted, modal shown');
      return;
    }

    // Schedule the harvest reminder
    const harvestDate = new Date(planting.harvest_date);
    const identifier = await scheduleHarvestReminder(planting.crop_name, harvestDate, 3);
    
    if (identifier) {
      Alert.alert(
        'Reminder Set',
        `You'll receive a reminder 3 days before ${planting.crop_name} is ready to harvest.`
      );
    } else {
      Alert.alert(
        'Unable to Set Reminder',
        'The harvest date may be too close or in the past.'
      );
    }
  };

  const deletePlanting = async (id: string | number) => {
    try {
      // Optimistically update UI by removing the planting from local state
      setPlantings(prev => prev.filter(p => String(p.id) !== String(id)));

      // Delete from Supabase
      const { error } = await supabase
        .from("plantings")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(error);
        Alert.alert("Error", "Failed to delete planting from server.");
        // Reload data to restore the item if delete failed
        await fetchPlantings();
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Unexpected error deleting planting.");
      // Reload data to restore the item if delete failed
      await fetchPlantings();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (plantingDate: string, harvestDate: string) => {
    const today = new Date();
    const planting = new Date(plantingDate);
    const harvest = new Date(harvestDate);

    if (today < planting) {
      return '#2196F3';
    } else if (today >= planting && today < harvest) {
      return '#4CAF50';
    } else {
      return '#FF9800';
    }
  };

  const getStatusText = (plantingDate: string, harvestDate: string) => {
    const today = new Date();
    const planting = new Date(plantingDate);
    const harvest = new Date(harvestDate);

    if (today < planting) {
      return 'Upcoming';
    } else if (today >= planting && today < harvest) {
      return 'Growing';
    } else {
      return 'Ready to Harvest';
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader title="🌱 Plantings" />
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
        >
          {loading ? (
            <View style={styles.card}>
              <Text style={styles.loadingText}>Loading plantings...</Text>
            </View>
          ) : plantings.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyTitle}>No Plantings Yet</Text>
              <Text style={styles.emptyText}>
                Add a field or bed in the Fields/Beds tab to start tracking your plantings!
              </Text>
            </View>
          ) : (
            <React.Fragment>
              {plantings.map((planting, index) => (
                <View key={index} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                      <Text style={styles.cropName}>{planting.crop_name}</Text>
                      <Text style={styles.fieldName}>
                        {planting.field_bed.name} ({planting.field_bed.type})
                      </Text>
                    </View>
                    <View style={styles.headerRight}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(planting.planting_date, planting.harvest_date) },
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {getStatusText(planting.planting_date, planting.harvest_date)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.reminderButton}
                        onPress={() => handleSetReminder(planting)}
                      >
                        <Ionicons name="notifications-outline" size={22} color="#4A7C2C" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEdit(planting)}
                      >
                        <Ionicons name="pencil-outline" size={22} color="#4A7C2C" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deletePlanting(planting.id)}
                      >
                        <Ionicons name="trash-outline" size={22} color="#d32f2f" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Planting Date:</Text>
                    <Text style={styles.infoValue}>{formatDate(planting.planting_date)}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Harvest Date:</Text>
                    <Text style={styles.infoValue}>{formatDate(planting.harvest_date)}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Days to Maturity:</Text>
                    <Text style={styles.infoValue}>{planting.days_to_maturity} days</Text>
                  </View>

                  {getDaysUntil(planting.harvest_date) > 0 && (
                    <View style={styles.countdownBox}>
                      <Text style={styles.countdownText}>
                        {getDaysUntil(planting.harvest_date)} days until harvest
                      </Text>
                    </View>
                  )}

                  {getDaysUntil(planting.harvest_date) <= 0 && (
                    <View style={[styles.countdownBox, styles.readyBox]}>
                      <Text style={[styles.countdownText, styles.readyText]}>
                        Ready to harvest!
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </React.Fragment>
          )}
        </ScrollView>
      </LinearGradient>

      {editingPlanting && (
        <EditPlantingModal
          visible={editModalVisible}
          onClose={handleCloseEditModal}
          onSuccess={fetchPlantings}
          planting={editingPlanting}
        />
      )}

      <NotificationPermissionModal
        visible={showNotificationModal}
        onClose={closeNotificationModal}
        featureName="harvest reminders"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D5016',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cropName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 4,
  },
  fieldName: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reminderButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 124, 44, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 124, 44, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
  },
  countdownBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 15,
    color: '#1976D2',
    fontWeight: '600',
  },
  readyBox: {
    backgroundColor: '#FFF3E0',
  },
  readyText: {
    color: '#F57C00',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
