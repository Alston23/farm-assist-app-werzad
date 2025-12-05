
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface ConversationWithDetails {
  id: string;
  listing_id: string;
  listing_type: string;
  seller_id: string;
  buyer_id: string;
  created_at: string;
  listing_title: string;
  other_user_name: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
}

export default function MarketplaceMessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Fetch all conversations for the user
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Fetch details for each conversation
      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          // Determine other user
          const otherUserId = conv.seller_id === user.id ? conv.buyer_id : conv.seller_id;

          // Fetch other user's name
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', otherUserId)
            .single();

          // Fetch listing title
          const listingTable =
            conv.listing_type === 'equipment'
              ? 'equipment_marketplace_listings'
              : 'customer_marketplace_listings';
          const titleField =
            conv.listing_type === 'equipment' ? 'equipment_name' : 'product_name';

          const { data: listingData } = await supabase
            .from(listingTable)
            .select(titleField)
            .eq('id', conv.listing_id)
            .single();

          // Fetch last message
          const { data: lastMessageData } = await supabase
            .from('messages')
            .select('text, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            listing_title: listingData?.[titleField] || 'Listing',
            other_user_name: profileData?.name || 'User',
            last_message: lastMessageData?.text || null,
            last_message_time: lastMessageData?.created_at || null,
            unread_count: 0, // TODO: Implement unread count
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getUserRole = (conv: ConversationWithDetails) => {
    return conv.seller_id === user?.id ? 'Seller' : 'Buyer';
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Marketplace Messages</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Loading conversations...</Text>
            </View>
          ) : conversations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>
                Start a conversation by messaging a seller from the marketplace
              </Text>
            </View>
          ) : (
            conversations.map((conv) => (
              <TouchableOpacity
                key={conv.id}
                style={styles.conversationCard}
                onPress={() => router.push(`/(tabs)/marketplace-messages/${conv.id}` as any)}
              >
                <View style={styles.conversationHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {conv.other_user_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.conversationInfo}>
                    <View style={styles.conversationTitleRow}>
                      <Text style={styles.conversationName} numberOfLines={1}>
                        {conv.other_user_name}
                      </Text>
                      <Text style={styles.conversationTime}>
                        {formatTime(conv.last_message_time)}
                      </Text>
                    </View>
                    <Text style={styles.conversationListing} numberOfLines={1}>
                      {conv.listing_title}
                    </Text>
                    <View style={styles.conversationFooter}>
                      <Text style={styles.conversationRole}>
                        You are the {getUserRole(conv)}
                      </Text>
                    </View>
                    {conv.last_message && (
                      <Text style={styles.lastMessage} numberOfLines={2}>
                        {conv.last_message}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </LinearGradient>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
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
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  conversationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conversationHeader: {
    flexDirection: 'row',
    padding: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A7C2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D5016',
    flex: 1,
  },
  conversationTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  conversationListing: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  conversationRole: {
    fontSize: 12,
    color: '#4A7C2C',
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
