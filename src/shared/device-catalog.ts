import { frameSpec } from './frame-geometry';
import type { DeviceFrameSpec, Finish, FrameStyleKey } from './frame-geometry';

export type DeviceCategory = 'desktop' | 'laptop' | 'tablet' | 'phone';
export type DeviceChromeKind = 'none' | 'ios-phone' | 'ios-tablet' | 'android';
export type DeviceGroup = 'Desktop' | 'Laptop' | 'iPhone' | 'iPad' | 'Galaxy' | 'Pixel' | 'Other phones';

export type DeviceProfile = {
  id: string;
  name: string;
  category: DeviceCategory;
  group: DeviceGroup;
  /** Portrait (or native landscape for desktops) CSS viewport of the whole screen. */
  width: number;
  height: number;
  deviceScaleFactor: number;
  mobile: boolean;
  touch: boolean;
  userAgent?: string;
  frame: DeviceFrameSpec;
  /** On-screen operating-system and browser UI drawn around the page viewport inside a device frame. */
  chrome: DeviceChromeKind;
};

const iosAgent = (device: 'iPhone' | 'iPad', version: number) =>
  `Mozilla/5.0 (${device}; CPU ${device === 'iPhone' ? 'iPhone OS' : 'OS'} ${version}_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version}.0 Mobile/15E148 Safari/604.1`;

const androidAgent = (version: number, model: string) =>
  `Mozilla/5.0 (Linux; Android ${version}; ${model}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome} Mobile Safari/537.36`;

type Row<Extra extends unknown[] = []> = [id: string, name: string, width: number, height: number, dpr: number, style: FrameStyleKey, finish: Finish, ...Extra];

const iphone = ([id, name, width, height, dpr, style, finish, ios]: Row<[ios: number]>): DeviceProfile => ({
  id, name, category: 'phone', group: 'iPhone', width, height, deviceScaleFactor: dpr, mobile: true, touch: true,
  userAgent: iosAgent('iPhone', ios), frame: frameSpec(style, finish), chrome: 'ios-phone',
});

const ipad = ([id, name, width, height, dpr, style, finish, ios]: Row<[ios: number]>): DeviceProfile => ({
  id, name, category: 'tablet', group: 'iPad', width, height, deviceScaleFactor: dpr, mobile: true, touch: true,
  userAgent: iosAgent('iPad', ios), frame: frameSpec(style, finish), chrome: 'ios-tablet',
});

const android = (group: 'Galaxy' | 'Pixel' | 'Other phones') => ([id, name, width, height, dpr, style, finish, version, model]: Row<[version: number, model: string]>): DeviceProfile => ({
  id, name, category: 'phone', group, width, height, deviceScaleFactor: dpr, mobile: true, touch: true,
  userAgent: androidAgent(version, model), frame: frameSpec(style, finish), chrome: 'android',
});

const screenDevice = (category: 'desktop' | 'laptop', group: 'Desktop' | 'Laptop') => ([id, name, width, height, dpr, style, finish]: Row): DeviceProfile => ({
  id, name, category, group, width, height, deviceScaleFactor: dpr, mobile: false, touch: false, frame: frameSpec(style, finish), chrome: 'none',
});

const desktops: DeviceProfile[] = ([
  ['desktop-hd', 'Desktop HD', 1440, 900, 1, 'imac', 'silver'],
  ['desktop-fhd', 'Desktop Full HD', 1920, 1080, 1, 'monitor', 'graphite'],
  ['desktop-hidpi', 'Desktop HiDPI', 1440, 900, 2, 'monitor', 'graphite'],
  ['desktop-hidpi-xl', 'Desktop HiDPI XL', 1920, 1080, 2, 'monitor', 'graphite'],
  ['desktop-4k', 'Desktop 4K (1x)', 3840, 2160, 1, 'monitor', 'black'],
  ['imac-retina', 'iMac 21.5″', 1920, 1080, 1, 'imac', 'silver'],
  ['imac-retina-4k-21', 'iMac 21.5″ 4K', 2048, 1152, 2, 'imac', 'silver'],
  ['imac-retina-45k-24', 'iMac 24″ 4.5K', 2240, 1260, 2, 'imac', 'blue'],
  ['imac-retina-5k-27', 'iMac 27″ 5K', 2560, 1440, 2, 'imac', 'silver'],
  ['imac-pro-5k-27', 'iMac Pro 27″ 5K', 2560, 1440, 2, 'imac', 'graphite'],
] satisfies Row[]).map(screenDevice('desktop', 'Desktop'));

