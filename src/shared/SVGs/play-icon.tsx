import Svg, { Path, type SvgProps } from 'react-native-svg';

/** Figma artist-profile play glyph (11×13). */
export function PlayIcon({ color = '#CBC3D7', ...props }: SvgProps) {
  return (
    <Svg width={11} height={13} viewBox="0 0 11 13" fill="none" {...props}>
      <Path
        d="M0 12.8333V0L10.0833 6.41667L0 12.8333ZM1.83333 9.4875L6.64583 6.41667L1.83333 3.34583V9.4875Z"
        fill={color}
      />
    </Svg>
  );
}
