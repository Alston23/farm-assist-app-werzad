
export interface EquipmentListing {
  id: string;
  name: string;
  description: string;
  price: number;
  condition: 'new' | 'used-excellent' | 'used-good' | 'used-fair';
  category: 'tractors' | 'implements' | 'tillage' | 'planting' | 'harvesting' | 'irrigation' | 'tools' | 'other';
  location: string;
  contactInfo: string;
  images?: string[];
  dateCreated: string;
  userId?: string;
}

export interface EquipmentFilters {
  category?: string;
  condition?: string;
  searchQuery?: string;
  sortBy?: 'price-low' | 'price-high' | 'date-new' | 'date-old';
}
