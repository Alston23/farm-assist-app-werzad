
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import PageHeader from '../../components/PageHeader';
import AddStorageModal from '../../components/AddStorageModal';
import AddFertilizerModal from '../../components/AddFertilizerModal';
import AddSeedModal from '../../components/AddSeedModal';
import AddTransplantModal from '../../components/AddTransplantModal';
import AddPackagingModal from '../../components/AddPackagingModal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface StorageLocation {
  id: string;
  type: string;
  unit: string;
  capacity: number;
  used: number;
  notes?: string;
}

interface Fertilizer {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

interface Seed {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface Transplant {
  id: string;
  crop_name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

interface Packaging {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  reorder_threshold?: number;
  notes?: string;
}

export default function InventoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  
  // Storage
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [storageModalVisible, setStorageModalVisible] = useState(false);
  const [editingStorage, setEditingStorage] = useState<StorageLocation | undefined>();
  
  // Fertilizers
  const [fertilizers, setFertilizers] = useState<Fertilizer[]>([]);
  const [fertilizerModalVisible, setFertilizerModalVisible] = useState(false);
  const [editingFertilizer, setEditingFertilizer] = useState<Fertilizer | undefined>();
  
  // Seeds
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [seedModalVisible, setSeedModalVisible] = useState(false);
  const [editingSeed, setEditingSeed] = useState<Seed | undefined>();
  
  // Transplants
  const [transplants, setTransplants] = useState<Transplant[]>([]);
  const [transplantModalVisible, setTransplantModalVisible] = useState(false);
  const [editingTransplant, setEditingTransplant] = useState<Transplant | undefined>();
  
  // Packaging
  const [packaging, setPackaging] = useState<Packaging[]>([]);
  const [packagingModalVisible, setPackagingModalVisible] = useState(false);
  const [editingPackaging, setEditingPackaging] = useState<Packaging | undefined>();

