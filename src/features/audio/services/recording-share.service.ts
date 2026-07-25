import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

type ShareRecordingOptions = {
  uri: string;
  dialogTitle: string;
};

function mimeAndUtiForUri(uri: string): { mimeType: string; UTI: string } {
  const lower = uri.toLowerCase();

  if (lower.endsWith('.m4a') || lower.endsWith('.mp4') || lower.endsWith('.aac')) {
    return { mimeType: 'audio/mp4', UTI: 'public.mpeg-4-audio' };
  }

  if (lower.endsWith('.wav')) {
    return { mimeType: 'audio/wav', UTI: 'com.microsoft.waveform-audio' };
  }

  return { mimeType: 'audio/mpeg', UTI: 'public.mp3' };
}

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

    const { mimeType, UTI } = mimeAndUtiForUri(uri);

    await Sharing.shareAsync(uri, {
      mimeType,
      UTI,
      dialogTitle,
    });
  } catch (error) {
    console.log('Error sharing recording:', error);
    Alert.alert('Could not share', 'Something went wrong while sharing this recording.');
  }
}

/** Opens the system save/share sheet for the audio currently being played. */
export async function downloadRecording({
  uri,
  dialogTitle = 'Download recording',
}: ShareRecordingOptions): Promise<void> {
  try {
    const canShare = await Sharing.isAvailableAsync();

    if (!canShare) {
      Alert.alert(
        'Download unavailable',
        'Saving files is not available on this device.',
      );
      return;
    }

    const { mimeType, UTI } = mimeAndUtiForUri(uri);

    await Sharing.shareAsync(uri, {
      mimeType,
      UTI,
      dialogTitle,
    });
  } catch (error) {
    console.log('Error downloading recording:', error);
    Alert.alert('Could not download', 'Something went wrong while saving this recording.');
  }
}
