
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Crop } from '@/types/crop';
import { EquipmentListing } from '@/types/equipment';

const STORAGE_KEYS = {
  FIELDS: '@farm_fields',
  PLANTINGS: '@farm_plantings',
  TASKS: '@farm_tasks',
  REVENUE: '@farm_revenue',
  SETTINGS: '@farm_settings',
  CUSTOM_CROPS: '@farm_custom_crops',
  EQUIPMENT_LISTINGS: '@farm_equipment_listings',
  USER: '@farm_user',
  USERS_DB: '@farm_users_db',
};

export const storage = {
  // Fields
  async getFields() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FIELDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Error loading fields:', error);
      return [];
    }
  },
  
  async saveFields(fields: any[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FIELDS, JSON.stringify(fields));
    } catch (error) {
      console.log('Error saving fields:', error);
    }
  },
  
  // Plantings
  async getPlantings() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PLANTINGS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Error loading plantings:', error);
      return [];
    }
  },
  
  async savePlantings(plantings: any[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PLANTINGS, JSON.stringify(plantings));
    } catch (error) {
      console.log('Error saving plantings:', error);
    }
  },
  
  // Tasks
  async getTasks() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Error loading tasks:', error);
      return [];
    }
  },
  
  async saveTasks(tasks: any[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.log('Error saving tasks:', error);
    }
  },
  
  // Revenue
  async getRevenue() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.REVENUE);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Error loading revenue:', error);
      return [];
    }
  },
  
  async saveRevenue(revenue: any[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REVENUE, JSON.stringify(revenue));
    } catch (error) {
      console.log('Error saving revenue:', error);
    }
  },
  
  // Settings
  async getSettings() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {
        region: 'Zone 5a',
        farmSize: 5,
        farmType: 'small-farm',
        primarySalesChannel: 'farmers-market',
        measurementSystem: 'imperial',
      };
    } catch (error) {
      console.log('Error loading settings:', error);
      return null;
    }
  },
  
  async saveSettings(settings: any) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.log('Error saving settings:', error);
    }
  },

  // Custom Crops
  async getCustomCrops(): Promise<Crop[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_CROPS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Error loading custom crops:', error);
      return [];
    }
  },

  async saveCustomCrops(crops: Crop[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_CROPS, JSON.stringify(crops));
      console.log('Custom crops saved successfully:', crops.length);
    } catch (error) {
      console.log('Error saving custom crops:', error);
    }
  },

  // Equipment Listings
  async getEquipmentListings(): Promise<EquipmentListing[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EQUIPMENT_LISTINGS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Error loading equipment listings:', error);
      return [];
    }
  },

  async saveEquipmentListings(listings: EquipmentListing[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EQUIPMENT_LISTINGS, JSON.stringify(listings));
      console.log('Equipment listings saved successfully:', listings.length);
    } catch (error) {
      console.log('Error saving equipment listings:', error);
    }
  },

  // Authentication
  async getUser() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.log('Error loading user:', error);
      return null;
    }
  },

  async saveUser(user: any) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.log('Error saving user:', error);
    }
  },

  async removeUser() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
      console.log('Error removing user:', error);
    }
  },
};