const laptops: DeviceProfile[] = ([
  ['laptop', 'Laptop', 1366, 768, 1, 'laptop', 'silver'],
  ['laptop-s', 'Laptop S', 1280, 800, 1, 'laptop', 'silver'],
  ['laptop-m', 'Laptop M', 1440, 900, 1, 'laptop', 'silver'],
  ['macbook', 'MacBook', 1440, 900, 2, 'laptop', 'gold'],
  ['macbook-air', 'MacBook Air', 1440, 900, 2, 'laptop', 'silver'],
  ['macbook-pro', 'MacBook Pro', 1440, 900, 2, 'laptop', 'graphite'],
] satisfies Row[]).map(screenDevice('laptop', 'Laptop'));

const iphones: DeviceProfile[] = ([
  ['iphone-16-pro-max', 'iPhone 16 Pro Max', 440, 956, 3, 'iphone-16-pro', 'natural', 18],
  ['iphone-16-pro', 'iPhone 16 Pro', 402, 874, 3, 'iphone-16-pro', 'titanium', 18],
  ['iphone-16-plus', 'iPhone 16 Plus', 430, 932, 3, 'iphone-15', 'pink', 18],
  ['iphone-16', 'iPhone 16', 393, 852, 3, 'iphone-15', 'teal', 18],
  ['iphone-16-e', 'iPhone 16e', 390, 844, 3, 'iphone-13', 'white', 18],
  ['iphone-15-pro-max', 'iPhone 15 Pro Max', 430, 932, 3, 'iphone-15', 'natural', 17],
  ['iphone-15-pro', 'iPhone 15 Pro', 393, 852, 3, 'iphone-15', 'titanium', 17],
  ['iphone-15-plus', 'iPhone 15 Plus', 430, 932, 3, 'iphone-15', 'yellow', 17],
  ['iphone-15', 'iPhone 15', 393, 852, 3, 'iphone-15', 'pink', 17],
  ['iphone-14-pro-max', 'iPhone 14 Pro Max', 430, 932, 3, 'iphone-island', 'graphite', 16],
  ['iphone-14-pro', 'iPhone 14 Pro', 393, 852, 3, 'iphone-island', 'gold', 16],
  ['iphone-14-plus', 'iPhone 14 Plus', 428, 926, 3, 'iphone-13', 'blue', 16],
  ['iphone-14', 'iPhone 14', 390, 844, 3, 'iphone-13', 'purple', 16],
  ['iphone-13-pro-max', 'iPhone 13 Pro Max', 428, 926, 3, 'iphone-13', 'silver', 15],
  ['iphone-13-pro', 'iPhone 13 Pro', 390, 844, 3, 'iphone-13', 'graphite', 15],
  ['iphone-13', 'iPhone 13', 390, 844, 3, 'iphone-13', 'blue', 15],
  ['iphone-13-mini', 'iPhone 13 mini', 375, 812, 3, 'iphone-13-mini', 'pink', 15],
  ['iphone-12-pro-max', 'iPhone 12 Pro Max', 428, 926, 3, 'iphone-12', 'gold', 15],
  ['iphone-12-pro', 'iPhone 12 Pro', 390, 844, 3, 'iphone-12', 'blue', 15],
  ['iphone-12', 'iPhone 12', 390, 844, 3, 'iphone-12', 'purple', 15],
  ['iphone-12-mini', 'iPhone 12 mini', 360, 780, 3, 'iphone-12-mini', 'green', 15],
  ['iphone-11-pro-max', 'iPhone 11 Pro Max', 414, 896, 3, 'iphone-xs-max', 'midnight', 15],
  ['iphone-11-pro', 'iPhone 11 Pro', 375, 812, 3, 'iphone-x', 'midnight', 15],
  ['iphone-11', 'iPhone 11', 414, 896, 2, 'iphone-xr', 'green', 15],
  ['iphone-xr', 'iPhone XR', 414, 896, 2, 'iphone-xr', 'red', 15],
  ['iphone-xs-max', 'iPhone XS Max', 414, 896, 3, 'iphone-xs-max', 'gold', 15],
  ['iphone-xs', 'iPhone XS', 375, 812, 3, 'iphone-x', 'silver', 15],
  ['iphone-x', 'iPhone X', 375, 812, 3, 'iphone-x', 'graphite', 15],
  ['iphone-se-2022', 'iPhone SE (2022)', 375, 667, 2, 'iphone-home', 'red', 16],
  ['iphone-se-2020', 'iPhone SE (2020)', 375, 667, 2, 'iphone-home', 'black', 15],
  ['iphone-8-plus', 'iPhone 8 Plus', 414, 736, 3, 'iphone-home-plus', 'gold', 15],
  ['iphone-8', 'iPhone 8', 375, 667, 2, 'iphone-home', 'silver', 15],
  ['iphone-7-plus', 'iPhone 7 Plus', 414, 736, 3, 'iphone-home-plus', 'black', 15],
  ['iphone-7', 'iPhone 7', 375, 667, 2, 'iphone-home', 'rose', 15],
  ['iphone-6s-plus', 'iPhone 6s Plus', 414, 736, 3, 'iphone-home-plus', 'rose', 15],
  ['iphone-6s', 'iPhone 6s', 375, 667, 2, 'iphone-home', 'gold', 15],
  ['iphone-se', 'iPhone SE (1st gen)', 320, 568, 2, 'iphone-home-small', 'graphite', 15],
] satisfies Row<[number]>[]).map(iphone);

