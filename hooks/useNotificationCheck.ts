
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
    const granted = await checkNotificationPermission();
    
    if (!granted) {
      setShowModal(true);
      return false;
    }
    
    return true;
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return {
    notificationPermissionGranted,
    showNotificationModal: showModal,
    checkAndShowModal,
    closeNotificationModal: closeModal,
  };
}
