import Svg, { Path, Rect, type SvgProps } from 'react-native-svg';

const CTA_FG = '#3C0091';
const LEVELS_BG = '#2A2930';
const LEVELS_FG = '#E4E1EA';

/** Figma open-full-track play glyph (circle + triangle), 17×17, #3C0091. */
export function FeedOpenTrackPlayIcon({ color = CTA_FG, ...props }: SvgProps) {
  return (
    <Svg width={17} height={17} viewBox="0 0 17 17" fill="none" {...props}>
      <Path
        d="M6.25 12.0833L12.0833 8.33333L6.25 4.58333V12.0833V12.0833M8.33333 16.6667C7.18056 16.6667 6.09722 16.4479 5.08333 16.0104C4.06944 15.5729 3.1875 14.9792 2.4375 14.2292C1.6875 13.4792 1.09375 12.5972 0.65625 11.5833C0.21875 10.5694 0 9.48611 0 8.33333C0 7.18056 0.21875 6.09722 0.65625 5.08333C1.09375 4.06944 1.6875 3.1875 2.4375 2.4375C3.1875 1.6875 4.06944 1.09375 5.08333 0.65625C6.09722 0.21875 7.18056 0 8.33333 0C9.48611 0 10.5694 0.21875 11.5833 0.65625C12.5972 1.09375 13.4792 1.6875 14.2292 2.4375C14.9792 3.1875 15.5729 4.06944 16.0104 5.08333C16.4479 6.09722 16.6667 7.18056 16.6667 8.33333C16.6667 9.48611 16.4479 10.5694 16.0104 11.5833C15.5729 12.5972 14.9792 13.4792 14.2292 14.2292C13.4792 14.9792 12.5972 15.5729 11.5833 16.0104C10.5694 16.4479 9.48611 16.6667 8.33333 16.6667V16.6667"
        fill={color}
      />
    </Svg>
  );
}

/** Figma open-full-track chevron (from CTA export). */
export function FeedOpenTrackChevronIcon({ color = CTA_FG, ...props }: SvgProps) {
  return (
    <Svg width={11} height={11} viewBox="0 0 11 11" fill="none" {...props}>
      <Path
        d="M8.45 5.66667H0.333344V4.33333H8.45L4.71668 0.6L5.66668 0L11 5.33333L5.66668 10.6667L4.71668 9.73333L8.45 5.66667V5.66667"
        fill={color}
      />
    </Svg>
  );
}

/** Same footprint as feed social rail circles. */
export const FEED_LEVELS_ICON_SIZE = 52;

/**
 * Figma levels / equalizer control — rx 12, #2A2930, bars #E4E1EA.
 */
export function FeedOpenTrackLevelsIcon(props: SvgProps) {
  return (
    <Svg
      width={FEED_LEVELS_ICON_SIZE}
      height={FEED_LEVELS_ICON_SIZE}
      viewBox="0 0 44 44"
      fill="none"
      {...props}>
      <Rect width={44} height={44} rx={12} fill={LEVELS_BG} />
      <Path
        d="M15.3334 28.6667V22H18.6667V28.6667H15.3334V28.6667M20.3334 28.6667V15.3334H23.6667V28.6667H20.3334V28.6667M25.3334 28.6667V19.5H28.6667V28.6667H25.3334V28.6667"
        fill={LEVELS_FG}
      />
    </Svg>
  );
}
