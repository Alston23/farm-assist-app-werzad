
export interface FertilizerItem {
  id: string;
  user_id?: string;
  name: string;
  quantity: number;
  unit: 'lbs' | 'bags' | 'trucks';
  notes?: string;
  created_at?: string;
}

export interface SeedItem {
  id: string;
  user_id?: string;
  name: string;
  quantity: number;
  unit: 'lbs' | 'bags' | 'units';
  created_at?: string;
}

export interface PackagingItem {
  id: string;
  user_id?: string;
  name: string;
  quantity: number;
  unit: string;
  created_at?: string;
}

export interface StorageLocation {
  id: string;
  user_id?: string;
  type: 'dry' | 'refrigerated' | 'freezer';
  unit: 'sqft' | 'shelf';
  capacity: number;
  used: number;
  created_at?: string;
}

export interface UsageRecord {
  id: string;
  user_id?: string;
  itemType: 'fertilizer' | 'seed' | 'packaging';
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  usageDate: string;
  usedFor?: string;
  notes?: string;
}

export interface YieldItem {
  id: string;
  user_id?: string;
  cropName: string;
  variety?: string;
  quantity: number;
  unit: 'lbs' | 'kg' | 'bushels' | 'units';
  harvestDate: string;
  storageLocation: 'dry' | 'refrigerated';
  quality?: 'excellent' | 'good' | 'fair';
  lotNumber?: string;
  notes?: string;
}

export interface SaleRecord {
  id: string;
  user_id?: string;
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
