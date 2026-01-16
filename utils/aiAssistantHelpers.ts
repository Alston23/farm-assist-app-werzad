
import { supabase } from '../lib/supabase';

export const uploadImageToSupabase = async (imageUri: string): Promise<string | null> => {
  try {
    console.log('[AI Assistant] Image upload started:', imageUri);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    const fileExt = imageUri.split('.').pop() || 'jpg';
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `ai-assistant-images/${fileName}`;

    const { data, error } = await supabase.storage
      .from('farm-images')
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (error) {
      console.error('[AI Assistant] Image upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('farm-images')
      .getPublicUrl(filePath);

    console.log('[AI Assistant] Image upload finished:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('[AI Assistant] Image upload exception:', error);
    return null;
  }
};

export const getUserContext = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const [cropsResult, fieldsResult, plantingsResult] = await Promise.all([
      supabase.from('crops').select('name, category').eq('user_id', user.id).limit(10),
      supabase.from('fields_beds').select('name, type, area_value, area_unit, soil_type, irrigation_type').eq('user_id', user.id).limit(10),
      supabase.from('plantings').select('crop_name, planting_date, harvest_date').eq('user_id', user.id).order('planting_date', { ascending: false }).limit(10),
    ]);

    return {
      crops: cropsResult.data || [],
      fields: fieldsResult.data || [],
      plantings: plantingsResult.data || [],
    };
  } catch (error) {
    console.error('[AI Assistant] Error getting user context:', error);
    return null;
  }
};

export const isAdvancedQuery = (text: string): boolean => {
  const advancedKeywords = [
    'recommend crop',
    'crop recommendation',
    'yield optimization',
    'optimize yield',
    'planting plan',
    'fertilizer plan',
    'revenue',
    'profit',
    'market price',
    'sales forecast',
    'personalized',
    'my farm data',
    'my fields',
    'my crops',
    'rotation plan',
  ];

  const lowerText = text.toLowerCase();
  return advancedKeywords.some(keyword => lowerText.includes(keyword));
};
