
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import AddEquipmentListingModal from '../../components/AddEquipmentListingModal';
import EquipmentListingDetailModal from '../../components/EquipmentListingDetailModal';

interface EquipmentListing {
  id: string;
  user_id: string;
  listing_type: string;
  equipment_name: string;
  equipment_type: string;
  manufacturer: string | null;
  model: string | null;
  year: number | null;
  condition: string | null;
  price: number | null;
  description: string;
  location: string | null;
  hours_used: number | null;
  images: string[] | null;
  status: string;
  created_at: string;
}

export default function EquipmentMarketplaceScreen() {
  const router = useRouter();
  const [listings, setListings] = useState<EquipmentListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<EquipmentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<EquipmentListing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedListingType, setSelectedListingType] = useState<string>('all');

  const equipmentTypes = ['all', 'tractor', 'plow', 'harvester', 'seeder', 'sprayer', 'cultivator', 'mower', 'trailer', 'irrigation', 'hand_tools', 'other'];

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    filterListings();
  }, [searchQuery, selectedType, selectedListingType, listings]);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment_marketplace_listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      Alert.alert('Error', 'Failed to load listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterListings = () => {
    let filtered = [...listings];

    if (selectedType !== 'all') {
      filtered = filtered.filter(listing => listing.equipment_type === selectedType);
    }

    if (selectedListingType !== 'all') {
      filtered = filtered.filter(listing => listing.listing_type === selectedListingType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(listing =>
        listing.equipment_name.toLowerCase().includes(query) ||
        listing.description.toLowerCase().includes(query) ||
        (listing.manufacturer && listing.manufacturer.toLowerCase().includes(query)) ||
        (listing.model && listing.model.toLowerCase().includes(query))
      );
    }

    setFilteredListings(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'sold':
        return '#F44336';
      case 'inactive':
        return '#999';
      default:
        return '#999';
    }
  };

  const formatEquipmentType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Equipment Marketplace</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search equipment..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedListingType === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedListingType('all')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedListingType === 'all' && styles.filterButtonTextActive
            ]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedListingType === 'for_sale' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedListingType('for_sale')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedListingType === 'for_sale' && styles.filterButtonTextActive
            ]}>For Sale</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedListingType === 'wanted' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedListingType('wanted')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedListingType === 'wanted' && styles.filterButtonTextActive
            ]}>Wanted</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {equipmentTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.categoryChip,
                selectedType === type && styles.categoryChipActive
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedType === type && styles.categoryChipTextActive
              ]}>
                {formatEquipmentType(type)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
        >
          {loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Loading listings...</Text>
            </View>
          ) : filteredListings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No listings found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || selectedType !== 'all' || selectedListingType !== 'all'
                  ? 'Try adjusting your filters' 
                  : 'Be the first to add a listing!'}
              </Text>
            </View>
          ) : (
            filteredListings.map((listing) => (
              <TouchableOpacity
                key={listing.id}
                style={styles.listingCard}
                onPress={() => setSelectedListing(listing)}
              >
                <View style={styles.listingHeader}>
                  <View style={styles.listingTypeContainer}>
                    <View style={[
                      styles.listingTypeBadge,
                      { backgroundColor: listing.listing_type === 'for_sale' ? '#4CAF50' : '#2196F3' }
                    ]}>
                      <Text style={styles.listingTypeBadgeText}>
                        {listing.listing_type === 'for_sale' ? 'FOR SALE' : 'WANTED'}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(listing.status) }]}>
                      <Text style={styles.statusBadgeText}>
                        {listing.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.listingBody}>
                  {listing.images && listing.images.length > 0 ? (
                    <Image
                      source={{ uri: listing.images[0] }}
                      style={styles.listingImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.listingImagePlaceholder}>
                      <Text style={styles.listingImagePlaceholderText}>🚜</Text>
                    </View>
                  )}

                  <View style={styles.listingInfo}>
                    <Text style={styles.listingName} numberOfLines={1}>
                      {listing.equipment_name}
                    </Text>
                    <Text style={styles.listingType}>
                      {formatEquipmentType(listing.equipment_type)}
                    </Text>
                    {listing.manufacturer && listing.model && (
                      <Text style={styles.listingDetails}>
                        {listing.manufacturer} {listing.model}
                        {listing.year && ` (${listing.year})`}
                      </Text>
                    )}
                    {listing.condition && (
                      <Text style={styles.listingCondition}>
                        Condition: {listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1).replace('_', ' ')}
                      </Text>
                    )}
                    {listing.price && (
                      <Text style={styles.listingPrice}>
                        ${listing.price.toLocaleString()}
                      </Text>
                    )}
                    {listing.location && (
                      <Text style={styles.listingLocation}>📍 {listing.location}</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </LinearGradient>

      <AddEquipmentListingModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchListings();
        }}
      />

      {selectedListing && (
        <EquipmentListingDetailModal
          visible={!!selectedListing}
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onUpdate={fetchListings}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D5016',
    paddingTop: 48,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#fff',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#2D5016',
  },
  categoryScroll: {
    maxHeight: 50,
    marginBottom: 12,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#fff',
  },
  categoryChipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#2D5016',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  listingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  listingHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  listingTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  listingTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  listingTypeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listingBody: {
    flexDirection: 'row',
    padding: 12,
  },
  listingImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    marginRight: 12,
  },
  listingImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listingImagePlaceholderText: {
    fontSize: 40,
  },
  listingInfo: {
    flex: 1,
  },
  listingName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 4,
  },
  listingType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  listingDetails: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  listingCondition: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A7C2C',
    marginBottom: 4,
  },
  listingLocation: {
    fontSize: 12,
    color: '#666',
  },
});
