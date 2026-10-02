import { AudioLines, Mic, Search } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

const ICON_ACTIVE = '#D0BCFF';
const ICON_MUTED = '#CBC3D7';
const PLACEHOLDER = '#958EA0';

type ExploreSearchBarProps = {
  placeholder?: string;
  onWaveformPress?: () => void;
  onMicPress?: () => void;
};

export function ExploreSearchBar({
  placeholder = 'Search songs, artists, stems, playlists…',
  onWaveformPress,
  onMicPress,
}: ExploreSearchBarProps) {
  const [query, setQuery] = useState('');

  return (
    <View className="mx-4 flex-row items-center gap-3 rounded-2xl bg-surface-container-high px-3.5 py-3">
      <Search size={20} color={ICON_ACTIVE} strokeWidth={2} />

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        placeholderTextColor={PLACEHOLDER}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel="Search explore"
        className="min-w-0 flex-1 font-sans text-base text-on-surface"
        style={{ padding: 0 }}
      />

      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={onWaveformPress}
          accessibilityRole="button"
          accessibilityLabel="Audio search"
          hitSlop={8}
          className="h-9 w-9 items-center justify-center">
          <AudioLines size={20} color={ICON_ACTIVE} strokeWidth={2} />
        </Pressable>

        <Pressable
          onPress={onMicPress}
          accessibilityRole="button"
          accessibilityLabel="Voice search"
          hitSlop={8}
          className="h-9 w-9 items-center justify-center">
          <Mic size={20} color={ICON_MUTED} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}
