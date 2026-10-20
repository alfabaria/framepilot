import { app, BrowserWindow, dialog, ipcMain, WebContentsView, session } from 'electron';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { contentViewport, createWorkspaceDevice, DEVICE_PROFILES, getDeviceProfile, INITIAL_DEVICE_PROFILE_IDS, MAX_DEVICE_COUNT, normalizeHttpUrl, orientedViewport, supportedOrientation } from '../shared/devices';
import type { DeviceProfile, WorkspaceDevice } from '../shared/devices';
import type { DeviceBounds, DeviceRuntimeState, WorkspaceSettings } from '../shared/ipc';
import { deviceSettingsSchema, parsePersistedWorkspace, workspaceSettingsSchema } from '../shared/workspace-settings';

const boundsSchema = z.array(z.object({
  id: z.string().min(1).max(64),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().positive().max(4800),
  height: z.number().finite().positive().max(4800),
  radius: z.number().finite().min(0).max(200),
  visible: z.boolean(),
  maskRadius: z.number().finite().min(0).max(200),
})).max(MAX_DEVICE_COUNT);
const prefsPath = () => join(app.getPath('userData'), 'workspace.json');
const states = new Map<string, DeviceRuntimeState>();
const views = new Map<string, WebContentsView>();
const presentationScales = new Map<string, number>();
const syncLocks = new Set<string>();
const navigationRevisions = new Map<string, number>();
let navigationRevision = 0;
let window: BrowserWindow | null = null;
const nativeVisibility = new Map<string, boolean>();
const appliedMetrics = new Map<string, string>();
const emulationQueues = new Map<string, Promise<void>>();
/** Per preview: two transparent web views drawn over the page's bottom corners that paint the area outside the screen's rounded corners. */
const cornerCovers = new Map<string, [WebContentsView, WebContentsView]>();
let settings: WorkspaceSettings;
let nextDeviceId = 1;
let syncScroll = false;
const SCROLL_OBSERVER_SOURCE = `(() => {
  if (globalThis.__framePilotScrollInstalled) return;
  globalThis.__framePilotScrollInstalled = true;
  let lastSentAt = 0;
  let trailingTimer = 0;
  const report = () => {
    trailingTimer = 0;
    lastSentAt = performance.now();
    const root = document.scrollingElement;
    const max = root ? Math.max(0, root.scrollHeight - innerHeight) : 0;
    globalThis.__framePilotScroll(max ? String(root.scrollTop / max) : '0');
  };
  addEventListener('scroll', () => {
    const remaining = 32 - (performance.now() - lastSentAt);
    if (remaining <= 0) {
      if (trailingTimer) clearTimeout(trailingTimer);
      report();
    } else if (!trailingTimer) {
      trailingTimer = setTimeout(report, remaining);
    }
  }, { passive: true, capture: true });
})();`;

function defaultSettings(): WorkspaceSettings {
  const devices = INITIAL_DEVICE_PROFILE_IDS.map((profileId) => {
    const profile = getDeviceProfile(profileId);
    return createWorkspaceDevice(profile, `device-${nextDeviceId++}`);
  });
  return { schemaVersion: 2, devices, syncUrl: true, syncScroll: true, workspaceScale: 0.32, layoutMode: 'horizontal' };
}

function persistSettings(): void {
  if (!settings) return;
  try {
    writeFileSync(prefsPath(), JSON.stringify(settings, null, 2), { mode: 0o600 });
  } catch (error) {
    console.error('Unable to save FramePilot workspace:', error);
  }
}

function loadSettings(): WorkspaceSettings {
  const path = prefsPath();
  if (!existsSync(path)) return defaultSettings();
  try {
    const { settings: parsed, migrated } = parsePersistedWorkspace(JSON.parse(readFileSync(path, 'utf8')));
    for (const device of parsed.devices) device.orientation = supportedOrientation(device);
    settings = parsed;
    nextDeviceId = parsed.devices.reduce((max, device) => {
      const suffix = Number(device.id.match(/(\d+)$/)?.[1] ?? 0);
      return Math.max(max, suffix + 1);
    }, 1);
    if (migrated) persistSettings();
    return parsed;
  } catch {
    return defaultSettings();
  }
}

