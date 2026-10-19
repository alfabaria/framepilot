import { describe, expect, it } from 'vitest';
import { DEVICE_PROFILES, createWorkspaceDevice, getDeviceProfile, layoutDeviceFrame } from '../src/shared/devices';
import { LEGACY_PROFILE_IDS } from '../src/shared/device-catalog';
import { computeFrame, layoutFrame } from '../src/shared/frame-geometry';

describe('device catalog', () => {
  it('has unique ids and a plausible viewport, pixel ratio and user agent for every model', () => {
    const ids = DEVICE_PROFILES.map((profile) => profile.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const profile of DEVICE_PROFILES) {
      expect(profile.width).toBeGreaterThanOrEqual(300);
      expect(profile.height).toBeGreaterThanOrEqual(500);
      expect([1, 2, 2.625, 2.75, 2.8125, 3, 3.5, 3.75, 4]).toContain(profile.deviceScaleFactor);
      if (profile.mobile) expect(profile.userAgent).toMatch(/iPhone|iPad|Android/);
      else expect(profile.userAgent).toBeUndefined();
    }
  });

  it('covers every phone, tablet and desktop family', () => {
    const names = new Set(DEVICE_PROFILES.map((profile) => profile.name));
    for (const name of ['iPhone SE (2022)', 'iPhone 14 Pro Max', 'iPhone 16 Pro Max', 'iPad mini', 'Galaxy S24 Ultra', 'Galaxy S6', 'Pixel 8 Pro', 'Pixel', 'iMac 24″ 4.5K', 'MacBook Air', 'LG G6']) {
      expect(names).toContain(name);
    }
    expect(DEVICE_PROFILES.length).toBeGreaterThanOrEqual(90);
  });

  it('keeps saved workspaces from earlier versions opening', () => {
    for (const [legacy, current] of Object.entries(LEGACY_PROFILE_IDS)) {
      expect(getDeviceProfile(legacy).id).toBe(current);
    }
    for (const id of ['desktop-hd', 'desktop-fhd', 'laptop', 'iphone-14', 'iphone-15-pro', 'ipad']) {
      expect(getDeviceProfile(id).id).toBe(id);
    }
  });
});

describe('device frame geometry', () => {
  it('opens exactly the screen: the aperture is the requested screen size for every model, portrait or landscape', () => {
    for (const profile of DEVICE_PROFILES) {
      const natural = createWorkspaceDevice(profile, 'd');
      const layout = layoutDeviceFrame(natural, 1);
      expect(layout, profile.id).not.toBeNull();
      expect(layout!.geometry.screen.width).toBeCloseTo(natural.width, 6);
      expect(layout!.geometry.screen.height).toBeCloseTo(natural.height, 6);
      // The screen opening lies inside the artwork, with the frame around it.
      expect(layout!.screenLeft).toBeGreaterThan(0);
      expect(layout!.screenTop).toBeGreaterThan(0);
      expect(layout!.screenLeft + natural.width).toBeLessThan(layout!.width);
      expect(layout!.screenTop + natural.height).toBeLessThan(layout!.height);
    }
  });

  it('turns a landscape phone counter-clockwise: the camera side becomes the left edge', () => {
    const phone = createWorkspaceDevice(getDeviceProfile('iphone-14-pro'), 'p');
    const portrait = layoutDeviceFrame(phone, 1)!;
    const landscape = layoutDeviceFrame({ ...phone, orientation: 'landscape' }, 1)!;
    expect(portrait.rotation).toBe(0);
    expect(landscape.rotation).toBe(-90);
    expect(landscape.width).toBeCloseTo(portrait.height, 6);
    expect(landscape.height).toBeCloseTo(portrait.width, 6);
    // Portrait top bezel (with the island) becomes the left bezel.
    expect(landscape.screenLeft).toBeCloseTo(portrait.screenTop, 6);
    // Portrait left bezel becomes the bottom bezel.
    expect(landscape.height - landscape.screenTop - phone.width).toBeCloseTo(portrait.screenLeft, 6);
  });

  it('scales a frame linearly with the preview scale', () => {
    const profile = getDeviceProfile('iphone-15');
    const full = layoutFrame(profile.frame, profile.width, profile.height, 1, false);
    const half = layoutFrame(profile.frame, profile.width, profile.height, 0.5, false);
    expect(half.width).toBeCloseTo(full.width / 2, 6);
    expect(half.screenLeft).toBeCloseTo(full.screenLeft / 2, 6);
    expect(half.radiusRatio).toBeCloseTo(full.radiusRatio, 6);
  });

  it('never lets the camera cutout reach the page area that sits below the status bar', () => {
    for (const profile of DEVICE_PROFILES) {
      const { cutout, statusHeight } = profile.frame;
      if (cutout.kind === 'notch') expect(cutout.height).toBeLessThanOrEqual(statusHeight);
      if (cutout.kind === 'island') expect(cutout.top + cutout.height).toBeLessThanOrEqual(statusHeight);
      if (cutout.kind === 'punch') expect(cutout.top + 2 * cutout.radius).toBeLessThanOrEqual(statusHeight + 8);
    }
  });

  it('keeps desktop frame proportions tied to the screen width', () => {
    const profile = getDeviceProfile('desktop-hd');
    const small = computeFrame(profile.frame, 720, 450);
    const large = computeFrame(profile.frame, 1440, 900);
    expect(large.width / small.width).toBeCloseTo(2, 6);
    expect(large.height / small.height).toBeCloseTo(2, 6);
  });
});
