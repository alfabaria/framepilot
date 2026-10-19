import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, DragEvent, RefObject } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDownUp, ArrowLeft, ArrowRight, Camera, ChevronDown, CircleAlert, Code2, Columns2,
  Clock, Frame, Globe, Laptop, Link2, LoaderCircle, LayoutGrid, Minus, Monitor,
  PanelLeftClose, PanelLeftOpen, Plus, RotateCcwSquare, RotateCw, Rows2, Settings2, Smartphone, Sun, Moon, Tablet, X,
} from './icons';
import { canRotate, createWorkspaceDevice, DEVICE_GROUP_ORDER, deviceInsets, getDeviceProfile, layoutDeviceFrame, MAX_DEVICE_COUNT, normalizeHttpUrl, previewDimensions } from '../shared/devices';
import type { DeviceGroup, DeviceProfile, WorkspaceDevice } from '../shared/devices';
import type { DeviceBounds, WorkspaceSettings } from '../shared/ipc';
import { useWorkspace } from './store';
import { DeviceFrameArt } from './device-frame-art';
import { DeviceChrome } from './device-chrome';
import { Tooltips } from './tooltip';
import { DeviceThumb } from './device-thumb';
import { ProfileSelect } from './profile-select';
import { loadHistory, recordVisit, saveHistory, searchHistory } from './history';
import type { HistoryEntry } from './history';
import { applySavedTheme, THEME_OPTIONS, useTheme } from './theme';
import logoDark from './assets/framepilot-logo-dark.png';
import logoLight from './assets/framepilot-logo-light.png';
import '@fontsource-variable/hanken-grotesk';
import './styles.css';

type FrameRef = HTMLDivElement;

const CATEGORY_ICONS = { desktop: Monitor, laptop: Laptop, tablet: Tablet, phone: Smartphone } as const;
const THEME_ICONS = { system: Monitor, light: Sun, dark: Moon } as const;

/** The FramePilot mark: the light-on-dark artwork in the dark theme, the navy-tile artwork in the light theme. */
function ThemedLogo({ className }: { className: string }) {
  return (
    <>
      <img className={`${className} logo-for-dark`} src={logoDark} alt="" aria-hidden="true" draggable={false} />
      <img className={`${className} logo-for-light`} src={logoLight} alt="" aria-hidden="true" draggable={false} />
    </>
  );
}

/** Grid layout columns: pairs for two to four devices, three across beyond that, so it differs from the single row/column layouts. */
function gridColumns(deviceCount: number): number {
  if (deviceCount <= 1) return 1;
  return deviceCount <= 4 ? 2 : 3;
}

/** Closes a menu on Escape or a press outside its anchor element. */
function useDismiss(open: boolean, close: () => void, anchor: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (anchor.current && !anchor.current.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close, anchor]);
}

