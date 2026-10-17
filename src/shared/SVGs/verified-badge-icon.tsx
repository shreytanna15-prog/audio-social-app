import Svg, { Path, Rect, type SvgProps } from 'react-native-svg';

/**
 * Figma artist-profile verified badge.
 * 20 circle #A078FF · check #3C0091 (24 viewBox includes shadow pad).
 */
export function VerifiedBadgeIcon(props: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect x={2} y={1} width={20} height={20} rx={10} fill="#A078FF" />
      <Path
        d="M10.6729 14.6969L7.1521 11.176L8.37085 9.95727L10.6729 12.2594L15.6292 7.3031L16.8479 8.52185L10.6729 14.6969Z"
        fill="#3C0091"
      />
    </Svg>
  );
}
