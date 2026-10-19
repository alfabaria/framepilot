import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { DEVICE_PROFILES } from '../src/shared/devices';
import { deviceFrames, layoutDeviceFrame } from '../src/renderer/device-frames';

describe('device frame asset mapping', () => {
  it('maps every supported profile to the requested frame image', () => {
    expect(Object.fromEntries(DEVICE_PROFILES.map((profile) => [profile.id, profile.frameKey]))).toEqual({
      'desktop-hd': 'desktopHd',
      'desktop-fhd': 'desktopFullHd',
      laptop: 'laptop',
      ipad: 'ipad',
      'large-tablet': 'largeTablet',
      'iphone-14': 'iphone14',
      'iphone-15-pro': 'iphone15Pro',
      'iphone-pro-max': 'iphoneProMax',
      'android-phone': 'androidPhone',
      'small-mobile': 'smallMobile',
    });
  });

  it('uses the supplied PNG filenames and rotates landscape frame apertures', () => {
    expect(Object.fromEntries(Object.entries(deviceFrames).map(([key, frame]) => [key, frame.file]))).toEqual({
      desktopHd: 'frame-01.png',
      desktopFullHd: 'frame-02.png',
      laptop: 'frame-03.png',
      ipad: 'frame-04.png',
      largeTablet: 'frame-05.png',
      iphone14: 'frame-06.png',
      iphone15Pro: 'frame-07.png',
      iphoneProMax: 'frame-08.png',
      androidPhone: 'frame-09.png',
      smallMobile: 'frame-10.png',
    });
    for (const profile of DEVICE_PROFILES) {
      const asset = deviceFrames[profile.frameKey];
      const portrait = layoutDeviceFrame(profile.frameKey, 390, 844, false);
      const landscape = layoutDeviceFrame(profile.frameKey, 844, 390, true);
      const topMargin = asset.screen.top / asset.imageHeight;
      const leftMargin = asset.screen.left / asset.imageWidth;
      expect(portrait.rotation).toBe(0);
      expect(landscape.rotation).toBe(-90);
      expect(portrait.screenTop / portrait.height).toBeCloseTo(topMargin);
      expect(portrait.screenLeft / portrait.width).toBeCloseTo(leftMargin);
      // Rotating the device counter-clockwise moves the top bezel (camera island/notch) to the left of the screen
      // and the left bezel to the bottom.
      expect(landscape.screenLeft / landscape.width).toBeCloseTo(topMargin);
      const bottomMargin = 1 - (landscape.screenTop + 390) / landscape.height;
      expect(bottomMargin).toBeCloseTo(leftMargin);
      expect(landscape.width).toBeGreaterThan(844);
    }
  });
});

type Aperture = { left: number; top: number; right: number; bottom: number };

function decodeAlpha(path: string): { width: number; height: number; alpha: Uint8Array } {
  const png = readFileSync(path);
  let offset = 8;
  let width = 0;
  let height = 0;
  const data: Buffer[] = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const body = png.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      if (body[8] !== 8 || body[9] !== 6 || body[12] !== 0) throw new Error('Frame fixtures must be 8-bit non-interlaced RGBA PNG files.');
    }
    if (type === 'IDAT') data.push(body);
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(data));
  const stride = width * 4;
  const pixels = new Uint8Array(stride * height);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)] ?? 0;
    const row = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const value = raw[y * (stride + 1) + 1 + x] ?? 0;
      const left = x >= 4 ? pixels[row + x - 4] ?? 0 : 0;
      const up = y > 0 ? pixels[row - stride + x] ?? 0 : 0;
      const upLeft = y > 0 && x >= 4 ? pixels[row - stride + x - 4] ?? 0 : 0;
      const estimate = left + up - upLeft;
      const distanceLeft = Math.abs(estimate - left);
      const distanceUp = Math.abs(estimate - up);
      const distanceUpLeft = Math.abs(estimate - upLeft);
      const paeth = distanceLeft <= distanceUp && distanceLeft <= distanceUpLeft ? left : distanceUp <= distanceUpLeft ? up : upLeft;
      const predictor = filter === 1 ? left : filter === 2 ? up : filter === 3 ? (left + up) >> 1 : filter === 4 ? paeth : 0;
      pixels[row + x] = (value + predictor) & 255;
    }
  }
  const alpha = new Uint8Array(width * height);
  for (let index = 0; index < alpha.length; index += 1) alpha[index] = pixels[index * 4 + 3] ?? 0;
  return { width, height, alpha };
}

function transparentScreenAt(path: string): { width: number; height: number; aperture: Aperture } {
  const { width, height, alpha } = decodeAlpha(path);
  const seen = new Uint8Array(width * height);
  const stack = [Math.floor(height / 2) * width + Math.floor(width / 2)];
  const aperture = { left: width, top: height, right: 0, bottom: 0 };
  while (stack.length) {
    const index = stack.pop()!;
    if (seen[index] || (alpha[index] ?? 255) >= 128) continue;
    seen[index] = 1;
    const x = index % width;
    const y = Math.floor(index / width);
    aperture.left = Math.min(aperture.left, x);
    aperture.top = Math.min(aperture.top, y);
    aperture.right = Math.max(aperture.right, x + 1);
    aperture.bottom = Math.max(aperture.bottom, y + 1);
    if (x > 0) stack.push(index - 1);
    if (x < width - 1) stack.push(index + 1);
    if (y > 0) stack.push(index - width);
    if (y < height - 1) stack.push(index + width);
  }
  return { width, height, aperture };
}

describe('device frame screen apertures', () => {
  it.each(Object.entries(deviceFrames))('%s aperture matches the transparent screen in the supplied PNG', (_key, frame) => {
    const measured = transparentScreenAt(`src/renderer/assets/device-frames/${frame.file}`);
    expect([frame.imageWidth, frame.imageHeight]).toEqual([measured.width, measured.height]);
    expect(frame.screen).toEqual(measured.aperture);
  });
});
