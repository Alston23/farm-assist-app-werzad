
import { useState, useCallback } from 'react';
import { useLocation } from '../contexts/LocationContext';

export function useLocationCheck() {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const { hasLocationPermission, checkLocationPermission } = useLocation();

  const checkAndRequestLocation = useCallback(async (): Promise<boolean> => {
    // Check current permission status
    const hasPermission = await checkLocationPermission();
    
    if (!hasPermission) {
      setShowLocationModal(true);
      return false;
    }
    
    return true;
  }, [checkLocationPermission]);

  const closeLocationModal = useCallback(() => {
    setShowLocationModal(false);
  }, []);

  return {
    hasLocationPermission,
    showLocationModal,
    checkAndRequestLocation,
    closeLocationModal,
  };
}
