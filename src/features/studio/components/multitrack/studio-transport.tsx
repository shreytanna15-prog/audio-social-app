import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { recordingSessionService } from '@/features/audio/services/recording-session.service';

type StudioTransportProps = {
  isRecording: boolean;
  isPlaying: boolean;
  disabled?: boolean;
  canAdd?: boolean;
  onAddLayer: () => void;
  onAddBeat: () => void;
  onRecord: () => void;
  onStop: () => void;
  onRecordFromStart: () => void;
  onTogglePlay: () => void;
};

export function StudioTransport({
  isRecording,
  isPlaying,
  disabled = false,
  canAdd = false,
  onAddLayer,
  onAddBeat,
  onRecord,
  onStop,
  onRecordFromStart,
  onTogglePlay,
}: StudioTransportProps) {
  const fromStartDisabled = disabled || isRecording;
  const playDisabled = disabled || isRecording;
  const addDisabled = !canAdd;

  return (
    <View style={styles.dock}>
      <View style={styles.row}>
        <Pressable
          disabled={playDisabled}
          onPress={onTogglePlay}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          style={({ pressed }) => [
            styles.play,
            playDisabled && styles.disabled,
            pressed && !playDisabled && styles.pressed,
          ]}>
          <SymbolView
            name={{
              ios: isPlaying ? 'pause.fill' : 'play.fill',
              android: isPlaying ? 'pause' : 'play_arrow',
              web: isPlaying ? 'pause' : 'play_arrow',
            }}
            size={24}
            tintColor="#1A1D21"
          />
        </Pressable>

        <Pressable
          disabled={isRecording ? false : disabled}
          accessibilityRole="button"
          accessibilityLabel={isRecording ? 'Stop' : 'Rec'}
          onPressIn={
            isRecording
              ? () => {
                  recordingSessionService.requestStop();
                  onStop();
                }
              : undefined
          }
          onPress={isRecording ? undefined : onRecord}
          style={({ pressed }) => [
            styles.rec,
            isRecording && styles.recLive,
            disabled && !isRecording && styles.disabled,
            pressed && styles.pressed,
          ]}>
          <SymbolView
            name={{
              ios: isRecording ? 'stop.fill' : 'mic.fill',
              android: isRecording ? 'stop' : 'mic',
              web: isRecording ? 'stop' : 'mic',
            }}
            size={32}
            tintColor="#FFFFFF"
          />
        </Pressable>

        <View style={styles.rowBalance} />
      </View>

      <View style={styles.addRow}>
        <Pressable
          disabled={addDisabled}
          onPress={onAddLayer}
          accessibilityRole="button"
          accessibilityLabel="Add layer"
          style={({ pressed }) => [
            styles.add,
            addDisabled && styles.disabled,
            pressed && !addDisabled && styles.pressed,
          ]}>
          <Text style={styles.addLabel}>+ Layer</Text>
        </Pressable>
        <Pressable
          disabled={addDisabled}
          onPress={onAddBeat}
          accessibilityRole="button"
          accessibilityLabel="Add beat"
          style={({ pressed }) => [
            styles.add,
            addDisabled && styles.disabled,
            pressed && !addDisabled && styles.pressed,
          ]}>
          <Text style={styles.addLabel}>+ Beat</Text>
        </Pressable>
      </View>

      <Pressable
        disabled={fromStartDisabled}
        onPress={() => {
          Alert.alert(
            'Start over',
            'This throws away this layer and records from the beginning. To fix only a part, move the red line and tap Rec.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Start over',
                style: 'destructive',
                onPress: onRecordFromStart,
              },
            ],
          );
        }}
        accessibilityRole="button"
        accessibilityLabel="Start over"
        style={({ pressed }) => [
          styles.fromStart,
          fromStartDisabled && styles.disabled,
          pressed && !fromStartDisabled && styles.pressed,
        ]}>
        <Text style={styles.fromStartLabel}>Start over</Text>
      </Pressable>

      {isRecording ? (
        <Text style={styles.hint}>Recording — headphones recommended</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D5DAE0',
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    paddingVertical: 4,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
  },
  add: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#EEF3F8',
  },
  addLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A73E8',
  },
  fromStart: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  fromStartLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5F6368',
  },
  play: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF3F8',
  },
  rec: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C62828',
  },
  recLive: {
    backgroundColor: '#E53935',
  },
  rowBalance: {
    width: 56,
    height: 56,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.82,
  },
  hint: {
    textAlign: 'center',
    fontSize: 11,
    color: '#7A7F87',
  },
});
