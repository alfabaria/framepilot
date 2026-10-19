export type DeviceCategory = 'desktop' | 'laptop' | 'tablet' | 'phone';
export type DeviceFrameKey = 'desktopHd' | 'desktopFullHd' | 'laptop' | 'ipad' | 'largeTablet' | 'iphone14' | 'iphone15Pro' | 'iphoneProMax' | 'androidPhone' | 'smallMobile';
export type DeviceChromeKind = 'none' | 'ios-phone' | 'ios-tablet' | 'android';

export type DeviceProfile = {
  id: string;
  name: string;
  category: DeviceCategory;
  width: number;
  height: number;
  deviceScaleFactor: number;
  mobile: boolean;
  touch: boolean;
  userAgent?: string;
  frameKey: DeviceFrameKey;
  /** On-screen operating-system and browser UI drawn around the page viewport inside a device frame. */
  chrome: DeviceChromeKind;
};

export type WorkspaceDevice = {
  id: string;
  profileId: string;
  name: string;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  frameMode: 'device' | 'borderless';
  panelScale: number;
  url: string;
};

export const DEVICE_PROFILES: readonly DeviceProfile[] = [
  { id: 'desktop-hd', name: 'Desktop HD', category: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1, mobile: false, touch: false, frameKey: 'desktopHd', chrome: 'none' },
  { id: 'desktop-fhd', name: 'Desktop Full HD', category: 'desktop', width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false, touch: false, frameKey: 'desktopFullHd', chrome: 'none' },
  { id: 'laptop', name: 'Laptop', category: 'laptop', width: 1366, height: 768, deviceScaleFactor: 1, mobile: false, touch: false, frameKey: 'laptop', chrome: 'none' },
  { id: 'iphone-14', name: 'iPhone 14', category: 'phone', width: 390, height: 844, deviceScaleFactor: 3, mobile: true, touch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1', frameKey: 'iphone14', chrome: 'ios-phone' },
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro', category: 'phone', width: 393, height: 852, deviceScaleFactor: 3, mobile: true, touch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', frameKey: 'iphone15Pro', chrome: 'ios-phone' },
  { id: 'iphone-pro-max', name: 'iPhone Pro Max', category: 'phone', width: 430, height: 932, deviceScaleFactor: 3, mobile: true, touch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', frameKey: 'iphoneProMax', chrome: 'ios-phone' },
  { id: 'android-phone', name: 'Android Phone', category: 'phone', width: 412, height: 915, deviceScaleFactor: 2.625, mobile: true, touch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome} Mobile Safari/537.36', frameKey: 'androidPhone', chrome: 'android' },
  { id: 'small-mobile', name: 'Small Mobile', category: 'phone', width: 360, height: 800, deviceScaleFactor: 2, mobile: true, touch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome} Mobile Safari/537.36', frameKey: 'smallMobile', chrome: 'android' },
  { id: 'ipad', name: 'iPad', category: 'tablet', width: 768, height: 1024, deviceScaleFactor: 2, mobile: true, touch: true, userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', frameKey: 'ipad', chrome: 'ios-tablet' },
  { id: 'large-tablet', name: 'Large Tablet', category: 'tablet', width: 1024, height: 1366, deviceScaleFactor: 2, mobile: true, touch: true, userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', frameKey: 'largeTablet', chrome: 'ios-tablet' },
] as const;

export const INITIAL_DEVICE_PROFILE_IDS = ['desktop-hd', 'iphone-14', 'ipad'] as const;
export const MAX_DEVICE_COUNT = 6;
export const MIN_DEVICE_COUNT = 1;

export function getDeviceProfile(profileId: string): DeviceProfile {
  const profile = DEVICE_PROFILES.find(({ id }) => id === profileId);
  if (!profile) throw new Error(`Unknown device profile: ${profileId}`);
  return profile;
}

/** Phones and tablets can be rotated; desktop and laptop screens stay in their native landscape orientation. */
export function canRotate(profile: Pick<DeviceProfile, 'category'>): boolean {
  return profile.category === 'phone' || profile.category === 'tablet';
}

export function supportedOrientation(device: Pick<WorkspaceDevice, 'profileId' | 'orientation'>): WorkspaceDevice['orientation'] {
  const profile = getDeviceProfile(device.profileId);
  if (canRotate(profile)) return device.orientation;
  return profile.width > profile.height ? 'landscape' : 'portrait';
}

export function orientedViewport(device: Pick<WorkspaceDevice, 'width' | 'height' | 'orientation'>) {
  const landscape = device.orientation === 'landscape';
  const alreadyLandscape = device.width > device.height;
  return landscape === alreadyLandscape
    ? { width: device.width, height: device.height }
    : { width: device.height, height: device.width };
}

export type DeviceInsets = { top: number; right: number; bottom: number; left: number };

/** CSS-pixel space the device's status bar and browser toolbars occupy; the page viewport is the screen minus these. */
export function deviceInsets(device: Pick<WorkspaceDevice, 'profileId' | 'width' | 'height' | 'orientation' | 'frameMode'>): DeviceInsets {
  const none = { top: 0, right: 0, bottom: 0, left: 0 };
  if (device.frameMode !== 'device') return none;
  const landscape = orientedViewport(device).width > orientedViewport(device).height;
  switch (getDeviceProfile(device.profileId).chrome) {
    case 'ios-phone':
      return landscape ? { top: 56, right: 0, bottom: 21, left: 56 } : { top: 54, right: 0, bottom: 88, left: 0 };
    case 'ios-tablet':
      return { top: 74, right: 0, bottom: 0, left: 0 };
    case 'android':
      return { top: 80, right: 0, bottom: 48, left: 0 };
    default:
      return none;
  }
}

/** CSS viewport the page sees: the oriented screen minus device chrome. */
export function contentViewport(device: Pick<WorkspaceDevice, 'profileId' | 'width' | 'height' | 'orientation' | 'frameMode'>) {
  const screen = orientedViewport(device);
  const insets = deviceInsets(device);
  return {
    width: Math.max(100, screen.width - insets.left - insets.right),
    height: Math.max(100, screen.height - insets.top - insets.bottom),
  };
}

export function previewDimensions(device: WorkspaceDevice, workspaceScale: number) {
  const viewport = orientedViewport(device);
  const scale = Math.max(0.25, workspaceScale * device.panelScale);
  return { width: viewport.width * scale, height: viewport.height * scale, cssWidth: viewport.width, cssHeight: viewport.height };
}

export function createWorkspaceDevice(profile: DeviceProfile, id: string, url = 'https://example.com'): WorkspaceDevice {
  return {
    id,
    profileId: profile.id,
    name: profile.name,
    width: profile.width,
    height: profile.height,
    orientation: profile.width > profile.height ? 'landscape' : 'portrait',
    frameMode: 'device',
    panelScale: 1,
    url,
  };
}

export function normalizeHttpUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Enter a website address.');
  const hasHttpScheme = /^https?:\/\//i.test(trimmed);
  const looksLikeHostAndPort = /^[a-z\d.-]+:\d+(?:\/|$)/i.test(trimmed);
  if (!hasHttpScheme && /^[a-z][a-z\d+.-]*:/i.test(trimmed) && !looksLikeHostAndPort) {
    throw new Error('Only HTTP and HTTPS websites can be opened.');
  }
  const localDevelopmentHost = /^(?:localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?(?:\/|$)/i.test(trimmed);
  const candidate = hasHttpScheme ? trimmed : `${localDevelopmentHost ? 'http' : 'https'}://${trimmed}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error('Enter a valid website address.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS websites can be opened.');
  }
  if (!url.hostname) throw new Error('Enter a valid website address.');
  return url.toString();
}

export function normalizedScrollPosition(scrollTop: number, scrollHeight: number, clientHeight: number): number {
  const range = Math.max(0, scrollHeight - clientHeight);
  return range === 0 ? 0 : Math.min(1, Math.max(0, scrollTop / range));
}
