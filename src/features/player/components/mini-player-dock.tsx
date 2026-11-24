import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from './mini-player';
import { usePlayerStore } from '../store/player.store';

export function MiniPlayerDock() {
  const insets = useSafeAreaInsets();
  const track = usePlayerStore((state) => state.track);

  if (!track) return null;

  return (
    <View
      className="border-t border-white/5 bg-background pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}>
      <MiniPlayer />
    </View>
  );
}
