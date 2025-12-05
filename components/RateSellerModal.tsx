
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface RateSellerModalProps {
  visible: boolean;
  sellerId: string;
  listingId: string;
  listingType: 'equipment' | 'customer';
  onClose: () => void;
  onSuccess: () => void;
}

export default function RateSellerModal({
  visible,
  sellerId,
  listingId,
  listingType,
  onClose,
  onSuccess,
}: RateSellerModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingRating, setExistingRating] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      checkExistingRating();
    }
  }, [visible, listingId]);

  const checkExistingRating = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('seller_ratings')
        .select('*')
        .eq('rater_id', user.id)
        .eq('listing_id', listingId)
        .single();

      if (data) {
        setExistingRating(data);
        setRating(data.rating);
        setComment(data.comment || '');
      } else {
        setExistingRating(null);
        setRating(5);
        setComment('');
      }
    } catch (error) {
      console.error('Error checking existing rating:', error);
    }
  };

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      Alert.alert('Error', 'Please select a rating between 1 and 5 stars');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get rater's profile ID
      const { data: raterProfile, error: raterError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (raterError) throw raterError;

      const ratingData = {
        seller_id: sellerId,
        rater_id: raterProfile.id,
        listing_id: listingId,
        listing_type: listingType,
        rating,
        comment: comment.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (existingRating) {
        // Update existing rating
        const { error } = await supabase
          .from('seller_ratings')
          .update(ratingData)
          .eq('id', existingRating.id);

        if (error) throw error;
        Alert.alert('Success', 'Rating updated successfully!');
      } else {
        // Insert new rating
        const { error } = await supabase
          .from('seller_ratings')
          .insert(ratingData);

        if (error) throw error;
        Alert.alert('Success', 'Rating submitted successfully!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          style={styles.starButton}
        >
          <Text style={styles.star}>
            {i <= rating ? '⭐' : '☆'}
          </Text>
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {existingRating ? 'Update Rating' : 'Rate Seller'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.label}>Your Rating</Text>
            <View style={styles.starsContainer}>
              {renderStars()}
            </View>
            <Text style={styles.ratingValue}>{rating} out of 5 stars</Text>

            <Text style={styles.label}>Comment (Optional)</Text>
            <TextInput
              style={styles.textArea}
              value={comment}
              onChangeText={setComment}
              placeholder="Share your experience with this seller..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
            />

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {existingRating ? 'Update Rating' : 'Submit Rating'}
                </Text>
              )}
            </TouchableOpacity>
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starButton: {
    padding: 8,
  },
  star: {
    fontSize: 40,
  },
  ratingValue: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  textArea: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#4A7C2C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
