
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export async function pickImage(source: 'camera' | 'library'): Promise<string | null> {
  try {
    let result;
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera permission is required');
        return null;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Photo access is required');
        return null;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
      });
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('Image picker error:', error);
    Alert.alert('Unable to access camera or photos');
    return null;
  }
}

export async function pickMultipleImages(source: 'camera' | 'library'): Promise<string[]> {
  try {
    let result;
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera permission is required');
        return [];
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Photo access is required');
        return [];
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: false,
        allowsMultipleSelection: true,
      });
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets.map(asset => asset.uri);
    }
    return [];
  } catch (error) {
    console.error('Image picker error:', error);
    Alert.alert('Unable to access camera or photos');
    return [];
  }
}