  const fetchAllData = async () => {
    if (!user) return;

    try {
      // Fetch storage locations
      const { data: storageData, error: storageError } = await supabase
        .from('storage_locations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (storageError) throw storageError;
      setStorageLocations(storageData || []);

      // Fetch fertilizers
      const { data: fertilizerData, error: fertilizerError } = await supabase
        .from('fertilizers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fertilizerError) throw fertilizerError;
      setFertilizers(fertilizerData || []);

      // Fetch seeds
      const { data: seedData, error: seedError } = await supabase
        .from('seeds')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (seedError) throw seedError;
      setSeeds(seedData || []);

      // Fetch transplants
      const { data: transplantData, error: transplantError } = await supabase
        .from('transplants')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (transplantError) throw transplantError;
      setTransplants(transplantData || []);

      // Fetch packaging
      const { data: packagingData, error: packagingError } = await supabase
        .from('packaging')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (packagingError) throw packagingError;
      setPackaging(packagingData || []);
    } catch (error: any) {
      console.error('Error fetching inventory data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const handleDeleteStorage = async (id: string) => {
    console.log('Inventory: Delete pressed for id', id);
    console.log('Inventory: handleDeleteStorage called with id', id);

    try {
      const { error } = await supabase
        .from('storage_locations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Inventory: delete error', error);
        return;
      }

      console.log('Inventory: delete success for id', id);

      // Remove from local state so UI updates immediately
      setStorageLocations((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      console.error('Inventory: unexpected delete error', err);
    }
  };

  const handleDeleteFertilizer = async (id: string) => {
    console.log('Inventory: Delete pressed for id', id);
    console.log('Inventory: handleDeleteFertilizer called with id', id);

    try {
      const { error } = await supabase
        .from('fertilizers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Inventory: delete error', error);
        return;
      }

      console.log('Inventory: delete success for id', id);

      // Remove from local state so UI updates immediately
      setFertilizers((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      console.error('Inventory: unexpected delete error', err);
    }
  };

  const handleDeleteSeed = async (id: string) => {
    console.log('Inventory: Delete pressed for id', id);
    console.log('Inventory: handleDeleteSeed called with id', id);

    try {
      const { error } = await supabase
        .from('seeds')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Inventory: delete error', error);
        return;
      }

      console.log('Inventory: delete success for id', id);

      // Remove from local state so UI updates immediately
      setSeeds((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      console.error('Inventory: unexpected delete error', err);
    }
  };

  const handleDeleteTransplant = async (id: string) => {
    console.log('Inventory: Delete pressed for id', id);
    console.log('Inventory: handleDeleteTransplant called with id', id);

    try {
      const { error } = await supabase
        .from('transplants')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Inventory: delete error', error);
        return;
      }

      console.log('Inventory: delete success for id', id);

      // Remove from local state so UI updates immediately
      setTransplants((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      console.error('Inventory: unexpected delete error', err);
    }
  };

  const handleDeletePackaging = async (id: string) => {
    console.log('Inventory: Delete pressed for id', id);
    console.log('Inventory: handleDeletePackaging called with id', id);

    try {
      const { error } = await supabase
        .from('packaging')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Inventory: delete error', error);
        return;
      }

      console.log('Inventory: delete success for id', id);

      // Remove from local state so UI updates immediately
      setPackaging((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      console.error('Inventory: unexpected delete error', err);
    }
  };

  const handleEditStorage = (storage: StorageLocation) => {
    setEditingStorage(storage);
    setStorageModalVisible(true);
  };

  const handleEditFertilizer = (fertilizer: Fertilizer) => {
    setEditingFertilizer(fertilizer);
    setFertilizerModalVisible(true);
  };

  const handleEditSeed = (seed: Seed) => {
    setEditingSeed(seed);
    setSeedModalVisible(true);
  };

  const handleEditTransplant = (transplant: Transplant) => {
    setEditingTransplant(transplant);
    setTransplantModalVisible(true);
  };

  const handleEditPackaging = (pkg: Packaging) => {
    setEditingPackaging(pkg);
    setPackagingModalVisible(true);
  };

  const getStoragePercentage = (storage: StorageLocation) => {
    if (storage.capacity === 0) return 0;
    return Math.round((storage.used / storage.capacity) * 100);
  };

  const isLowStock = (item: Packaging) => {
    if (!item.reorder_threshold) return false;
    return item.quantity <= item.reorder_threshold;
  };

  return (
    <View style={styles.container}>
      <PageHeader title="📦 Inventory" />
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Storage Space Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏪 Storage Space</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setEditingStorage(undefined);
                  setStorageModalVisible(true);
                }}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {storageLocations.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No storage locations added yet</Text>
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
                          onPress={() => handleEditStorage(storage)}
                          style={styles.actionButton}
                        >
                          <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            console.log('Inventory: Delete pressed for id', storage.id);
                            handleDeleteStorage(storage.id);
                          }}
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
          </View>

          {/* Fertilizers Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🌱 Fertilizers</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setEditingFertilizer(undefined);
                  setFertilizerModalVisible(true);
                }}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {fertilizers.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No fertilizers added yet</Text>
              </View>
            ) : (
              <React.Fragment>
                {fertilizers.map((fertilizer, index) => (
                  <View key={index} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{fertilizer.name}</Text>
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          onPress={() => handleEditFertilizer(fertilizer)}
                          style={styles.actionButton}
                        >
                          <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            console.log('Inventory: Delete pressed for id', fertilizer.id);
                            handleDeleteFertilizer(fertilizer.id);
                          }}
                          style={[styles.actionButton, styles.deleteButton]}
                        >
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.quantity}>
                      {fertilizer.quantity} {fertilizer.unit}
                    </Text>
                    {fertilizer.notes && <Text style={styles.notes}>{fertilizer.notes}</Text>}
                  </View>
                ))}
              </React.Fragment>
            )}
          </View>

          {/* Seeds Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🌾 Seeds</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setEditingSeed(undefined);
                  setSeedModalVisible(true);
                }}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {seeds.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No seeds added yet</Text>
              </View>
            ) : (
              <React.Fragment>
                {seeds.map((seed, index) => (
                  <View key={index} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{seed.name}</Text>
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          onPress={() => handleEditSeed(seed)}
                          style={styles.actionButton}
                        >
                          <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            console.log('Inventory: Delete pressed for id', seed.id);
                            handleDeleteSeed(seed.id);
                          }}
                          style={[styles.actionButton, styles.deleteButton]}
                        >
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.quantity}>
                      {seed.quantity} {seed.unit}
                    </Text>
                  </View>
                ))}
              </React.Fragment>
            )}
          </View>

          {/* Transplants Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🌿 Transplants</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setEditingTransplant(undefined);
                  setTransplantModalVisible(true);
                }}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {transplants.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No transplants added yet</Text>
              </View>
            ) : (
              <React.Fragment>
                {transplants.map((transplant, index) => (
                  <View key={index} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{transplant.crop_name}</Text>
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          onPress={() => handleEditTransplant(transplant)}
                          style={styles.actionButton}
                        >
                          <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            console.log('Inventory: Delete pressed for id', transplant.id);
                            handleDeleteTransplant(transplant.id);
                          }}
                          style={[styles.actionButton, styles.deleteButton]}
                        >
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.quantity}>
                      {transplant.quantity} {transplant.unit}
                    </Text>
                    {transplant.notes && <Text style={styles.notes}>{transplant.notes}</Text>}
                  </View>
                ))}
              </React.Fragment>
            )}
          </View>

          {/* Packaging Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📦 Packaging</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setEditingPackaging(undefined);
                  setPackagingModalVisible(true);
                }}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {packaging.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No packaging added yet</Text>
              </View>
            ) : (
              <React.Fragment>
                {packaging.map((pkg, index) => (
                  <View key={index} style={[styles.card, isLowStock(pkg) && styles.lowStockCard]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.titleContainer}>
                        <Text style={styles.cardTitle}>{pkg.name}</Text>
                        {isLowStock(pkg) && (
                          <View style={styles.lowStockBadge}>
                            <Text style={styles.lowStockText}>⚠️ Low Stock</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          onPress={() => handleEditPackaging(pkg)}
                          style={styles.actionButton}
                        >
                          <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            console.log('Inventory: Delete pressed for id', pkg.id);
                            handleDeletePackaging(pkg.id);
                          }}
                          style={[styles.actionButton, styles.deleteButton]}
                        >
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.quantity}>
                      {pkg.quantity} {pkg.unit}
                    </Text>
                    {pkg.reorder_threshold && (
                      <Text style={styles.reorderText}>
                        Reorder at: {pkg.reorder_threshold} {pkg.unit}
                      </Text>
                    )}
                    {pkg.notes && <Text style={styles.notes}>{pkg.notes}</Text>}
                  </View>
                ))}
              </React.Fragment>
            )}
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Modals */}
      <AddStorageModal
        visible={storageModalVisible}
        onClose={() => {
          setStorageModalVisible(false);
          setEditingStorage(undefined);
        }}
        onSuccess={fetchAllData}
        editItem={editingStorage}
      />

      <AddFertilizerModal
        visible={fertilizerModalVisible}
        onClose={() => {
          setFertilizerModalVisible(false);
          setEditingFertilizer(undefined);
        }}
        onSuccess={fetchAllData}
        editItem={editingFertilizer}
      />

      <AddSeedModal
        visible={seedModalVisible}
        onClose={() => {
          setSeedModalVisible(false);
          setEditingSeed(undefined);
        }}
        onSuccess={fetchAllData}
        editItem={editingSeed}
      />

      <AddTransplantModal
        visible={transplantModalVisible}
        onClose={() => {
          setTransplantModalVisible(false);
          setEditingTransplant(undefined);
        }}
        onSuccess={fetchAllData}
        editItem={editingTransplant}
      />

      <AddPackagingModal
        visible={packagingModalVisible}
        onClose={() => {
          setPackagingModalVisible(false);
          setEditingPackaging(undefined);
        }}
        onSuccess={fetchAllData}
        editItem={editingPackaging}
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
    paddingBottom: 120,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  addButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#2D5016',
    fontWeight: 'bold',
    fontSize: 14,
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
  lowStockCard: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 15,
    fontStyle: 'italic',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 4,
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
  quantity: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
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
  lowStockBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  lowStockText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reorderText: {
    fontSize: 13,
    color: '#FF6B6B',
    fontWeight: '600',
    marginTop: 4,
  },
});
