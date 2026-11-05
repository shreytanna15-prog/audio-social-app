import {
  ArrowRight,
  Headphones,
  Mic,
  Pause,
  Play,
  Square,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

const SIDE = 36;
const SIDE_ICON = 15;
const RECORD = 64;
const RECORD_ICON = 26;
const SIDE_SLOT = 44;
const RECORD_SLOT = 68;
const CLUSTER_GAP = 12;
const GROUP_GAP = 12;

type QuickRecordCaptureTransportProps = {
  isRecording: boolean;
  isOptimizing: boolean;
  isPlaying: boolean;
  hasTake: boolean;
  isCleaning?: boolean;
  isMonitoring?: boolean;
  headsetConnected?: boolean;
  onTogglePlayback: () => void;
  onToggleRecord: () => void;
  onToggleMonitor?: () => void;
  onNext: () => void;
  onStopRecordPressIn?: () => void;
};

export function QuickRecordCaptureTransport({
  isRecording,
  isOptimizing,
  isPlaying,
  hasTake,
  isCleaning = false,
  isMonitoring = false,
  headsetConnected = false,
  onTogglePlayback,
  onToggleRecord,
  onToggleMonitor,
  onNext,
  onStopRecordPressIn,
}: QuickRecordCaptureTransportProps) {
  const busy = isOptimizing || isCleaning;
  const playDisabled = busy || isRecording || !hasTake;
  const recordDisabled = busy;
  const nextDisabled = busy || isRecording || !hasTake;
  const monitorDisabled = busy || !onToggleMonitor || !headsetConnected;

  const PlayIcon: LucideIcon = isPlaying ? Pause : Play;
  const RecordIcon: LucideIcon = isRecording ? Square : Mic;

  return (
    <View className="items-center">
      <View style={styles.row}>
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
            styles.sideSlot,
            { opacity: monitorDisabled ? 0.35 : pressed ? 0.8 : 1 },
          ]}>
          <View style={styles.sideButton}>
            <Headphones
              size={SIDE_ICON}
              color={isMonitoring ? '#A078FF' : '#E4E1EA'}
              strokeWidth={2}
            />
          </View>
        </Pressable>

        <View style={styles.cluster}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            disabled={playDisabled}
            onPress={onTogglePlayback}
            style={({ pressed }) => [
              styles.sideSlot,
              { opacity: playDisabled ? 0.35 : pressed ? 0.8 : 1 },
            ]}>
            <View style={styles.sideButton}>
              <PlayIcon size={SIDE_ICON} color="#E4E1EA" strokeWidth={2} />
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isRecording ? 'Stop' : 'Record'}
            disabled={recordDisabled}
            onPress={onToggleRecord}
            onPressIn={isRecording ? onStopRecordPressIn : undefined}
            style={({ pressed }) => [
              styles.recordSlot,
              { opacity: recordDisabled ? 0.5 : pressed ? 0.92 : 1 },
            ]}>
            <View
              style={[
                styles.recordButton,
                isRecording ? styles.recordButtonActive : null,
              ]}>
              <RecordIcon
                size={RECORD_ICON}
                color={isRecording ? '#FFFFFF' : '#3C0091'}
                strokeWidth={2.3}
              />
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit take"
            disabled={nextDisabled}
            onPress={onNext}
            style={({ pressed }) => [
              styles.sideSlot,
              { opacity: nextDisabled ? 0.35 : pressed ? 0.8 : 1 },
            ]}>
            <View style={styles.sideButton}>
              <ArrowRight size={SIDE_ICON} color="#E4E1EA" strokeWidth={2} />
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: GROUP_GAP,
  },
  cluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CLUSTER_GAP,
  },
  sideSlot: {
    width: SIDE_SLOT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordSlot: {
    width: RECORD_SLOT,
    alignItems: 'center',
    justifyContent: 'center',
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
