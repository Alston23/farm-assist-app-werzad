
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform, ActionSheetIOS } from 'react-native';

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

/**
 * Opens a system sheet that allows the user to choose between taking a photo or selecting from library.
 * This is the unified image picker used across Marketplace and AI Assistant.
 * Works reliably on physical devices without requiring dev server bridge.
 * 
 * @param onPicked - Callback function that receives an array of selected image URIs
 * @param allowMultiple - Whether to allow multiple image selection (default: true)
 */
export const openImagePicker = async (
  onPicked: (uris: string[]) => void,
  allowMultiple: boolean = true
): Promise<void> => {
  console.log('[ImagePicker] Opening picker, allowMultiple:', allowMultiple);

  const handleSelection = async (choice: 'camera' | 'library' | 'cancel') => {
    if (choice === 'cancel') {
      console.log('[ImagePicker] User cancelled selection');
      return;
    }

    try {
      if (choice === 'camera') {
        console.log('[ImagePicker] Requesting camera permissions');
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        
        if (status !== 'granted') {
          console.log('[ImagePicker] Camera permission denied');
          Alert.alert(
            'Camera Permission Required',
            'Please enable camera access in Settings to take photos.',
            [{ text: 'OK' }]
          );
          return;
        }

        console.log('[ImagePicker] Launching camera');
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
          exif: false,
        });

        console.log('[ImagePicker] Camera result:', { 
          canceled: result.canceled, 
          hasAssets: !!result.assets,
          assetCount: result.assets?.length || 0 
        });

        if (result.canceled) {
          console.log('[ImagePicker] Camera cancelled by user');
          return;
        }

        const asset = result.assets?.[0];
        if (!asset?.uri) {
          console.log('[ImagePicker] No asset URI returned from camera');
          return;
        }

        console.log('[ImagePicker] Camera image captured:', asset.uri);
        // Use setImmediate to ensure callback executes after native bridge completes
        setImmediate(() => {
          onPicked([asset.uri]);
        });
        
      } else {
        console.log('[ImagePicker] Requesting media library permissions');
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
          console.log('[ImagePicker] Media library permission denied');
          Alert.alert(
            'Photo Access Required',
            'Please enable photo library access in Settings to select photos.',
            [{ text: 'OK' }]
          );
          return;
        }

        console.log('[ImagePicker] Launching image library');
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: !allowMultiple,
          allowsMultipleSelection: allowMultiple,
          quality: 0.8,
          exif: false,
        });

        console.log('[ImagePicker] Library result:', { 
          canceled: result.canceled, 
          hasAssets: !!result.assets,
          assetCount: result.assets?.length || 0 
        });

        if (result.canceled) {
          console.log('[ImagePicker] Library selection cancelled by user');
          return;
        }

        if (result.assets && result.assets.length > 0) {
          const uris = result.assets.map(asset => asset.uri);
          console.log('[ImagePicker] Library images selected:', uris.length, 'images');
          // Use setImmediate to ensure callback executes after native bridge completes
          setImmediate(() => {
            onPicked(uris);
          });
        } else {
          console.log('[ImagePicker] No assets returned from library');
        }
      }
    } catch (error) {
      console.error('[ImagePicker] Error during image selection:', error);
      Alert.alert(
        'Error',
        'There was a problem accessing the camera or photos. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Show platform-specific picker
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Take Photo', 'Choose from Library', 'Cancel'],
        cancelButtonIndex: 2,
      },
      (buttonIndex) => {
        console.log('[ImagePicker] iOS ActionSheet button pressed:', buttonIndex);
        if (buttonIndex === 0) {
          handleSelection('camera');
        } else if (buttonIndex === 1) {
          handleSelection('library');
        } else {
          handleSelection('cancel');
        }
      }
    );
  } else {
    Alert.alert(
      'Choose an option',
      'Select how you want to add a photo',
      [
        {
          text: 'Take Photo',
          onPress: () => handleSelection('camera'),
        },
        {
          text: 'Choose from Library',
          onPress: () => handleSelection('library'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => handleSelection('cancel'),
        },
      ]
    );
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
    console.log('[ImageUpload] Starting upload for URI:', uri);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[ImageUpload] No authenticated user found');
      return null;
    }

    console.log('[ImageUpload] Fetching image blob');
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    console.log('[ImageUpload] Uploading to Supabase:', filePath);
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (error) {
      console.error('[ImageUpload] Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log('[ImageUpload] Upload successful:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('[ImageUpload] Exception during upload:', error);
    return null;
  }
}
