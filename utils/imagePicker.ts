
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export const pickImageFromSource = async (
  source: 'camera' | 'library',
  onPicked: (uri: string) => void
) => {
  try {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera permission required', 'Enable camera access in Settings.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        onPicked(result.assets[0].uri);
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Photo access required', 'Enable photo library access in Settings.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        onPicked(result.assets[0].uri);
      }
    }
  } catch (e) {
    console.error('Image pick error', e);
    Alert.alert('Error', 'There was a problem accessing the camera or photos.');
  }
};

// Multiple image picker for library (for marketplace listings)
export const pickMultipleImagesFromSource = async (
  source: 'camera' | 'library',
  onPicked: (uris: string[]) => void
) => {
  try {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera permission required', 'Enable camera access in Settings.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        onPicked([result.assets[0].uri]);
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Photo access required', 'Enable photo library access in Settings.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uris = result.assets.map(asset => asset.uri);
        onPicked(uris);
      }
    }
  } catch (e) {
    console.error('Image pick error', e);
    Alert.alert('Error', 'There was a problem accessing the camera or photos.');
  }
};

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
