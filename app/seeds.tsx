
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import PageHeader from '../components/PageHeader';
import AddSeedModal from '../components/AddSeedModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Seed {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export default function SeedsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSeed, setEditingSeed] = useState<Seed | undefined>();
  const [refreshing, setRefreshing] = useState(false);

  const fetchSeeds = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('seeds')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSeeds(data || []);
    } catch (error: any) {
      console.error('Error fetching seeds:', error);
      Alert.alert('Error', 'Failed to load seeds');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSeeds();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSeeds();
    setRefreshing(false);
  };

  const handleEdit = (seed: Seed) => {
    setEditingSeed(seed);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Seed',
      'Are you sure you want to delete this seed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('seeds')
                .delete()
                .eq('id', id);

              if (error) throw error;
              fetchSeeds();
            } catch (error: any) {
              console.error('Error deleting seed:', error);
              Alert.alert('Error', 'Failed to delete seed');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader 
        title="🌾 Seeds" 
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
              setEditingSeed(undefined);
              setModalVisible(true);
            }}
          >
            <Text style={styles.addButtonText}>+ Add Seed</Text>
          </TouchableOpacity>

          {seeds.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No seeds added yet</Text>
              <Text style={styles.emptySubtext}>Tap the button above to add your first seed</Text>
            </View>
          ) : (
            <React.Fragment>
              {seeds.map((seed, index) => (
                <View key={index} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{seed.name}</Text>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        onPress={() => handleEdit(seed)}
                        style={styles.actionButton}
                      >
                        <Text style={styles.actionButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(seed.id)}
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
        </ScrollView>
      </LinearGradient>

      <AddSeedModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingSeed(undefined);
        }}
        onSuccess={fetchSeeds}
        editItem={editingSeed}
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
});
