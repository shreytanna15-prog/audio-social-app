import { AudioLines, FileMusic } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import {
  LIVE_WINDOW_SECONDS,
  edgeEnsureLiveWindowStart,
  followLiveWindowStart,
  secondsFromLiveWindowX,
} from '@/features/audio/domain/live-window';
import { useCaptureElapsed } from '@/features/audio/hooks/use-capture-elapsed';
import type { ProjectLayer } from '@/features/audio/types/project';
import { MultitrackLayerCard } from '@/features/studio/components/multitrack/multitrack-layer-card';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { fieldClassName } from '@/shared/components/ui/field-styles';
import { Input } from '@/shared/components/ui/input';
import { Text } from '@/shared/components/ui/text';
import { cn } from '@/shared/lib/utils';

type MultitrackLayerStackProps = {
  layers: ProjectLayer[];
  selectedLayerId: string | null;
  durationSeconds: number;
  playheadSeconds: number;
  windowStartSeconds: number;
  isRecording: boolean;
  isPlaying: boolean;
  recordingLayerId: string | null;
  recordOriginSeconds: number;
  canEdit: boolean;
  canAdd: boolean;
  onWindowStartChange: (windowStartSeconds: number) => void;
  onSelectLayer: (id: string) => void;
  onRenameLayer: (id: string, name: string) => void;
  onToggleMute: (id: string) => void;
  onRemoveLayer: (id: string) => void;
  onScrubStart?: () => void;
  onSeek?: (seconds: number) => void;
  onScrubEnd?: (seconds: number) => void;
  onAddLayer?: () => void;
  onAddBeat?: () => void;
};

function SharedPlayheadLine({ leftPx }: { leftPx: number }) {
  return (
    <View
      pointerEvents="none"
      className="absolute bottom-0 top-0 z-10 w-0.5 items-center bg-primary"
      style={{ left: leftPx }}>
      <View className="absolute -top-1 h-2.5 w-2.5 rounded-full bg-primary" />
      <View className="absolute -bottom-1 h-2.5 w-2.5 rounded-full bg-primary" />
    </View>
  );
}

/** Local follow window while recording — avoids 10 Hz parent setState. */
function RecordingStackBody({
  layers,
  selectedLayerId,
  viewportWidth,
  recordOriginSeconds,
  recordingLayerId,
  onSelectLayer,
  onRequestRename,
  onToggleMute,
  onRemoveLayer,
}: {
  layers: ProjectLayer[];
  selectedLayerId: string | null;
  viewportWidth: number;
  recordOriginSeconds: number;
  recordingLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onRequestRename: (layer: ProjectLayer) => void;
  onToggleMute: (id: string) => void;
  onRemoveLayer: (id: string) => void;
}) {
  const elapsed = useCaptureElapsed(true);
  const playhead = Math.max(0, recordOriginSeconds) + elapsed;
  const windowStart = followLiveWindowStart(playhead);
  // Use raw playhead X (no knob offset) so the line sits on the live wave tip.
  const pps = viewportWidth > 0 ? viewportWidth / LIVE_WINDOW_SECONDS : 0;
  const playheadLeft =
    viewportWidth > 0
      ? Math.max(0, (playhead - windowStart) * pps)
      : 0;

  return (
    <>
      {layers.map((layer) => (
        <MultitrackLayerCard
          key={layer.id}
          layer={layer}
          selected={layer.id === selectedLayerId}
          canEdit={false}
          viewportWidth={viewportWidth}
          windowStartSeconds={windowStart}
          playheadSeconds={playhead}
          isLive={layer.id === recordingLayerId}
          liveOriginSeconds={recordOriginSeconds}
          onSelect={() => onSelectLayer(layer.id)}
          onEditName={() => onRequestRename(layer)}
          onToggleMute={() => onToggleMute(layer.id)}
          onRemove={() => onRemoveLayer(layer.id)}
        />
      ))}
      {viewportWidth > 0 ? <SharedPlayheadLine leftPx={playheadLeft} /> : null}
    </>
  );
}

