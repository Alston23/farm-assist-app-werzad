
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import SellerProfileModal from './SellerProfileModal';
import RateSellerModal from './RateSellerModal';

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
  seller_name?: string;
  seller_rating?: number;
  seller_review_count?: number;
}

interface CustomerListingDetailModalProps {
  visible: boolean;
  listing: CustomerListing;
  onClose: () => void;
  onUpdate: () => void;
}

const { width } = Dimensions.get('window');

export default function CustomerListingDetailModal({
  visible,
  listing,
  onClose,
  onUpdate,
}: CustomerListingDetailModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSellerProfile, setShowSellerProfile] = useState(false);
  const [showRateSeller, setShowRateSeller] = useState(false);
  const [sellerName, setSellerName] = useState('');
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    checkOwnership();
    fetchSellerInfo();
  }, [listing]);

  const checkOwnership = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setIsOwner(currentUser?.id === listing.user_id);
  };

  const fetchSellerInfo = async () => {
    try {
      // Fetch seller name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', listing.user_id)
        .single();

      setSellerName(profileData?.name || 'Anonymous');

      // Fetch seller rating
      const { data: ratingData } = await supabase
        .rpc('get_seller_average_rating', { seller_uuid: listing.user_id });

      if (ratingData && ratingData.length > 0) {
        setAvgRating(ratingData[0].avg_rating);
        setReviewCount(ratingData[0].review_count || 0);
      }
    } catch (error) {
      console.error('Error fetching seller info:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('customer_marketplace_listings')
                .delete()
                .eq('id', listing.id);

              if (error) throw error;

              Alert.alert('Success', 'Listing deleted successfully');
              onUpdate();
              onClose();
            } catch (error) {
              console.error('Error deleting listing:', error);
              Alert.alert('Error', 'Failed to delete listing');
            }
          },
        },
      ]
    );
  };

  const handleMessageSeller = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to message sellers');
      return;
    }

    try {
      // Check if conversation already exists
      const { data: existingConv, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listing.id)
        .eq('seller_id', listing.user_id)
        .eq('buyer_id', user.id)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      let conversationId: string;

      if (existingConv) {
        // Use existing conversation
        conversationId = existingConv.id;
      } else {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            listing_id: listing.id,
            listing_type: 'customer',
            seller_id: listing.user_id,
            buyer_id: user.id,
          })
          .select('id')
          .single();

        if (createError) throw createError;
        conversationId = newConv.id;
      }

      // Navigate to chat screen
      onClose();
      router.push(`/marketplace-messages/${conversationId}` as any);
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Failed to start conversation');
    }
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
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {listing.images && listing.images.length > 0 ? (
                <View>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={(event) => {
                      const index = Math.round(event.nativeEvent.contentOffset.x / width);
                      setCurrentImageIndex(index);
                    }}
                    scrollEventThrottle={16}
                  >
                    {listing.images.map((uri, index) => (
                      <Image
                        key={index}
                        source={{ uri }}
                        style={styles.image}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                  {listing.images.length > 1 && (
                    <View style={styles.pagination}>
                      {listing.images.map((_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.paginationDot,
                            index === currentImageIndex && styles.paginationDotActive,
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>📦</Text>
                </View>
              )}

              <View style={styles.content}>
                <View style={styles.headerRow}>
                  <View style={styles.headerLeft}>
                    <Text style={styles.productName}>{listing.product_name}</Text>
                    <Text style={styles.category}>
                      {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(listing.availability_status) }]}>
                    <Text style={styles.statusBadgeText}>
                      {getStatusText(listing.availability_status)}
                    </Text>
                  </View>
                </View>

                {/* Seller Info Section */}
                <View style={styles.sellerSection}>
                  <View style={styles.sellerInfoRow}>
                    <View style={styles.sellerAvatar}>
                      <Text style={styles.sellerAvatarText}>
                        {sellerName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.sellerDetails}>
                      <Text style={styles.sellerLabel}>Seller</Text>
                      <Text style={styles.sellerName}>{sellerName}</Text>
                      {avgRating !== null && (
                        <View style={styles.ratingRow}>
                          <Text style={styles.ratingStar}>⭐</Text>
                          <Text style={styles.ratingText}>
                            {avgRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.viewProfileButton}
                    onPress={() => setShowSellerProfile(true)}
                  >
                    <Text style={styles.viewProfileButtonText}>View Profile</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.price}>
                  ${listing.price.toFixed(2)} / {listing.unit}
                </Text>

                <Text style={styles.quantity}>
                  {listing.quantity} {listing.unit} available
                </Text>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.description}>{listing.description}</Text>
                </View>

                {listing.pickup_location && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pickup Location</Text>
                    <Text style={styles.infoText}>📍 {listing.pickup_location}</Text>
                  </View>
                )}

                {listing.delivery_available && (
                  <View style={styles.deliveryBadge}>
                    <Text style={styles.deliveryBadgeText}>🚚 Delivery Available</Text>
                  </View>
                )}

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Posted</Text>
                  <Text style={styles.infoText}>
                    {new Date(listing.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              {isOwner ? (
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                  <Text style={styles.deleteButtonText}>Delete Listing</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.footerButtons}>
                  <TouchableOpacity 
                    style={styles.rateButton} 
                    onPress={() => setShowRateSeller(true)}
                  >
                    <Text style={styles.rateButtonText}>Rate Seller</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.contactButton} onPress={handleMessageSeller}>
                    <Text style={styles.contactButtonText}>Message Seller</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <SellerProfileModal
        visible={showSellerProfile}
        sellerId={listing.user_id}
        onClose={() => setShowSellerProfile(false)}
        onRatePress={() => {
          setShowSellerProfile(false);
          setShowRateSeller(true);
        }}
        isOwnProfile={isOwner}
      />

      <RateSellerModal
        visible={showRateSeller}
        sellerId={listing.user_id}
        listingId={listing.id}
        listingType="customer"
        onClose={() => setShowRateSeller(false)}
        onSuccess={() => {
          fetchSellerInfo();
          onUpdate();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  image: {
    width: width,
    height: 300,
    backgroundColor: '#E8F5E9',
  },
  imagePlaceholder: {
    width: width,
    height: 300,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 80,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#666',
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
  sellerSection: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sellerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A7C2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStar: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 13,
    color: '#666',
  },
  viewProfileButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A7C2C',
  },
  viewProfileButtonText: {
    color: '#4A7C2C',
    fontSize: 14,
    fontWeight: '600',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A7C2C',
    marginBottom: 8,
  },
  quantity: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
  },
  deliveryBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  deliveryBadgeText: {
    fontSize: 16,
    color: '#4A7C2C',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rateButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A7C2C',
  },
  rateButtonText: {
    color: '#4A7C2C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#4A7C2C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
