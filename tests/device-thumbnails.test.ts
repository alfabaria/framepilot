import { describe, expect, it } from 'vitest';
import { DEVICE_PROFILES } from '../src/shared/devices';
import { deviceThumbnailUrl } from '../src/renderer/device-thumbnails';

// No thumbnail photo was supplied for these; they keep the drawn frame miniature.
const WITHOUT_PHOTO = ['desktop-fhd', 'galaxy-note-8', 'imac-retina-5k-27', 'ipad', 'laptop'];

describe('device thumbnails', () => {
  it('has a bundled photo for every profile except the ones known to lack one', () => {
    const missing = DEVICE_PROFILES.filter((profile) => !deviceThumbnailUrl(profile.id)).map((profile) => profile.id);
    expect(missing.sort()).toEqual(WITHOUT_PHOTO);
  });
  it('maps renamed artwork files onto their profiles', () => {
    expect(deviceThumbnailUrl('desktop-4k')).toMatch(/desktop-4k-1x-scale/);
    expect(deviceThumbnailUrl('imac-retina-45k-24')).toMatch(/imac-retina-4\.5k-24-inch/);
  });
});
