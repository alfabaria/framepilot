/**
 * Original, parametric device frames. Every frame is described by a handful of numbers (bezel, band, corner radius,
 * camera cutout, buttons) taken from the real hardware's proportions, and drawn as vector art, so one description
 * serves any screen size and any zoom level and the screen opening is exact by construction.
 */

export type FrameFamily = 'phone' | 'tablet' | 'imac' | 'monitor' | 'laptop';

export type Finish =
  | 'graphite' | 'black' | 'silver' | 'white' | 'gold' | 'rose' | 'blue' | 'red' | 'purple' | 'green' | 'yellow' | 'pink'
  | 'titanium' | 'natural' | 'midnight' | 'starlight' | 'orange' | 'teal';

export type Cutout =
  | { kind: 'none' }
  /** Display notch: flush with the top edge, rounded bottom corners. */
  | { kind: 'notch'; width: number; height: number }
  /** Pill-shaped camera island floating below the top edge. */
  | { kind: 'island'; width: number; height: number; top: number }
  /** Round hole-punch camera. */
  | { kind: 'punch'; position: 'center' | 'left'; radius: number; top: number };

export type FrameStyle = {
  family: FrameFamily;
  /** Black front-glass border between the screen and the metal band, in design px (phones and tablets). */
  side: number;
  top: number;
  bottom: number;
  /** Metal band thickness. */
  band: number;
  screenRadius: number;
  cutout: Cutout;
  /** Physical or on-glass home button below the screen. */
  homeButton?: boolean;
  /** Front speaker slit and camera dot in the top bezel. */
  speaker?: boolean;
  buttons: 'ios' | 'android' | 'none';
  /** Height of the status bar the operating system draws at the top of the screen. */
  statusHeight: number;
};

export type DeviceFrameSpec = FrameStyle & { finish: Finish };

export type Rect = { x: number; y: number; width: number; height: number };

export type FrameGeometry = {
  /** Size of the whole artwork box, including protruding buttons or a stand. */
  width: number;
  height: number;
  screen: Rect;
  screenRadius: number;
  body: Rect & { radius: number };
  /** Inner edge of the metal band (the black front glass). */
  glass: Rect & { radius: number };
  band: number;
  /** Where the stand, base or buttons sit, for the renderer. */
  stand?: { neckWidth: number; neckHeight: number; baseWidth: number; baseHeight: number; top: number };
  base?: { x: number; y: number; width: number; height: number };
  chin?: number;
};

/** Distance buttons protrude from the band. */
const BUTTON_PROTRUSION = 3;

