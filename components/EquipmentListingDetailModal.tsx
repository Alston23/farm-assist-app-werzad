
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

interface EquipmentListingDetailModalProps {
  visible: boolean;
  listing: EquipmentListing;
  onClose: () => void;
  onUpdate: () => void;
}

const { width } = Dimensions.get('window');

export default function EquipmentListingDetailModal({
  visible,
  listing,
  onClose,
  onUpdate,
}: EquipmentListingDetailModalProps) {
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
                .from('equipment_marketplace_listings')
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
                <Text style={styles.imagePlaceholderText}>🚜</Text>
              </View>
            )}

            <View style={styles.content}>
              <View style={styles.badgeRow}>
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

              <Text style={styles.equipmentName}>{listing.equipment_name}</Text>
              <Text style={styles.equipmentType}>
                {formatEquipmentType(listing.equipment_type)}
              </Text>

              {listing.price && (
                <Text style={styles.price}>
                  ${listing.price.toLocaleString()}
                </Text>
              )}

              <View style={styles.detailsGrid}>
                {listing.manufacturer && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Manufacturer</Text>
                    <Text style={styles.detailValue}>{listing.manufacturer}</Text>
                  </View>
                )}
                {listing.model && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Model</Text>
                    <Text style={styles.detailValue}>{listing.model}</Text>
                  </View>
                )}
                {listing.year && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Year</Text>
                    <Text style={styles.detailValue}>{listing.year}</Text>
                  </View>
                )}
                {listing.condition && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Condition</Text>
                    <Text style={styles.detailValue}>
                      {listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1).replace('_', ' ')}
                    </Text>
                  </View>
                )}
                {listing.hours_used !== null && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Hours Used</Text>
                    <Text style={styles.detailValue}>{listing.hours_used.toLocaleString()}</Text>
                  </View>
                )}
                {listing.location && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>📍 {listing.location}</Text>
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{listing.description}</Text>
              </View>

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
                <Text style={styles.contactButtonText}>
                  {listing.listing_type === 'for_sale' ? 'Contact Seller' : 'Contact Buyer'}
                </Text>
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
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
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
  equipmentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 4,
  },
  equipmentType: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A7C2C',
    marginBottom: 20,
  },
  detailsGrid: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
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
