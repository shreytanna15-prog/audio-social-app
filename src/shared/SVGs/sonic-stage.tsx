import * as React from "react";
import Svg, {
  G,
  Rect,
  Path,
  Defs,
  LinearGradient,
  Stop,
  type SvgProps,
} from "react-native-svg";
const SVGComponent = (props: SvgProps) => (
<Svg
    width={288}
    height={288}
    viewBox="0 0 288 288"
    fill="none"
    {...props}
  >
    <G>
      <Rect
        width={288}
        height={288}
        rx={144}
        fill="#1B1B21"
        fillOpacity={0.3}
      />
      <Rect
        x={32}
        y={32}
        width={224}
        height={224}
        rx={112}
        fill="#1F1F25"
        fillOpacity={0.4}
      />
      <Rect
        x={64}
        y={64}
        width={160}
        height={160}
        rx={80}
        fill="#2A2930"
        fillOpacity={0.6}
      />
      <Rect
        x={88}
        y={88}
        width={112}
        height={112}
        rx={56}
        fill="url(#paint0_linear_0_1)"
      />
      <G>
        <Rect
          x={88}
          y={88}
          width={112}
          height={112}
          rx={56}
          fill="white"
          fillOpacity={0.01}
        />
      </G>
      <Rect
        opacity={0.6}
        x={92}
        y={92}
        width={104}
        height={104}
        rx={52}
        fill="url(#paint1_linear_0_1)"
      />
<G>
        <Path
          d="M135.75 153.9V134.1H139.05V153.9H135.75ZM142.35 160.5V127.5H145.65V160.5H142.35ZM129.15 147.3V140.7H132.45V147.3H129.15ZM148.95 153.9V134.1H152.25V153.9H148.95ZM155.55 147.3V140.7H158.85V147.3H155.55Z"
          fill="#3C0091"
        />
      </G>
    </G>
    <Rect
      x={87}
      y={261}
      width={4}
      height={12}
      rx={2}
      fill="#D0BCFF"
      fillOpacity={0.3}
    />
    <Rect
      x={97}
      y={249}
      width={4}
      height={24}
      rx={2}
      fill="#D0BCFF"
      fillOpacity={0.4}
    />
    <Rect
      x={107}
      y={233}
      width={4}
      height={40}
      rx={2}
      fill="#D0BCFF"
      fillOpacity={0.6}
    />
    <Rect x={117} y={217} width={4} height={56} rx={2} fill="#A078FF" />
    <Rect x={127} y={241} width={4} height={32} rx={2} fill="#FFB0CD" />
    <Rect x={137} y={225} width={4} height={48} rx={2} fill="#D0BCFF" />
    <Rect x={147} y={253} width={4} height={20} rx={2} fill="#D0BCFF" />
    <Rect x={157} y={237} width={4} height={36} rx={2} fill="#FFB0CD" />
    <Rect x={167} y={209} width={4} height={64} rx={2} fill="#A078FF" />
    <Rect
      x={177}
      y={245}
      width={4}
      height={28}
      rx={2}
      fill="#D0BCFF"
      fillOpacity={0.6}
    />
    <Rect
      x={187}
      y={257}
      width={4}
      height={16}
      rx={2}
      fill="#D0BCFF"
      fillOpacity={0.4}
    />
    <Rect
      x={197}
      y={265}
      width={4}
      height={8}
      rx={2}
      fill="#D0BCFF"
      fillOpacity={0.2}
    />
    <Defs>
      <LinearGradient
        id="paint0_linear_0_1"
        x1={88}
        y1={200}
        x2={200}
        y2={88}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#D0BCFF" />
        <Stop offset={0.5} stopColor="#A078FF" />
        <Stop offset={1} stopColor="#FFB0CD" />
      </LinearGradient>
      <LinearGradient
        id="paint1_linear_0_1"
        x1={144}
        y1={92}
        x2={144}
        y2={196}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="white" stopOpacity={0.3} />
        <Stop offset={1} stopColor="white" stopOpacity={0} />
      </LinearGradient>
    </Defs>
  </Svg>
);
export { SVGComponent as SonicStage };
export default SVGComponent;