export const FRAME_STYLES = {
  // iPhone with a home button
  'iphone-home-small': { family: 'phone', side: 23, top: 78, bottom: 84, band: 10, screenRadius: 4, cutout: { kind: 'none' }, homeButton: true, speaker: true, buttons: 'ios', statusHeight: 20 },
  'iphone-home': { family: 'phone', side: 27, top: 100, bottom: 102, band: 10, screenRadius: 4, cutout: { kind: 'none' }, homeButton: true, speaker: true, buttons: 'ios', statusHeight: 20 },
  'iphone-home-plus': { family: 'phone', side: 30, top: 108, bottom: 110, band: 10, screenRadius: 4, cutout: { kind: 'none' }, homeButton: true, speaker: true, buttons: 'ios', statusHeight: 20 },
  // iPhone with a notch
  'iphone-x': { family: 'phone', side: 14, top: 14, bottom: 14, band: 9, screenRadius: 39, cutout: { kind: 'notch', width: 209, height: 30 }, buttons: 'ios', statusHeight: 44 },
  'iphone-xs-max': { family: 'phone', side: 15, top: 15, bottom: 15, band: 9, screenRadius: 39, cutout: { kind: 'notch', width: 209, height: 30 }, buttons: 'ios', statusHeight: 44 },
  'iphone-xr': { family: 'phone', side: 19, top: 19, bottom: 19, band: 8, screenRadius: 41, cutout: { kind: 'notch', width: 230, height: 33 }, buttons: 'ios', statusHeight: 48 },
  'iphone-12-mini': { family: 'phone', side: 12, top: 12, bottom: 12, band: 9, screenRadius: 44, cutout: { kind: 'notch', width: 190, height: 30 }, buttons: 'ios', statusHeight: 50 },
  'iphone-12': { family: 'phone', side: 12, top: 12, bottom: 12, band: 9, screenRadius: 47, cutout: { kind: 'notch', width: 209, height: 30 }, buttons: 'ios', statusHeight: 47 },
  'iphone-13': { family: 'phone', side: 12, top: 12, bottom: 12, band: 9, screenRadius: 47, cutout: { kind: 'notch', width: 162, height: 30 }, buttons: 'ios', statusHeight: 47 },
  'iphone-13-mini': { family: 'phone', side: 12, top: 12, bottom: 12, band: 9, screenRadius: 44, cutout: { kind: 'notch', width: 162, height: 30 }, buttons: 'ios', statusHeight: 50 },
  // iPhone with a Dynamic Island
  'iphone-island': { family: 'phone', side: 10, top: 10, bottom: 10, band: 9, screenRadius: 55, cutout: { kind: 'island', width: 124, height: 36, top: 11 }, buttons: 'ios', statusHeight: 54 },
  'iphone-15': { family: 'phone', side: 10, top: 10, bottom: 10, band: 9, screenRadius: 55, cutout: { kind: 'island', width: 124, height: 36, top: 11 }, buttons: 'ios', statusHeight: 59 },
  'iphone-16-pro': { family: 'phone', side: 8, top: 8, bottom: 8, band: 9, screenRadius: 62, cutout: { kind: 'island', width: 124, height: 36, top: 14 }, buttons: 'ios', statusHeight: 62 },
  // iPad
  'ipad-home': { family: 'tablet', side: 48, top: 104, bottom: 104, band: 10, screenRadius: 4, cutout: { kind: 'none' }, homeButton: true, speaker: true, buttons: 'ios', statusHeight: 20 },
  'ipad-home-pro': { family: 'tablet', side: 44, top: 88, bottom: 88, band: 10, screenRadius: 4, cutout: { kind: 'none' }, homeButton: true, speaker: true, buttons: 'ios', statusHeight: 20 },
  'ipad-modern': { family: 'tablet', side: 38, top: 38, bottom: 38, band: 10, screenRadius: 18, cutout: { kind: 'none' }, speaker: true, buttons: 'ios', statusHeight: 24 },
  'ipad-modern-pro': { family: 'tablet', side: 44, top: 44, bottom: 44, band: 10, screenRadius: 20, cutout: { kind: 'none' }, speaker: true, buttons: 'ios', statusHeight: 24 },
  'ipad-mini': { family: 'tablet', side: 34, top: 34, bottom: 34, band: 9, screenRadius: 20, cutout: { kind: 'none' }, speaker: true, buttons: 'ios', statusHeight: 24 },
  // Android: Pixel
  'pixel-classic': { family: 'phone', side: 20, top: 92, bottom: 92, band: 6, screenRadius: 4, cutout: { kind: 'none' }, speaker: true, buttons: 'android', statusHeight: 24 },
  'pixel-2xl': { family: 'phone', side: 21, top: 62, bottom: 62, band: 6, screenRadius: 26, cutout: { kind: 'none' }, speaker: true, buttons: 'android', statusHeight: 24 },
  'pixel-3': { family: 'phone', side: 18, top: 66, bottom: 66, band: 6, screenRadius: 10, cutout: { kind: 'none' }, speaker: true, buttons: 'android', statusHeight: 24 },
  'pixel-3-xl': { family: 'phone', side: 16, top: 18, bottom: 56, band: 6, screenRadius: 34, cutout: { kind: 'notch', width: 140, height: 28 }, buttons: 'android', statusHeight: 28 },
  'pixel-4': { family: 'phone', side: 16, top: 68, bottom: 34, band: 6, screenRadius: 16, cutout: { kind: 'none' }, speaker: true, buttons: 'android', statusHeight: 24 },
  'pixel-punch-left': { family: 'phone', side: 12, top: 18, bottom: 22, band: 6, screenRadius: 24, cutout: { kind: 'punch', position: 'left', radius: 8, top: 14 }, buttons: 'android', statusHeight: 28 },
  'pixel-6': { family: 'phone', side: 10, top: 12, bottom: 12, band: 6, screenRadius: 34, cutout: { kind: 'punch', position: 'center', radius: 8, top: 14 }, buttons: 'android', statusHeight: 28 },
  'pixel-pro': { family: 'phone', side: 8, top: 10, bottom: 10, band: 6, screenRadius: 40, cutout: { kind: 'punch', position: 'center', radius: 8, top: 14 }, buttons: 'android', statusHeight: 28 },
  // Android: Galaxy and others
  'galaxy-classic': { family: 'phone', side: 16, top: 82, bottom: 84, band: 7, screenRadius: 4, cutout: { kind: 'none' }, homeButton: true, speaker: true, buttons: 'android', statusHeight: 24 },
  'galaxy-edge': { family: 'phone', side: 8, top: 82, bottom: 84, band: 7, screenRadius: 8, cutout: { kind: 'none' }, homeButton: true, speaker: true, buttons: 'android', statusHeight: 24 },
  'galaxy-infinity': { family: 'phone', side: 10, top: 46, bottom: 44, band: 7, screenRadius: 30, cutout: { kind: 'none' }, speaker: true, buttons: 'android', statusHeight: 24 },
  'galaxy-punch': { family: 'phone', side: 9, top: 12, bottom: 12, band: 7, screenRadius: 34, cutout: { kind: 'punch', position: 'center', radius: 7, top: 12 }, buttons: 'android', statusHeight: 28 },
  'galaxy-ultra': { family: 'phone', side: 8, top: 10, bottom: 10, band: 7, screenRadius: 40, cutout: { kind: 'punch', position: 'center', radius: 7, top: 12 }, buttons: 'android', statusHeight: 28 },
  'galaxy-ultra-flat': { family: 'phone', side: 8, top: 10, bottom: 10, band: 7, screenRadius: 10, cutout: { kind: 'punch', position: 'center', radius: 7, top: 12 }, buttons: 'android', statusHeight: 28 },
  'android-infinity': { family: 'phone', side: 9, top: 52, bottom: 50, band: 6, screenRadius: 26, cutout: { kind: 'none' }, speaker: true, buttons: 'android', statusHeight: 24 },
  // Desktop and laptop: proportions follow the screen width
  imac: { family: 'imac', side: 0, top: 0, bottom: 0, band: 0, screenRadius: 0, cutout: { kind: 'none' }, buttons: 'none', statusHeight: 0 },
  monitor: { family: 'monitor', side: 0, top: 0, bottom: 0, band: 0, screenRadius: 0, cutout: { kind: 'none' }, buttons: 'none', statusHeight: 0 },
  laptop: { family: 'laptop', side: 0, top: 0, bottom: 0, band: 0, screenRadius: 0, cutout: { kind: 'none' }, buttons: 'none', statusHeight: 0 },
} as const satisfies Record<string, FrameStyle>;

