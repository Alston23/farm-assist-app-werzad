
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

export interface Equipment {
  id: string;
  name: string;
  category: 'tractors' | 'implements' | 'tillage' | 'planting' | 'harvesting' | 'irrigation' | 'tools' | 'other';
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  hoursUsed?: number;
  status: 'operational' | 'needs-maintenance' | 'in-repair' | 'retired';
  location?: string;
  notes?: string;
}

export interface MaintenanceSchedule {
  id: string;
  equipmentId: string;
  taskName: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'hours-based' | 'one-time';
  frequencyValue?: number; // For hours-based (e.g., every 50 hours)
  lastCompleted?: string; // ISO date
  nextDue: string; // ISO date
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost?: number;
  estimatedDuration?: number; // minutes
  notes?: string;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  scheduleId?: string; // Reference to schedule if this was scheduled maintenance
  taskName: string;
  description: string;
  dateCompleted: string; // ISO date
  hoursAtMaintenance?: number;
  cost: number;
  duration?: number; // minutes
  performedBy?: string;
  partsReplaced?: string[];
  notes?: string;
  nextMaintenanceDue?: string; // ISO date
}
