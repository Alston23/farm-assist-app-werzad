
import { useSubscription } from '../contexts/SubscriptionContext';

/**
 * Hook to easily check if the user has an active Pro subscription
 * 
 * @returns {Object} Object containing:
 *   - isPro: boolean indicating if user has active Pro subscription
 *   - loading: boolean indicating if subscription status is being loaded
 *   - subscription: the full subscription object (or null)
 *   - refreshSubscription: function to manually refresh subscription status
 *   - activateSubscription: function to activate a Pro subscription
 * 
 * @example
 * const { isPro, loading } = useProStatus();
 * 
 * if (loading) return <LoadingSpinner />;
 * if (!isPro) return <UpgradePrompt />;
 * return <PremiumFeature />;
 */
export function useProStatus() {
  const { 
    hasActiveSubscription: isPro, 
    loading, 
    subscription,
    refreshSubscription,
    activateSubscription 
  } = useSubscription();

  return {
    isPro,
    loading,
    subscription,
    refreshSubscription,
    activateSubscription,
  };
}
