
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Subscription {
  id: string;
  user_id: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  plan_type: 'free' | 'pro';
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
}

interface SubscriptionContextType {
  hasActiveSubscription: boolean;
  subscription: Subscription | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  activateSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const SUBSCRIPTION_STORAGE_KEY = '@farm_copilot_subscription';

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load subscription from storage on mount
  useEffect(() => {
    loadSubscriptionFromStorage();
  }, []);

  // Fetch subscription from database when user changes
  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      clearSubscription();
    }
  }, [user]);

  const loadSubscriptionFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
      if (stored) {
        const parsedSubscription = JSON.parse(stored);
        setSubscription(parsedSubscription);
        setHasActiveSubscription(parsedSubscription.status === 'active');
      }
    } catch (error) {
      console.error('SubscriptionContext: Error loading subscription from storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSubscriptionToStorage = async (sub: Subscription | null) => {
    try {
      if (sub) {
        await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(sub));
      } else {
        await AsyncStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
      }
    } catch (error) {
      console.error('SubscriptionContext: Error saving subscription to storage:', error);
    }
  };

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        clearSubscription();
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          clearSubscription();
        } else {
          console.error('SubscriptionContext: Error fetching subscription:', error);
        }
        return;
      }

      if (data) {
        const isActive = data.status === 'active';
        setSubscription(data);
        setHasActiveSubscription(isActive);
        await saveSubscriptionToStorage(data);
      } else {
        clearSubscription();
      }
    } catch (error) {
      console.error('SubscriptionContext: Exception fetching subscription:', error);
      clearSubscription();
    } finally {
      setLoading(false);
    }
  };

  const clearSubscription = () => {
    setSubscription(null);
    setHasActiveSubscription(false);
    saveSubscriptionToStorage(null);
    setLoading(false);
  };

  const refreshSubscription = async () => {
    await fetchSubscription();
  };

  const activateSubscription = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('No user found');
      }

      // Check if user already has a subscription
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (existingSub) {
        // Update existing subscription
        const { data, error } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            plan_type: 'pro',
            started_at: new Date().toISOString(),
            expires_at: null,
            cancelled_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', currentUser.id)
          .select()
          .single();

        if (error) throw error;

        setSubscription(data);
        setHasActiveSubscription(true);
        await saveSubscriptionToStorage(data);
      } else {
        // Create new subscription
        const { data, error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: currentUser.id,
            status: 'active',
            plan_type: 'pro',
            started_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        setSubscription(data);
        setHasActiveSubscription(true);
        await saveSubscriptionToStorage(data);
      }
    } catch (error) {
      console.error('SubscriptionContext: Error activating subscription:', error);
      throw error;
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        hasActiveSubscription,
        subscription,
        loading,
        refreshSubscription,
        activateSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
