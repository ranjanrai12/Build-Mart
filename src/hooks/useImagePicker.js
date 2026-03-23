import { useState } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

/**
 * useImagePicker Hook
 * 
 * Centralizes ImagePicker logic:
 * - Handles permissions (Camera Roll)
 * - Standard configurations (aspect ratio, quality, editing)
 */
export default function useImagePicker() {
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ 
          type: 'error', 
          text1: 'Permission Required', 
          text2: 'We need access to your photos to upload media. Please enable it in settings.' 
        });
        return false;
      }
    }
    return true;
  };

  const pickImage = async (options = {}) => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return null;

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: options.aspect || [4, 3],
        quality: options.quality || 0.8,
        ...options,
      });

      if (!result.canceled) {
        return result.assets[0].uri;
      }
    } catch (error) {
      console.error('ImagePicker Error:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to pick image. Please try again.' });
    } finally {
      setLoading(false);
    }
    return null;
  };

  return { pickImage, loading };
}
