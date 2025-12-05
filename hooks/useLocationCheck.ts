
import { useState, useCallback } from 'react';
import { useLocation } from '../contexts/LocationContext';

export function useLocationCheck() {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const { hasLocationPermission, checkLocationPermission } = useLocation();

  const checkAndRequestLocation = useCallback(async (): Promise<boolean> => {
    console.log('useLocationCheck: Checking location permission');
    
    // Check current permission status
    const hasPermission = await checkLocationPermission();
    
    if (!hasPermission) {
      console.log('useLocationCheck: No location permission, showing modal');
      setShowLocationModal(true);
      return false;
    }
    
    console.log('useLocationCheck: Location permission granted');
    return true;
  }, [checkLocationPermission]);

  const closeLocationModal = useCallback(() => {
    console.log('useLocationCheck: Closing location modal');
    setShowLocationModal(false);
  }, []);

  return {
    hasLocationPermission,
    showLocationModal,
    checkAndRequestLocation,
    closeLocationModal,
  };
}
