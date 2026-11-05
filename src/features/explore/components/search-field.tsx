import { AudioLines, Mic, X } from 'lucide-react-native';
import { Platform, Pressable, Text, View } from 'react-native';

import { embeddedInputClassName } from '@/shared/components/ui/field-styles';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/utils';

import { SearchGlyph } from './search-glyph';

const ICON_ACTIVE = '#D0BCFF';
const ICON_MUTED = '#CBC3D7';
const PLACEHOLDER = '#958EA0';

type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onWaveformPress?: () => void;
  onMicPress?: () => void;
  /** Extra classes (e.g. flex-1 when embedded in ScreenHeader). */
  className?: string;
  testID?: string;
  accessibilityLabel?: string;
};

/**
 * Figma Search bar: #1F1F25 fill, 12 radius, 48 height,
 * search + optional clear + waveform + mic.
 */
export function SearchField({
  value,
  onChangeText,
  placeholder = 'Search songs, artists, stems, playlists...',
  autoFocus = false,
  onWaveformPress,
  onMicPress,
  className,
  testID = 'search-input',
  accessibilityLabel = 'Search',
}: SearchFieldProps) {
  const showPlaceholder = value.length === 0;

  return (
    <View
      className={cn(
        'h-12 flex-row items-center gap-2 rounded-xl bg-surface-container px-3',
        className,
      )}
      style={{ borderCurve: 'continuous' }}>
      <SearchGlyph width={18} height={18} color={ICON_ACTIVE} />

      <View className="relative min-h-5 min-w-0 flex-1 justify-center">
        {showPlaceholder ? (
          <Text
            pointerEvents="none"
            numberOfLines={1}
            ellipsizeMode="tail"
            className="absolute inset-x-0 font-sans text-[15px] leading-5"
            style={{ color: PLACEHOLDER }}>
            {placeholder}
          </Text>
        ) : null}

        <Input
          value={value}
          onChangeText={onChangeText}
          // Custom Text overlay handles ellipsis — Android wraps native placeholders.
          placeholder=""
          returnKeyType="search"
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="none"
          multiline={false}
          numberOfLines={1}
          testID={testID}
          accessibilityLabel={accessibilityLabel}
          className={cn(embeddedInputClassName, 'text-[15px] leading-5')}
          style={{
            ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
          }}
        />
      </View>

      <View className="flex-row items-center gap-1">
        {value.length > 0 ? (
          <Pressable
            onPress={() => onChangeText('')}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={8}
            className="h-9 w-9 items-center justify-center">
            <X size={18} color={PLACEHOLDER} strokeWidth={2} />
          </Pressable>
        ) : null}

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
