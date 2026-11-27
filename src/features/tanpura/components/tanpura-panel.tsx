import Slider from '@react-native-community/slider';
import { Image } from 'expo-image';
import { Minus, Pause, Play, Plus } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/shared/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet';
import { Text } from '@/shared/components/ui/text';

import {
  TANPURA_FINE_SEMIS_MAX,
  TANPURA_FINE_SEMIS_MIN,
  TANPURA_PITCH_IDS,
  TANPURA_SPEED_MAX,
  TANPURA_SPEED_MIN,
} from '../constants';
import { labelForPitch } from '../data/pitches';
import { TANPURA_PRESETS } from '../data/presets';
import type { TanpuraController } from '../hooks/use-tanpura-controller';
import type { TanpuraLabelMode } from '../types';

const TANPURA_BG = require('../assets/tanpura-bg.png');

type TanpuraPanelProps = {
  controller: TanpuraController;
};

const LABEL_MODES: { id: TanpuraLabelMode; label: string }[] = [
  { id: 'western', label: 'Western' },
  { id: 'indian', label: 'Indian' },
];

function formatFineSemis(value: number): string {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

export function TanpuraPanel({ controller }: TanpuraPanelProps) {
  const {
    panelOpen,
    setPanelOpen,
    isPlaying,
    isRecording,
    pitchId,
    presetId,
    volume,
    speed,
    fineSemis,
    labelMode,
    setPitchId,
    setPresetId,
    setVolume,
    setSpeed,
    nudgeFineSemis,
    setLabelMode,
    toggle,
  } = controller;

  const playDisabled = isRecording;
  const canNudgeDown = fineSemis > TANPURA_FINE_SEMIS_MIN;
  const canNudgeUp = fineSemis < TANPURA_FINE_SEMIS_MAX;

  return (
    <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
      <SheetContent useModal className="overflow-hidden bg-[#17171D]">
        <View pointerEvents="none" style={styles.bgLayer}>
          <View style={styles.glowTopLeft} />
          <View style={styles.glowTopRight} />
          <View style={styles.glowBottom} />
          <View style={styles.glowPlay} />
          <Image
            source={TANPURA_BG}
            style={styles.bgImage}
            contentFit="contain"
          />
        </View>

        <SheetClose accessibilityLabel="Close tanpura" />
        <SheetHeader>
          <SheetTitle>Tanpura</SheetTitle>
        </SheetHeader>

        <SheetBody>
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerClassName="gap-5 pb-2">
            <View className="gap-2">
              <Text variant="label-md" className="text-on-surface-variant">
                Pitch labels
              </Text>
              <View
                className="flex-row p-1"
                style={{
                  borderRadius: 9999,
                  borderCurve: 'continuous',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                }}>
                {LABEL_MODES.map((mode) => {
                  const selected = mode.id === labelMode;
                  return (
                    <Pressable
                      key={mode.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setLabelMode(mode.id)}
                      className="h-9 flex-1 items-center justify-center rounded-full px-3"
                      style={{
                        backgroundColor: selected ? '#D0BCFF' : 'transparent',
                        borderCurve: 'continuous',
                      }}>
                      <Text
                        variant="label-md"
                        style={{
                          color: selected ? '#3C0091' : '#E4E1EA',
                          fontWeight: selected ? '600' : '500',
                        }}>
                        {mode.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="gap-2">
              <Text variant="label-md" className="text-on-surface-variant">
                Pitch (Sa)
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {TANPURA_PITCH_IDS.map((id) => {
                  const selected = id === pitchId;
                  return (
                    <Pressable
                      key={id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setPitchId(id)}
                      className="will-change-pressable active:opacity-90">
                      <View
                        className={`min-w-12 items-center rounded-full px-3 py-2 ${
                          selected
                            ? 'bg-primary-tonal'
                            : 'bg-surface-container'
                        }`}>
                        <Text
                          variant="label-md"
                          className={
                            selected ? 'text-on-primary' : 'text-on-surface'
                          }>
                          {labelForPitch(id, labelMode)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="gap-2">
              <Text variant="label-md" className="text-on-surface-variant">
                Semi
              </Text>
              <View className="flex-row items-center justify-between rounded-2xl border border-white/5 bg-surface-container px-2 py-1.5">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Lower semi"
                  disabled={!canNudgeDown}
                  onPress={() => nudgeFineSemis(-1)}
                  className="will-change-pressable active:opacity-90"
                  style={{ opacity: canNudgeDown ? 1 : 0.35 }}>
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container-high">
                    <Minus size={18} color="#E4E1EA" strokeWidth={2.2} />
                  </View>
                </Pressable>
                <Text
                  variant="title-md"
                  className="min-w-12 text-center text-on-surface">
                  {formatFineSemis(fineSemis)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Raise semi"
                  disabled={!canNudgeUp}
                  onPress={() => nudgeFineSemis(1)}
                  className="will-change-pressable active:opacity-90"
                  style={{ opacity: canNudgeUp ? 1 : 0.35 }}>
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container-high">
                    <Plus size={18} color="#E4E1EA" strokeWidth={2.2} />
                  </View>
                </Pressable>
              </View>
            </View>

            <View className="gap-2">
              <Text variant="label-md" className="text-on-surface-variant">
                Preset
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {TANPURA_PRESETS.map((preset) => {
                  const selected = preset.id === presetId;
                  return (
                    <Pressable
                      key={preset.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setPresetId(preset.id)}
                      className="will-change-pressable active:opacity-90">
                      <View
                        className={`rounded-full border px-3.5 py-2 ${
                          selected
                            ? 'border-primary-tonal bg-surface-container-high'
                            : 'border-white/5 bg-surface-container'
                        }`}
                        style={{ borderCurve: 'continuous' }}>
                        <Text
                          variant="label-md"
                          className={
                            selected
                              ? 'text-on-surface'
                              : 'text-on-surface-variant'
                          }>
                          {preset.label}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text variant="label-md" className="text-on-surface-variant">
                  Speed
                </Text>
                <Text variant="label-md" className="text-on-surface-variant">
                  {speed.toFixed(2)}x
                </Text>
              </View>
              <Slider
                style={{ width: '100%', height: 36 }}
                minimumValue={TANPURA_SPEED_MIN}
                maximumValue={TANPURA_SPEED_MAX}
                value={speed}
                minimumTrackTintColor="#D0BCFF"
                maximumTrackTintColor="#34343B"
                thumbTintColor="#FFFFFF"
                onValueChange={setSpeed}
              />
            </View>

            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text variant="label-md" className="text-on-surface-variant">
                  Volume
                </Text>
                <Text variant="label-md" className="text-on-surface-variant">
                  {Math.round(volume * 100)}%
                </Text>
              </View>
              <Slider
                style={{ width: '100%', height: 36 }}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                minimumTrackTintColor="#D0BCFF"
                maximumTrackTintColor="#34343B"
                thumbTintColor="#FFFFFF"
                onValueChange={setVolume}
              />
            </View>

            <Button
              variant="tonal"
              size="lg"
              disabled={playDisabled}
              onPress={toggle}
              className="h-14 w-full rounded-md">
              <View className="flex-row items-center gap-2">
                {isPlaying ? (
                  <Pause
                    size={20}
                    color="#3C0091"
                    strokeWidth={0}
                    fill="#3C0091"
                  />
                ) : (
                  <Play
                    size={20}
                    color="#3C0091"
                    strokeWidth={0}
                    fill="#3C0091"
                    style={{ marginLeft: 2 }}
                  />
                )}
                <Text>
                  {playDisabled
                    ? 'Unavailable while recording'
                    : isPlaying
                      ? 'Stop'
                      : 'Play'}
                </Text>
              </View>
            </Button>
          </ScrollView>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  bgLayer: {
    ...StyleSheet.absoluteFill,
  },
  bgImage: {
    ...StyleSheet.absoluteFill,
    opacity: 0.28,
  },
  // Soft wood washes — uneven sizes/placement so it doesn’t feel mirrored.
  glowTopLeft: {
    position: 'absolute',
    top: -120,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 999,
    opacity: 0.85,
    experimental_backgroundImage:
      'radial-gradient(circle, rgba(74,52,40,0.72) 0%, rgba(58,42,34,0.34) 40%, rgba(58,42,34,0) 74%)',
  },
  glowTopRight: {
    position: 'absolute',
    top: 20,
    right: -70,
    width: 210,
    height: 210,
    borderRadius: 999,
    opacity: 0.7,
    experimental_backgroundImage:
      'radial-gradient(circle, rgba(90,64,48,0.58) 0%, rgba(74,52,40,0.24) 46%, rgba(74,52,40,0) 76%)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -140,
    left: '10%',
    width: 380,
    height: 280,
    borderRadius: 999,
    opacity: 0.8,
    experimental_backgroundImage:
      'radial-gradient(ellipse at center, rgba(58,42,34,0.68) 0%, rgba(74,52,40,0.28) 44%, rgba(58,42,34,0) 78%)',
  },
  glowPlay: {
    position: 'absolute',
    bottom: 24,
    right: -30,
    width: 260,
    height: 160,
    borderRadius: 999,
    opacity: 0.75,
    experimental_backgroundImage:
      'radial-gradient(ellipse at center, rgba(90,64,48,0.62) 0%, rgba(74,52,40,0.26) 48%, rgba(58,42,34,0) 76%)',
  },
});