const ipads: DeviceProfile[] = ([
  ['ipad-pro-12-2021', 'iPad Pro 12.9″ (2021)', 1024, 1366, 2, 'ipad-modern-pro', 'graphite', 17],
  ['ipad-pro-11-2021', 'iPad Pro 11″ (2021)', 834, 1194, 2, 'ipad-modern', 'silver', 17],
  ['ipad-pro-12', 'iPad Pro 12.9″', 1024, 1366, 2, 'ipad-home-pro', 'silver', 15],
  ['ipad-pro-10', 'iPad Pro 10.5″', 834, 1112, 2, 'ipad-home-pro', 'gold', 15],
  ['ipad-pro-9', 'iPad Pro 9.7″', 768, 1024, 2, 'ipad-home', 'rose', 15],
  ['ipad-10', 'iPad 10.2″', 810, 1080, 2, 'ipad-home', 'silver', 17],
  ['ipad-mini', 'iPad mini', 744, 1133, 2, 'ipad-mini', 'purple', 17],
  ['ipad', 'iPad', 768, 1024, 2, 'ipad-modern', 'silver', 17],
] satisfies Row<[number]>[]).map(ipad);

const galaxies: DeviceProfile[] = ([
  ['galaxy-s24-ultra', 'Galaxy S24 Ultra', 384, 824, 3.75, 'galaxy-ultra-flat', 'titanium', 14, 'SM-S928B'],
  ['galaxy-s24-plus', 'Galaxy S24+', 384, 832, 3.75, 'galaxy-punch', 'silver', 14, 'SM-S926B'],
  ['galaxy-s24', 'Galaxy S24', 360, 780, 3, 'galaxy-punch', 'purple', 14, 'SM-S921B'],
  ['galaxy-s23-ultra', 'Galaxy S23 Ultra', 384, 824, 3.75, 'galaxy-ultra-flat', 'green', 13, 'SM-S918B'],
  ['galaxy-s23-plus', 'Galaxy S23+', 384, 832, 3, 'galaxy-punch', 'pink', 13, 'SM-S916B'],
  ['galaxy-s23', 'Galaxy S23', 360, 780, 3, 'galaxy-punch', 'green', 13, 'SM-S911B'],
  ['galaxy-s22-ultra', 'Galaxy S22 Ultra', 384, 824, 3.75, 'galaxy-ultra-flat', 'black', 12, 'SM-S908B'],
  ['galaxy-s22-plus', 'Galaxy S22+', 384, 832, 3, 'galaxy-punch', 'rose', 12, 'SM-S906B'],
  ['galaxy-s22', 'Galaxy S22', 360, 780, 3, 'galaxy-punch', 'white', 12, 'SM-S901B'],
  ['galaxy-s21-ultra', 'Galaxy S21 Ultra', 412, 915, 3.5, 'galaxy-ultra', 'silver', 11, 'SM-G998B'],
  ['galaxy-s21-plus', 'Galaxy S21+', 384, 854, 2.8125, 'galaxy-punch', 'purple', 11, 'SM-G996B'],
  ['galaxy-s21', 'Galaxy S21', 360, 800, 3, 'galaxy-punch', 'pink', 11, 'SM-G991B'],
  ['galaxy-s20-ultra', 'Galaxy S20 Ultra', 412, 915, 3.5, 'galaxy-ultra', 'graphite', 10, 'SM-G988B'],
  ['galaxy-s20-plus', 'Galaxy S20+', 384, 854, 2.8125, 'galaxy-punch', 'blue', 10, 'SM-G985F'],
  ['galaxy-s20', 'Galaxy S20', 360, 800, 3, 'galaxy-punch', 'graphite', 10, 'SM-G980F'],
  ['galaxy-note-8', 'Galaxy Note 8', 412, 846, 3.5, 'galaxy-infinity', 'black', 8, 'SM-N950F'],
  ['galaxy-s9-plus', 'Galaxy S9+', 412, 846, 3.5, 'galaxy-infinity', 'purple', 9, 'SM-G965F'],
  ['galaxy-s9', 'Galaxy S9', 360, 740, 4, 'galaxy-infinity', 'blue', 9, 'SM-G960F'],
  ['galaxy-s8', 'Galaxy S8', 360, 740, 4, 'galaxy-infinity', 'silver', 8, 'SM-G950F'],
  ['galaxy-note-5', 'Galaxy Note 5', 360, 640, 4, 'galaxy-classic', 'white', 7, 'SM-N920C'],
  ['galaxy-s7', 'Galaxy S7', 360, 640, 4, 'galaxy-classic', 'gold', 8, 'SM-G930F'],
  ['galaxy-s6-edge', 'Galaxy S6 edge', 360, 640, 4, 'galaxy-edge', 'green', 7, 'SM-G925F'],
  ['galaxy-s6', 'Galaxy S6', 360, 640, 4, 'galaxy-classic', 'white', 7, 'SM-G920F'],
] satisfies Row<[number, string]>[]).map(android('Galaxy'));

