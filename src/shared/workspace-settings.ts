import { z } from 'zod';
import { getDeviceProfile, MAX_DEVICE_COUNT, MIN_DEVICE_COUNT, normalizeHttpUrl } from './devices';

export const deviceSettingsSchema = z.object({
  id: z.string().min(1).max(64),
  profileId: z.string().min(1).max(64),
  name: z.string().min(1).max(80),
  width: z.number().int().min(240).max(2400),
  height: z.number().int().min(240).max(2400),
  orientation: z.enum(['portrait', 'landscape']),
  frameMode: z.enum(['device', 'borderless']),
  panelScale: z.number().min(0.5).max(1.8).default(1),
  url: z.string().max(2048).transform((url) => normalizeHttpUrl(url)),
});

export const workspaceSettingsSchema = z.object({
  schemaVersion: z.literal(2).default(2),
  devices: z.array(deviceSettingsSchema).min(MIN_DEVICE_COUNT).max(MAX_DEVICE_COUNT),
  syncUrl: z.boolean(),
  syncScroll: z.boolean(),
  workspaceScale: z.number().min(0.12).max(1).transform((scale) => Math.max(0.25, scale)),
  layoutMode: z.enum(['grid', 'horizontal', 'vertical']).default('horizontal'),
});

export function parsePersistedWorkspace(raw: unknown): { settings: z.infer<typeof workspaceSettingsSchema>; migrated: boolean } {
  const isLegacy = typeof raw !== 'object' || raw === null || !Object.hasOwn(raw, 'schemaVersion');
  const settings = workspaceSettingsSchema.parse(raw);
  let migrated = isLegacy || (typeof raw === 'object' && raw !== null && 'workspaceScale' in raw && typeof raw.workspaceScale === 'number' && raw.workspaceScale < 0.25);

  if (isLegacy) {
    settings.syncUrl = true;
    settings.syncScroll = true;
    settings.layoutMode = 'horizontal';
    for (const device of settings.devices) {
      const category = getDeviceProfile(device.profileId).category;
      if (category === 'desktop' || category === 'laptop') device.frameMode = 'device';
    }
  }

  if (settings.syncUrl && settings.devices.length > 1) {
    const sharedUrl = settings.devices[0]!.url;
    for (const device of settings.devices.slice(1)) {
      if (device.url !== sharedUrl) {
        device.url = sharedUrl;
        migrated = true;
      }
    }
  }

  return { settings, migrated };
}
