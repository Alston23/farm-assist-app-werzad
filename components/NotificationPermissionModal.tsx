
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNotification } from '../contexts/NotificationContext';

interface NotificationPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  featureName?: string;
}

export default function NotificationPermissionModal({
  visible,
  onClose,
  featureName = 'this feature',
}: NotificationPermissionModalProps) {
  const { openSettings } = useNotification();

  const handleOpenSettings = () => {
    console.log('NotificationPermissionModal: Opening settings');
    openSettings();
    onClose();
  };

  const handleContinueWithout = () => {
    console.log('NotificationPermissionModal: Continue without notifications');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔔</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Notifications are turned off</Text>

          {/* Body */}
          <Text style={styles.body}>
            To receive reminders and alerts, please enable notifications in your device settings.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleOpenSettings}
            >
              <Text style={styles.primaryButtonText}>Open Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleContinueWithout}
            >
              <Text style={styles.secondaryButtonText}>Continue without notifications</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D5016',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 28,
  },
  body: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2D5016',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2D5016',
    fontSize: 15,
    fontWeight: '600',
  },
});
