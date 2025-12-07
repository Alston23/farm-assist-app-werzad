
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
 */
export const openImagePicker = async (
  onPicked: (uris: string[]) => void,
  allowMultiple: boolean = true
): Promise<void> => {
  console.log('Image picker: open');

  const handleSelection = async (choice: 'camera' | 'library' | 'cancel') => {
    if (choice === 'cancel') {
      console.log('Image picker: user cancelled');
      return;
    }

    try {
      if (choice === 'camera') {
        console.log('Image picker: camera selected');
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          console.log('Image picker: camera permission denied');
          Alert.alert('Camera permission required', 'Enable camera access in Settings.');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });

        if (result.canceled) {
          console.log('Image picker: camera cancelled');
          return;
        }

        const asset = result.assets?.[0];
        if (!asset) {
          console.log('Image picker: no asset returned from camera');
          return;
        }

        console.log('Image picker: camera image selected', asset.uri);
        onPicked([asset.uri]);
      } else {
        console.log('Image picker: library selected');
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          console.log('Image picker: library permission denied');
          Alert.alert('Photo access required', 'Enable photo library access in Settings.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: !allowMultiple,
          allowsMultipleSelection: allowMultiple,
          quality: 0.8,
        });

        if (result.canceled) {
          console.log('Image picker: library cancelled');
          return;
        }

        if (result.assets && result.assets.length > 0) {
          const uris = result.assets.map(asset => asset.uri);
          console.log('Image picker: library images selected', uris);
          onPicked(uris);
        } else {
          console.log('Image picker: no assets returned from library');
        }
      }
    } catch (error) {
      console.error('Image picker error', error);
      Alert.alert('Error', 'There was a problem accessing the camera or photos.');
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
