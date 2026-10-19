import { describe, expect, it } from 'vitest';
import { DEVICE_PROFILES, canRotate, contentViewport, createWorkspaceDevice, deviceInsets, getDeviceProfile, normalizeHttpUrl, normalizedScrollPosition, orientedViewport, previewDimensions, supportedOrientation } from '../src/shared/devices';

describe('device workspace behavior', () => {
  it('keeps the emulated CSS viewport fixed while orientation swaps its axes', () => {
    const phone = createWorkspaceDevice(getDeviceProfile('iphone-14'), 'phone-1');
    expect(orientedViewport(phone)).toEqual({ width: 390, height: 844 });
    expect(orientedViewport({ ...phone, orientation: 'landscape' })).toEqual({ width: 844, height: 390 });
  });
  it('scales the preview canvas without changing the device CSS viewport', () => {
    const phone = createWorkspaceDevice(getDeviceProfile('iphone-14'), 'phone-1');
    expect(previewDimensions(phone, 0.3)).toEqual({ width: 117, height: 253.2, cssWidth: 390, cssHeight: 844 });
    expect(phone).toMatchObject({ width: 390, height: 844 });
  });
  it('reserves status-bar and browser-toolbar space so the page viewport is the screen minus device chrome', () => {
    const phone = createWorkspaceDevice(getDeviceProfile('iphone-15-pro'), 'phone-1');
    expect(deviceInsets(phone)).toEqual({ top: 54, right: 0, bottom: 88, left: 0 });
    expect(contentViewport(phone)).toEqual({ width: 393, height: 710 });
    const landscape = { ...phone, orientation: 'landscape' as const };
    expect(deviceInsets(landscape)).toEqual({ top: 56, right: 0, bottom: 21, left: 56 });
    expect(contentViewport(landscape)).toEqual({ width: 796, height: 316 });
  });
  it('gives desktop previews and borderless previews the full screen as viewport', () => {
    const desktop = createWorkspaceDevice(getDeviceProfile('desktop-hd'), 'desktop-1');
    expect(contentViewport(desktop)).toEqual({ width: 1440, height: 900 });
    const borderless = { ...createWorkspaceDevice(getDeviceProfile('iphone-14'), 'phone-2'), frameMode: 'borderless' as const };
    expect(contentViewport(borderless)).toEqual({ width: 390, height: 844 });
  });
  it('only lets phones and tablets rotate and pins desktop and laptop screens to landscape', () => {
    expect(DEVICE_PROFILES.filter(canRotate).map(({ category }) => category).every((category) => category === 'phone' || category === 'tablet')).toBe(true);
    for (const id of ['desktop-hd', 'desktop-fhd', 'laptop']) {
      const device = { ...createWorkspaceDevice(getDeviceProfile(id), 'screen-1'), orientation: 'portrait' as const };
      expect(canRotate(getDeviceProfile(id))).toBe(false);
      expect(supportedOrientation(device)).toBe('landscape');
    }
    const phone = { ...createWorkspaceDevice(getDeviceProfile('iphone-14'), 'phone-9'), orientation: 'landscape' as const };
    expect(supportedOrientation(phone)).toBe('landscape');
  });

  it('keeps native page zoom inside the minimum frame scale without changing CSS viewport size', () => {
    const phone = createWorkspaceDevice(getDeviceProfile('iphone-14'), 'phone-1');
    expect(previewDimensions(phone, 0.12)).toEqual({ width: 97.5, height: 211, cssWidth: 390, cssHeight: 844 });
  });

  it('enables a mapped physical frame for every device profile by default', () => {
    for (const profile of DEVICE_PROFILES) {
      expect(createWorkspaceDevice(profile, profile.id).frameMode).toBe('device');
    }
  });
  it('includes device-specific user-agent overrides for mobile emulation', () => {
    expect(getDeviceProfile('iphone-14').userAgent).toContain('(iPhone; CPU iPhone OS');
    expect(getDeviceProfile('ipad').userAgent).toContain('(iPad; CPU OS');
    expect(getDeviceProfile('android-phone').userAgent).toContain('Chrome/{chrome} Mobile');
    expect(getDeviceProfile('desktop-hd').userAgent).toBeUndefined();
  });


  it('defaults bare localhost development URLs to HTTP', () => {
    expect(normalizeHttpUrl('localhost:3001')).toBe('http://localhost:3001/');
  });
  it('accepts local development origins and public HTTPS while rejecting executable schemes', () => {
    expect(normalizeHttpUrl('localhost:5173')).toBe('http://localhost:5173/');
    expect(normalizeHttpUrl('http://127.0.0.1:3000/page')).toBe('http://127.0.0.1:3000/page');
    expect(() => normalizeHttpUrl('file:///etc/passwd')).toThrow('Only HTTP and HTTPS');
    expect(() => normalizeHttpUrl('')).toThrow('Enter a website address');
  });

  it('maps different document heights to the same proportional scroll position', () => {
    expect(normalizedScrollPosition(500, 1100, 100)).toBe(0.5);
    expect(normalizedScrollPosition(1000, 1000, 100)).toBe(1);
    expect(normalizedScrollPosition(0, 400, 800)).toBe(0);
  });
});
