
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  FIELDS: '@farm_fields',
  PLANTINGS: '@farm_plantings',
  TASKS: '@farm_tasks',
  REVENUE: '@farm_revenue',
  SETTINGS: '@farm_settings',
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
};
