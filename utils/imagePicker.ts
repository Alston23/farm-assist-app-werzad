
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

// Single image picker for camera
export async function pickImageFromCamera(onImagePicked?: (uri: string) => void): Promise<string | null> {
  console.log('Camera: button pressed');

  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    alert('Camera permission is required to take a photo.');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 0.8,
  });

  if (!result.canceled) {
    const uri = result.assets[0]?.uri;
    console.log('Camera: got image uri', uri);
    onImagePicked?.(uri);
    return uri;
  }
  
  return null;
}

// Single image picker for library
export async function pickImageFromLibrary(onImagePicked?: (uri: string) => void): Promise<string | null> {
  console.log('Library: button pressed');

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Photo library permission is required to select an image.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    quality: 0.8,
  });

  if (!result.canceled) {
    const uri = result.assets[0]?.uri;
    console.log('Library: got image uri', uri);
    onImagePicked?.(uri);
    return uri;
  }
  
  return null;
}

// Legacy function for backward compatibility
export async function pickImage(source: 'camera' | 'library'): Promise<string | null> {
  if (source === 'camera') {
    return pickImageFromCamera();
  } else {
    return pickImageFromLibrary();
  }
}

// Multiple image picker for camera (takes one photo at a time)
export async function pickMultipleImagesFromCamera(): Promise<string[]> {
  console.log('Camera: button pressed (multiple)');

  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    alert('Camera permission is required to take a photo.');
    return [];
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 0.8,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    const uri = result.assets[0].uri;
    console.log('Camera: got image uri', uri);
    return [uri];
  }
  
  return [];
}

// Multiple image picker for library
export async function pickMultipleImagesFromLibrary(): Promise<string[]> {
  console.log('Library: button pressed (multiple)');

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Photo library permission is required to select an image.');
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: false,
    allowsMultipleSelection: true,
    quality: 0.8,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    const uris = result.assets.map(asset => asset.uri);
    console.log('Library: got image uris', uris);
    return uris;
  }
  
  return [];
}

// Legacy function for backward compatibility
export async function pickMultipleImages(source: 'camera' | 'library'): Promise<string[]> {
  if (source === 'camera') {
    return pickMultipleImagesFromCamera();
  } else {
    return pickMultipleImagesFromLibrary();
  }
}

// Helper to upload image to Supabase with logging
export async function uploadImageToSupabase(
  uri: string,
  supabase: any,
  bucket: string = 'farm-images',
  folder: string = 'uploads'
): Promise<string | null> {
  try {
    console.log('Image upload: started with uri', uri);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('Image upload: no user found');
      return null;
    }

    const response = await fetch(uri);
    const blob = await response.blob();
    
    const fileExt = uri.split('.').pop() || 'jpg';
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (error) {
      console.error('Image upload: error', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log('Image upload: finished', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Image upload: exception', error);
    return null;
  }
}