export function MultitrackLayerStack({
  layers,
  selectedLayerId,
  durationSeconds,
  playheadSeconds,
  windowStartSeconds,
  isRecording,
  isPlaying,
  recordingLayerId,
  recordOriginSeconds,
  canEdit,
  canAdd,
  onWindowStartChange,
  onSelectLayer,
  onRenameLayer,
  onToggleMute,
  onRemoveLayer,
  onScrubStart,
  onSeek,
  onScrubEnd,
  onAddLayer,
  onAddBeat,
}: MultitrackLayerStackProps) {
  const [viewportWidth, setViewportWidth] = useState(0);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [scrubSeconds, setScrubSeconds] = useState<number | null>(null);
  const scrubbingRef = useRef(false);
  const windowStartRef = useRef(windowStartSeconds);
  const onWindowStartChangeRef = useRef(onWindowStartChange);
  onWindowStartChangeRef.current = onWindowStartChange;
  windowStartRef.current = windowStartSeconds;

  const scrubEnabled =
    Boolean(onSeek || onScrubEnd) &&
    !isRecording &&
    durationSeconds > 0 &&
    viewportWidth > 0;

  const displayPlayhead =
    scrubSeconds != null ? scrubSeconds : Math.max(0, playheadSeconds);

  useEffect(() => {
    if (isRecording || scrubbingRef.current || !isPlaying) {
      return;
    }
    const next = edgeEnsureLiveWindowStart(
      displayPlayhead,
      windowStartRef.current,
      durationSeconds,
    );
    if (Math.abs(next - windowStartRef.current) < 0.001) {
      return;
    }
    onWindowStartChangeRef.current(next);
  }, [displayPlayhead, durationSeconds, isPlaying, isRecording]);

  const onLaneLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setViewportWidth((prev) => (prev === next ? prev : next));
  };

  const secondsFromEvent = (event: GestureResponderEvent) => {
    const x = event.nativeEvent.locationX;
    return secondsFromLiveWindowX(
      x,
      windowStartRef.current,
      viewportWidth,
      durationSeconds,
    );
  };

  const beginScrub = (event: GestureResponderEvent) => {
    if (!scrubEnabled) {
      return;
    }
    scrubbingRef.current = true;
    const seconds = secondsFromEvent(event);
    setScrubSeconds(seconds);
    onScrubStart?.();
    onSeek?.(seconds);
    const nextWindow = edgeEnsureLiveWindowStart(
      seconds,
      windowStartRef.current,
      durationSeconds,
    );
    if (Math.abs(nextWindow - windowStartRef.current) >= 0.001) {
      onWindowStartChange(nextWindow);
    }
  };

  const moveScrub = (event: GestureResponderEvent) => {
    if (!scrubbingRef.current || !scrubEnabled) {
      return;
    }
    const seconds = secondsFromEvent(event);
    setScrubSeconds(seconds);
    onSeek?.(seconds);
    const nextWindow = edgeEnsureLiveWindowStart(
      seconds,
      windowStartRef.current,
      durationSeconds,
    );
    if (Math.abs(nextWindow - windowStartRef.current) >= 0.001) {
      onWindowStartChange(nextWindow);
    }
  };

  const endScrub = (event: GestureResponderEvent) => {
    if (!scrubbingRef.current) {
      return;
    }
    scrubbingRef.current = false;
    const seconds = secondsFromEvent(event);
    setScrubSeconds(null);
    onScrubEnd?.(seconds);
  };

  // Idle playhead: tip-aligned (no knob inset) so it matches stored clip edges.
  const idlePps = viewportWidth > 0 ? viewportWidth / LIVE_WINDOW_SECONDS : 0;
  const idlePlayheadLeft =
    viewportWidth > 0
      ? Math.max(0, (displayPlayhead - windowStartSeconds) * idlePps)
      : 0;

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-3"
        keyboardShouldPersistTaps="handled">
        {/* Width matches screen px-4 content — same as QuickRecordTimeline. */}
        <View className="relative w-full" onLayout={onLaneLayout}>
          {isRecording ? (
            <RecordingStackBody
              layers={layers}
              selectedLayerId={selectedLayerId}
              viewportWidth={viewportWidth}
              recordOriginSeconds={recordOriginSeconds}
              recordingLayerId={recordingLayerId}
              onSelectLayer={onSelectLayer}
              onRequestRename={(layer) => {
                setRenameTarget({ id: layer.id, name: layer.name });
                setRenameDraft(layer.name);
              }}
              onToggleMute={onToggleMute}
              onRemoveLayer={onRemoveLayer}
            />
          ) : (
            <View
              onStartShouldSetResponder={() => scrubEnabled}
              onMoveShouldSetResponder={() => scrubEnabled}
              onResponderGrant={beginScrub}
              onResponderMove={moveScrub}
              onResponderRelease={endScrub}
              onResponderTerminate={endScrub}>
              {layers.map((layer) => (
                <MultitrackLayerCard
                  key={layer.id}
                  layer={layer}
                  selected={layer.id === selectedLayerId}
                  canEdit={canEdit}
                  viewportWidth={viewportWidth}
                  windowStartSeconds={windowStartSeconds}
                  playheadSeconds={displayPlayhead}
                  isLive={false}
                  liveOriginSeconds={0}
                  onSelect={() => onSelectLayer(layer.id)}
                  onEditName={() => {
                    setRenameTarget({ id: layer.id, name: layer.name });
                    setRenameDraft(layer.name);
                  }}
                  onToggleMute={() => onToggleMute(layer.id)}
                  onRemove={() => onRemoveLayer(layer.id)}
                />
              ))}
              {viewportWidth > 0 ? (
                <SharedPlayheadLine leftPx={idlePlayheadLeft} />
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>

      <View className="flex-row gap-2.5 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add layer"
          disabled={!canAdd || !canEdit}
          onPress={onAddLayer}
          className={cn(
            'min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-white/10 bg-surface-container px-3 active:bg-surface-bright',
            !canAdd || !canEdit ? 'opacity-40' : null,
          )}>
          <AudioLines size={16} color="#CBC3D7" strokeWidth={2} />
          <Text variant="label-md" className="text-on-surface">
            Add Layer
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add beat"
          disabled={!canAdd || !canEdit}
          onPress={onAddBeat}
          className={cn(
            'min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-white/10 bg-surface-container px-3 active:bg-surface-bright',
            !canAdd || !canEdit ? 'opacity-40' : null,
          )}>
          <FileMusic size={16} color="#CBC3D7" strokeWidth={2} />
          <Text variant="label-md" className="text-on-surface">
            Add Beat
          </Text>
        </Pressable>
      </View>

      <Dialog
        open={renameTarget != null}
        onOpenChange={(next) => {
          if (!next) {
            setRenameTarget(null);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename layer</DialogTitle>
          </DialogHeader>
          <Input
            value={renameDraft}
            onChangeText={setRenameDraft}
            autoFocus
            selectTextOnFocus
            maxLength={80}
            placeholder="Layer name"
            onSubmitEditing={() => {
              if (!renameTarget) {
                return;
              }
              onRenameLayer(renameTarget.id, renameDraft);
              setRenameTarget(null);
            }}
            className={cn(
              fieldClassName,
              'rounded-2xl border border-hairline bg-canvas',
            )}
          />
          <DialogFooter>
            <Button variant="ghost" size="sm" onPress={() => setRenameTarget(null)}>
              <Text>Cancel</Text>
            </Button>
            <Button
              variant="soft"
              size="sm"
              onPress={() => {
                if (!renameTarget) {
                  return;
                }
                onRenameLayer(renameTarget.id, renameDraft);
                setRenameTarget(null);
              }}>
              <Text>Save</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  );
}
