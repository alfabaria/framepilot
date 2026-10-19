import { create } from 'zustand';
import type { DeviceProfile, WorkspaceDevice } from '../shared/devices';
import type { DeviceRuntimeState, WorkspaceSettings } from '../shared/ipc';

type WorkspaceStore = WorkspaceSettings & {
  profiles: DeviceProfile[];
  runtime: Record<string, DeviceRuntimeState>;
  activeId: string;
  initialized: boolean;
  errors: { id: string; message: string; category: string; time: number }[];
  hydrate(value: { settings: WorkspaceSettings; profiles: DeviceProfile[]; states: DeviceRuntimeState[] }): void;
  setActive(id: string): void;
  setRuntime(state: DeviceRuntimeState): void;
  add(device: WorkspaceDevice): void;
  remove(id: string): void;
  update(id: string, patch: Partial<WorkspaceDevice>): void;
  reorder(sourceId: string, targetId: string): void;
  setSyncUrl(enabled: boolean): void;
  setSyncScroll(enabled: boolean): void;
  setScale(scale: number): void;
  setLayoutMode(mode: WorkspaceSettings['layoutMode']): void;
  addError(error: { id: string; message: string; category: string; time: number }): void;
};

export const useWorkspace = create<WorkspaceStore>((set) => ({
  schemaVersion: 2, devices: [], syncUrl: true, syncScroll: true, workspaceScale: 0.32, layoutMode: 'horizontal',
  profiles: [], runtime: {}, activeId: '', initialized: false, errors: [],
  hydrate(value) {
    set({
      ...value.settings,
      profiles: value.profiles,
      runtime: Object.fromEntries(value.states.map((state) => [state.id, state])),
      activeId: value.settings.devices[0]?.id ?? '',
      initialized: true,
    });
  },
  setActive(activeId) { set({ activeId }); },
  setRuntime(state) {
    set((current) => {
      const device = current.devices.find(({ id }) => id === state.id);
      return {
        runtime: { ...current.runtime, [state.id]: state },
        ...(device && device.url !== state.url
          ? { devices: current.devices.map((entry) => entry.id === state.id ? { ...entry, url: state.url } : entry) }
          : {}),
      };
    });
  },
  add(device) { set((current) => ({ devices: [...current.devices, device], activeId: device.id })); },
  remove(id) {
    set((current) => {
      const devices = current.devices.filter((device) => device.id !== id);
      return { devices, activeId: current.activeId === id ? devices[0]?.id ?? '' : current.activeId };
    });
  },
  update(id, patch) {
    set((current) => ({ devices: current.devices.map((device) => device.id === id ? { ...device, ...patch } : device) }));
  },
  reorder(sourceId, targetId) {
    set((current) => {
      const from = current.devices.findIndex((device) => device.id === sourceId);
      const to = current.devices.findIndex((device) => device.id === targetId);
      if (from < 0 || to < 0 || from === to) return current;
      const devices = [...current.devices];
      const [moved] = devices.splice(from, 1);
      devices.splice(to, 0, moved!);
      return { devices };
    });
  },
  setSyncUrl(syncUrl) { set({ syncUrl }); },
  setSyncScroll(syncScroll) { set({ syncScroll }); },
  setScale(workspaceScale) { set({ workspaceScale: Math.max(0.25, Math.min(1, workspaceScale)) }); },
  setLayoutMode(layoutMode) { set({ layoutMode }); },
  addError(error) { set((current) => ({ errors: [error, ...current.errors].slice(0, 100) })); },
}));
