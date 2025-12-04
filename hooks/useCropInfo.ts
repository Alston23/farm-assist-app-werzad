
import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export type CropInfo = {
  name: string;
  category: 'vegetable' | 'fruit' | 'flower' | 'herb';
  scientificName: string;
  sunlight: string;
  water: string;
  soilType: string;
  soilPH: string;
  plantSpacing: string;
  rowSpacing: string;
  daysToMaturity: string;
  plantingDepth: string;
  temperature: string;
  hardiness: string;
  companions: string;
  avoid: string;
  pests: string;
  diseases: string;
  harvest: string;
  storage: string;
  notes: string;
};

type State =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: CropInfo; error: null }
  | { status: 'error'; data: null; error: string };

export function useCropInfo() {
  const [state, setState] = useState<State>({ status: 'idle', data: null, error: null });

  const reset = useCallback(() => {
    setState({ status: 'idle', data: null, error: null });
  }, []);

  const generateCropInfo = useCallback(async (cropName: string): Promise<CropInfo | null> => {
    const name = cropName.trim();
    if (name.length < 2) {
      setState({ status: 'error', data: null, error: 'Crop name must be at least 2 characters.' });
      return null;
    }

    setState({ status: 'loading', data: null, error: null });
    
    try {
      console.log('Calling generate-crop-info function for:', name);
      
      const { data, error } = await supabase.functions.invoke('generate-crop-info', {
        body: { cropName: name },
      });

      if (error) {
        console.error('Function error:', error);
        throw new Error(error.message || 'Failed to generate crop information');
      }

      if (!data) {
        throw new Error('No data returned from function');
      }

      console.log('Successfully generated crop info:', data);
      setState({ status: 'success', data: data as CropInfo, error: null });
      return data as CropInfo;
    } catch (e: any) {
      console.error('Error generating crop info:', e);
      const errorMessage = e?.message ?? 'Unknown error occurred';
      setState({ status: 'error', data: null, error: errorMessage });
      return null;
    }
  }, []);

  const saveCrop = useCallback(async (cropInfo: CropInfo): Promise<boolean> => {
    try {
      console.log('Saving crop to database:', cropInfo.name);
      
      const { error } = await supabase.from('crops').insert({
        name: cropInfo.name,
        category: cropInfo.category,
        scientific_name: cropInfo.scientificName,
        sunlight: cropInfo.sunlight,
        water: cropInfo.water,
        soil_type: cropInfo.soilType,
        soil_ph: cropInfo.soilPH,
        plant_spacing: cropInfo.plantSpacing,
        row_spacing: cropInfo.rowSpacing,
        days_to_maturity: cropInfo.daysToMaturity,
        planting_depth: cropInfo.plantingDepth,
        temperature: cropInfo.temperature,
        hardiness: cropInfo.hardiness,
        companions: cropInfo.companions,
        avoid: cropInfo.avoid,
        pests: cropInfo.pests,
        diseases: cropInfo.diseases,
        harvest: cropInfo.harvest,
        storage: cropInfo.storage,
        notes: cropInfo.notes,
      });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Crop saved successfully');
      return true;
    } catch (e: any) {
      console.error('Error saving crop:', e);
      return false;
    }
  }, []);

  const loading = state.status === 'loading';
  const error = state.status === 'error' ? state.error : null;
  const data = state.status === 'success' ? state.data : null;

  return { generateCropInfo, saveCrop, loading, error, data, reset };
}
