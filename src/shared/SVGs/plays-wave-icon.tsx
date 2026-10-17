import Svg, { Path, type SvgProps } from 'react-native-svg';

/** Figma featured-song plays waveform (10×11). */
export function PlaysWaveIcon({ color = '#958EA0', ...props }: SvgProps) {
  return (
    <Svg width={10} height={11} viewBox="0 0 10 11" fill="none" {...props}>
      <Path
        d="M2.16667 8.66667V2.16667H3.25V8.66667H2.16667ZM4.33333 10.8333V0H5.41667V10.8333H4.33333ZM0 6.5V4.33333H1.08333V6.5H0ZM6.5 8.66667V2.16667H7.58333V8.66667H6.5ZM8.66667 6.5V4.33333H9.75V6.5H8.66667Z"
        fill={color}
      />
    </Svg>
  );
}
