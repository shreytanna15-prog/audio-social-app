import {
  Headphones,
  Mic,
  Pause,
  Play,
  Save,
  Square,
  Upload,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

const SIDE = 40;
const RECORD = 64;
const SLOT = 56;
const RECORD_SLOT = 68;

type QuickRecordTransportProps = {
  isRecording: boolean;
  isOptimizing: boolean;
  isSaving: boolean;
  isPlaying: boolean;
  hasTake: boolean;
  isMonitoring?: boolean;
  headsetConnected?: boolean;
  onSave: () => void;
  onTogglePlayback: () => void;
  onToggleRecord: () => void;
  onToggleMonitor?: () => void;
  onStopRecordPressIn?: () => void;
};

export function QuickRecordTransport({
  isRecording,
  isOptimizing,
  isSaving,
  isPlaying,
  hasTake,
  isMonitoring = false,
  headsetConnected = false,
  onSave,
  onTogglePlayback,
  onToggleRecord,
  onToggleMonitor,
  onStopRecordPressIn,
}: QuickRecordTransportProps) {
  const busy = isOptimizing || isSaving;
  const saveDisabled = busy || isRecording || !hasTake;
  const playDisabled = busy || isRecording || !hasTake;
  const recordDisabled = busy;
  const monitorDisabled = busy || !onToggleMonitor || !headsetConnected;

  const PlayIcon: LucideIcon = isPlaying ? Pause : Play;
  const RecordIcon: LucideIcon = isRecording ? Square : Mic;

  return (
    <View className="items-center">
      <View className="flex-row items-center justify-center gap-4">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            disabled: monitorDisabled,
            checked: isMonitoring,
          }}
          accessibilityLabel={
            !headsetConnected
              ? 'Headphone monitoring unavailable. Connect earphones.'
              : isMonitoring
                ? 'Disable headphone monitoring'
                : 'Enable headphone monitoring'
          }
          disabled={monitorDisabled}
          onPress={onToggleMonitor}
          style={({ pressed }) => [
            styles.slot,
            { opacity: monitorDisabled ? 0.35 : pressed ? 0.8 : 1 },
          ]}>
          <View style={styles.sideButton}>
            <Headphones
              size={17}
              color={isMonitoring ? '#A078FF' : '#E4E1EA'}
              strokeWidth={2}
            />
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save"
          disabled={saveDisabled}
          onPress={onSave}
          style={({ pressed }) => [
            styles.slot,
            { opacity: saveDisabled ? 0.35 : pressed ? 0.8 : 1 },
          ]}>
          <View style={styles.sideButton}>
            <Save size={17} color="#E4E1EA" strokeWidth={2} />
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          disabled={playDisabled}
          onPress={onTogglePlayback}
          style={({ pressed }) => [
            styles.slot,
            { opacity: playDisabled ? 0.35 : pressed ? 0.8 : 1 },
          ]}>
          <View style={styles.sideButton}>
            <PlayIcon size={17} color="#E4E1EA" strokeWidth={2} />
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isRecording ? 'Stop' : 'Record'}
          disabled={recordDisabled}
          onPress={onToggleRecord}
          onPressIn={isRecording ? onStopRecordPressIn : undefined}
          style={({ pressed }) => [
            styles.slot,
            styles.recordSlot,
            { opacity: recordDisabled ? 0.5 : pressed ? 0.92 : 1 },
          ]}>
          <View
            style={[
              styles.recordButton,
              isRecording ? styles.recordButtonActive : null,
            ]}>
            <RecordIcon
              size={26}
              color={isRecording ? '#FFFFFF' : '#3C0091'}
              strokeWidth={2.3}
            />
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Publish"
          disabled
          style={[styles.slot, { opacity: 0.35 }]}>
          <View style={styles.sideButton}>
            <Upload size={17} color="#E4E1EA" strokeWidth={2} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: SLOT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordSlot: {
    width: RECORD_SLOT,
  },
  sideButton: {
    width: SIDE,
    height: SIDE,
    borderRadius: SIDE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.25,
    borderColor: 'rgba(228, 225, 234, 0.5)',
    backgroundColor: 'transparent',
  },
  recordButton: {
    width: RECORD,
    height: RECORD,
    borderRadius: RECORD / 2,
    alignItems: 'center',
    justifyContent: 'center',
    experimental_backgroundImage:
      'linear-gradient(to right, #A078FF 0%, #D0BCFF 50%, #D0BCFF 100%)',
    boxShadow: '0 8px 20px rgba(160, 120, 255, 0.38)',
  },
  recordButtonActive: {
    experimental_backgroundImage:
      'linear-gradient(to right, #C62828 0%, #E53935 50%, #EF5350 100%)',
    boxShadow: '0 8px 20px rgba(229, 57, 53, 0.38)',
  },
});
