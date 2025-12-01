
export interface Crop {
  id: string;
  name: string;
  category: 'vegetable' | 'fruit' | 'flower' | 'herb' | 'spice' | 'aromatic';
  description: string;
  
  // Growing conditions
  sunlight: 'full-sun' | 'partial-shade' | 'full-shade';
  sunlightHours: string; // e.g., "6-8 hours"
  waterNeeds: 'low' | 'moderate' | 'high';
  waterFrequency: string; // e.g., "1-2 times per week"
  soilType: string[]; // e.g., ["loamy", "sandy"]
  phMin: number;
  phMax: number;
  temperatureMin: number; // Fahrenheit
  temperatureMax: number;
  
  // Spacing
  plantSpacing: number; // inches
  rowSpacing: number; // inches
  depth: number; // inches for planting depth
  
  // Timeline
  daysToGermination: string; // e.g., "7-14"
  daysToMaturity: string; // e.g., "60-80"
  harvestWindow: string; // e.g., "2-3 weeks"
  
  // Season
  plantingSeasons: string[]; // e.g., ["spring", "fall"]
  frostTolerance: 'tender' | 'half-hardy' | 'hardy';
  
  // Yield
  yieldPerPlant: string; // e.g., "2-4 lbs"
  plantsPerSqFt: number;
  
  // Companion planting
  companionPlants: string[];
  avoidPlants: string[];
  
  // Cover crops
  recommendedCoverCrops: string[];
  
  // Additional care
  fertilizer: string;
  commonPests: string[];
  commonDiseases: string[];
  specialNotes: string;
}

export interface SoilHealthRecord {
  id: string;
  date: string; // ISO date
  phLevel: number;
  organicMatter: number; // percentage
  nitrogen: 'low' | 'medium' | 'high';
  phosphorus: 'low' | 'medium' | 'high';
  potassium: 'low' | 'medium' | 'high';
  notes: string;
}

export interface PestDiseaseRecord {
  id: string;
  date: string; // ISO date
  type: 'pest' | 'disease';
  name: string;
  severity: 'low' | 'medium' | 'high';
  affectedCrops: string[]; // crop ids
  treatment: string;
  resolved: boolean;
  notes: string;
}

export interface Field {
  id: string;
  name: string;
  size: number; // square feet
  type: 'bed' | 'field' | 'greenhouse' | 'container';
  currentCrop?: string; // crop id
  soilType: string;
  irrigationType: 'drip' | 'sprinkler' | 'hand-water' | 'rain-fed';
  notes: string;
  
  // Soil health tracking
  soilHealthRecords: SoilHealthRecord[];
  currentPH: number;
  lastSoilTest: string; // ISO date
  
  // Pest and disease history
  pestDiseaseHistory: PestDiseaseRecord[];
}

export interface Planting {
  id: string;
  cropId: string;
  fieldId: string;
  plantDate: string; // ISO date
  expectedHarvestDate: string; // ISO date
  actualHarvestDate?: string; // ISO date
  quantity: number; // number of plants
  status: 'planned' | 'planted' | 'growing' | 'harvested';
  notes: string;
  
  // Issues tracking
  pestIssues: string[];
  diseaseIssues: string[];
  yieldQuality: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO date
  completed: boolean;
  plantingId?: string;
  priority: 'low' | 'medium' | 'high';
  type: 'planting' | 'watering' | 'fertilizing' | 'weeding' | 'harvesting' | 'other';
}

export interface InputCosts {
  fertilizer: number;
  fuel: number;
  seed: number;
  equipment: number;
  packaging: number;
  miscellaneous: number;
}

export interface RevenueEntry {
  id: string;
  plantingId: string;
  harvestAmount: number; // lbs or units
  marketPrice: number; // per lb or unit
  totalRevenue: number;
  costs: number; // Total costs (sum of all input costs)
  inputCosts: InputCosts; // Detailed breakdown of costs
  profit: number;
  salesChannel: 'self-sufficiency' | 'roadside-stand' | 'restaurant' | 'csa' | 'farmers-market';
  date: string; // ISO date
  notes: string;
}

export interface UserSettings {
  region: string; // e.g., "Zone 5a"
  farmSize: number; // acres
  farmType: 'homestead' | 'small-farm';
  primarySalesChannel: 'self-sufficiency' | 'roadside-stand' | 'restaurant' | 'csa' | 'farmers-market';
  measurementSystem: 'imperial' | 'metric';
}

export interface PlantingRecommendation {
  cropId: string;
  cropName: string;
  score: number; // 0-100
  reasons: string[];
  warnings: string[];
  benefits: string[];
}

export interface CropToAvoid {
  cropId: string;
  cropName: string;
  reasons: string[];
  riskLevel: 'low' | 'medium' | 'high';
}
