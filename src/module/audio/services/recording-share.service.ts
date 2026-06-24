import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

type ShareRecordingOptions = {
  uri: string;
  dialogTitle: string;
};

export async function shareRecording({
  uri,
  dialogTitle,
}: ShareRecordingOptions): Promise<void> {
  try {
    const canShare = await Sharing.isAvailableAsync();

    if (!canShare) {
      Alert.alert('Sharing unavailable', 'Sharing is not available on this device.');
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'audio/mp4',
      UTI: 'public.m4a-audio',
      dialogTitle,
    });
  } catch (error) {
    console.log('Error sharing recording:', error);
  }
}
