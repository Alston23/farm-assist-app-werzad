
import { Field, Planting, Crop, PlantingRecommendation, CropToAvoid, PestDiseaseRecord } from '@/types/crop';
import { cropDatabase } from '@/data/cropDatabase';

export class PlantingRecommendationEngine {
  /**
   * Generate planting recommendations for a field based on:
   * - Soil pH compatibility
   * - Crop rotation history
   * - Pest and disease history
   * - Nutrient requirements
   */
  static getRecommendations(
    field: Field,
    allPlantings: Planting[],
    availableCrops: Crop[] = cropDatabase
  ): PlantingRecommendation[] {
    const recommendations: PlantingRecommendation[] = [];
    
    // Get field's planting history
    const fieldPlantings = allPlantings
      .filter(p => p.fieldId === field.id)
      .sort((a, b) => new Date(b.plantDate).getTime() - new Date(a.plantDate).getTime());
    
    const recentPlantings = fieldPlantings.slice(0, 5); // Last 5 plantings
    const recentCropIds = recentPlantings.map(p => p.cropId);
    
    // Get pest and disease issues
    const activePestDiseases = field.pestDiseaseHistory.filter(pd => !pd.resolved);
    const historicalPestDiseases = field.pestDiseaseHistory;
    
    for (const crop of availableCrops) {
      const score = this.calculateCropScore(crop, field, recentCropIds, activePestDiseases);
      const reasons: string[] = [];
      const warnings: string[] = [];
      const benefits: string[] = [];
      
      // pH compatibility
      if (field.currentPH >= crop.phMin && field.currentPH <= crop.phMax) {
        reasons.push(`pH ${field.currentPH.toFixed(1)} is ideal for ${crop.name}`);
      } else if (field.currentPH < crop.phMin) {
        warnings.push(`Soil pH ${field.currentPH.toFixed(1)} is too acidic (needs ${crop.phMin}-${crop.phMax})`);
      } else {
        warnings.push(`Soil pH ${field.currentPH.toFixed(1)} is too alkaline (needs ${crop.phMin}-${crop.phMax})`);
      }
      
      // Crop rotation benefits
      if (recentCropIds.length > 0) {
        const lastCropId = recentCropIds[0];
        const lastCrop = availableCrops.find(c => c.id === lastCropId);
        
        if (lastCrop) {
          // Check if this is a good rotation
          if (this.isGoodRotation(lastCrop, crop)) {
            benefits.push(`Excellent rotation after ${lastCrop.name}`);
            reasons.push('Follows crop rotation best practices');
          }
          
          // Check if recently planted
          if (recentCropIds.includes(crop.id)) {
            const lastPlanting = recentPlantings.find(p => p.cropId === crop.id);
            if (lastPlanting) {
              const monthsSince = this.getMonthsSince(lastPlanting.plantDate);
              if (monthsSince < 12) {
                warnings.push(`Recently planted ${monthsSince} months ago - may deplete soil`);
              }
            }
          }
          
          // Nitrogen fixers benefit
          if (lastCrop.category === 'vegetable' && 
              (lastCrop.name.toLowerCase().includes('bean') || 
               lastCrop.name.toLowerCase().includes('pea'))) {
            benefits.push('Benefits from nitrogen fixed by previous legume crop');
          }
        }
      }
      
      // Pest and disease resistance
      const pestWarnings = this.checkPestDiseaseRisk(crop, activePestDiseases, historicalPestDiseases);
      warnings.push(...pestWarnings);
      
      // Resistant alternatives
      if (pestWarnings.length === 0 && activePestDiseases.length > 0) {
        benefits.push('Not susceptible to current field pest/disease issues');
      }
      
      // Soil type compatibility
      if (field.soilType && crop.soilType.some(st => 
        field.soilType.toLowerCase().includes(st.toLowerCase())
      )) {
        reasons.push(`Compatible with ${field.soilType} soil`);
      }
      
      // Cover crop benefits
      if (crop.recommendedCoverCrops.length > 0) {
        benefits.push(`Can be followed by cover crops: ${crop.recommendedCoverCrops.slice(0, 2).join(', ')}`);
      }
      
      recommendations.push({
        cropId: crop.id,
        cropName: crop.name,
        score,
        reasons,
        warnings,
        benefits,
      });
    }
    
    // Sort by score
    return recommendations.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Get crops to avoid in a field based on pest/disease history
   */
  static getCropsToAvoid(
    field: Field,
    allPlantings: Planting[],
    availableCrops: Crop[] = cropDatabase
  ): CropToAvoid[] {
    const cropsToAvoid: CropToAvoid[] = [];
    
    const activePestDiseases = field.pestDiseaseHistory.filter(pd => !pd.resolved);
    const recentPestDiseases = field.pestDiseaseHistory
      .filter(pd => this.getMonthsSince(pd.date) < 24); // Last 2 years
    
    for (const crop of availableCrops) {
      const reasons: string[] = [];
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      
      // Check against active pest/disease issues
      for (const issue of activePestDiseases) {
        if (issue.type === 'pest' && crop.commonPests.some(p => 
          p.toLowerCase().includes(issue.name.toLowerCase()) ||
          issue.name.toLowerCase().includes(p.toLowerCase())
        )) {
          reasons.push(`Susceptible to active pest: ${issue.name}`);
          riskLevel = issue.severity === 'high' ? 'high' : 'medium';
        }
        
        if (issue.type === 'disease' && crop.commonDiseases.some(d => 
          d.toLowerCase().includes(issue.name.toLowerCase()) ||
          issue.name.toLowerCase().includes(d.toLowerCase())
        )) {
          reasons.push(`Susceptible to active disease: ${issue.name}`);
          riskLevel = issue.severity === 'high' ? 'high' : 'medium';
        }
      }
      
      // Check against recent issues
      for (const issue of recentPestDiseases) {
        if (!activePestDiseases.includes(issue)) {
          if (issue.type === 'pest' && crop.commonPests.some(p => 
            p.toLowerCase().includes(issue.name.toLowerCase())
          )) {
            reasons.push(`History of ${issue.name} (${this.getMonthsSince(issue.date)} months ago)`);
            if (riskLevel === 'low') riskLevel = 'medium';
          }
          
          if (issue.type === 'disease' && crop.commonDiseases.some(d => 
            d.toLowerCase().includes(issue.name.toLowerCase())
          )) {
            reasons.push(`History of ${issue.name} (${this.getMonthsSince(issue.date)} months ago)`);
            if (riskLevel === 'low') riskLevel = 'medium';
          }
        }
      }
      
      // Check pH incompatibility
      if (field.currentPH < crop.phMin - 0.5 || field.currentPH > crop.phMax + 0.5) {
        reasons.push(`pH ${field.currentPH.toFixed(1)} is outside acceptable range (${crop.phMin}-${crop.phMax})`);
        if (riskLevel === 'low') riskLevel = 'medium';
      }
      
      if (reasons.length > 0) {
        cropsToAvoid.push({
          cropId: crop.id,
          cropName: crop.name,
          reasons,
          riskLevel,
        });
      }
    }
    
    // Sort by risk level
    return cropsToAvoid.sort((a, b) => {
      const riskOrder = { high: 3, medium: 2, low: 1 };
      return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
    });
  }
  
  /**
   * Get resistant crop alternatives for current pest/disease issues
   */
  static getResistantAlternatives(
    field: Field,
    availableCrops: Crop[] = cropDatabase
  ): PlantingRecommendation[] {
    const activePestDiseases = field.pestDiseaseHistory.filter(pd => !pd.resolved);
    
    if (activePestDiseases.length === 0) {
      return [];
    }
    
    const resistantCrops: PlantingRecommendation[] = [];
    
    for (const crop of availableCrops) {
      let isResistant = true;
      const benefits: string[] = [];
      const reasons: string[] = [];
      
      // Check if crop is resistant to active issues
      for (const issue of activePestDiseases) {
        if (issue.type === 'pest') {
          const isSusceptible = crop.commonPests.some(p => 
            p.toLowerCase().includes(issue.name.toLowerCase()) ||
            issue.name.toLowerCase().includes(p.toLowerCase())
          );
          
          if (isSusceptible) {
            isResistant = false;
            break;
          }
        }
        
        if (issue.type === 'disease') {
          const isSusceptible = crop.commonDiseases.some(d => 
            d.toLowerCase().includes(issue.name.toLowerCase()) ||
            issue.name.toLowerCase().includes(d.toLowerCase())
          );
          
          if (isSusceptible) {
            isResistant = false;
            break;
          }
        }
      }
      
      if (isResistant) {
        for (const issue of activePestDiseases) {
          benefits.push(`Not susceptible to ${issue.name}`);
        }
        
        reasons.push('Resistant to current field issues');
        
        // pH compatibility
        if (field.currentPH >= crop.phMin && field.currentPH <= crop.phMax) {
          reasons.push(`pH compatible (${field.currentPH.toFixed(1)})`);
        }
        
        resistantCrops.push({
          cropId: crop.id,
          cropName: crop.name,
          score: 85 + (benefits.length * 5), // Base score for resistant crops
          reasons,
          warnings: [],
          benefits,
        });
      }
    }
    
    return resistantCrops.sort((a, b) => b.score - a.score);
  }
  
  private static calculateCropScore(
    crop: Crop,
    field: Field,
    recentCropIds: string[],
    activePestDiseases: PestDiseaseRecord[]
  ): number {
    let score = 50; // Base score
    
    // pH compatibility (0-25 points)
    const phDiff = Math.min(
      Math.abs(field.currentPH - crop.phMin),
      Math.abs(field.currentPH - crop.phMax)
    );
    
    if (field.currentPH >= crop.phMin && field.currentPH <= crop.phMax) {
      score += 25; // Perfect pH
    } else if (phDiff <= 0.5) {
      score += 15; // Close enough
    } else if (phDiff <= 1.0) {
      score += 5; // Marginal
    } else {
      score -= 20; // Too far off
    }
    
    // Crop rotation (0-25 points)
    if (!recentCropIds.includes(crop.id)) {
      score += 15; // Not recently planted
    } else {
      score -= 15; // Recently planted
    }
    
    // Pest/disease resistance (0-30 points)
    let susceptibilityPenalty = 0;
    for (const issue of activePestDiseases) {
      if (issue.type === 'pest' && crop.commonPests.some(p => 
        p.toLowerCase().includes(issue.name.toLowerCase())
      )) {
        susceptibilityPenalty += issue.severity === 'high' ? 15 : 10;
      }
      
      if (issue.type === 'disease' && crop.commonDiseases.some(d => 
        d.toLowerCase().includes(issue.name.toLowerCase())
      )) {
        susceptibilityPenalty += issue.severity === 'high' ? 15 : 10;
      }
    }
    
    score -= Math.min(susceptibilityPenalty, 30);
    
    // Bonus for no active issues
    if (activePestDiseases.length > 0 && susceptibilityPenalty === 0) {
      score += 20; // Resistant to current issues
    }
    
    // Soil type compatibility (0-10 points)
    if (field.soilType && crop.soilType.some(st => 
      field.soilType.toLowerCase().includes(st.toLowerCase())
    )) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  private static isGoodRotation(previousCrop: Crop, nextCrop: Crop): boolean {
    // Legumes (nitrogen fixers) are good before heavy feeders
    const isLegume = previousCrop.name.toLowerCase().includes('bean') || 
                     previousCrop.name.toLowerCase().includes('pea');
    const isHeavyFeeder = nextCrop.category === 'vegetable' && 
                          (nextCrop.name.toLowerCase().includes('tomato') ||
                           nextCrop.name.toLowerCase().includes('corn') ||
                           nextCrop.name.toLowerCase().includes('cabbage'));
    
    if (isLegume && isHeavyFeeder) {
      return true;
    }
    
    // Different plant families
    if (previousCrop.category !== nextCrop.category) {
      return true;
    }
    
    // Avoid same crop family in succession
    const brassicas = ['cabbage', 'broccoli', 'cauliflower', 'kale', 'brussels'];
    const nightshades = ['tomato', 'pepper', 'eggplant', 'potato'];
    const cucurbits = ['cucumber', 'squash', 'pumpkin', 'melon'];
    
    const prevName = previousCrop.name.toLowerCase();
    const nextName = nextCrop.name.toLowerCase();
    
    const isSameFamily = 
      (brassicas.some(b => prevName.includes(b)) && brassicas.some(b => nextName.includes(b))) ||
      (nightshades.some(n => prevName.includes(n)) && nightshades.some(n => nextName.includes(n))) ||
      (cucurbits.some(c => prevName.includes(c)) && cucurbits.some(c => nextName.includes(c)));
    
    return !isSameFamily;
  }
  
  private static checkPestDiseaseRisk(
    crop: Crop,
    activePestDiseases: PestDiseaseRecord[],
    historicalPestDiseases: PestDiseaseRecord[]
  ): string[] {
    const warnings: string[] = [];
    
    for (const issue of activePestDiseases) {
      if (issue.type === 'pest' && crop.commonPests.some(p => 
        p.toLowerCase().includes(issue.name.toLowerCase()) ||
        issue.name.toLowerCase().includes(p.toLowerCase())
      )) {
        warnings.push(`⚠️ Susceptible to active pest: ${issue.name} (${issue.severity} severity)`);
      }
      
      if (issue.type === 'disease' && crop.commonDiseases.some(d => 
        d.toLowerCase().includes(issue.name.toLowerCase()) ||
        issue.name.toLowerCase().includes(d.toLowerCase())
      )) {
        warnings.push(`⚠️ Susceptible to active disease: ${issue.name} (${issue.severity} severity)`);
      }
    }
    
    // Check recent history (last 12 months)
    const recentIssues = historicalPestDiseases.filter(pd => 
      this.getMonthsSince(pd.date) < 12 && !activePestDiseases.includes(pd)
    );
    
    for (const issue of recentIssues) {
      if (issue.type === 'pest' && crop.commonPests.some(p => 
        p.toLowerCase().includes(issue.name.toLowerCase())
      )) {
        warnings.push(`Recent history of ${issue.name} (${this.getMonthsSince(issue.date)} months ago)`);
      }
      
      if (issue.type === 'disease' && crop.commonDiseases.some(d => 
        d.toLowerCase().includes(issue.name.toLowerCase())
      )) {
        warnings.push(`Recent history of ${issue.name} (${this.getMonthsSince(issue.date)} months ago)`);
      }
    }
    
    return warnings;
  }
  
  private static getMonthsSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
  }
}
