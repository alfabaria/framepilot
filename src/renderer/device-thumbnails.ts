const images = import.meta.glob<string>('./assets/device-thumbnails/*.png', { eager: true, query: '?url', import: 'default' });

const urlByFile = new Map(Object.entries(images).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -'.png'.length), url]));

/** Profile ids whose artwork file is not named after the id. */
const FILE_BY_PROFILE_ID: Readonly<Record<string, string>> = {
  'desktop-hd': 'desktop-mdpi',
  'desktop-4k': 'desktop-4k-1x-scale',
  'imac-retina-4k-21': 'imac-retina-4k-21.5-inch',
  'imac-retina-45k-24': 'imac-retina-4.5k-24-inch',
  'imac-pro-5k-27': 'imac-pro-retina-5k-27-inch',
};

/** The bundled thumbnail photo for a device profile, or undefined when none was supplied. */
export function deviceThumbnailUrl(profileId: string): string | undefined {
  return urlByFile.get(FILE_BY_PROFILE_ID[profileId] ?? profileId);
}
