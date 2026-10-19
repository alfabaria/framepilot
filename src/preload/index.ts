import { contextBridge, ipcRenderer } from 'electron';
import type { FramePilotBridge, DeviceRuntimeState, DeviceSnapshot } from '../shared/ipc';

const bridge: FramePilotBridge = {
  initialize: () => ipcRenderer.invoke('workspace:initialize'),
  navigate: (id, url) => ipcRenderer.invoke('device:navigate', id, url),
  back: (id) => ipcRenderer.invoke('device:back', id),
  forward: (id) => ipcRenderer.invoke('device:forward', id),
  reload: (id) => ipcRenderer.invoke('device:reload', id),
  updateDevice: (id, device) => ipcRenderer.invoke('device:update', id, device),
  addDevice: (profileId) => ipcRenderer.invoke('device:add', profileId),
  removeDevice: (id) => ipcRenderer.invoke('device:remove', id),
  saveSettings: (settings) => ipcRenderer.invoke('workspace:save', settings),
  layout: (bounds) => ipcRenderer.invoke('workspace:layout', bounds),
  openDevTools: (id) => ipcRenderer.invoke('device:devtools', id),
  capture: (id) => ipcRenderer.invoke('device:capture', id),
  onState: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, state: DeviceRuntimeState) => callback(state);
    ipcRenderer.on('device:state', listener);
    return () => ipcRenderer.removeListener('device:state', listener);
  },
  onError: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, error: { id: string; message: string; category: string; time: number }) => callback(error);
    ipcRenderer.on('device:error', listener);
    return () => ipcRenderer.removeListener('device:error', listener);
  },
  onSnapshot: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: DeviceSnapshot) => callback(snapshot);
    ipcRenderer.on('device:snapshot', listener);
    return () => ipcRenderer.removeListener('device:snapshot', listener);
  },
  onFocusAddress: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('workspace:focus-address', listener);
    return () => ipcRenderer.removeListener('workspace:focus-address', listener);
  },
};

contextBridge.exposeInMainWorld('framePilot', bridge);
