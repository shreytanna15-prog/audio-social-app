import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { embeddedInputClassName } from '@/shared/components/ui/field-styles';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/utils';

/** Figma search bar tokens (`filter0_d_89_211` / clip text). */
const BAR_BG = '#1B1B21';
const MUTED = '#958EA0';
const BAR_HEIGHT = 44;
const BAR_RADIUS = 12;
const ICON_SIZE = 15;

type MessageSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

/**
 * Chat search field — matches Figma SVG (358×44, rx 12, #1B1B21,
 * filled Material search + Inter 14 / #958EA0 placeholder).
 */
export function MessageSearchBar({
  value,
  onChangeText,
  placeholder = 'Search conversations',
}: MessageSearchBarProps) {
  return (
    <View
      className="mx-4 flex-row items-center"
      style={{
        height: BAR_HEIGHT,
        borderRadius: BAR_RADIUS,
        borderCurve: 'continuous',
        backgroundColor: BAR_BG,
        paddingHorizontal: 16,
        gap: 14,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      }}>
      <SearchGlyph />
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        accessibilityLabel="Search conversations"
        className={cn(embeddedInputClassName, 'text-sm')}
      />
    </View>
  );
}

/** Exact path from Figma search icon (viewBox aligned to 15×15 glyph). */
function SearchGlyph() {
  return (
    <Svg
      width={ICON_SIZE}
      height={ICON_SIZE}
      viewBox="18.5 15.5 15 15"
      accessibilityElementsHidden
      importantForAccessibility="no">
      <Path
        d="M32.3333 30.5L27.0833 25.25C26.6667 25.5833 26.1875 25.8472 25.6458 26.0417C25.1042 26.2361 24.5278 26.3333 23.9167 26.3333C22.4028 26.3333 21.1215 25.809 20.0729 24.7604C19.0243 23.7118 18.5 22.4306 18.5 20.9167C18.5 19.4028 19.0243 18.1215 20.0729 17.0729C21.1215 16.0243 22.4028 15.5 23.9167 15.5C25.4306 15.5 26.7118 16.0243 27.7604 17.0729C28.809 18.1215 29.3333 19.4028 29.3333 20.9167C29.3333 21.5278 29.2361 22.1042 29.0417 22.6458C28.8472 23.1875 28.5833 23.6667 28.25 24.0833L33.5 29.3333L32.3333 30.5V30.5M23.9167 24.6667C24.9583 24.6667 25.8438 24.3021 26.5729 23.5729C27.3021 22.8438 27.6667 21.9583 27.6667 20.9167C27.6667 19.875 27.3021 18.9896 26.5729 18.2604C25.8438 17.5312 24.9583 17.1667 23.9167 17.1667C22.875 17.1667 21.9896 17.5312 21.2604 18.2604C20.5312 18.9896 20.1667 19.875 20.1667 20.9167C20.1667 21.9583 20.5312 22.8438 21.2604 23.5729C21.9896 24.3021 22.875 24.6667 23.9167 24.6667V24.6667"
        fill={MUTED}
      />
    </Svg>
  );
}
