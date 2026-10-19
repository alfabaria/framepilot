import type { FramePilotBridge } from '../shared/ipc';

declare global {
  interface Window {
    framePilot: FramePilotBridge;
  }
}

export {};
