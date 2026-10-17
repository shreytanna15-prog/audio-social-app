import Svg, { Path, type SvgProps } from 'react-native-svg';

/**
 * Figma featured-song play glyph (hollow triangle).
 * Coords match the 48 circle at (18,18) inside the 82×84 export.
 */
export function FeaturedPlayIcon({ color = '#3C0091', ...props }: SvgProps) {
  return (
    <Svg width={48} height={48} viewBox="18 18 48 48" fill="none" {...props}>
      <Path
        d="M38.0317 49.5833V34.4166L49.9484 42L38.0317 49.5833ZM40.1984 45.6291L45.8859 42L40.1984 38.3708V45.6291Z"
        fill={color}
      />
    </Svg>
  );
}
