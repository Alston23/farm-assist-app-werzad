
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking } from 'react-native';

interface CameraContextType {
  hasCameraPermission: boolean;
  cameraPermissionStatus: ImagePicker.PermissionStatus | null;
  hasAskedForCamera: boolean;
  loading: boolean;
  requestCameraPermission: () => Promise<boolean>;
  checkCameraPermission: () => Promise<boolean>;
  openSettings: () => void;
  markCameraAsked: () => Promise<void>;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

const CAMERA_ASKED_KEY = '@farm_copilot_camera_asked';

export function CameraProvider({ children }: { children: React.ReactNode }) {
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<ImagePicker.PermissionStatus | null>(null);
  const [hasAskedForCamera, setHasAskedForCamera] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeCameraState();
  }, []);

  const initializeCameraState = async () => {
    try {
      // Check if we've asked before
      const asked = await AsyncStorage.getItem(CAMERA_ASKED_KEY);
      setHasAskedForCamera(asked === 'true');
      console.log('CameraContext: Has asked for camera before:', asked === 'true');

      // Check current permission status
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      setCameraPermissionStatus(status);
      setHasCameraPermission(status === ImagePicker.PermissionStatus.GRANTED);
      console.log('CameraContext: Current camera permission status:', status);
    } catch (error) {
      console.error('CameraContext: Error initializing camera state:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      setCameraPermissionStatus(status);
      const granted = status === ImagePicker.PermissionStatus.GRANTED;
      setHasCameraPermission(granted);
      console.log('CameraContext: Checked camera permission:', granted);
      return granted;
    } catch (error) {
      console.error('CameraContext: Error checking camera permission:', error);
      return false;
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      console.log('CameraContext: Requesting camera permission...');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      setCameraPermissionStatus(status);
      const granted = status === ImagePicker.PermissionStatus.GRANTED;
      setHasCameraPermission(granted);
      
      console.log('CameraContext: Camera permission result:', status, 'granted:', granted);
      
      // Mark that we've asked
      await markCameraAsked();
      
      return granted;
    } catch (error) {
      console.error('CameraContext: Error requesting camera permission:', error);
      return false;
    }
  };

  const markCameraAsked = async () => {
    try {
      await AsyncStorage.setItem(CAMERA_ASKED_KEY, 'true');
      setHasAskedForCamera(true);
      console.log('CameraContext: Marked camera as asked');
    } catch (error) {
      console.error('CameraContext: Error marking camera as asked:', error);
    }
  };

  const openSettings = () => {
    console.log('CameraContext: Opening settings');
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <CameraContext.Provider
      value={{
        hasCameraPermission,
        cameraPermissionStatus,
        hasAskedForCamera,
        loading,
        requestCameraPermission,
        checkCameraPermission,
        openSettings,
        markCameraAsked,
      }}
    >
      {children}
    </CameraContext.Provider>
  );
}

export function useCamera() {
  const context = useContext(CameraContext);
  if (context === undefined) {
    throw new Error('useCamera must be used within a CameraProvider');
  }
  return context;
}
