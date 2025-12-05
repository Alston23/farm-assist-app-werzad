
import { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';

/**
 * Hook to check if notifications are enabled and show a modal if not.
 * Returns a function to trigger the check and modal state.
 */
export function useNotificationCheck() {
  const { notificationPermissionGranted, checkNotificationPermission } = useNotification();
  const [showModal, setShowModal] = useState(false);

  const checkAndShowModal = async (): Promise<boolean> => {
    console.log('useNotificationCheck: Checking notification permission');
    const granted = await checkNotificationPermission();
    
    if (!granted) {
      console.log('useNotificationCheck: Permission not granted, showing modal');
      setShowModal(true);
      return false;
    }
    
    console.log('useNotificationCheck: Permission granted');
    return true;
  };

  const closeModal = () => {
    console.log('useNotificationCheck: Closing modal');
    setShowModal(false);
  };

  return {
    notificationPermissionGranted,
    showNotificationModal: showModal,
    checkAndShowModal,
    closeNotificationModal: closeModal,
  };
}
