
export interface FertilizerItem {
  id: string;
  name: string;
  type: 'nitrogen' | 'phosphorus' | 'potassium' | 'organic' | 'compound' | 'other';
  quantity: number;
  unit: 'lbs' | 'kg' | 'gallons' | 'liters';
  purchaseDate: string;
  expirationDate?: string;
  lowStockThreshold: number;
  notes?: string;
}

export interface SeedItem {
  id: string;
  cropName: string;
  variety: string;
  quantity: number;
  unit: 'seeds' | 'packets' | 'lbs' | 'kg';
  purchaseDate: string;
  expirationDate?: string;
  viabilityRate?: number; // percentage
  lowStockThreshold: number;
  notes?: string;
}

export interface PackagingItem {
  id: string;
  name: string;
  type: 'box' | 'bag' | 'container' | 'crate' | 'basket' | 'other';
  quantity: number;
  size?: string; // e.g., "small", "medium", "large", or specific dimensions
  lowStockThreshold: number;
  notes?: string;
}

export interface YieldItem {
  id: string;
  cropName: string;
  variety?: string;
  quantity: number;
  unit: 'lbs' | 'kg' | 'bushels' | 'units';
  harvestDate: string;
  storageLocation: 'dry' | 'refrigerated';
  quality?: 'excellent' | 'good' | 'fair';
  notes?: string;
}

export interface SaleRecord {
  id: string;
  yieldItemId: string;
  cropName: string;
  quantity: number;
  unit: string;
  saleDate: string;
  price?: number;
  customer?: string;
  notes?: string;
}

export interface StorageLocation {
  id: string;
  name: string;
  type: 'dry' | 'refrigerated';
  totalCapacity: number;
  unit: 'cubic_feet' | 'cubic_meters' | 'lbs' | 'kg';
  notes?: string;
}

export interface UsageRecord {
  id: string;
  itemType: 'fertilizer' | 'seed' | 'packaging';
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  usageDate: string;
  usedFor?: string; // crop name, field name, etc.
  notes?: string;
}