export type FrameStyleKey = keyof typeof FRAME_STYLES;

export function frameSpec(style: FrameStyleKey, finish: Finish): DeviceFrameSpec {
  return { ...FRAME_STYLES[style], finish };
}

/** Geometry of a frame around a screen of the given portrait size (design px). */
export function computeFrame(spec: DeviceFrameSpec, screenWidth: number, screenHeight: number): FrameGeometry {
  if (spec.family === 'phone' || spec.family === 'tablet') return computeHandheld(spec, screenWidth, screenHeight);
  return computeDesktop(spec, screenWidth, screenHeight);
}

function computeHandheld(spec: DeviceFrameSpec, screenWidth: number, screenHeight: number): FrameGeometry {
  const pad = spec.buttons === 'none' ? 0 : BUTTON_PROTRUSION;
  const bodyWidth = screenWidth + 2 * (spec.side + spec.band);
  const bodyHeight = screenHeight + spec.top + spec.bottom + 2 * spec.band;
  const bodyRadius = spec.screenRadius + Math.min(spec.side, spec.top, spec.bottom) + spec.band;
  const body = { x: pad, y: pad, width: bodyWidth, height: bodyHeight, radius: Math.min(bodyRadius, bodyWidth / 2) };
  const glass = {
    x: pad + spec.band,
    y: pad + spec.band,
    width: bodyWidth - 2 * spec.band,
    height: bodyHeight - 2 * spec.band,
    radius: Math.max(0, body.radius - spec.band),
  };
  const screen = { x: glass.x + spec.side, y: glass.y + spec.top, width: screenWidth, height: screenHeight };
  return { width: bodyWidth + 2 * pad, height: bodyHeight + 2 * pad, screen, screenRadius: spec.screenRadius, body, glass, band: spec.band };
}

