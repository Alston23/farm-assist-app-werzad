
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../../components/PageHeader';
import AddFieldBedModal from '../../components/AddFieldBedModal';
import { supabase } from '../../lib/supabase';

interface FieldBed {
  id: string;
  type: 'field' | 'bed';
  name: string;
  area_value: number;
  area_unit: 'acres' | 'sqft';
  soil_type: string;
  irrigation_type: string;
  created_at: string;
}

export default function FieldsScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [fieldsBeds, setFieldsBeds] = useState<FieldBed[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<FieldBed | null>(null);

  useEffect(() => {
    fetchFieldsBeds();
  }, []);

  const fetchFieldsBeds = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('fields_beds')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching fields/beds:', error);
        Alert.alert('Error', 'Failed to load fields/beds');
      } else {
        setFieldsBeds(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldSaved = (savedField: any) => {
    console.log('Fields: handleFieldSaved called', savedField);

    // Update the local state with the saved field
    setFieldsBeds((prev) => {
      if (!prev) return [savedField];
      const index = prev.findIndex((f) => f.id === savedField.id);
      if (index === -1) {
        // New field - add to the beginning of the list
        return [savedField, ...prev];
      }
      // Existing field - update it
      const copy = [...prev];
      copy[index] = savedField;
      return copy;
    });

    // Refresh the data to ensure we have the latest information
    fetchFieldsBeds();
  };

  const handleEdit = (item: FieldBed) => {
    console.log('Editing field/bed:', item);
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingItem(null);
  };

  const deleteFieldBed = async (id: string | number) => {
    try {
      // Optimistically update UI by removing the field/bed from local state
      setFieldsBeds(prev => prev.filter(fb => String(fb.id) !== String(id)));

      // Delete from Supabase
      const { error } = await supabase
        .from("fields_beds")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(error);
        Alert.alert("Error", "Failed to delete field/bed from server.");
        // Reload data to restore the item if delete failed
        await fetchFieldsBeds();
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Unexpected error deleting field/bed.");
      // Reload data to restore the item if delete failed
      await fetchFieldsBeds();
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader title="🏞️ Fields/Beds" />
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+ Add Field/Bed</Text>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.card}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : fieldsBeds.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyTitle}>No Fields or Beds Yet</Text>
              <Text style={styles.emptyText}>
                Tap the button above to add your first field or bed and start planning your plantings!
              </Text>
            </View>
          ) : (
            <React.Fragment>
              {fieldsBeds.map((item, index) => (
                <View key={index} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <View style={styles.headerRight}>
                      <View style={[styles.typeBadge, item.type === 'field' ? styles.fieldBadge : styles.bedBadge]}>
                        <Text style={styles.typeBadgeText}>
                          {item.type === 'field' ? 'Field' : 'Bed'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEdit(item)}
                      >
                        <Ionicons name="pencil-outline" size={22} color="#4A7C2C" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deleteFieldBed(item.id)}
                      >
                        <Ionicons name="trash-outline" size={22} color="#d32f2f" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Area:</Text>
                    <Text style={styles.infoValue}>
                      {item.area_value} {item.area_unit}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Soil Type:</Text>
                    <Text style={styles.infoValue}>{item.soil_type}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Irrigation:</Text>
                    <Text style={styles.infoValue}>{item.irrigation_type}</Text>
                  </View>
                </View>
              ))}
            </React.Fragment>
          )}
        </ScrollView>
      </LinearGradient>

      <AddFieldBedModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onSuccess={handleFieldSaved}
        editItem={editingItem}
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
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  fieldBadge: {
    backgroundColor: '#4A7C2C',
  },
  bedBadge: {
    backgroundColor: '#6BA542',
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
