import { describe, expect, it } from 'vitest';
import { createWorkspaceDevice, getDeviceProfile } from '../src/shared/devices';
import { parsePersistedWorkspace } from '../src/shared/workspace-settings';

describe('saved workspace migration', () => {
  it('moves legacy workspaces to side-by-side, synchronized local development previews', () => {
    const desktop = { ...createWorkspaceDevice(getDeviceProfile('desktop-hd'), 'device-1', 'http://localhost:3001/'), frameMode: 'borderless' as const };
    const phone = createWorkspaceDevice(getDeviceProfile('iphone-14'), 'device-2');
    const { settings, migrated } = parsePersistedWorkspace({
      devices: [desktop, phone],
      syncUrl: false,
      syncScroll: false,
      workspaceScale: 0.32,
      layoutMode: 'grid',
    });

    expect(migrated).toBe(true);
    expect(settings).toMatchObject({ schemaVersion: 2, layoutMode: 'horizontal', syncUrl: true, syncScroll: true });
    expect(settings.devices.map(({ url }) => url)).toEqual(['http://localhost:3001/', 'http://localhost:3001/']);
    expect(settings.devices.map(({ frameMode }) => frameMode)).toEqual(['device', 'device']);
  });

  it('preserves explicit choices saved with the current schema version', () => {
    const desktop = createWorkspaceDevice(getDeviceProfile('desktop-hd'), 'device-1');
    const { settings, migrated } = parsePersistedWorkspace({
      schemaVersion: 2,
      devices: [desktop],
      syncUrl: false,
      syncScroll: false,
      workspaceScale: 0.32,
      layoutMode: 'vertical',
    });

    expect(migrated).toBe(false);
    expect(settings).toMatchObject({ schemaVersion: 2, layoutMode: 'vertical', syncUrl: false, syncScroll: false });
  });

  it('migrates stored zoom values below the native page zoom minimum', () => {
    const desktop = createWorkspaceDevice(getDeviceProfile('desktop-hd'), 'device-1');
    const { settings, migrated } = parsePersistedWorkspace({
      schemaVersion: 2,
      devices: [desktop],
      syncUrl: true,
      syncScroll: true,
      workspaceScale: 0.12,
      layoutMode: 'horizontal',
    });
    expect(migrated).toBe(true);
    expect(settings.workspaceScale).toBe(0.25);
  });
});
