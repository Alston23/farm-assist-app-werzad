
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import PageHeader from '../components/PageHeader';
import AddTransplantModal from '../components/AddTransplantModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Transplant {
  id: string;
  crop_name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export default function TransplantsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [transplants, setTransplants] = useState<Transplant[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransplant, setEditingTransplant] = useState<Transplant | undefined>();
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransplants = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transplants')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransplants(data || []);
    } catch (error: any) {
      console.error('Error fetching transplants:', error);
      Alert.alert('Error', 'Failed to load transplants');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTransplants();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransplants();
    setRefreshing(false);
  };

  const handleEdit = (transplant: Transplant) => {
    setEditingTransplant(transplant);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Transplant',
      'Are you sure you want to delete this transplant?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('transplants')
                .delete()
                .eq('id', id);

              if (error) throw error;
              fetchTransplants();
            } catch (error: any) {
              console.error('Error deleting transplant:', error);
              Alert.alert('Error', 'Failed to delete transplant');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader 
        title="🌿 Transplants" 
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
              setEditingTransplant(undefined);
              setModalVisible(true);
            }}
          >
            <Text style={styles.addButtonText}>+ Add Transplant</Text>
          </TouchableOpacity>

          {transplants.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No transplants added yet</Text>
              <Text style={styles.emptySubtext}>Tap the button above to add your first transplant</Text>
            </View>
          ) : (
            <React.Fragment>
              {transplants.map((transplant, index) => (
                <View key={index} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{transplant.crop_name}</Text>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        onPress={() => handleEdit(transplant)}
                        style={styles.actionButton}
                      >
                        <Text style={styles.actionButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(transplant.id)}
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
        </ScrollView>
      </LinearGradient>

      <AddTransplantModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingTransplant(undefined);
        }}
        onSuccess={fetchTransplants}
        editItem={editingTransplant}
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
});
