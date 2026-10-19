import { describe, expect, it } from 'vitest';
import { createWorkspaceDevice, getDeviceProfile } from '../src/shared/devices';
import type { DeviceRuntimeState, WorkspaceSettings } from '../src/shared/ipc';
import { useWorkspace } from '../src/renderer/store';
describe('workspace defaults', () => {
  it('starts with side-by-side previews and synchronized navigation and scrolling', () => {
    expect(useWorkspace.getState()).toMatchObject({
      layoutMode: 'horizontal',
      syncUrl: true,
      syncScroll: true,
    });
  });
});

describe('workspace zoom', () => {
  it('stays within Chromium native page zoom bounds', () => {
    useWorkspace.getState().setScale(0.12);
    expect(useWorkspace.getState().workspaceScale).toBe(0.25);
  });
});

describe('workspace URL persistence', () => {
  it('retains an in-page navigation URL in the settings snapshot', () => {
    const profile = getDeviceProfile('desktop-hd');
    const device = createWorkspaceDevice(profile, 'device-1', 'http://127.0.0.1:4179/');
    const settings: WorkspaceSettings = {
      schemaVersion: 2,
      devices: [device],
      syncUrl: true,
      syncScroll: false,
      workspaceScale: 0.32,
      layoutMode: 'grid',
    };
    const state: DeviceRuntimeState = {
      id: device.id,
      url: device.url,
      loading: false,
      canGoBack: false,
      canGoForward: false,
      error: null,
      title: device.name,
    };
    useWorkspace.getState().hydrate({ settings, profiles: [profile], states: [state] });

    const navigatedUrl = 'http://127.0.0.1:4179/#checkpoint';
    useWorkspace.getState().setRuntime({ ...state, url: navigatedUrl });

    expect(useWorkspace.getState().devices[0]?.url).toBe(navigatedUrl);
  });
});