const pixels: DeviceProfile[] = ([
  ['google-pixel-8-pro', 'Pixel 8 Pro', 448, 998, 3, 'pixel-pro', 'teal', 14, 'Pixel 8 Pro'],
  ['google-pixel-8', 'Pixel 8', 412, 915, 2.625, 'pixel-6', 'green', 14, 'Pixel 8'],
  ['google-pixel-7-pro', 'Pixel 7 Pro', 412, 892, 3.5, 'pixel-pro', 'silver', 13, 'Pixel 7 Pro'],
  ['google-pixel-7a', 'Pixel 7a', 412, 915, 2.625, 'pixel-6', 'blue', 13, 'Pixel 7a'],
  ['google-pixel-7', 'Pixel 7', 412, 915, 2.625, 'pixel-6', 'graphite', 13, 'Pixel 7'],
  ['google-pixel-6-pro', 'Pixel 6 Pro', 412, 892, 3.5, 'pixel-pro', 'gold', 12, 'Pixel 6 Pro'],
  ['google-pixel-6', 'Pixel 6', 412, 915, 2.625, 'pixel-6', 'red', 12, 'Pixel 6'],
  ['google-pixel-5', 'Pixel 5', 393, 851, 2.75, 'pixel-punch-left', 'green', 11, 'Pixel 5'],
  ['google-pixel-4-xl', 'Pixel 4 XL', 411, 869, 3.5, 'pixel-4', 'white', 10, 'Pixel 4 XL'],
  ['google-pixel-4', 'Pixel 4', 393, 829, 2.75, 'pixel-4', 'orange', 10, 'Pixel 4'],
  ['google-pixel-3a-xl', 'Pixel 3a XL', 411, 823, 2.625, 'pixel-2xl', 'black', 9, 'Pixel 3a XL'],
  ['google-pixel-3a', 'Pixel 3a', 393, 808, 2.75, 'pixel-3', 'purple', 9, 'Pixel 3a'],
  ['google-pixel-3-xl', 'Pixel 3 XL', 411, 846, 3.5, 'pixel-3-xl', 'black', 9, 'Pixel 3 XL'],
  ['google-pixel-3', 'Pixel 3', 393, 786, 2.75, 'pixel-3', 'white', 9, 'Pixel 3'],
  ['google-pixel-2-xl', 'Pixel 2 XL', 411, 823, 3.5, 'pixel-2xl', 'black', 8, 'Pixel 2 XL'],
  ['google-pixel-2', 'Pixel 2', 411, 731, 2.625, 'pixel-classic', 'black', 8, 'Pixel 2'],
  ['google-pixel-xl', 'Pixel XL', 411, 731, 3.5, 'pixel-classic', 'silver', 7, 'Pixel XL'],
  ['google-pixel', 'Pixel', 411, 731, 2.625, 'pixel-classic', 'silver', 7, 'Pixel'],
] satisfies Row<[number, string]>[]).map(android('Pixel'));

const others: DeviceProfile[] = ([
  ['oneplus-5t', 'OnePlus 5T', 411, 823, 2.625, 'android-infinity', 'black', 8, 'ONEPLUS A5010'],
  ['lg-g6', 'LG G6', 360, 720, 4, 'android-infinity', 'silver', 7, 'LG-H870'],
] satisfies Row<[number, string]>[]).map(android('Other phones'));

export const DEVICE_PROFILES: readonly DeviceProfile[] = [...desktops, ...laptops, ...iphones, ...ipads, ...galaxies, ...pixels, ...others];

export const DEVICE_GROUP_ORDER: readonly DeviceGroup[] = ['Desktop', 'Laptop', 'iPhone', 'iPad', 'Galaxy', 'Pixel', 'Other phones'];

/** Profile ids used by earlier versions, so saved workspaces keep opening. */
export const LEGACY_PROFILE_IDS: Readonly<Record<string, string>> = {
  'iphone-pro-max': 'iphone-14-pro-max',
  'android-phone': 'google-pixel-8',
  'small-mobile': 'galaxy-s20',
  'large-tablet': 'ipad-pro-12-2021',
};
