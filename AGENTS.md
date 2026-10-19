# FramePilot repository guidance

- Multi-device simultaneous browsing and high-fidelity device frames are the core requirements; they take priority over other UI work (see `docs/ARCHITECTURE.md`, `PRODUCT.md`).
- Keep website contents untrusted: no preload, Node integration, or broad IPC in device webContents. Validate IPC inputs and preserve exact shell origin checks.
- Keep profile viewport metrics, physical frame CSS, and workspace/panel scaling independent.
- Use one independent `WebContentsView` and session per device; close both on removal.
- Test behavior with `npm test`, `npx tsc --noEmit`, and `npm run build`; describe runtime smoke evidence separately from source review.
- Treat Chromium device emulation as an approximation, not iOS/WebKit or physical-hardware equivalence.
- See `docs/ARCHITECTURE.md`, `docs/RFC.md`, `docs/IMPLEMENTATION.md`, and `docs/TESTING.md` for design and acceptance boundaries.
