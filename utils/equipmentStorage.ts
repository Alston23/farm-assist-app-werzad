
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Equipment, MaintenanceSchedule, MaintenanceRecord } from '@/types/equipment';

const STORAGE_KEYS = {
  EQUIPMENT: '@farm_equipment',
  MAINTENANCE_SCHEDULES: '@farm_maintenance_schedules',
  MAINTENANCE_RECORDS: '@farm_maintenance_records',
};

export const equipmentStorage = {
  // Equipment
  async getEquipment(): Promise<Equipment[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EQUIPMENT);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Error loading equipment:', error);
      return [];
    }
  },

  async saveEquipment(equipment: Equipment[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(equipment));
      console.log('Equipment saved successfully:', equipment.length);
    } catch (error) {
      console.log('Error saving equipment:', error);
    }
  },

  // Maintenance Schedules
  async getMaintenanceSchedules(): Promise<MaintenanceSchedule[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MAINTENANCE_SCHEDULES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Error loading maintenance schedules:', error);
      return [];
    }
  },

  async saveMaintenanceSchedules(schedules: MaintenanceSchedule[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MAINTENANCE_SCHEDULES, JSON.stringify(schedules));
      console.log('Maintenance schedules saved successfully:', schedules.length);
    } catch (error) {
      console.log('Error saving maintenance schedules:', error);
    }
  },

  // Maintenance Records
  async getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MAINTENANCE_RECORDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Error loading maintenance records:', error);
      return [];
    }
  },

  async saveMaintenanceRecords(records: MaintenanceRecord[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MAINTENANCE_RECORDS, JSON.stringify(records));
      console.log('Maintenance records saved successfully:', records.length);
    } catch (error) {
      console.log('Error saving maintenance records:', error);
    }
  },
};
