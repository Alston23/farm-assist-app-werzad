
export interface FertilizerItem {
  id: string;
  name: string;
  type: 'nitrogen' | 'phosphorus' | 'potassium' | 'organic' | 'compound' | 'other';
  quantity: number;
  unit: 'lbs' | 'kg' | 'bags' | 'gallons' | 'liters';
  purchaseDate: string;
  expirationDate?: string;
  lowStockThreshold: number;
  notes?: string;
}

export interface SeedItem {
  id: string;
  cropName: string;
  variety: string;
  itemType: 'seed' | 'transplant';
  quantity: number;
  unit: 'seeds' | 'packets' | 'lbs' | 'kg' | 'plants' | 'trays';
  purchaseDate: string;
  expirationDate?: string;
  viabilityRate?: number; // percentage
  lowStockThreshold: number;
  notes?: string;
}

export interface PackagingItem {
  id: string;
  name: string;
  type: 'box' | 'bag' | 'container' | 'crate' | 'basket' | 'bouquet_paper' | 'other';
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
  lotNumber?: string; // For food safety tracking, especially for restaurant sales
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
  paymentMethod: 'cash' | 'credit_debit' | 'payment_app';
  customer?: string;
  notes?: string;
}

export interface StorageLocation {
  id: string;
  name: string;
  type: 'dry' | 'cold' | 'frozen';
  capacityType: 'fixed' | 'percentage';
  totalCapacity: number;
  unit: 'sq_ft' | 'percentage';
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
