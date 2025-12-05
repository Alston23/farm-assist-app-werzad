
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to easily check if the user has an active Pro subscription
 * 
 * @returns {Object} Object containing:
 *   - isPro: boolean indicating if user has active Pro subscription
 *   - loading: boolean indicating if auth/profile status is being loaded
 *   - refreshProfile: function to manually refresh profile status from Supabase
 * 
 * @example
 * const { isPro, loading } = useProStatus();
 * 
 * if (loading) return <LoadingSpinner />;
 * if (!isPro) return <UpgradePrompt />;
 * return <PremiumFeature />;
 */
export function useProStatus() {
  const { isPro, loading, refreshProfile } = useAuth();

  return {
    isPro,
    loading,
    refreshProfile,
  };
}