function computeDesktop(spec: DeviceFrameSpec, screenWidth: number, screenHeight: number): FrameGeometry {
  const w = screenWidth;
  const h = screenHeight;
  if (spec.family === 'laptop') {
    const bezel = w * 0.02;
    const band = w * 0.0035;
    const lidWidth = w + 2 * (bezel + band);
    const lidHeight = h + bezel * 1.6 + bezel + 2 * band;
    const baseHeight = Math.max(8, h * 0.035);
    const overhang = w * 0.045;
    const body = { x: overhang, y: 0, width: lidWidth, height: lidHeight, radius: w * 0.009 };
    return {
      width: lidWidth + 2 * overhang,
      height: lidHeight + baseHeight,
      screen: { x: overhang + band + bezel, y: band + bezel * 1.6, width: w, height: h },
      screenRadius: w * 0.002,
      body,
      glass: { x: body.x + band, y: band, width: lidWidth - 2 * band, height: lidHeight - 2 * band, radius: body.radius },
      band,
      base: { x: 0, y: lidHeight, width: lidWidth + 2 * overhang, height: baseHeight },
    };
  }
  const isImac = spec.family === 'imac';
  const bezel = w * (isImac ? 0.014 : 0.016);
  const band = w * 0.003;
  const chin = isImac ? h * 0.2 : bezel * 1.6;
  const bodyWidth = w + 2 * (bezel + band);
  const bodyHeight = h + bezel + chin + 2 * band;
  const neckHeight = h * (isImac ? 0.18 : 0.14);
  const baseHeight = h * 0.016;
  const standExtra = neckHeight + baseHeight;
  const body = { x: 0, y: 0, width: bodyWidth, height: bodyHeight, radius: w * 0.008 };
  return {
    width: bodyWidth,
    height: bodyHeight + standExtra,
    screen: { x: band + bezel, y: band + bezel, width: w, height: h },
    screenRadius: w * 0.001,
    body,
    glass: { x: band, y: band, width: bodyWidth - 2 * band, height: bodyHeight - 2 * band, radius: body.radius },
    band,
    chin,
    stand: {
      neckWidth: w * (isImac ? 0.15 : 0.09),
      neckHeight,
      baseWidth: w * (isImac ? 0.3 : 0.24),
      baseHeight,
      top: bodyHeight,
    },
  };
}

/** Aperture and stage size for a frame, optionally rotated a quarter turn counter-clockwise (landscape phones/tablets). */
export type FrameLayout = {
  /** Size of the stage the frame occupies after rotation, in displayed px. */
  width: number;
  height: number;
  /** Size of the unrotated artwork, in displayed px. */
  artworkWidth: number;
  artworkHeight: number;
  /** Screen opening within the stage, in displayed px. */
  screenLeft: number;
  screenTop: number;
  /** Screen corner radius as a fraction of the displayed screen width. */
  radiusRatio: number;
  rotation: 0 | -90;
  geometry: FrameGeometry;
};

/**
 * Lays a frame out around an oriented screen of `cssWidth × cssHeight` CSS px shown at `scale` display px per CSS px.
 * `rotate` draws the portrait artwork turned counter-clockwise, as for a phone held in landscape.
 */
export function layoutFrame(spec: DeviceFrameSpec, cssWidth: number, cssHeight: number, scale: number, rotate: boolean): FrameLayout {
  const portraitWidth = rotate ? cssHeight : cssWidth;
  const portraitHeight = rotate ? cssWidth : cssHeight;
  const geometry = computeFrame(spec, portraitWidth, portraitHeight);
  const artworkWidth = geometry.width * scale;
  const artworkHeight = geometry.height * scale;
  const { screen } = geometry;
  return {
    width: rotate ? artworkHeight : artworkWidth,
    height: rotate ? artworkWidth : artworkHeight,
    artworkWidth,
    artworkHeight,
    screenLeft: (rotate ? screen.y : screen.x) * scale,
    screenTop: (rotate ? geometry.width - screen.x - screen.width : screen.y) * scale,
    radiusRatio: geometry.screenRadius / screen.width,
    rotation: rotate ? -90 : 0,
    geometry,
  };
}
