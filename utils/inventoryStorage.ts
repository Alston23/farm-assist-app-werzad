
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FertilizerItem,
  SeedItem,
  PackagingItem,
  YieldItem,
  SaleRecord,
  StorageLocation,
  UsageRecord,
} from '@/types/inventory';

const STORAGE_KEYS = {
  FERTILIZERS: '@farm_fertilizers',
  SEEDS: '@farm_seeds',
  PACKAGING: '@farm_packaging',
  YIELDS: '@farm_yields',
  SALES: '@farm_sales',
  STORAGE_LOCATIONS: '@farm_storage_locations',
  USAGE_RECORDS: '@farm_usage_records',
};

export const inventoryStorage = {
  // Fertilizers
  async getFertilizers(): Promise<FertilizerItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FERTILIZERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Error loading fertilizers:', error);
      return [];
    }
  },

  async saveFertilizers(fertilizers: FertilizerItem[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FERTILIZERS, JSON.stringify(fertilizers));
      console.log('Fertilizers saved successfully:', fertilizers.length);
    } catch (error) {
      console.log('Error saving fertilizers:', error);
    }
  },

  // Seeds
  async getSeeds(): Promise<SeedItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SEEDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Error loading seeds:', error);
      return [];
    }
  },

  async saveSeeds(seeds: SeedItem[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SEEDS, JSON.stringify(seeds));
      console.log('Seeds saved successfully:', seeds.length);
    } catch (error) {
      console.log('Error saving seeds:', error);
    }
  },

  // Packaging
  async getPackaging(): Promise<PackagingItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PACKAGING);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Error loading packaging:', error);
      return [];
    }
  },

  async savePackaging(packaging: PackagingItem[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PACKAGING, JSON.stringify(packaging));
      console.log('Packaging saved successfully:', packaging.length);
    } catch (error) {
      console.log('Error saving packaging:', error);
    }
  },

  // Yields
  async getYields(): Promise<YieldItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.YIELDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Error loading yields:', error);
      return [];
    }
  },

  async saveYields(yields: YieldItem[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.YIELDS, JSON.stringify(yields));
      console.log('Yields saved successfully:', yields.length);
    } catch (error) {
      console.log('Error saving yields:', error);
    }
  },

  // Sales
  async getSales(): Promise<SaleRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SALES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Error loading sales:', error);
      return [];
    }
  },

  async saveSales(sales: SaleRecord[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
      console.log('Sales saved successfully:', sales.length);
    } catch (error) {
      console.log('Error saving sales:', error);
    }
  },

  // Storage Locations
  async getStorageLocations(): Promise<StorageLocation[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.STORAGE_LOCATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Error loading storage locations:', error);
      return [];
    }
  },

  async saveStorageLocations(locations: StorageLocation[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STORAGE_LOCATIONS, JSON.stringify(locations));
      console.log('Storage locations saved successfully:', locations.length);
    } catch (error) {
      console.log('Error saving storage locations:', error);
    }
  },

  // Usage Records
  async getUsageRecords(): Promise<UsageRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USAGE_RECORDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Error loading usage records:', error);
      return [];
    }
  },

  async saveUsageRecords(records: UsageRecord[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USAGE_RECORDS, JSON.stringify(records));
      console.log('Usage records saved successfully:', records.length);
    } catch (error) {
      console.log('Error saving usage records:', error);
    }
  },
};
