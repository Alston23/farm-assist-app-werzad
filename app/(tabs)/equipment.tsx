
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PageHeader from '../../components/PageHeader';
import AddEquipmentModal from '../../components/AddEquipmentModal';
import EquipmentDetailModal from '../../components/EquipmentDetailModal';
import { supabase } from '../../lib/supabase';

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
  created_at: string;
}

export default function EquipmentScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for edit functionality
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isEquipmentFormOpen, setIsEquipmentFormOpen] = useState(false);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching equipment:', error);
        Alert.alert('Error', 'Failed to load equipment');
      } else {
        setEquipment(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    fetchEquipment();
  };

  const handleEquipmentSaved = (saved: any) => {
    console.log('Equipment: handleEquipmentSaved', saved);
    setEquipment((prev) => {
      const existingIndex = prev.findIndex((e) => e.id === saved.id);
      if (existingIndex === -1) {
        // New equipment - add to the beginning of the list
        return [saved, ...prev];
      }
      // Existing equipment - update in place
      const copy = [...prev];
      copy[existingIndex] = saved;
      return copy;
    });
  };

  const handleEquipmentPress = (item: Equipment) => {
    setSelectedEquipment(item);
    setDetailModalVisible(true);
  };

  const handleEditEquipment = (equipment: Equipment) => {
    console.log('Equipment: Edit button pressed for', equipment);
    setEditingEquipment(equipment);
    setIsEquipmentFormOpen(true);
  };

  const handleDeleteEquipment = (id: string) => {
    console.log('Equipment: handleDeleteEquipment called with id', id);

    Alert.alert(
      'Delete Equipment',
      'Are you sure you want to delete this equipment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('Equipment: confirmed delete for id', id);

            try {
              // Use the SAME table and id column as the Equipment EDIT/SAVE logic
              const { error } = await supabase
                .from('equipment')
                .delete()
                .eq('id', id);

              if (error) {
                console.error('Equipment: delete error', error);
                Alert.alert(
                  'Error deleting equipment',
                  error.message || 'Something went wrong while deleting.'
                );
                return;
              }

              console.log('Equipment: delete success for id', id);

              // Update local state to remove the deleted item
              setEquipment((prev) =>
                Array.isArray(prev) ? prev.filter((e) => e.id !== id) : prev
              );

              // Also refetch to ensure consistency
              await fetchEquipment();
            } catch (err) {
              console.error('Equipment: unexpected delete error', err);
              Alert.alert(
                'Error deleting equipment',
                'Something went wrong. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader title="🚜 Equipment" />
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingEquipment(null);
              setModalVisible(true);
            }}
          >
            <Text style={styles.addButtonText}>+ Add Equipment</Text>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.card}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : equipment.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyTitle}>No Equipment Yet</Text>
              <Text style={styles.emptyText}>
                Tap the button above to add your first piece of equipment and start tracking hours, maintenance, and repairs!
              </Text>
            </View>
          ) : (
            <React.Fragment>
              {equipment.map((item, index) => (
                <View key={index} style={styles.card}>
                  <TouchableOpacity
                    onPress={() => handleEquipmentPress(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleContainer}>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <Text style={styles.cardSubtitle}>{item.type}</Text>
                      </View>
                      <View style={styles.hoursContainer}>
                        <Text style={styles.hoursLabel}>Hours</Text>
                        <Text style={styles.hoursValue}>{item.hours}</Text>
                      </View>
                    </View>

                    {(item.brand || item.model || item.year) && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoText}>
                          {[item.brand, item.model, item.year].filter(Boolean).join(' • ')}
                        </Text>
                      </View>
                    )}

                    <View style={styles.cardFooter}>
                      <Text style={styles.tapHint}>Tap to view details and service history</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditEquipment(item)}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => {
                        console.log('Equipment: Delete pressed for id', item.id);
                        handleDeleteEquipment(item.id);
                      }}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </React.Fragment>
          )}
        </ScrollView>
      </LinearGradient>

      <AddEquipmentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={handleSuccess}
      />

      {isEquipmentFormOpen && (
        <AddEquipmentModal
          visible={isEquipmentFormOpen}
          initialEquipment={editingEquipment}
          onClose={() => {
            console.log('Equipment: closing EquipmentForm');
            setIsEquipmentFormOpen(false);
            setEditingEquipment(null);
          }}
          onSaved={handleEquipmentSaved}
        />
      )}

      {selectedEquipment && (
        <EquipmentDetailModal
          visible={detailModalVisible}
          onClose={() => {
            setDetailModalVisible(false);
            setSelectedEquipment(null);
          }}
          equipment={selectedEquipment}
          onUpdate={handleSuccess}
        />
      )}
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
  addButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A7C2C',
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
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  hoursContainer: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  hoursLabel: {
    fontSize: 11,
    color: '#2D5016',
    fontWeight: '600',
    marginBottom: 2,
  },
  hoursValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  infoRow: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 8,
  },
  tapHint: {
    fontSize: 13,
    color: '#4A7C2C',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  editButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '600',
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