function FramePilotApp() {
  const [theme, setTheme] = useTheme();
  const devices = useWorkspace((state) => state.devices);
  const profiles = useWorkspace((state) => state.profiles);
  const runtime = useWorkspace((state) => state.runtime);
  const activeId = useWorkspace((state) => state.activeId);
  const initialized = useWorkspace((state) => state.initialized);
  const syncUrl = useWorkspace((state) => state.syncUrl);
  const syncScroll = useWorkspace((state) => state.syncScroll);
  const workspaceScale = useWorkspace((state) => state.workspaceScale);
  const layoutMode = useWorkspace((state) => state.layoutMode);
  const errors = useWorkspace((state) => state.errors);
  const hydrate = useWorkspace((state) => state.hydrate);
  const add = useWorkspace((state) => state.add);
  const remove = useWorkspace((state) => state.remove);
  const update = useWorkspace((state) => state.update);
  const reorder = useWorkspace((state) => state.reorder);
  const setActive = useWorkspace((state) => state.setActive);
  const setRuntime = useWorkspace((state) => state.setRuntime);
  const setSyncUrl = useWorkspace((state) => state.setSyncUrl);
  const setSyncScroll = useWorkspace((state) => state.setSyncScroll);
  const setScale = useWorkspace((state) => state.setScale);
  const setLayoutMode = useWorkspace((state) => state.setLayoutMode);
  const addError = useWorkspace((state) => state.addError);

  const [address, setAddress] = useState('');
  const [profileMenu, setProfileMenu] = useState<false | 'sidebar' | 'canvas'>(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.localStorage.getItem('framepilot.sidebar') !== 'closed');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [snapshots, setSnapshots] = useState<Record<string, string>>({});
  const refs = useRef(new Map<string, FrameRef>());
  const canvas = useRef<HTMLDivElement>(null);
  const addressInput = useRef<HTMLInputElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const addSurfaceRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const active = devices.find((device) => device.id === activeId);
  const activeRuntime = runtime[activeId];
  // Address bar history: the newest visits, narrowed by what is typed.
  const addressForm = useRef<HTMLFormElement>(null);
  const [visits, setVisits] = useState<HistoryEntry[]>(loadHistory);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [profileSelectOpen, setProfileSelectOpen] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [addressDirty, setAddressDirty] = useState(false);
  // Right after focusing the field the whole recent list is offered; once typing starts it narrows to matches.
  const suggestions = searchHistory(visits, addressDirty ? address : '');
  const historyShown = historyOpen && suggestions.length > 0;
  // Native web views draw above all DOM, so while a menu is open the previews are swapped for snapshots.
  const overlayOpen = profileMenu !== false || settingsOpen || zoomOpen || notice !== '' || historyShown || profileSelectOpen;
  useDismiss(historyOpen, () => { setHistoryOpen(false); setHistoryIndex(-1); }, addressForm);
  const visitedUrl = activeRuntime?.loading ? '' : activeRuntime?.url ?? '';
  const visitedTitle = activeRuntime?.title ?? '';
  useEffect(() => {
    if (visitedUrl) setVisits((current) => recordVisit(current, visitedUrl, visitedTitle, Date.now()));
  }, [visitedUrl, visitedTitle]);
  useEffect(() => saveHistory(visits), [visits]);
  useDismiss(profileMenu !== false, () => setProfileMenu(false), profileMenu === 'canvas' ? addSurfaceRef : addMenuRef);
  useDismiss(zoomOpen, () => setZoomOpen(false), zoomRef);
  useDismiss(settingsOpen, () => setSettingsOpen(false), settingsRef);

  useEffect(() => {
    window.localStorage.setItem('framepilot.sidebar', sidebarOpen ? 'open' : 'closed');
  }, [sidebarOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setSidebarOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const stopState = window.framePilot.onState(setRuntime);
    const stopError = window.framePilot.onError(addError);
    const stopSnapshot = window.framePilot.onSnapshot(({ id, dataUrl }) => {
      setSnapshots((current) => {
        if (dataUrl) return { ...current, [id]: dataUrl };
        const { [id]: _released, ...rest } = current;
        return rest;
      });
    });
    const stopFocusAddress = window.framePilot.onFocusAddress(() => {
      addressInput.current?.focus();
      addressInput.current?.select();
    });
    window.framePilot.initialize().then(hydrate).catch((error: Error) => {
      setNotice(`Workspace could not start: ${error.message}`);
    });
    return () => { stopState(); stopError(); stopSnapshot(); stopFocusAddress(); };
  }, [addError, hydrate, setRuntime]);

  useEffect(() => {
    if (!initialized) return;
    const settings: WorkspaceSettings = { schemaVersion: 2, devices, syncUrl, syncScroll, workspaceScale, layoutMode };
    const timer = window.setTimeout(() => {
      window.framePilot.saveSettings(settings).catch((error: Error) => setNotice(`Workspace save failed: ${error.message}`));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [devices, initialized, layoutMode, syncScroll, syncUrl, workspaceScale]);

  const syncLayout = useCallback(() => {
    const canvasElement = canvas.current;
    if (!canvasElement || !initialized) return;
    const canvasRect = canvasElement.getBoundingClientRect();
    // The scrollport excludes scrollbars; a native view must lie fully inside it or it would draw over the shell.
    const area = { left: canvasRect.left, top: canvasRect.top, right: canvasRect.left + canvasElement.clientWidth, bottom: canvasRect.top + canvasElement.clientHeight };
    const bounds: DeviceBounds[] = [];
    for (const device of devices) {
      const screen = refs.current.get(device.id);
      if (!screen) continue;
      const rect = screen.getBoundingClientRect();
      const visible = !overlayOpen && rect.left >= area.left - 0.5 && rect.top >= area.top - 0.5 && rect.right <= area.right + 0.5 && rect.bottom <= area.bottom + 0.5;
      const profile = getDeviceProfile(device.profileId);
      const rotated = (device.orientation === 'landscape') !== (profile.width > profile.height);
      // The native view paints over the frame artwork, so where its edges coincide with the screen opening it must follow
      // the opening's rounded corners. With no toolbar above (desktop, laptop) all four corners are rounded natively. With a
      // toolbar above and nothing below (tablet) the top edge must stay flat, so the bottom corners are masked instead.
      const edgeInsets = deviceInsets(device);
      const touchesBottomAndSides = device.frameMode === 'device' && edgeInsets.bottom === 0 && edgeInsets.left === 0 && edgeInsets.right === 0;
      const radiusRatio = touchesBottomAndSides ? layoutDeviceFrame(device, 1)?.radiusRatio ?? 0 : 0;
      const cornerRadius = Math.min(200, radiusRatio * rect.width);
      const toolbarAbove = edgeInsets.top > 0;
      bounds.push({
        id: device.id,
        x: rect.left,
        y: rect.top,
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
        radius: toolbarAbove ? 0 : cornerRadius,
        maskRadius: toolbarAbove ? cornerRadius : 0,
        visible,
      });
    }
    window.framePilot.layout(bounds).catch((error: Error) => setNotice(`Preview layout failed: ${error.message}`));
  }, [devices, initialized, overlayOpen, workspaceScale]);

  useEffect(() => {
    const observer = new ResizeObserver(syncLayout);
    if (canvas.current) observer.observe(canvas.current);
    const workspace = document.querySelector('.workspace-grid');
    if (workspace) observer.observe(workspace);
    window.addEventListener('resize', syncLayout);
    window.addEventListener('scroll', syncLayout, true);
    const frame = window.requestAnimationFrame(syncLayout);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncLayout);
      window.removeEventListener('scroll', syncLayout, true);
      window.cancelAnimationFrame(frame);
    };
  }, [syncLayout]);

  useEffect(() => {
    if (activeRuntime?.url) setAddress(activeRuntime.url);
    else if (active?.url) setAddress(active.url);
  }, [active?.url, activeId, activeRuntime?.url]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 5200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const profilesByGroup = useMemo(() => {
    const groups: Partial<Record<DeviceGroup, DeviceProfile[]>> = {};
    for (const profile of profiles) (groups[profile.group] ??= []).push(profile);
    return groups;
  }, [profiles]);

  async function navigate(targetId: string, value: string): Promise<void> {
    try {
      const url = normalizeHttpUrl(value);
      setAddress(url);
      await window.framePilot.navigate(targetId, url);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The address could not be opened.');
    }
  }

  async function addProfile(profileId: string): Promise<void> {
    try {
      const device = await window.framePilot.addDevice(profileId);
      add(device);
      setActive(device.id);
      setProfileMenu(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'A device could not be added.');
    }
  }

  async function removeDevice(id: string): Promise<void> {
    try {
      await window.framePilot.removeDevice(id);
      remove(id);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'This device could not be removed.');
    }
  }

  function setFrameRef(id: string, screen: HTMLDivElement | null): void {
    if (screen) refs.current.set(id, screen);
    else refs.current.delete(id);
  }

  function setDimension(device: WorkspaceDevice, dimension: 'width' | 'height', value: string): void {
    const nextValue = Number(value);
    if (!Number.isFinite(nextValue) || nextValue < 240 || nextValue > 2400) return;
    const field = device.orientation === 'landscape' ? (dimension === 'width' ? 'height' : 'width') : dimension;
    const nextDevice = { ...device, [field]: Math.round(nextValue) };
    update(device.id, { [field]: nextDevice[field] });
    window.framePilot.updateDevice(device.id, nextDevice).catch((error: Error) => setNotice(`Viewport update failed: ${error.message}`));
  }

  function rotateDevice(device: WorkspaceDevice): void {
    const orientation: WorkspaceDevice['orientation'] = device.orientation === 'portrait' ? 'landscape' : 'portrait';
    const nextDevice: WorkspaceDevice = { ...device, orientation };
    update(device.id, { orientation });
    window.framePilot.updateDevice(device.id, nextDevice).catch((error: Error) => setNotice(`Rotation failed: ${error.message}`));
  }

  function toggleFrame(device: WorkspaceDevice): void {
    const nextMode = device.frameMode === 'device' ? 'borderless' : 'device';
    const nextDevice: WorkspaceDevice = { ...device, frameMode: nextMode };
    update(device.id, { frameMode: nextMode });
    window.framePilot.updateDevice(device.id, nextDevice).catch((error: Error) => setNotice(`Frame mode update failed: ${error.message}`));
  }

  function reorderAfter(event: DragEvent, targetId: string): void {
    const sourceId = event.dataTransfer.getData('text/framepilot-device');
    if (sourceId) reorder(sourceId, targetId);
    event.preventDefault();
  }

  function changeProfile(device: WorkspaceDevice, profileId: string): void {
    const profile = getDeviceProfile(profileId);
    const nextDevice: WorkspaceDevice = {
      ...device,
      profileId: profile.id,
      name: profile.name,
      width: profile.width,
      height: profile.height,
      orientation: profile.width > profile.height ? 'landscape' : 'portrait',
      frameMode: 'device',
      panelScale: device.panelScale,
    };
    update(device.id, nextDevice);
    window.framePilot.updateDevice(device.id, nextDevice).catch((error: Error) => setNotice(`Device profile update failed: ${error.message}`));
  }

  function capture(id: string | null): void {
    window.framePilot.capture(id).then(({ saved }) => {
      setNotice(saved.length ? `${saved.length} real browser screenshot${saved.length === 1 ? '' : 's'} saved.` : 'Screenshot capture cancelled.');
    }).catch((error: Error) => setNotice(`Screenshot failed: ${error.message}`));
  }
  function fitToWorkspace(): void {
    const canvasElement = canvas.current;
    if (!canvasElement) return;
    const sizes = devices.map((device) => {
      const dimensions = previewDimensions({ ...device, panelScale: 1 }, 1);
      const frame = layoutDeviceFrame({ ...device, panelScale: 1 }, 1);
      return { width: frame?.width ?? dimensions.width, height: frame?.height ?? dimensions.height, panelScale: device.panelScale };
    });
    const horizontal = layoutMode === 'horizontal';
    const gap = horizontal ? 10 : 20;
    const columns = layoutMode === 'grid' ? gridColumns(devices.length) : 1;
    const rows = Math.ceil(devices.length / columns);
    const availableWidth = Math.max(1, canvasElement.clientWidth - (horizontal ? 20 : 112));
    const availableHeight = Math.max(1, canvasElement.clientHeight - (horizontal ? 20 : 64));
    const fits = (scale: number) => {
      const widths = sizes.map((size) => horizontal
        ? Math.max(256, size.width * Math.max(0.25, scale * size.panelScale) + 26)
        : Math.max(300, size.width * Math.max(0.25, scale * size.panelScale)) + 36);
      const heights = sizes.map((size) => size.height * Math.max(0.25, scale * size.panelScale) + (horizontal ? 172 : 140));
      const width = layoutMode === 'horizontal'
        ? widths.reduce((sum, value) => sum + value, 0) + Math.max(0, widths.length - 1) * gap
        : layoutMode === 'vertical'
          ? Math.max(0, ...widths)
          : widths.slice().sort((left, right) => right - left).slice(0, columns).reduce((sum, value) => sum + value, 0) + Math.max(0, columns - 1) * gap;
      const height = layoutMode === 'horizontal'
        ? Math.max(0, ...heights)
        : layoutMode === 'vertical'
          ? heights.reduce((sum, value) => sum + value, 0) + Math.max(0, heights.length - 1) * gap
          : Math.max(0, ...heights) * rows + Math.max(0, rows - 1) * gap;
      return width <= availableWidth && height <= availableHeight;
    };
    let low = 0.25;
    let high = 1;
    if (fits(high)) low = high;
    else {
      for (let attempt = 0; attempt < 16; attempt += 1) {
        const middle = (low + high) / 2;
        if (fits(middle)) low = middle;
        else high = middle;
      }
    }
    setScale(low);
  }

  function fitActiveWidth(): void {
    if (!active || !canvas.current) return;
    const dimensions = previewDimensions({ ...active, panelScale: 1 }, 1);
    const frame = layoutDeviceFrame({ ...active, panelScale: 1 }, 1);
    const horizontal = layoutMode === 'horizontal';
    const width = (frame?.width ?? dimensions.width) * active.panelScale + (horizontal ? 26 : 36);
    setScale(Math.min(1, Math.max(0.25, (canvas.current.clientWidth - (horizontal ? 20 : 112)) / width)));
  }

  function showActualSize(): void {
    for (const device of devices) {
      if (device.panelScale !== 1) update(device.id, { panelScale: 1 });
    }
    setScale(1);
  }

  function showDeviceIcon(category: DeviceProfile['category'], size = 15) {
    const Icon = CATEGORY_ICONS[category];
    return <Icon size={size} strokeWidth={1.7} />;
  }

  const sidebarToggle = (
    <button className="icon-button" aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'} aria-pressed={sidebarOpen} title={`${sidebarOpen ? 'Hide' : 'Show'} sidebar (⌘B)`} onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <PanelLeftClose size={16} strokeWidth={1.7} /> : <PanelLeftOpen size={16} strokeWidth={1.7} />}</button>
  );

  /** With an anchor, the menu floats below it at a readable width instead of being squeezed into the narrow sidebar. */
  const renderProfileMenu = (anchor?: HTMLElement | null) => {
    const rect = anchor?.getBoundingClientRect();
    const style: CSSProperties | undefined = rect
      ? { top: rect.bottom + 4, left: rect.left + 8, maxHeight: Math.max(200, window.innerHeight - rect.bottom - 16) }
      : undefined;
    return (
      <div className={`popover profile-menu ${rect ? 'is-floating' : ''}`} style={style} role="menu">
        {DEVICE_GROUP_ORDER.map((group) => (
          <div className="profile-group" key={group} role="group" aria-label={group}>
            <div className="profile-group-title">{group}</div>
            {(profilesByGroup[group] ?? []).map((profile) => <button className="profile-option" role="menuitem" key={profile.id} onClick={() => void addProfile(profile.id)}><DeviceThumb profile={profile} /><span className="profile-name">{profile.name}</span><small>{profile.width}×{profile.height}</small></button>)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="app-shell">
      <aside className={`device-sidebar ${sidebarOpen ? '' : 'is-collapsed'}`} aria-hidden={!sidebarOpen} inert={!sidebarOpen}>
        <div className="sidebar-top drag">{sidebarToggle}</div>
        <div className="sidebar-brand">
          <ThemedLogo className="brand-mark" />
          <div className="brand-text">
            <span className="brand-name">FramePilot</span>
            <span className="brand-tagline">Every Screen. One Cockpit.</span>
          </div>
        </div>
        <div className="sidebar-heading"><span>Devices</span><span>{devices.length} of {MAX_DEVICE_COUNT}</span></div>
        <div className="device-list">
          {devices.map((device, slot) => {
            const profile = getDeviceProfile(device.profileId);
            const state = runtime[device.id];
            const status = state?.loading ? 'loading' : state?.error ? 'error' : '';
            return (
              <button key={device.id} className={`device-row ${activeId === device.id ? 'selected' : ''}`} style={{ '--slot': `var(--slot-${slot % 6})` } as CSSProperties} aria-current={activeId === device.id ? 'true' : undefined} onClick={() => setActive(device.id)}>
                {showDeviceIcon(profile.category, 16)}
                <span className="device-row-name">{device.name}</span>
                {status && <span className={`state-dot ${status}`} role="img" aria-label={status === 'loading' ? 'Loading' : 'Error'} />}
                <span className="device-row-dims">{device.width}×{device.height}</span>
              </button>
            );
          })}
        </div>
        <div className="add-device-wrap" ref={addMenuRef}>
          <button className="add-device-button" disabled={devices.length >= MAX_DEVICE_COUNT} title={devices.length >= MAX_DEVICE_COUNT ? `Up to ${MAX_DEVICE_COUNT} devices` : 'Add a device'} onClick={() => setProfileMenu(profileMenu === 'sidebar' ? false : 'sidebar')} aria-expanded={profileMenu === 'sidebar'} aria-haspopup="menu"><Plus size={16} strokeWidth={1.7} /><span>Add device</span></button>
          {profileMenu === 'sidebar' && renderProfileMenu(addMenuRef.current)}
        </div>
      </aside>

      <main className="workspace-main">
        <header className={`toolbar drag ${sidebarOpen ? '' : 'is-leading'}`}>
          <div className="toolbar-left">
            {!sidebarOpen && sidebarToggle}
            <button className="icon-button" aria-label="Back" title="Back" disabled={!activeRuntime?.canGoBack} onClick={() => active && window.framePilot.back(active.id)}><ArrowLeft size={16} strokeWidth={1.7} /></button>
            <button className="icon-button" aria-label="Forward" title="Forward" disabled={!activeRuntime?.canGoForward} onClick={() => active && window.framePilot.forward(active.id)}><ArrowRight size={16} strokeWidth={1.7} /></button>
            <button className={`icon-button ${activeRuntime?.loading ? 'is-loading' : ''}`} aria-label="Reload" title="Reload (⌘R)" onClick={() => active && window.framePilot.reload(active.id)}>{activeRuntime?.loading ? <LoaderCircle size={16} strokeWidth={1.7} /> : <RotateCw size={15} strokeWidth={1.7} />}</button>
          </div>
          <div className="toolbar-center">
            <form ref={addressForm} className="address-form" onSubmit={(event) => {
              event.preventDefault();
              if (!active) return;
              const picked = historyIndex >= 0 ? suggestions[historyIndex] : undefined;
              setHistoryOpen(false);
              void navigate(active.id, picked?.url ?? address);
            }}>
              <Globe size={14} strokeWidth={1.7} aria-hidden="true" />
              <input
                ref={addressInput}
                role="combobox"
                aria-expanded={historyShown}
                aria-controls="address-history"
                aria-autocomplete="list"
                aria-label="Website address"
                value={address}
                onFocus={() => { setActive(active?.id ?? ''); setAddressDirty(false); setHistoryIndex(-1); setHistoryOpen(true); }}
                onChange={(event) => { setAddress(event.target.value); setAddressDirty(true); setHistoryIndex(-1); setHistoryOpen(true); }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    setHistoryOpen(true);
                    const count = suggestions.length;
                    if (count === 0) return;
                    const step = event.key === 'ArrowDown' ? 1 : -1;
                    setHistoryIndex((current) => ((current + 1 + step + count + 1) % (count + 1)) - 1);
                  }
                }}
                placeholder="Search or enter a URL"
                spellCheck={false}
              />
              {activeRuntime?.loading && <span className="address-progress" />}
              {historyShown && <div className="popover address-history" id="address-history" role="listbox" aria-label="Recently visited">
                {suggestions.map((entry, index) => (
                  <button type="button" key={entry.url} role="option" aria-selected={index === historyIndex} className={`history-option ${index === historyIndex ? 'is-selected' : ''}`}
                    onMouseEnter={() => setHistoryIndex(index)}
                    onClick={() => { setHistoryOpen(false); if (active) void navigate(active.id, entry.url); }}>
                    <Clock size={13} strokeWidth={1.7} aria-hidden="true" />
                    <span className="history-title">{entry.title || entry.url}</span>
                    <span className="history-url">{entry.title ? entry.url.replace(/^https?:\/\//, '') : ''}</span>
                  </button>
                ))}
                <button type="button" className="history-clear" onClick={() => { setVisits([]); setHistoryOpen(false); }}>Clear history</button>
              </div>}
            </form>
          </div>
          <div className="toolbar-right">
            <button className="icon-button" aria-label="Sync navigation" aria-pressed={syncUrl} title={`Sync navigation: ${syncUrl ? 'on' : 'off'}`} onClick={() => setSyncUrl(!syncUrl)}><Link2 size={16} strokeWidth={1.7} /></button>
            <button className="icon-button" aria-label="Sync scrolling" aria-pressed={syncScroll} title={`Sync scrolling: ${syncScroll ? 'on' : 'off'}`} onClick={() => setSyncScroll(!syncScroll)}><ArrowDownUp size={16} strokeWidth={1.7} /></button>
            <span className="toolbar-divider" />
            <div className="segmented" role="group" aria-label="Workspace layout">
              <button aria-label="Side by side" aria-pressed={layoutMode === 'horizontal'} title="Side by side" onClick={() => setLayoutMode('horizontal')}><Columns2 size={15} strokeWidth={1.7} /></button>
              <button aria-label="Grid" aria-pressed={layoutMode === 'grid'} title="Grid" onClick={() => setLayoutMode('grid')}><LayoutGrid size={15} strokeWidth={1.7} /></button>
              <button aria-label="Stacked" aria-pressed={layoutMode === 'vertical'} title="Stacked" onClick={() => setLayoutMode('vertical')}><Rows2 size={15} strokeWidth={1.7} /></button>
            </div>
            <span className="toolbar-divider" />
            <button className="icon-button" aria-label="Zoom out" title="Zoom out" disabled={workspaceScale <= 0.25} onClick={() => setScale(Math.max(0.25, Math.round((workspaceScale - 0.05) * 100) / 100))}><Minus size={15} strokeWidth={1.7} /></button>
            <div className="zoom-wrap" ref={zoomRef}>
              <button className="zoom-trigger" aria-label="Zoom and fit options" aria-expanded={zoomOpen} aria-haspopup="menu" onClick={() => setZoomOpen(!zoomOpen)}>{Math.round(workspaceScale * 100)}%<ChevronDown size={12} strokeWidth={1.7} /></button>
              {zoomOpen && <div className="popover zoom-menu" role="menu">
                <button className="menu-item" role="menuitem" onClick={() => { fitToWorkspace(); setZoomOpen(false); }}>Fit all previews</button>
                <button className="menu-item" role="menuitem" onClick={() => { fitActiveWidth(); setZoomOpen(false); }}>Fit selected width</button>
                <button className="menu-item" role="menuitem" onClick={() => { showActualSize(); setZoomOpen(false); }}>Actual size<kbd>100%</kbd></button>
                <div className="menu-separator" />
                <div className="zoom-slider"><input aria-label="Workspace zoom" type="range" min="0.25" max="1" step="0.01" value={workspaceScale} onChange={(event) => setScale(Number(event.target.value))} /></div>
              </div>}
            </div>
            <button className="icon-button" aria-label="Zoom in" title="Zoom in" disabled={workspaceScale >= 1} onClick={() => setScale(Math.min(1, Math.round((workspaceScale + 0.05) * 100) / 100))}><Plus size={15} strokeWidth={1.7} /></button>
            <span className="toolbar-divider" />
            <button className="icon-button" title="Capture every device" aria-label="Capture every device" onClick={() => capture(null)}><Camera size={16} strokeWidth={1.7} /></button>
            {errors.length > 0 && <button className="icon-button" title={`${errors.length} browser console or navigation errors`} aria-label={`${errors.length} errors; show the latest`} onClick={() => setNotice(`${errors[0]?.category}: ${errors[0]?.message}`)}><CircleAlert size={16} strokeWidth={1.7} color="var(--danger)" /></button>}
            <div className="zoom-wrap" ref={settingsRef}>
              <button className="icon-button" aria-label="Workspace settings" aria-expanded={settingsOpen} aria-haspopup="dialog" title="Settings" onClick={() => setSettingsOpen(!settingsOpen)}><Settings2 size={16} strokeWidth={1.7} /></button>
              {settingsOpen && <div className="popover settings-menu" role="dialog" aria-label="Workspace settings">
                <h2>Appearance</h2>
                <div className="theme-choice" role="group" aria-label="Theme">
                  {THEME_OPTIONS.map(({ id, label }) => {
                    const Icon = THEME_ICONS[id];
                    return <button key={id} aria-pressed={theme === id} onClick={() => setTheme(id)}><Icon size={14} strokeWidth={1.7} />{label}</button>;
                  })}
                </div>
                <h2>Synchronization</h2>
                <label className="setting-row"><span><strong>Navigation</strong><small>Open the same page on every device</small></span><input type="checkbox" checked={syncUrl} onChange={(event) => setSyncUrl(event.target.checked)} /></label>
                <label className="setting-row"><span><strong>Scrolling</strong><small>Keep every page at the same position</small></span><input type="checkbox" checked={syncScroll} onChange={(event) => setSyncScroll(event.target.checked)} /></label>
                <div className="shortcut-list">
                  <div><span>Focus address</span><kbd>⌘ L</kbd></div>
                  <div><span>Reload</span><kbd>⌘ R</kbd></div>
                  <div><span>Toggle sidebar</span><kbd>⌘ B</kbd></div>
                </div>
                <p className="settings-note">Previews are Chromium. They emulate viewport, touch, and pixel ratio, but are not iOS Safari or physical hardware.</p>
              </div>}
            </div>
          </div>
        </header>

          <div className={`workspace-canvas ${devices.length > 3 ? 'is-dense' : ''} ${layoutMode === 'horizontal' ? 'is-horizontal' : ''}`} ref={canvas} style={{ '--device-scale': workspaceScale } as CSSProperties}>
            <div className={`workspace-grid layout-${layoutMode}`} style={{ '--device-scale': workspaceScale, '--grid-columns': gridColumns(devices.length) } as CSSProperties}>
              {devices.map((device, slot) => {
                const profile = getDeviceProfile(device.profileId);
                const viewSize = previewDimensions(device, workspaceScale);
                const viewport = { width: viewSize.cssWidth, height: viewSize.cssHeight };
                const insets = deviceInsets(device);
                const chromeScale = viewSize.width / viewport.width;
                const state = runtime[device.id];
                const frame = layoutDeviceFrame(device, workspaceScale);
                return (
                  <article key={device.id} className={`preview-card ${activeId === device.id ? 'is-active' : ''}`} style={{ '--slot': `var(--slot-${slot % 6})` } as CSSProperties} ref={(element) => {
                    const screen = element?.querySelector<HTMLDivElement>('.device-screen') ?? null;
                    setFrameRef(device.id, screen);
                  }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => reorderAfter(event, device.id)}>
                    <div className="preview-header" draggable onDragStart={(event) => event.dataTransfer.setData('text/framepilot-device', device.id)} onClick={() => setActive(device.id)}>
                      <div className="header-main">
                        <span className="slot-chip" aria-hidden="true" />
                        <ProfileSelect
                          label={`Device profile for ${device.name}`}
                          tip={`${device.name} · ${profile.deviceScaleFactor}× DPR · ${profile.mobile ? 'touch' : 'pointer'}`}
                          profiles={profiles}
                          value={device.profileId}
                          onChange={(profileId) => changeProfile(device, profileId)}
                          onOpenChange={setProfileSelectOpen}
                        />
                      </div>
                      <div className="preview-actions">
                        {canRotate(profile) && <button className="icon-button" aria-label={`Rotate ${device.name}`} title="Rotate device" onClick={(event) => { event.stopPropagation(); rotateDevice(device); }}><RotateCcwSquare size={14} strokeWidth={1.7} /></button>}
                        <button className="icon-button" aria-label={`${device.frameMode === 'device' ? 'Hide' : 'Show'} frame for ${device.name}`} title={device.frameMode === 'device' ? 'Hide device frame' : 'Show device frame'} onClick={(event) => { event.stopPropagation(); toggleFrame(device); }}><Frame size={14} strokeWidth={1.7} /></button>
                        <button className="icon-button" aria-label={`Capture ${device.name}`} title="Capture screenshot" onClick={(event) => { event.stopPropagation(); capture(device.id); }}><Camera size={14} strokeWidth={1.7} /></button>
                        <button className="icon-button" aria-label={`Open DevTools for ${device.name}`} title="Open DevTools" onClick={(event) => { event.stopPropagation(); window.framePilot.openDevTools(device.id); }}><Code2 size={14} strokeWidth={1.7} /></button>
                        {devices.length > 1 && <button className="icon-button danger" aria-label={`Remove ${device.name}`} title="Remove device" onClick={(event) => { event.stopPropagation(); void removeDevice(device.id); }}><X size={14} strokeWidth={1.7} /></button>}
                      </div>
                    </div>
                    <div className="device-stage" style={{ width: frame?.width ?? viewSize.width, height: frame?.height ?? viewSize.height } as CSSProperties}>
                      {frame && <div className="device-frame-shadow" aria-hidden="true"><DeviceFrameArt className="device-frame-art" spec={profile.frame} geometry={frame.geometry} style={{ width: frame.artworkWidth, height: frame.artworkHeight, transform: `translate(-50%, -50%) rotate(${frame.rotation}deg)` }} /></div>}
                      {frame && profile.chrome !== 'none' && (
                        <div className="device-display" style={{ left: frame.screenLeft, top: frame.screenTop, width: viewSize.width, height: viewSize.height, borderRadius: frame.geometry.screenRadius * chromeScale }}>
                          <DeviceChrome kind={profile.chrome} frame={profile.frame} width={viewport.width} height={viewport.height} insets={insets} url={state?.url ?? device.url} scale={chromeScale} />
                        </div>
                      )}
                      {frame && <div className="device-frame-layer" aria-hidden="true"><DeviceFrameArt className="device-frame-art" spec={profile.frame} geometry={frame.geometry} style={{ width: frame.artworkWidth, height: frame.artworkHeight, transform: `translate(-50%, -50%) rotate(${frame.rotation}deg)` }} /></div>}
                      <div className={`device-screen ${frame ? 'is-framed' : 'is-borderless'}`} data-device-id={device.id} style={{ left: (frame?.screenLeft ?? 0) + insets.left * chromeScale, top: (frame?.screenTop ?? 0) + insets.top * chromeScale, width: (viewport.width - insets.left - insets.right) * chromeScale, height: (viewport.height - insets.top - insets.bottom) * chromeScale, ...(frame && profile.chrome === 'none' ? { borderRadius: frame.geometry.screenRadius * chromeScale } : {}) }}>
                        {snapshots[device.id] && <img className="device-snapshot" src={snapshots[device.id]} alt="" aria-hidden="true" draggable={false} />}
                      </div>
                    </div>
                    <div className="preview-footer">
                      <div className="viewport-edit"><input aria-label={`${device.name} viewport width`} type="number" min="240" max="2400" step="1" value={viewport.width} onChange={(event) => setDimension(device, 'width', event.target.value)} /><span aria-hidden="true">×</span><input aria-label={`${device.name} viewport height`} type="number" min="240" max="2400" step="1" value={viewport.height} onChange={(event) => setDimension(device, 'height', event.target.value)} /></div>
                      <span className={`page-status ${state?.loading ? 'loading' : state?.error ? 'error' : ''}`}>{state?.loading ? <LoaderCircle size={12} strokeWidth={1.7} /> : <span className={`state-dot ${state?.error ? 'error' : ''}`} />}{state?.loading ? 'Loading' : state?.error ? 'Error' : 'Ready'}</span>
                    </div>
                    {state?.error && <div className="page-error" title={state.error}><CircleAlert size={13} /><span>{state.error}</span></div>}
                    <div className="resize-handle" title="Resize this preview panel" onPointerDown={(event) => {
                      const startX = event.clientX;
                      const initial = device.panelScale;
                      const denominator = Math.max(180, viewport.width * workspaceScale);
                      const move = (moveEvent: PointerEvent) => update(device.id, { panelScale: Math.max(0.5, Math.min(1.8, initial + (moveEvent.clientX - startX) / denominator)) });
                      const stop = () => {
                        window.removeEventListener('pointermove', move);
                        window.removeEventListener('pointerup', stop);
                      };
                      window.addEventListener('pointermove', move);
                      window.addEventListener('pointerup', stop, { once: true });
                    }} />
                  </article>
                );
              })}
              {devices.length < 3 && <div className="add-surface-wrap" ref={addSurfaceRef}>
                <button className="add-surface" aria-expanded={profileMenu === 'canvas'} aria-haspopup="menu" onClick={() => setProfileMenu(profileMenu === 'canvas' ? false : 'canvas')}><span className="viewfinder" aria-hidden="true">{[0, 1, 2, 3].map((corner) => <svg key={corner} viewBox="0 0 26 26"><path d="M1.5 25V13.5a12 12 0 0 1 12-12H25" /></svg>)}</span><Plus size={16} strokeWidth={1.7} />Add a device</button>
                {profileMenu === 'canvas' && renderProfileMenu()}
              </div>}
            </div>
          </div>

        </main>

        {notice && <div className="notice" role="status"><span>{notice}</span><button aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={14} strokeWidth={1.7} /></button></div>}
        <Tooltips />
        {!initialized && <div className="startup-overlay"><ThemedLogo className="startup-logo" /><LoaderCircle size={16} className="startup-spin" /><span>Preparing your workspace…</span></div>}
      </div>
  );
}

applySavedTheme();


createRoot(document.getElementById('root')!).render(<FramePilotApp />);
