import type { DeviceProfile, WorkspaceDevice } from './devices';

export type DeviceRuntimeState = {
  id: string;
  url: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  error: string | null;
  title: string;
};

export type WorkspaceSettings = {
  schemaVersion: 2;
  devices: WorkspaceDevice[];
  syncUrl: boolean;
  syncScroll: boolean;
  workspaceScale: number;
  layoutMode: 'grid' | 'horizontal' | 'vertical';
};

export type DeviceBounds = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  visible: boolean;
  /** Radius of transparent wedge masks drawn over the page's bottom corners when only those corners touch the frame; 0 for none. */
  maskRadius: number;
};

export type DeviceSnapshot = {
  id: string;
  /** Last frame of a preview whose native view is hidden; null once the live view is visible again. */
  dataUrl: string | null;
};

export type FramePilotBridge = {
  initialize(): Promise<{ settings: WorkspaceSettings; profiles: DeviceProfile[]; states: DeviceRuntimeState[] }>;
  navigate(id: string, url: string): Promise<void>;
  back(id: string): Promise<void>;
  forward(id: string): Promise<void>;
  reload(id: string): Promise<void>;
  updateDevice(id: string, device: WorkspaceDevice): Promise<void>;
  addDevice(profileId: string): Promise<WorkspaceDevice>;
  removeDevice(id: string): Promise<void>;
  saveSettings(settings: WorkspaceSettings): Promise<void>;
  layout(bounds: DeviceBounds[]): Promise<void>;
  openDevTools(id: string): Promise<void>;
  capture(id: string | null): Promise<{ saved: string[] }>;
  onState(callback: (state: DeviceRuntimeState) => void): () => void;
  onError(callback: (error: { id: string; message: string; category: string; time: number }) => void): () => void;
  onSnapshot(callback: (snapshot: DeviceSnapshot) => void): () => void;
  onFocusAddress(callback: () => void): () => void;
  onActivate(callback: (id: string) => void): () => void;
};
