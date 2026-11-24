import { AudioLines, Mic } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { SearchGlyph } from './search-glyph';

const ICON_ACTIVE = '#D0BCFF';
const ICON_MUTED = '#CBC3D7';
const PLACEHOLDER = '#958EA0';

type ExploreSearchBarProps = {
  placeholder?: string;
  onPress?: () => void;
  onWaveformPress?: () => void;
  onMicPress?: () => void;
};

export function ExploreSearchBar({
  placeholder = 'Search songs, artists, stems, playlists...',
  onPress,
  onWaveformPress,
  onMicPress,
}: ExploreSearchBarProps) {
  return (
    <Pressable
      onPress={onPress}
      testID="explore-search-bar"
      accessibilityRole="button"
      accessibilityLabel="Open search"
      className="mx-4 h-12 flex-row items-center gap-2 rounded-2xl bg-surface-container px-3.5"
      style={{ borderCurve: 'continuous' }}>
      <SearchGlyph width={17} height={17} color={ICON_ACTIVE} />

      <Text
        className="min-w-0 flex-1 font-sans text-[15px] leading-5"
        style={{ color: PLACEHOLDER }}
        numberOfLines={1}
        ellipsizeMode="tail">
        {placeholder}
      </Text>

      <View className="flex-row items-center gap-1">
        {onWaveformPress ? (
          <Pressable onPress={onWaveformPress} accessibilityRole="button"
            accessibilityLabel="Audio search" hitSlop={8}
            className="h-9 w-9 items-center justify-center">
            <AudioLines size={20} color={ICON_ACTIVE} strokeWidth={2} />
          </Pressable>
        ) : null}
        {onMicPress ? (
          <Pressable onPress={onMicPress} accessibilityRole="button"
            accessibilityLabel="Voice search" hitSlop={8}
            className="h-9 w-9 items-center justify-center">
            <Mic size={20} color={ICON_MUTED} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}
