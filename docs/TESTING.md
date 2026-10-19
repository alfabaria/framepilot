# Testing and smoke procedure

## Automated checks

From the project root:

```sh
npx tsc --noEmit
npm test
npm run build
```

The Vitest suite covers viewport orientation and display scaling, default frame modes, all ten profile-to-PNG mappings, portrait/landscape frame-aperture geometry, emulation profile properties, HTTP(S) and local-development URL normalization, normalized scroll-range boundaries, workspace defaults, and versionless-settings migration.

## Local live-browser fixture

Start the fixture separately:

```sh
npm run test:fixture
```

It listens on `http://127.0.0.1:4179/` and reports each page's CSS viewport, DPR, orientation, UA, touch points, counter, and document scroll position. The page has an in-page anchor and enough content to exercise normalized scrolling. Do not use the fixture as a public-site compatibility test.

## Manual P0 acceptance checklist

1. Start `npm run dev`; load the fixture into desktop, phone, and tablet views. Add Android to make four simultaneous devices.
2. Click the counter in two views and confirm their state remains independent.
3. Compare reported `innerWidth`, `innerHeight`, DPR, touch points, orientation, and UA against the profile labels.
4. Change workspace zoom from 25% through 100%, including buttons, slider, Fit all, Fit width, and Actual size. Confirm each device's `innerWidth`, `innerHeight`, DPR, and responsive breakpoints remain at its profile values.
5. Use the **Rotate device** icon button on the phone and tablet previews; confirm viewport dimensions swap and page state is retained. Confirm desktop and laptop previews show no rotate button and cannot be put in portrait.
5a. Drag over a phone or tablet preview: the cursor is a touch circle, the page receives `touchstart`/`touchmove`/`touchend` with `pointerType: "touch"`, and `navigator.maxTouchPoints` is 5 (also after several navigations). On a desktop preview a drag produces only mouse pointer events.
6. Use the fixture anchor to test URL sync. With scroll sync enabled, scroll the document and confirm normalized scroll positions track across different viewport sizes; repeat with sync disabled.
7. Confirm the default horizontal layout places device cards side by side. Exercise grid/vertical layouts, drag reorder, per-panel resize, fit-all/fit-width/actual-size, zoom +/- and slider, frame toggle, and window resizing. Confirm off-canvas native previews do not cover the shell toolbar/sidebar/status bar.
8. Compare all ten selected profiles to their mapped images; confirm each transparent screen opening aligns with the native browser surface in portrait and landscape and page input is not intercepted by frame decorations.
9. Add a device and remove it; confirm other browser pages retain their contents. Verify the one-view minimum and six-view cap.
10. Open DevTools for one view. Use single and all-device capture, choose an output directory, and inspect that actual PNG files are present.
11. Navigate to an external HTTP(S) site. Verify standard navigation works and unsupported schemes/popups/downloads/permissions are blocked.
12. Restart FramePilot with the same user-data directory and verify device set, URLs, layout, sync settings, and zoom are restored.
13. Build and package the macOS application when signing/packaging prerequisites are available.

## Recent smoke run

The packaged Electron app was exercised against `localhost:3001`. Address submission synchronized all three previews to `http://localhost:3001/?framepilot=final-check`. At 27%→32%→27% zoom, page metrics remained 1440×900/DPR 1, 390×844/DPR 3/touch 5, and 768×1024/DPR 2/touch 5. iPhone orientation changed to 844×390 and back. Scrolling the desktop document to ratio 0.67976 synchronized the iPad and iPhone to 0.67968 and 0.67949. Fit all placed the desktop, phone, and tablet cards side by side; the composed macOS window was captured and reviewed with all three mapped frames and rendered pages visible. Typecheck, all 16 unit tests, production build, and macOS package completed.

The smoke used CDP-driven interaction plus a full-window macOS screenshot. Nested-container scroll sync, capture dialogs/output, DevTools UI, other frame mappings, drag reorder, and six-page performance remain outside this smoke run.
