import { computeFrame } from '../shared/frame-geometry';
import type { DeviceProfile } from '../shared/devices';
import { DeviceFrameArt } from './device-frame-art';
import { deviceThumbnailUrl } from './device-thumbnails';

const BOX_WIDTH = 34;
const BOX_HEIGHT = 30;

/** A device's thumbnail photo for the device lists, falling back to a miniature of its drawn frame artwork. */
export function DeviceThumb({ profile }: { profile: Pick<DeviceProfile, 'id' | 'frame' | 'width' | 'height'> }) {
  const url = deviceThumbnailUrl(profile.id);
  if (url) {
    return (
      <span className="device-thumb" aria-hidden="true">
        <img className="device-thumb-photo" src={url} alt="" draggable={false} decoding="async" />
      </span>
    );
  }
  const plain = computeFrame(profile.frame, profile.width, profile.height);
  const plainScale = Math.min(BOX_WIDTH / plain.width, BOX_HEIGHT / plain.height);
  // At this size a real metal band is a fraction of a pixel, so it is thickened to keep the finish colour visible.
  const spec = profile.frame.family === 'phone' || profile.frame.family === 'tablet'
    ? { ...profile.frame, band: Math.max(profile.frame.band, 1.3 / plainScale) }
    : profile.frame;
  const geometry = computeFrame(spec, profile.width, profile.height);
  const k = Math.min(BOX_WIDTH / geometry.width, BOX_HEIGHT / geometry.height);
  const { screen } = geometry;
  return (
    <span className="device-thumb" aria-hidden="true">
      <span className="device-thumb-art" style={{ width: geometry.width * k, height: geometry.height * k }}>
        <span className="device-thumb-screen" style={{ left: screen.x * k, top: screen.y * k, width: screen.width * k, height: screen.height * k, borderRadius: geometry.screenRadius * k }} />
        <DeviceFrameArt spec={spec} geometry={geometry} className="device-thumb-frame" />
      </span>
    </span>
  );
}
