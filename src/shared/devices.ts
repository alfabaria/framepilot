import { DEVICE_PROFILES, LEGACY_PROFILE_IDS } from './device-catalog';
import type { DeviceProfile } from './device-catalog';
import { layoutFrame } from './frame-geometry';
import type { FrameLayout } from './frame-geometry';

export { DEVICE_GROUP_ORDER, DEVICE_PROFILES } from './device-catalog';
export type { DeviceCategory, DeviceChromeKind, DeviceGroup, DeviceProfile } from './device-catalog';
export type { DeviceFrameSpec } from './frame-geometry';

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

export const INITIAL_DEVICE_PROFILE_IDS = ['desktop-hd', 'iphone-14', 'ipad'] as const;
export const MAX_DEVICE_COUNT = 6;
export const MIN_DEVICE_COUNT = 1;

export function getDeviceProfile(profileId: string): DeviceProfile {
  const resolved = LEGACY_PROFILE_IDS[profileId] ?? profileId;
  const profile = DEVICE_PROFILES.find(({ id }) => id === resolved);
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
  const profile = getDeviceProfile(device.profileId);
  const { statusHeight, homeButton, cutout } = profile.frame;
  switch (profile.chrome) {
    case 'ios-phone':
      // Notched and island phones keep content clear of the camera cutout when held in landscape.
      return landscape
        ? { top: 56, right: 0, bottom: homeButton ? 0 : 21, left: cutout.kind === 'none' ? 0 : 56 }
        : { top: statusHeight, right: 0, bottom: homeButton ? 76 : 88, left: 0 };
    case 'ios-tablet':
      return { top: statusHeight + 50, right: 0, bottom: 0, left: 0 };
    case 'android':
      return { top: statusHeight + 52, right: 0, bottom: homeButton ? 0 : 48, left: 0 };
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

/** Frame layout for a device, or null when it is shown borderless. Landscape phones and tablets turn the portrait artwork. */
export function layoutDeviceFrame(device: WorkspaceDevice, workspaceScale: number): FrameLayout | null {
  if (device.frameMode !== 'device') return null;
  const profile = getDeviceProfile(device.profileId);
  const view = previewDimensions(device, workspaceScale);
  const rotate = (device.orientation === 'landscape') !== (profile.width > profile.height);
  return layoutFrame(profile.frame, view.cssWidth, view.cssHeight, view.width / view.cssWidth, rotate);
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
