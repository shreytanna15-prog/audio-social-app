import { ArrowLeft, AudioLines, Layers } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createLayer,
  createImportLayerProject,
} from '@/features/audio/domain/project';
import { PROJECT_VERSION } from '@/features/audio/types/project';
import { StudioColors } from '@/core/theme/tokens';
import { QuickRecordProcessingOverlay } from '@/features/studio/components/quick-record-processing-overlay';
import {
  pickBeatFile,
  prepareImportedDeviceAudio,
} from '@/features/studio/services/import-device-audio.service';
import { useMultitrackEntryStore } from '@/features/studio/store/multitrack-entry.store';
import { useQuickRecordStore } from '@/features/studio/store/quick-record.store';
import { CreateOptionRow } from '@/shared/components/create/create-option-row';
import { Text } from '@/shared/components/ui/text';

/**
 * Create → Import Audio chooser. Single → QR edit; Multi → Multitrack with layer 1.
 */
export function ImportAudioScreen() {
  const insets = useSafeAreaInsets();
  const { back, replace } = useRouter();
  const hydrateFromImport = useQuickRecordStore((s) => s.hydrateFromImport);
  const setPendingProject = useMultitrackEntryStore((s) => s.setPendingProject);
  const [importing, setImporting] = useState(false);

  const runImport = async (mode: 'single' | 'multi') => {
    if (importing) {
      return;
    }

    try {
      const picked = await pickBeatFile();
      if (!picked) {
        return;
      }

      setImporting(true);
      const imported = await prepareImportedDeviceAudio(picked);

      if (mode === 'single') {
        const layer = createLayer({
          kind: 'vocal',
          name: imported.displayName,
          stemUri: imported.uri,
          baselineUri: imported.uri,
          sourceUri: imported.uri,
          durationSeconds: imported.durationSeconds,
          peaks: imported.peaks,
        });
        hydrateFromImport({
          version: PROJECT_VERSION,
          layers: [layer],
          selectedLayerId: layer.id,
        });
        replace('/studio/quick-record/edit');
        return;
      }

      setPendingProject(
        createImportLayerProject({
          stemUri: imported.uri,
          sourceUri: imported.uri,
          durationSeconds: imported.durationSeconds,
          peaks: imported.peaks,
          name: imported.displayName,
        }),
      );
      replace('/studio/multitrack');
    } catch (error) {
      Alert.alert(
        'Could not import audio',
        error instanceof Error ? error.message : 'Please try another file.',
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="border-b border-white/5 px-4 pb-3 pt-2">
        <View className="h-10 flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            disabled={importing}
            onPress={back}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-bright">
            <ArrowLeft size={20} color="#E4E1EA" strokeWidth={2} />
          </Pressable>

          <Text variant="title-md" className="text-on-surface">
            Import Audio
          </Text>

          <View className="h-10 w-10" />
        </View>
      </View>

      <View className="gap-3 px-4 pt-6">
        <CreateOptionRow
          title="Single Track"
          description="Import and edit a single audio file."
          Icon={AudioLines}
          iconColor={StudioColors.primaryTonal}
          onPress={() => {
            void runImport('single');
          }}
        />
        <CreateOptionRow
          title="Multi-Track"
          description="Combine up to five audio layers."
          Icon={Layers}
          iconColor={StudioColors.primaryTonal}
          onPress={() => {
            void runImport('multi');
          }}
        />
      </View>

      <QuickRecordProcessingOverlay
        visible={importing}
        title="Importing…"
        detail="Preparing your audio file."
      />
    </View>
  );
}