function stateFor(device: WorkspaceDevice): DeviceRuntimeState {
  return { id: device.id, url: device.url, loading: false, canGoBack: false, canGoForward: false, error: null, title: device.name };
}

function sendState(id: string, patch: Partial<DeviceRuntimeState>): void {
  const previous = states.get(id);
  if (!previous) return;
  const state = { ...previous, ...patch };
  states.set(id, state);
  window?.webContents.send('device:state', state);
}

function sendError(id: string, message: string, category: string): void {
  window?.webContents.send('device:error', { id, message, category, time: Date.now() });
}

/** `loadURL` rejects with ERR_ABORTED (-3) when a newer navigation replaces the one in flight; the page still loads. */
function isSupersededNavigation(error: unknown): boolean {
  return error instanceof Error && /ERR_ABORTED|\(-3\)/.test(error.message);
}

async function loadDeviceUrl(id: string, url: string): Promise<void> {
  const device = currentDevice(id);
  const view = views.get(id);
  if (!view) throw new Error(`Browser view is not ready for ${id}.`);
  const revision = ++navigationRevision;
  navigationRevisions.set(id, revision);
  syncLocks.add(id);
  device.url = url;
  states.get(id) && sendState(id, { url, error: null });
  try {
    await view.webContents.loadURL(url);
  } catch (error) {
    if (isSupersededNavigation(error)) return;
    sendState(id, { error: error instanceof Error ? error.message : String(error), loading: false });
    throw error;
  } finally {
    if (navigationRevisions.get(id) === revision) {
      const currentUrl = view.webContents.getURL();
      if (currentUrl.startsWith('http')) {
        device.url = currentUrl;
        states.get(id) && sendState(id, { url: currentUrl });
      }
      navigationRevisions.delete(id);
      syncLocks.delete(id);
    }
  }
}

function emitNavigation(id: string, url: string): void {
  if (!window || !url.startsWith('http') || views.get(id)?.webContents.getURL() !== url) return;
  const device = settings.devices.find(({ id: candidate }) => candidate === id);
  if (device) {
    device.url = url;
    states.get(id) && sendState(id, { url, error: null });
    persistSettings();
  }
  if (!settings.syncUrl) return;
  for (const target of settings.devices) {
    if (target.id === id) continue;
    const targetView = views.get(target.id);
    if (!targetView) continue;
    if (target.url === url && targetView.webContents.getURL() === url) continue;
    void loadDeviceUrl(target.id, url).catch(() => undefined);
  }
  persistSettings();
}

function scrollToRatio(sourceId: string, ratio: number): void {
  if (!syncScroll || !Number.isFinite(ratio) || syncLocks.has(sourceId)) return;
  for (const [id, view] of views) {
    if (id === sourceId) continue;
    const script = `(() => { const root = document.scrollingElement; if (!root) return; const max = Math.max(0, root.scrollHeight - innerHeight); const target = ${Math.max(0, Math.min(1, ratio))} * max; if (Math.abs(root.scrollTop - target) > 2) root.scrollTo({ top: target, behavior: 'instant' }); })()`;
    void view.webContents.executeJavaScript(script, true).catch(() => undefined);
  }
}

async function installScrollObserver(view: WebContentsView, id: string): Promise<void> {
  const contents = view.webContents;
  try {
    await contents.debugger.sendCommand('Runtime.evaluate', { expression: SCROLL_OBSERVER_SOURCE });
  } catch (error) {
    console.warn(`Scroll synchronization is unavailable for ${id}:`, error);
  }
}

function deviceEmulationMetrics(device: WorkspaceDevice, presentationScale: number) {
  const profile = getDeviceProfile(device.profileId);
  const viewport = contentViewport(device);
  const screen = orientedViewport(device);
  // Chromium's mobile emulation paints its full emulated surface regardless of the native view's bounds, so a
  // scaled-down preview would overflow its frame. Emulate every profile as a non-mobile viewport sized to the view and
  // compensate with DPR and page zoom; the profile's user agent, client hints, touch support, and orientation are
  // applied separately.
  const emulationScale = presentationScale;
  const width = Math.max(1, Math.round(viewport.width * emulationScale));
  const height = Math.max(1, Math.round(viewport.height * emulationScale));
  return {
    width,
    height,
    deviceScaleFactor: profile.deviceScaleFactor / emulationScale,
    mobile: false,
    screenWidth: screen.width,
    screenHeight: screen.height,
    ...(profile.touch ? {
      screenOrientation: {
        type: device.orientation === 'landscape' ? 'landscapePrimary' as const : 'portraitPrimary' as const,
        angle: device.orientation === 'landscape' ? 90 : 0,
      },
    } : {}),
  };
}

