
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
import { supabase } from '../lib/supabase';

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
  const [isOwner, setIsOwner] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    checkOwnership();
  }, [listing]);

  const checkOwnership = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsOwner(user?.id === listing.user_id);
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

  const handleContact = () => {
    Alert.alert(
      'Contact Seller',
      'Messaging feature coming soon! For now, please contact the seller directly.',
      [{ text: 'OK' }]
    );
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
              <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
                <Text style={styles.contactButtonText}>Contact Seller</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
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
    marginBottom: 12,
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
  contactButton: {
    backgroundColor: '#4A7C2C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 18,
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
