
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking } from 'react-native';

interface LocationContextType {
  hasLocationPermission: boolean;
  locationPermissionStatus: Location.PermissionStatus | null;
  hasAskedForLocation: boolean;
  loading: boolean;
  requestLocationPermission: () => Promise<boolean>;
  checkLocationPermission: () => Promise<boolean>;
  openSettings: () => void;
  markLocationAsked: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCATION_ASKED_KEY = '@farm_copilot_location_asked';

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [hasAskedForLocation, setHasAskedForLocation] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeLocationState();
  }, []);

  const initializeLocationState = async () => {
    try {
      console.log('LocationContext: Initializing location state');
      
      // Check if we've asked before
      const asked = await AsyncStorage.getItem(LOCATION_ASKED_KEY);
      setHasAskedForLocation(asked === 'true');
      console.log('LocationContext: Has asked for location before:', asked === 'true');

      // Check current permission status
      const { status } = await Location.getForegroundPermissionsAsync();
      console.log('LocationContext: Current permission status:', status);
      setLocationPermissionStatus(status);
      setHasLocationPermission(status === Location.PermissionStatus.GRANTED);
    } catch (error) {
      console.error('LocationContext: Error initializing location state:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLocationPermission = async (): Promise<boolean> => {
    try {
      console.log('LocationContext: Checking location permission');
      const { status } = await Location.getForegroundPermissionsAsync();
      console.log('LocationContext: Permission status:', status);
      setLocationPermissionStatus(status);
      const granted = status === Location.PermissionStatus.GRANTED;
      setHasLocationPermission(granted);
      return granted;
    } catch (error) {
      console.error('LocationContext: Error checking location permission:', error);
      return false;
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      console.log('LocationContext: Requesting location permission');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('LocationContext: Permission request result:', status);
      
      setLocationPermissionStatus(status);
      const granted = status === Location.PermissionStatus.GRANTED;
      setHasLocationPermission(granted);
      
      // Mark that we've asked
      await markLocationAsked();
      
      return granted;
    } catch (error) {
      console.error('LocationContext: Error requesting location permission:', error);
      return false;
    }
  };

  const markLocationAsked = async () => {
    try {
      await AsyncStorage.setItem(LOCATION_ASKED_KEY, 'true');
      setHasAskedForLocation(true);
      console.log('LocationContext: Marked location as asked');
    } catch (error) {
      console.error('LocationContext: Error marking location as asked:', error);
    }
  };

  const openSettings = () => {
    console.log('LocationContext: Opening app settings');
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <LocationContext.Provider
      value={{
        hasLocationPermission,
        locationPermissionStatus,
        hasAskedForLocation,
        loading,
        requestLocationPermission,
        checkLocationPermission,
        openSettings,
        markLocationAsked,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
