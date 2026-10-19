# Design decisions

## RFC 001 — Independent Electron browser views

**Status:** Accepted

Each device owns one independent `WebContentsView` and persistent Electron session. A single webContents resized between profiles would lose independent page state and cannot satisfy simultaneous interactivity. Six views is the current configured maximum; actual usable capacity depends on host resources.

## RFC 002 — Separate page viewport from workspace presentation

**Status:** Accepted

CDP device metrics describe the CSS viewport, DPR, touch, and orientation. The renderer applies workspace zoom and panel scale only to the native view bounds. This preserves responsive breakpoints and `innerWidth`/`innerHeight` while the workspace fits multiple frames.

## RFC 003 — Main-process ownership of untrusted page lifecycle

**Status:** Accepted

Only the Electron main process creates browser views, applies emulation, controls navigation, captures screenshots, and persists settings. The renderer receives an explicit preload bridge. Website content is sandboxed, has no preload or Node integration, cannot open popups, cannot request permissions, and may navigate only to HTTP(S). The shell IPC sender must be the exact top-level trusted renderer frame.

## RFC 004 — URL and document-scroll synchronization

**Status:** Accepted

URL synchronization follows main-frame navigation and in-page URL changes; per-device locks prevent echoes. Scroll synchronization uses a normalized document scroll ratio because devices have different viewport and page heights. The capture listener is throttled by elapsed time rather than `requestAnimationFrame`; RAF is suspended in hidden webContents. Nested scroll containers are not covered.

## RFC 005 — Parametric device frames

**Status:** Accepted

FramePilot draws every device frame as parametric vector art (bezel, metal band, corner radius, camera cutout, buttons) from a per-model style, and positions each native browser viewport in the artwork's screen opening, which is exact by construction. Frame art is presentation-only; the native `WebContentsView` remains the interactive page surface. Orientation rotates both artwork and aperture geometry together. The frames are representative drawings, not exact certified device CAD models.

## RFC 006 — Apply CDP metrics after navigation begins

**Status:** Accepted

On the macOS workstation, applying `Emulation.setDeviceMetricsOverride` immediately after creating a new webContents caused Electron to terminate with signal 11. Applying metrics from `did-start-loading` eliminated that crash in a repeated four-view launch. Profile changes on an already loaded view still apply immediately. This sequencing is isolated to the main-process lifecycle handler.
