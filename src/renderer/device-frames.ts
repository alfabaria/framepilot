import frame01 from './assets/device-frames/frame-01.png';
import frame02 from './assets/device-frames/frame-02.png';
import frame03 from './assets/device-frames/frame-03.png';
import frame04 from './assets/device-frames/frame-04.png';
import frame05 from './assets/device-frames/frame-05.png';
import frame06 from './assets/device-frames/frame-06.png';
import frame07 from './assets/device-frames/frame-07.png';
import frame08 from './assets/device-frames/frame-08.png';
import frame09 from './assets/device-frames/frame-09.png';
import frame10 from './assets/device-frames/frame-10.png';
import type { DeviceFrameKey } from '../shared/devices';

type DeviceFrameAsset = {
  file: string;
  source: string;
  imageWidth: number;
  imageHeight: number;
  screen: { left: number; top: number; right: number; bottom: number };
  /** Rounded-corner radius of the screen hole in image pixels. */
  cornerRadius: number;
};

export type DeviceFrameLayout = {
  source: string;
  width: number;
  height: number;
  artworkWidth: number;
  artworkHeight: number;
  screenLeft: number;
  screenTop: number;
  /** Screen corner radius as a fraction of the rendered screen width. */
  radiusRatio: number;
  rotation: 0 | -90;
};

export const deviceFrames: Record<DeviceFrameKey, DeviceFrameAsset> = {
  desktopHd: { file: 'frame-01.png', source: frame01, imageWidth: 1448, imageHeight: 1086, screen: { left: 133, top: 95, right: 1315, bottom: 770 }, cornerRadius: 8 },
  desktopFullHd: { file: 'frame-02.png', source: frame02, imageWidth: 1672, imageHeight: 941, screen: { left: 280, top: 87, right: 1392, bottom: 673 }, cornerRadius: 8 },
  laptop: { file: 'frame-03.png', source: frame03, imageWidth: 1586, imageHeight: 992, screen: { left: 224, top: 108, right: 1363, bottom: 748 }, cornerRadius: 6 },
  ipad: { file: 'frame-04.png', source: frame04, imageWidth: 1086, imageHeight: 1448, screen: { left: 94, top: 114, right: 993, bottom: 1344 }, cornerRadius: 18 },
  largeTablet: { file: 'frame-05.png', source: frame05, imageWidth: 1086, imageHeight: 1448, screen: { left: 101, top: 121, right: 988, bottom: 1346 }, cornerRadius: 17 },
  iphone14: { file: 'frame-06.png', source: frame06, imageWidth: 941, imageHeight: 1672, screen: { left: 119, top: 75, right: 822, bottom: 1596 }, cornerRadius: 87 },
  iphone15Pro: { file: 'frame-07.png', source: frame07, imageWidth: 941, imageHeight: 1672, screen: { left: 123, top: 81, right: 817, bottom: 1596 }, cornerRadius: 97 },
  iphoneProMax: { file: 'frame-08.png', source: frame08, imageWidth: 941, imageHeight: 1672, screen: { left: 132, top: 79, right: 810, bottom: 1590 }, cornerRadius: 100 },
  androidPhone: { file: 'frame-09.png', source: frame09, imageWidth: 941, imageHeight: 1672, screen: { left: 117, top: 61, right: 824, bottom: 1607 }, cornerRadius: 70 },
  smallMobile: { file: 'frame-10.png', source: frame10, imageWidth: 941, imageHeight: 1672, screen: { left: 131, top: 126, right: 810, bottom: 1535 }, cornerRadius: 34 },
};

export function layoutDeviceFrame(key: DeviceFrameKey, screenWidth: number, screenHeight: number, rotate: boolean): DeviceFrameLayout {
  const frame = deviceFrames[key];
  const original = {
    x: frame.screen.left / frame.imageWidth,
    y: frame.screen.top / frame.imageHeight,
    width: (frame.screen.right - frame.screen.left) / frame.imageWidth,
    height: (frame.screen.bottom - frame.screen.top) / frame.imageHeight,
  };
  const aperture = rotate
    ? { x: original.y, y: 1 - original.x - original.width, width: original.height, height: original.width }
    : original;
  const width = screenWidth / aperture.width;
  const height = screenHeight / aperture.height;
  return {
    source: frame.source,
    width,
    height,
    artworkWidth: rotate ? height : width,
    artworkHeight: rotate ? width : height,
    screenLeft: aperture.x * width,
    screenTop: aperture.y * height,
    radiusRatio: frame.cornerRadius / (rotate ? frame.screen.bottom - frame.screen.top : frame.screen.right - frame.screen.left),
    rotation: rotate ? -90 : 0,
  };
}
