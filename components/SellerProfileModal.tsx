
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface SellerRating {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  rater_id: string;
}

interface SellerProfileModalProps {
  visible: boolean;
  sellerId: string;
  onClose: () => void;
  onRatePress?: () => void;
  isOwnProfile: boolean;
}

export default function SellerProfileModal({
  visible,
  sellerId,
  onClose,
  onRatePress,
  isOwnProfile,
}: SellerProfileModalProps) {
  const [sellerName, setSellerName] = useState('');
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [recentRatings, setRecentRatings] = useState<SellerRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      fetchSellerProfile();
    }
  }, [visible, sellerId]);

  const fetchSellerProfile = async () => {
    setLoading(true);
    try {
      // Fetch seller name
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', sellerId)
        .single();

      if (profileError) throw profileError;
      setSellerName(profileData?.name || 'Anonymous Seller');

      // Fetch average rating and count
      const { data: ratingData, error: ratingError } = await supabase
        .rpc('get_seller_average_rating', { seller_uuid: sellerId });

      if (ratingError) throw ratingError;
      
      if (ratingData && ratingData.length > 0) {
        setAvgRating(ratingData[0].avg_rating);
        setReviewCount(ratingData[0].review_count || 0);
      } else {
        setAvgRating(null);
        setReviewCount(0);
      }

      // Fetch recent ratings
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('seller_ratings')
        .select('id, rating, comment, created_at, rater_id')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ratingsError) throw ratingsError;
      setRecentRatings(ratingsData || []);
    } catch (error) {
      console.error('Error fetching seller profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.star}>
          {i <= rating ? '⭐' : '☆'}
        </Text>
      );
    }
    return stars;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seller Profile</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A7C2C" />
            </View>
          ) : (
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {sellerName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.sellerName}>{sellerName}</Text>
                
                {avgRating !== null ? (
                  <View style={styles.ratingContainer}>
                    <View style={styles.starsRow}>
                      {renderStars(Math.round(avgRating))}
                    </View>
                    <Text style={styles.ratingText}>
                      {avgRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.noRatingsText}>No ratings yet</Text>
                )}
              </View>

              {!isOwnProfile && onRatePress && (
                <TouchableOpacity style={styles.rateButton} onPress={onRatePress}>
                  <Text style={styles.rateButtonText}>Rate this seller</Text>
                </TouchableOpacity>
              )}

              {recentRatings.length > 0 && (
                <View style={styles.reviewsSection}>
                  <Text style={styles.sectionTitle}>Recent Reviews</Text>
                  {recentRatings.map((rating) => (
                    <View key={rating.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.starsRow}>
                          {renderStars(rating.rating)}
                        </View>
                        <Text style={styles.reviewDate}>
                          {new Date(rating.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      {rating.comment && (
                        <Text style={styles.reviewComment}>{rating.comment}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A7C2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  sellerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 12,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  star: {
    fontSize: 24,
    marginHorizontal: 2,
  },
  ratingText: {
    fontSize: 16,
    color: '#666',
  },
  noRatingsText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  rateButton: {
    backgroundColor: '#4A7C2C',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  rateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  reviewsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});
