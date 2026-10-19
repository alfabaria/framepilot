import type { ReactNode, SVGProps } from 'react';

/**
 * FramePilot's own icon set, drawn on a 24px grid with the logo's soft corners and round caps.
 * Panels and layouts are rounded windows with one tinted pane; capture and framing borrow the logo's viewfinder
 * corners. Components keep the names and props of the set they replace, so call sites only change their import.
 */
export type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & { size?: number | string; strokeWidth?: number | string };

function Svg({ size = 24, strokeWidth = 1.7, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {children}
    </svg>
  );
}

/** The tinted pane that gives each icon its second tone. */
const Tone = ({ d }: { d: string }) => <path d={d} fill="currentColor" fillOpacity={0.22} stroke="none" />;

const WINDOW = 'M7.5 5h9a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-9a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4z';

export const ArrowLeft = (p: IconProps) => <Svg {...p}><path d="M11.5 6 5.5 12l6 6M6 12h13" /></Svg>;
export const ArrowRight = (p: IconProps) => <Svg {...p}><path d="m12.5 6 6 6-6 6M18 12H5" /></Svg>;
export const ChevronDown = (p: IconProps) => <Svg {...p}><path d="m6.5 9.5 5.5 5.5 5.5-5.5" /></Svg>;
export const Check = (p: IconProps) => <Svg {...p}><path d="m5.5 12.5 4.5 4.5 8.5-9.5" /></Svg>;
export const Plus = (p: IconProps) => <Svg {...p}><path d="M12 5.5v13M5.5 12h13" /></Svg>;
export const Minus = (p: IconProps) => <Svg {...p}><path d="M5.5 12h13" /></Svg>;
export const X = (p: IconProps) => <Svg {...p}><path d="m6.5 6.5 11 11m0-11-11 11" /></Svg>;

export const RotateCw = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.5-5.6M19.6 3.6v4.2h-4.2" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </Svg>
);
export const LoaderCircle = (p: IconProps) => <Svg {...p}><path d="M12 4.5a7.5 7.5 0 1 0 7.5 7.5" /></Svg>;

export const PanelLeftOpen = (p: IconProps) => (
  <Svg {...p}><path d={WINDOW} /><path d="M9.5 5v14" /><path d="m5.6 10.3 1.4 1.7-1.4 1.7" /></Svg>
);
export const PanelLeftClose = (p: IconProps) => (
  <Svg {...p}><Tone d="M9.5 5H7.5a4 4 0 0 0-4 4v6a4 4 0 0 0 4 4h2z" /><path d={WINDOW} /><path d="M9.5 5v14" /><path d="M6.9 10.3 5.5 12l1.4 1.7" /></Svg>
);

export const Columns2 = (p: IconProps) => (
  <Svg {...p}><Tone d="M12 5H7.5a4 4 0 0 0-4 4v6a4 4 0 0 0 4 4H12z" /><path d={WINDOW} /><path d="M12 5v14" /></Svg>
);
export const Rows2 = (p: IconProps) => (
  <Svg {...p}><Tone d="M3.5 12V9a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4v3z" /><path d={WINDOW} /><path d="M3.5 12h17" /></Svg>
);
export const LayoutGrid = (p: IconProps) => (
  <Svg {...p}><Tone d="M12 5H7.5a4 4 0 0 0-4 4v3H12z" /><path d={WINDOW} /><path d="M12 5v14M3.5 12h17" /></Svg>
);

export const Link2 = (p: IconProps) => (
  <Svg {...p}><rect x="2.8" y="8.4" width="11.2" height="7.2" rx="3.6" /><rect x="10" y="8.4" width="11.2" height="7.2" rx="3.6" /></Svg>
);
export const ArrowDownUp = (p: IconProps) => (
  <Svg {...p}><path d="M8.5 19V5.5m0 0-3 3m3-3 3 3M15.5 5v13.5m0 0-3-3m3 3 3-3" /></Svg>
);

export const Camera = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8.5V7a3 3 0 0 1 3-3h1.5M15.5 4H17a3 3 0 0 1 3 3v1.5M4 15.5V17a3 3 0 0 0 3 3h1.5M15.5 20H17a3 3 0 0 0 3-3v-1.5" />
    <circle cx="12" cy="12" r="3.4" fill="currentColor" fillOpacity={0.22} />
  </Svg>
);
export const Frame = (p: IconProps) => (
  <Svg {...p}>
    <path fillRule="evenodd" fill="currentColor" fillOpacity={0.22} stroke="none" d="M8.5 3.5h7a5 5 0 0 1 5 5v7a5 5 0 0 1-5 5h-7a5 5 0 0 1-5-5v-7a5 5 0 0 1 5-5zM9.5 7.5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2z" />
    <path d="M8.5 3.5h7a5 5 0 0 1 5 5v7a5 5 0 0 1-5 5h-7a5 5 0 0 1-5-5v-7a5 5 0 0 1 5-5z" />
    <path d="M9.5 7.5h5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z" />
  </Svg>
);
export const Code2 = (p: IconProps) => <Svg {...p}><path d="m8.5 8-4 4 4 4m7-8 4 4-4 4M13.2 5.8l-2.4 12.4" /></Svg>;
export const RotateCcwSquare = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4.5" y="9.5" width="9" height="11" rx="2.8" fill="currentColor" fillOpacity={0.22} />
    <path d="M10 5.2h5.3A3.7 3.7 0 0 1 19 8.9V11M16.8 9 19 11.2 21.2 9" />
  </Svg>
);
export const CircleAlert = (p: IconProps) => (
  <Svg {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="6" /><path d="M12 8v5M12 16.3v.01" /></Svg>
);
export const Settings2 = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8h8M17 8h3M4 16h3M12 16h8" />
    <rect x="12" y="5.5" width="5" height="5" rx="2.5" fill="currentColor" fillOpacity={0.22} />
    <rect x="7" y="13.5" width="5" height="5" rx="2.5" fill="currentColor" fillOpacity={0.22} />
  </Svg>
);

export const Globe = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c-2.7 2.5-3.7 5.3-3.7 8.5s1 6 3.7 8.5c2.7-2.5 3.7-5.3 3.7-8.5S14.7 6 12 3.5z" /></Svg>
);
export const Clock = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 1.8" /></Svg>;
export const Sun = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.6" fill="currentColor" fillOpacity={0.22} />
    <path d="M12 3.5v1.8M12 18.7v1.8M3.5 12h1.8M18.7 12h1.8M6 6l1.3 1.3M16.7 16.7 18 18M18 6l-1.3 1.3M7.3 16.7 6 18" />
  </Svg>
);
export const Moon = (p: IconProps) => (
  <Svg {...p}><path d="M19.6 14.4A8.2 8.2 0 0 1 9.6 4.4a8.2 8.2 0 1 0 10 10z" fill="currentColor" fillOpacity={0.22} /></Svg>
);

export const Smartphone = (p: IconProps) => <Svg {...p}><rect x="6.5" y="3" width="11" height="18" rx="3.5" /><path d="M10.8 18h2.4" /></Svg>;
export const Tablet = (p: IconProps) => <Svg {...p}><rect x="4.5" y="3.5" width="15" height="17" rx="3.5" /><path d="M10.8 17.5h2.4" /></Svg>;
export const Laptop = (p: IconProps) => <Svg {...p}><rect x="5" y="5" width="14" height="10" rx="2.8" /><path d="M2.8 18.5h18.4" /></Svg>;
export const Monitor = (p: IconProps) => <Svg {...p}><rect x="3.5" y="4.5" width="17" height="11.5" rx="3" /><path d="M9 20h6M12 16v4" /></Svg>;