function profileUserAgent(device: WorkspaceDevice) {
  const profile = getDeviceProfile(device.profileId);
  const chromeVersion = process.versions.chrome;
  const userAgent = profile.userAgent?.replace('{chrome}', chromeVersion)
    ?? `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
  const major = chromeVersion.split('.')[0];
  const platform = /iPhone|iPad/.test(userAgent) ? 'iOS' : /Android/.test(userAgent) ? 'Android' : 'macOS';
  const platformVersion = platform === 'iOS' ? userAgent.match(/OS (\d+)_(\d+)/)?.slice(1, 3).join('.') ?? '17.0' : platform === 'Android' ? '14.0.0' : '15.0.0';
  const safariFamily = platform === 'iOS';
  return {
    userAgent,
    userAgentMetadata: {
      brands: safariFamily ? [] : [{ brand: 'Chromium', version: major }, { brand: 'Google Chrome', version: major }, { brand: 'Not_A Brand', version: '24' }],
      fullVersionList: safariFamily ? [] : [{ brand: 'Chromium', version: chromeVersion }, { brand: 'Google Chrome', version: chromeVersion }, { brand: 'Not_A Brand', version: '24.0.0.0' }],
      platform,
      platformVersion,
      architecture: platform === 'macOS' ? 'arm' : '',
      model: platform === 'iOS' ? (/iPad/.test(userAgent) ? 'iPad' : 'iPhone') : platform === 'Android' ? 'Pixel 8' : '',
      mobile: profile.mobile,
    },
  };
}

/** Touch profiles turn the mouse into a finger: drag to swipe or scroll, Shift-drag to pinch, with the touch cursor. */
async function applyTouchEmulation(contents: Electron.WebContents, profile: DeviceProfile, refreshPointerMedia = false): Promise<void> {
  // Toggling off first makes Chromium recompute pointer/hover media features, but only once a document exists:
  // toggling while a navigation starts would create the new document with touch support off.
  if (profile.touch && refreshPointerMedia) await contents.debugger.sendCommand('Emulation.setTouchEmulationEnabled', { enabled: false });
  await contents.debugger.sendCommand('Emulation.setTouchEmulationEnabled', {
    enabled: profile.touch,
    maxTouchPoints: profile.touch ? 5 : 1,
  });
  await contents.debugger.sendCommand('Emulation.setEmitTouchEventsForMouse', {
    enabled: profile.touch,
    ...(profile.touch ? { configuration: profile.mobile ? 'mobile' as const : 'desktop' as const } : {}),
  });
}

type EmulationRefresh = 'none' | 'ifChanged' | 'always';

/**
 * Applies a device's metrics, user agent, and touch emulation. Every trigger (navigation start, document ready, layout,
 * device update) goes through one per-view queue so overlapping CDP command sequences cannot leave touch emulation off.
 * `force` re-sends metrics even when unchanged; `refresh` toggles touch emulation so pointer media features update.
 */
function queueEmulation(contents: Electron.WebContents, id: string, options: { force: boolean; refresh: EmulationRefresh }): Promise<void> {
  const run = async (): Promise<void> => {
    const device = settings.devices.find((candidate) => candidate.id === id);
    if (!device || contents.isDestroyed()) return;
    const profile = getDeviceProfile(device.profileId);
    const presentationScale = presentationScales.get(id) ?? 1;
    const metrics = deviceEmulationMetrics(device, presentationScale);
    const metricsKey = JSON.stringify(metrics);
    const changed = appliedMetrics.get(id) !== metricsKey;
    if (!changed && !options.force && options.refresh !== 'always') return;
    if (changed || options.force) {
      const identity = profileUserAgent(device);
      appliedMetrics.set(id, metricsKey);
      contents.setUserAgent(identity.userAgent);
      await contents.debugger.sendCommand('Emulation.setDeviceMetricsOverride', metrics);
      await contents.debugger.sendCommand('Emulation.setUserAgentOverride', identity);
    }
    // Zoom changes and navigations can drop touch emulation, so zoom first and let touch be applied last.
    contents.setZoomFactor(presentationScale);
    const refreshPointerMedia = options.refresh === 'always' || (options.refresh === 'ifChanged' && changed);
    await applyTouchEmulation(contents, profile, refreshPointerMedia);
  };
  const next = (emulationQueues.get(id) ?? Promise.resolve()).then(run).catch((error: Error) => {
    console.warn(`Device emulation is unavailable for ${id}:`, error);
  });
  emulationQueues.set(id, next);
  return next;
}


function configureDeviceView(device: WorkspaceDevice, view: WebContentsView): void {
  const contents = view.webContents;
  const browserSession = session.fromPartition(`persist:framepilot-${device.id}`);
  browserSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  browserSession.setPermissionCheckHandler(() => false);
  browserSession.on('will-download', (_event, item) => {
    item.cancel();
    sendError(device.id, `Blocked download: ${item.getFilename()}`, 'security');
  });
  const rejectUnsafeNavigation = (event: Electron.Event, targetUrl: string): void => {
    try {
      normalizeHttpUrl(targetUrl);
    } catch {
      event.preventDefault();
    }
  };
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  contents.on('will-navigate', rejectUnsafeNavigation);
  contents.on('will-redirect', rejectUnsafeNavigation);
  contents.on('did-start-loading', () => sendState(device.id, { loading: true, error: null }));
  contents.on('did-stop-loading', () => sendState(device.id, { loading: false, canGoBack: contents.navigationHistory.canGoBack(), canGoForward: contents.navigationHistory.canGoForward() }));
  contents.on('did-navigate', (_event, url) => {
    if (syncLocks.has(device.id)) return;
    emitNavigation(device.id, url);
  });
  contents.on('did-navigate-in-page', (_event, url, isMainFrame) => {
    if (isMainFrame && !syncLocks.has(device.id)) emitNavigation(device.id, url);
  });
  contents.on('page-title-updated', (_event, title) => sendState(device.id, { title }));
  contents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (!isMainFrame || errorCode === -3) return;
    sendState(device.id, { loading: false, error: `${errorDescription} (${errorCode})` });
    sendError(device.id, `${errorDescription}: ${validatedURL}`, 'navigation');
  });
  contents.on('console-message', (_event, level, message, lineNumber, sourceId) => {
    if (level >= 2) sendError(device.id, `${message} — ${sourceId}:${lineNumber}`, level === 3 ? 'error' : 'warning');
  });
  contents.on('focus', () => window?.webContents.send('device:state', { ...states.get(device.id), id: device.id }));
  // A click inside a preview lands in its own native view, so the shell learns about it here. Focus events are not
  // used: views take focus on their own while loading, which would override the selection.
  contents.on('input-event', (_event, input) => {
    if (input.type === 'mouseDown') window?.webContents.send('device:activate', device.id);
  });
  contents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown' || !(process.platform === 'darwin' ? input.meta : input.control) || input.key.toLowerCase() !== 'l') return;
    event.preventDefault();
    window?.webContents.send('workspace:focus-address');
  });
}


function createDeviceView(device: WorkspaceDevice): void {
  const browserSession = session.fromPartition(`persist:framepilot-${device.id}`);
  const view = new WebContentsView({
    webPreferences: {
      session: browserSession,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  views.set(device.id, view);
  states.set(device.id, stateFor(device));
  configureDeviceView(device, view);
  view.webContents.setUserAgent(profileUserAgent(device).userAgent);
  window?.contentView.addChildView(view);
  const bindingPromises = new Set<Promise<unknown>>();
  try {
    view.webContents.debugger.attach('1.3');
    view.webContents.debugger.on('message', (_event, method, params) => {
      if (method === 'Runtime.bindingCalled' && params.name === '__framePilotScroll') {
        scrollToRatio(device.id, Number(params.payload));
        return;
      }
      if (method === 'Runtime.executionContextCreated' && params.context.auxData?.isDefault) {
        const binding = view.webContents.debugger.sendCommand('Runtime.addBinding', {
          name: '__framePilotScroll',
          executionContextId: params.context.id,
        }).catch((error: Error) => {
          console.warn(`Scroll binding unavailable for ${device.id}:`, error);
        });
        bindingPromises.add(binding);
        void binding.finally(() => bindingPromises.delete(binding));
      }
    });
    void view.webContents.debugger.sendCommand('Runtime.enable').catch((error: Error) => {
      console.warn(`Scroll context tracking is unavailable for ${device.id}:`, error);
    });
    // CDP overrides persist across navigations, and re-sending metrics while a navigation commits can create the new
    // document with touch support off, so metrics are applied once at the first load. Touch emulation is re-asserted
    // after each document is ready and loaded because navigations and zoom changes can drop it.
    let emulationStarted = false;
    view.webContents.on('did-start-loading', () => {
      if (emulationStarted) return;
      emulationStarted = true;
      void queueEmulation(view.webContents, device.id, { force: true, refresh: 'none' });
    });
    view.webContents.on('dom-ready', () => {
      void queueEmulation(view.webContents, device.id, { force: false, refresh: 'always' });
    });
    view.webContents.on('did-finish-load', () => {
      void queueEmulation(view.webContents, device.id, { force: false, refresh: 'always' });
      void Promise.all([...bindingPromises]).then(() => installScrollObserver(view, device.id));
    });
  } catch (error) {
    console.warn(`Device emulation is unavailable for ${device.id}:`, error);
  }
  void view.webContents.loadURL(device.url).catch((error: Error) => {
    if (isSupersededNavigation(error)) return;
    sendState(device.id, { loading: false, error: error.message });
  });
}

/**
 * A native view can only be rounded on all four corners, but under a browser toolbar the page's top edge must stay flat
 * while its bottom corners follow the frame opening. So the page is left square and each bottom corner gets a small
 * transparent web view that paints bezel black everywhere outside a quarter circle. (A plain `View` would be painted
 * beneath native web views, so these are web views themselves.)
 */
function createCornerMask(side: 'left' | 'right'): WebContentsView {
  const mask = new WebContentsView({ webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, javascript: false } });
  mask.setBackgroundColor('#00000000');
  const center = side === 'left' ? '100% 0' : '0 0';
  const body = `html{background:transparent}body{margin:0;height:100vh;background:radial-gradient(circle farthest-side at ${center},transparent calc(100% - 1px),#000 100%)}`;
  void mask.webContents.loadURL(`data:text/html,${encodeURIComponent(`<style>${body}</style>`)}`);
  return mask;
}

function placeBottomCornerMasks(id: string, edge: { x: number; y: number; width: number; height: number }, radius: number, visible: boolean): void {
  let masks = cornerCovers.get(id);
  if (radius <= 0) {
    for (const mask of masks ?? []) mask.setVisible(false);
    return;
  }
  if (!masks) {
    masks = [createCornerMask('left'), createCornerMask('right')];
    for (const mask of masks) window?.contentView.addChildView(mask);
    cornerCovers.set(id, masks);
  }
  masks[0].setBounds({ x: edge.x, y: edge.y + edge.height - radius, width: radius, height: radius });
  masks[1].setBounds({ x: edge.x + edge.width - radius, y: edge.y + edge.height - radius, width: radius, height: radius });
  for (const mask of masks) mask.setVisible(visible);
}

function trustedRendererUrl(): string {
  return process.env.ELECTRON_RENDERER_URL ?? pathToFileURL(join(__dirname, '../renderer/index.html')).href;
}

function requireTrustedShell(event: Electron.IpcMainInvokeEvent): void {
  const frame = event.senderFrame;
  if (!window || event.sender !== window.webContents || frame !== window.webContents.mainFrame || frame.url !== trustedRendererUrl()) {
    throw new Error('Untrusted renderer request.');
  }
}

async function sendSnapshot(id: string, view: WebContentsView): Promise<void> {
  try {
    const image = await view.webContents.capturePage();
    if (image.isEmpty() || nativeVisibility.get(id)) return;
    const size = image.getSize();
    const scaled = size.width > 960 ? image.resize({ width: 960 }) : image;
    window?.webContents.send('device:snapshot', { id, dataUrl: scaled.toDataURL() });
  } catch {
    // The preview stays blank only until it becomes visible again.
  }
}

function currentDevice(id: string): WorkspaceDevice {
  const device = settings.devices.find((candidate) => candidate.id === id);
  if (!device) throw new Error(`Unknown device: ${id}`);
  return device;
}

function registerIpc(): void {
  ipcMain.handle('workspace:initialize', (event) => {
    requireTrustedShell(event);
    for (const device of settings.devices) createDeviceView(device);
    return { settings, profiles: DEVICE_PROFILES, states: [...states.values()] };
  });
  ipcMain.handle('device:navigate', async (event, id: unknown, url: unknown) => {
    requireTrustedShell(event);
    const deviceId = z.string().min(1).max(64).parse(id);
    const target = normalizeHttpUrl(z.string().max(2048).parse(url));
    const device = currentDevice(deviceId);
    const targets = settings.syncUrl ? settings.devices : [device];
    await Promise.all(targets.map((targetDevice) => loadDeviceUrl(targetDevice.id, target)));
    persistSettings();
  });
  for (const [channel, action] of [
    ['device:back', (contents: Electron.WebContents) => { if (contents.navigationHistory.canGoBack()) contents.navigationHistory.goBack(); }],
    ['device:forward', (contents: Electron.WebContents) => { if (contents.navigationHistory.canGoForward()) contents.navigationHistory.goForward(); }],
    ['device:reload', (contents: Electron.WebContents) => contents.reload()],
  ] as const) {
    ipcMain.handle(channel, (event, id: unknown) => {
      requireTrustedShell(event);
      const deviceId = z.string().min(1).max(64).parse(id);
      currentDevice(deviceId);
      const view = views.get(deviceId);
      if (!view) throw new Error('Browser view is not ready.');
      action(view.webContents);
    });
  }
  ipcMain.handle('device:update', async (event, id: unknown, rawDevice: unknown) => {
    requireTrustedShell(event);
    const deviceId = z.string().min(1).max(64).parse(id);
    const device = deviceSettingsSchema.parse(rawDevice);
    if (device.id !== deviceId) throw new Error('Device identity cannot change.');
    const existing = currentDevice(deviceId);
    const view = views.get(deviceId);
    if (!view) throw new Error('Browser view is not ready.');
    getDeviceProfile(device.profileId);
    device.orientation = supportedOrientation(device);
    Object.assign(existing, device);
    persistSettings();
    await queueEmulation(view.webContents, deviceId, { force: true, refresh: 'always' });
  });
  ipcMain.handle('device:add', (event, profileId: unknown) => {
    requireTrustedShell(event);
    if (settings.devices.length >= MAX_DEVICE_COUNT) throw new Error(`FramePilot supports up to ${MAX_DEVICE_COUNT} simultaneous devices.`);
    const profile = getDeviceProfile(z.string().min(1).max(64).parse(profileId));
    const device = createWorkspaceDevice(profile, `device-${nextDeviceId++}`, settings.devices[0]?.url ?? 'https://example.com');
    settings.devices.push(device);
    createDeviceView(device);
    persistSettings();
    return device;
  });
  ipcMain.handle('device:remove', (event, id: unknown) => {
    requireTrustedShell(event);
    const deviceId = z.string().min(1).max(64).parse(id);
    if (settings.devices.length <= 1) throw new Error('At least one device must remain in the workspace.');
    currentDevice(deviceId);
    const view = views.get(deviceId);
    if (view) {
      window?.contentView.removeChildView(view);
      nativeVisibility.delete(deviceId);
      appliedMetrics.delete(deviceId);
      emulationQueues.delete(deviceId);
      for (const cover of cornerCovers.get(deviceId) ?? []) {
        window?.contentView.removeChildView(cover);
        cover.webContents.close();
      }
      cornerCovers.delete(deviceId);
      view.webContents.close();
      views.delete(deviceId);
      presentationScales.delete(deviceId);
      states.delete(deviceId);
    }
    settings.devices = settings.devices.filter(({ id: candidate }) => candidate !== deviceId);
    persistSettings();
  });
  ipcMain.handle('workspace:save', (event, rawSettings: unknown) => {
    requireTrustedShell(event);
    const next = workspaceSettingsSchema.parse(rawSettings);
    if (next.devices.some((device) => !views.has(device.id))) throw new Error('Workspace settings include an inactive browser view.');
    for (const device of next.devices) device.orientation = supportedOrientation(device);
    settings = next;
    syncScroll = next.syncScroll;
    persistSettings();
  });
  ipcMain.handle('workspace:layout', (event, rawBounds: unknown) => {
    requireTrustedShell(event);
    const bounds = boundsSchema.parse(rawBounds) as DeviceBounds[];
    for (const bound of bounds) {
      const view = views.get(bound.id);
      if (!view) continue;
      const x = Math.round(bound.x);
      const y = Math.round(bound.y);
      const width = Math.min(4800, Math.round(bound.width));
      const height = Math.min(4800, Math.round(bound.height));
      const device = currentDevice(bound.id);
      const viewport = contentViewport(device);
      const presentationScale = width / viewport.width;
      presentationScales.set(bound.id, presentationScale);
      view.setBounds({ x, y, width, height });
      view.setBorderRadius(Math.round(bound.radius));
      const wasVisible = nativeVisibility.get(bound.id) ?? true;
      nativeVisibility.set(bound.id, bound.visible);
      // A native view cannot be clipped to the scrolled workspace, so a partly visible preview is swapped for a
      // snapshot of its last frame that the renderer draws (and clips) as ordinary DOM.
      if (wasVisible && !bound.visible) void sendSnapshot(bound.id, view);
      else if (!wasVisible && bound.visible) window?.webContents.send('device:snapshot', { id: bound.id, dataUrl: null });
      view.setVisible(bound.visible);
      placeBottomCornerMasks(bound.id, { x, y, width, height }, Math.round(bound.maskRadius), bound.visible);
      void queueEmulation(view.webContents, bound.id, { force: false, refresh: 'ifChanged' });
    }
  });
  ipcMain.handle('device:devtools', (event, id: unknown) => {
    requireTrustedShell(event);
    const view = views.get(z.string().min(1).max(64).parse(id));
    if (!view) throw new Error('Browser view is not ready.');
    view.webContents.openDevTools({ mode: 'detach' });
  });
  ipcMain.handle('device:capture', async (event, id: unknown) => {
    requireTrustedShell(event);
    const deviceId = id === null ? null : z.string().min(1).max(64).parse(id);
    const selected = deviceId ? [currentDevice(deviceId)] : settings.devices;
    const result = await dialog.showOpenDialog(window!, {
      title: deviceId ? 'Choose screenshot folder' : 'Choose multi-device capture folder',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) return { saved: [] as string[] };
    const folder = result.filePaths[0]!;
    const saved: string[] = [];
    for (const device of selected) {
      const view = views.get(device.id);
      if (!view) continue;
      const image = await view.webContents.capturePage();
      const filename = `${device.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${device.id}-${Date.now()}.png`;
      const path = join(folder, filename);
      writeFileSync(path, image.toPNG(), { mode: 0o600 });
      saved.push(path);
    }
    return { saved };
  });
}

function createWindow(): void {
  window = new BrowserWindow({
    width: 1536,
    height: 1024,
    minWidth: 920,
    minHeight: 680,
    title: 'FramePilot',
    backgroundColor: '#0e0f11',
    show: false,
    // macOS draws its traffic lights over our toolbar; other systems keep their own title bar.
    ...(process.platform === 'darwin' ? { titleBarStyle: 'hiddenInset' as const, trafficLightPosition: { x: 20, y: 17 } } : { autoHideMenuBar: true }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.once('ready-to-show', () => {
    window?.maximize();
    window?.show();
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== trustedRendererUrl()) event.preventDefault();
  });
  if (process.env.ELECTRON_RENDERER_URL) void window.loadURL(process.env.ELECTRON_RENDERER_URL);
  else void window.loadFile(join(__dirname, '../renderer/index.html'));
  window.on('closed', () => { window = null; });
}

app.whenReady().then(() => {
  settings = loadSettings();
  syncScroll = settings.syncScroll;
  registerIpc();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  persistSettings();
  for (const view of views.values()) view.webContents.close();
});
