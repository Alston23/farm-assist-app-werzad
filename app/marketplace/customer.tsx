
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import AddCustomerListingModal from '../../components/AddCustomerListingModal';
import CustomerListingDetailModal from '../../components/CustomerListingDetailModal';

interface CustomerListing {
  id: string;
  user_id: string;
  product_name: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
  category: string;
  availability_status: string;
  pickup_location: string | null;
  delivery_available: boolean;
  images: string[] | null;
  created_at: string;
}

export default function CustomerMarketplaceScreen() {
  const router = useRouter();
  const [listings, setListings] = useState<CustomerListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<CustomerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<CustomerListing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'vegetables', 'fruits', 'flowers', 'herbs', 'spices', 'aromatics', 'other'];

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    filterListings();
  }, [searchQuery, selectedCategory, listings]);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_marketplace_listings')
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

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(listing => listing.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(listing =>
        listing.product_name.toLowerCase().includes(query) ||
        listing.description.toLowerCase().includes(query)
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
      case 'available':
        return '#4CAF50';
      case 'low_stock':
        return '#FF9800';
      case 'sold_out':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'low_stock':
        return 'Low Stock';
      case 'sold_out':
        return 'Sold Out';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customer Marketplace</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextActive
              ]}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
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
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Be the first to add a listing!'}
              </Text>
            </View>
          ) : (
            <View style={styles.listingsGrid}>
              {filteredListings.map((listing) => (
                <TouchableOpacity
                  key={listing.id}
                  style={styles.listingCard}
                  onPress={() => setSelectedListing(listing)}
                >
                  {listing.images && listing.images.length > 0 ? (
                    <Image
                      source={{ uri: listing.images[0] }}
                      style={styles.listingImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.listingImagePlaceholder}>
                      <Text style={styles.listingImagePlaceholderText}>📦</Text>
                    </View>
                  )}
                  
                  <View style={styles.listingContent}>
                    <Text style={styles.listingName} numberOfLines={1}>
                      {listing.product_name}
                    </Text>
                    <Text style={styles.listingCategory}>
                      {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
                    </Text>
                    <Text style={styles.listingPrice}>
                      ${listing.price.toFixed(2)} / {listing.unit}
                    </Text>
                    <View style={styles.listingFooter}>
                      <Text style={styles.listingQuantity}>
                        {listing.quantity} {listing.unit} available
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(listing.availability_status) }]}>
                        <Text style={styles.statusBadgeText}>
                          {getStatusText(listing.availability_status)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </LinearGradient>

      <AddCustomerListingModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchListings();
        }}
      />

      {selectedListing && (
        <CustomerListingDetailModal
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
  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  listingCard: {
    width: '48%',
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
  listingImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E8F5E9',
  },
  listingImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingImagePlaceholderText: {
    fontSize: 48,
  },
  listingContent: {
    padding: 12,
  },
  listingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 4,
  },
  listingCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  listingPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A7C2C',
    marginBottom: 8,
  },
  listingFooter: {
    flexDirection: 'column',
    gap: 6,
  },
  listingQuantity: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});
