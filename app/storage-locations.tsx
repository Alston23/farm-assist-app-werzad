
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import PageHeader from '../components/PageHeader';
import AddStorageModal from '../components/AddStorageModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface StorageLocation {
  id: string;
  type: string;
  unit: string;
  capacity: number;
  used: number;
  notes?: string;
}

export default function StorageLocationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStorage, setEditingStorage] = useState<StorageLocation | undefined>();
  const [refreshing, setRefreshing] = useState(false);

  const fetchStorageLocations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('storage_locations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStorageLocations(data || []);
    } catch (error: any) {
      console.error('Error fetching storage locations:', error);
      Alert.alert('Error', 'Failed to load storage locations');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStorageLocations();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStorageLocations();
    setRefreshing(false);
  };

  const handleEdit = (storage: StorageLocation) => {
    setEditingStorage(storage);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Storage',
      'Are you sure you want to delete this storage location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('storage_locations')
                .delete()
                .eq('id', id);

              if (error) throw error;
              fetchStorageLocations();
            } catch (error: any) {
              console.error('Error deleting storage:', error);
              Alert.alert('Error', 'Failed to delete storage location');
            }
          },
        },
      ]
    );
  };

  const getStoragePercentage = (storage: StorageLocation) => {
    if (storage.capacity === 0) return 0;
    return Math.round((storage.used / storage.capacity) * 100);
  };

  return (
    <View style={styles.container}>
      <PageHeader 
        title="🏪 Storage Space" 
        showBackButton 
        onBackPress={() => router.back()}
      />
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingStorage(undefined);
              setModalVisible(true);
            }}
          >
            <Text style={styles.addButtonText}>+ Add Storage Location</Text>
          </TouchableOpacity>

          {storageLocations.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No storage locations added yet</Text>
              <Text style={styles.emptySubtext}>Tap the button above to add your first storage location</Text>
            </View>
          ) : (
            <React.Fragment>
              {storageLocations.map((storage, index) => (
                <View key={index} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>
                      {storage.type.charAt(0).toUpperCase() + storage.type.slice(1)} Storage
                    </Text>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        onPress={() => handleEdit(storage)}
                        style={styles.actionButton}
                      >
                        <Text style={styles.actionButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(storage.id)}
                        style={[styles.actionButton, styles.deleteButton]}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${getStoragePercentage(storage)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {storage.used} / {storage.capacity} {storage.unit === 'percentage' ? '%' : 'sq ft'} ({getStoragePercentage(storage)}%)
                    </Text>
                  </View>
                  {storage.notes && <Text style={styles.notes}>{storage.notes}</Text>}
                </View>
              ))}
            </React.Fragment>
          )}
        </ScrollView>
      </LinearGradient>

      <AddStorageModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingStorage(undefined);
        }}
        onSuccess={fetchStorageLocations}
        editItem={editingStorage}
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
    padding: 16,
    paddingBottom: 40,
  },
  addButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#2D5016',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#333',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
  },
  actionButtonText: {
    color: '#2D5016',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    color: '#C62828',
    fontSize: 13,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A7C2C',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#666',
  },
  notes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
