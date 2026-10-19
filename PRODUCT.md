# Product

<!-- impeccable:product-schema 1 -->

## Stack

Delegated to the prompt's recommended stack: Electron, Node.js 24, TypeScript, React, Vite, Tailwind CSS, Zustand, and Lucide. Chromium-powered independent browser contents, with Electron's supported native view APIs and CDP where needed.

## Users

Web developers testing their own sites across desktop, laptop, tablet, and phone viewports.

## Product Purpose

FramePilot is a macOS-first desktop responsive web development browser. Users enter a local development URL or public HTTPS URL and compare live, interactive Chromium browser views across multiple device profiles.

## Positioning

The workspace keeps multiple independent browser instances visible and interactive side by side while presenting device-accurate viewport emulation and original physical device frames.

## Operating Context

A developer opens a local server URL such as `http://localhost:3000` or a public HTTPS page, arranges device previews in a workspace, and inspects responsive behavior. Chromium emulation does not claim equivalence with iOS Safari/WebKit or physical hardware.

## Capabilities and Constraints

The mandatory product scope includes at least three simultaneously active independent browser views, device profile and orientation controls, optional URL and normalized scroll synchronization, add/remove/reorder/resize controls, workspace zoom and pan, frame and borderless modes, real browser navigation, DevTools, screenshots, and local workspace persistence. The six-device target is subject to machine resources. Local-first; no account, cloud service, subscription, or telemetry required. Website content is untrusted and must not receive Node.js or OS APIs.

## Brand Commitments

Product name: FramePilot. Tagline: “Every Screen. One Cockpit.” The multi-device mark in `docs/assets` is the app logo and macOS package icon. Preserve its identity; do not reuse Blisk branding, visual assets, source code, or exact visual design. Product brief requires a dark-first developer environment with refined, professional styling.

## Evidence on Hand

Multi-device browsing and high-fidelity device frames are the two mandatory scope items. FramePilot is an independent project and contains no code or artwork from any other responsive browser.

## Product Principles

- Real Chromium views, never screenshots or ordinary cross-origin iframes, for the responsive previews.
- Keep multiple devices alive independently; selection must not swap one browser instance between profiles.
- Keep viewport emulation, physical frame rendering, and workspace scaling as separate concepts.
- Keep privileged browser lifecycle and OS operations in Electron's main process behind narrow IPC.
- Treat every loaded website as untrusted.
