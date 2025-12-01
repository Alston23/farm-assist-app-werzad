
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { router } from 'expo-router';
import { FertilizerItem } from '@/types/inventory';
import { supabase } from '@/lib/supabase';

export default function FertilizersScreen() {
  const [fertilizers, setFertilizers] = useState<FertilizerItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<FertilizerItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<FertilizerItem['unit']>('lbs');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadFertilizers();
  }, []);

  const loadFertilizers = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('fertilizers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading fertilizers:', error);
        Alert.alert('Error', 'Failed to load fertilizers');
      } else {
        setFertilizers(data || []);
      }
    } catch (error) {
      console.error('Error loading fertilizers:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (item: FertilizerItem) => {
    setEditingItem(item);
    setName(item.name);
    setQuantity(item.quantity.toString());
    setUnit(item.unit);
    setNotes(item.notes || '');
    setModalVisible(true);
  };

  const resetForm = () => {
    setName('');
    setQuantity('');
    setUnit('lbs');
    setNotes('');
  };

  const handleSave = async () => {
    if (!name.trim() || !quantity) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty < 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in');
        return;
      }

      if (editingItem) {
        // Update existing
        const { error } = await supabase
          .from('fertilizers')
          .update({
            name: name.trim(),
            quantity: qty,
            unit,
            notes: notes.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating fertilizer:', error);
          Alert.alert('Error', 'Failed to update fertilizer');
          return;
        }
      } else {
        // Insert new
        const { error } = await supabase
          .from('fertilizers')
          .insert({
            user_id: user.id,
            name: name.trim(),
            quantity: qty,
            unit,
            notes: notes.trim(),
          });

        if (error) {
          console.error('Error adding fertilizer:', error);
          Alert.alert('Error', 'Failed to add fertilizer');
          return;
        }
      }

      setModalVisible(false);
      resetForm();
      loadFertilizers();
      Alert.alert('Success', `Fertilizer ${editingItem ? 'updated' : 'added'} successfully`);
    } catch (error) {
      console.error('Error saving fertilizer:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleDelete = (item: FertilizerItem) => {
    Alert.alert(
      'Delete Fertilizer',
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                Alert.alert('Error', 'You must be logged in');
                return;
              }

              const { error } = await supabase
                .from('fertilizers')
                .delete()
                .eq('id', item.id)
                .eq('user_id', user.id);

              if (error) {
                console.error('Error deleting fertilizer:', error);
                Alert.alert('Error', 'Failed to delete fertilizer');
              } else {
                loadFertilizers();
                Alert.alert('Success', 'Fertilizer deleted successfully');
              }
            } catch (error) {
              console.error('Error deleting fertilizer:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
  };

  const filteredFertilizers = fertilizers.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={commonStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fertilizers</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <IconSymbol
          ios_icon_name="magnifyingglass"
          android_material_icon_name="search"
          size={20}
          color={colors.textSecondary}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search fertilizers..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Fertilizer List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading fertilizers...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredFertilizers.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="tray"
                android_material_icon_name="inventory_2"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No fertilizers found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search' : 'Add your first fertilizer to get started'}
              </Text>
            </View>
          ) : (
            filteredFertilizers.map((item, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={[commonStyles.card, styles.itemCard]}
                  onPress={() => openEditModal(item)}
                >
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(item)}
                    >
                      <IconSymbol
                        ios_icon_name="trash.fill"
                        android_material_icon_name="delete"
                        size={20}
                        color={colors.error}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.itemDetails}>
                    <View style={styles.detailRow}>
                      <IconSymbol
                        ios_icon_name="scalemass.fill"
                        android_material_icon_name="scale"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.detailText}>
                        {item.quantity} {item.unit}
                      </Text>
                    </View>
                  </View>

                  {item.notes && (
                    <Text style={styles.itemNotes} numberOfLines={2}>
                      {item.notes}
                    </Text>
                  )}
                </TouchableOpacity>
              </React.Fragment>
            ))
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Fertilizer' : 'Add Fertilizer'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="e.g., 10-10-10 NPK"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Quantity *</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[commonStyles.input, styles.quantityInput]}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                />
                <View style={styles.unitSelector}>
                  {(['lbs', 'bags', 'trucks'] as const).map((u, idx) => (
                    <React.Fragment key={idx}>
                      <TouchableOpacity
                        style={[
                          styles.unitOption,
                          unit === u && styles.unitOptionSelected,
                        ]}
                        onPress={() => setUnit(u)}
                      >
                        <Text
                          style={[
                            styles.unitOptionText,
                            unit === u && styles.unitOptionTextSelected,
                          ]}
                        >
                          {u}
                        </Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  ))}
                </View>
              </View>

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[commonStyles.input, styles.notesInput]}
                placeholder="Additional information..."
                placeholderTextColor={colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[commonStyles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={commonStyles.buttonText}>
                  {editingItem ? 'Update' : 'Add'} Fertilizer
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 60 : 60,
    paddingBottom: 16,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  itemCard: {
    marginBottom: 12,
    position: 'relative',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  itemDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  itemNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalScroll: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityInput: {
    flex: 1,
    marginRight: 12,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 2,
  },
  unitOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  unitOptionSelected: {
    backgroundColor: colors.card,
  },
  unitOptionText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  unitOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 16,
  },
});
