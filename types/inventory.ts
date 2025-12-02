
export interface FertilizerItem {
  id: string;
  user_id?: string;
  name: string;
  quantity: number;
  unit: 'lbs' | 'bags';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SeedItem {
  id: string;
  user_id?: string;
  name: string;
  quantity: number;
  unit: 'lbs' | 'bags' | 'units';
  created_at?: string;
  updated_at?: string;
}

export interface PackagingItem {
  id: string;
  user_id?: string;
  name: string;
  quantity: number;
  unit: string;
  created_at?: string;
  updated_at?: string;
}

export interface StorageLocation {
  id: string;
  user_id?: string;
  type: 'dry' | 'refrigerated' | 'freezer';
  unit: 'sqft' | 'lbs' | 'shelf';
  capacity: number;
  used: number;
  created_at?: string;
  updated_at?: string;
}

export interface Harvest {
  id: string;
  user_id?: string;
  crop_name: string;
  yield_amount: number;
  unit: 'lbs' | 'kg' | 'bushels' | 'boxes' | 'units';
  planted_amount?: number | null;
  loss?: number | null;
  storage_location_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Sale {
  id: string;
  user_id?: string;
  crop_name: string;
  amount_sold: number;
  unit: 'lbs' | 'kg' | 'bushels' | 'boxes' | 'units';
  storage_location_id?: string | null;
  price?: number | null;
  payment_method?: 'cash' | 'credit_debit' | 'payment_app' | null;
  customer?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
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
