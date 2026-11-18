import { AudioLines, Layers } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

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
import { useStudioProjectContextStore } from '@/features/studio/store/studio-project-context.store';
import { CreateOptionRow } from '@/shared/components/create/create-option-row';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

/**
 * Create → Import Audio chooser.
 * Single → shared single-edit screen (`/studio/import-audio/edit`).
 * Multi → Multitrack with layer 1.
 */
export function ImportAudioScreen() {
  const { replace } = useRouter();
  const { guard } = useNavigationGuard();
  const hydrateFromImport = useQuickRecordStore((s) => s.hydrateFromImport);
  const setPendingProject = useMultitrackEntryStore((s) => s.setPendingProject);
  // `busy` disables rows during picker + decode; overlay only during decode.
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const busyRef = useRef(false);
  const { showError, dialog } = useFeedbackDialog();

  const beginBusy = () => {
    if (busyRef.current) {
      return false;
    }
    busyRef.current = true;
    setBusy(true);
    return true;
  };

  const endBusy = () => {
    busyRef.current = false;
    setBusy(false);
    setPreparing(false);
  };

  const runImportSingle = async () => {
    if (!beginBusy()) {
      return;
    }

    try {
      const picked = await pickBeatFile();
      if (!picked) {
        return;
      }

      setPreparing(true);
      const imported = await prepareImportedDeviceAudio(picked);

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
      const projectId =
        useStudioProjectContextStore.getState().projectId ?? undefined;
      guard(() =>
        replace({
          pathname: '/studio/import-audio/edit',
          params: projectId
            ? { projectId, discardTarget: 'home', isNew: '1' }
            : { discardTarget: 'home', isNew: '1' },
        }),
      );
    } catch (error) {
      showError(
        'Could not import audio',
        error instanceof Error ? error.message : 'Please try another file.',
      );
    } finally {
      endBusy();
    }
  };

  const runImportMulti = async () => {
    if (!beginBusy()) {
      return;
    }

    try {
      const picked = await pickBeatFile();
      if (!picked) {
        return;
      }

      setPreparing(true);
      const imported = await prepareImportedDeviceAudio(picked);

      setPendingProject(
        createImportLayerProject({
          stemUri: imported.uri,
          sourceUri: imported.uri,
          durationSeconds: imported.durationSeconds,
          peaks: imported.peaks,
          name: imported.displayName,
        }),
      );
      const projectId =
        useStudioProjectContextStore.getState().projectId ?? undefined;
      guard(() =>
        replace({
          pathname: '/studio/multitrack',
          params: projectId ? { projectId } : undefined,
        }),
      );
    } catch (error) {
      showError(
        'Could not import audio',
        error instanceof Error ? error.message : 'Please try another file.',
      );
    } finally {
      endBusy();
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Import Audio" backDisabled={busy} />

      <View className="gap-3 px-4 pt-6">
        <CreateOptionRow
          title="Single Track"
          description="Import and edit a single audio file."
          Icon={AudioLines}
          iconColor={StudioColors.primaryTonal}
          disabled={busy}
          onPress={() => {
            void runImportSingle();
          }}
        />
        <CreateOptionRow
          title="Multi-Track"
          description="Combine up to five audio layers."
          Icon={Layers}
          iconColor={StudioColors.primaryTonal}
          disabled={busy}
          onPress={() => {
            void runImportMulti();
          }}
        />
      </View>

      <QuickRecordProcessingOverlay
        visible={preparing}
        title="Importing…"
        detail="Preparing your audio file."
      />
      {dialog}
    </View>
  );
}
