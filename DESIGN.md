---
name: FramePilot
description: Every Screen. One Cockpit. A warm charcoal gallery wall where each device is a lit, labelled exhibit.
colors:
  wall: "#161518"
  surface: "#1c1b1f"
  raised: "#252429"
  hover-wash: "rgb(255 244 228 / 6%)"
  pressed-wash: "rgb(255 244 228 / 10%)"
  hairline: "rgb(255 244 228 / 8%)"
  hairline-strong: "rgb(255 244 228 / 15%)"
  paper: "#efebe4"
  muted: "#b3aea6"
  subtle: "#958f87"
  accent: "#4aa0ff"
  accent-wash: "rgb(74 160 255 / 15%)"
  accent-line: "rgb(74 160 255 / 50%)"
  danger: "#ff6b82"
  danger-wash: "rgb(255 107 130 / 14%)"
  danger-line: "rgb(255 107 130 / 32%)"
  warning: "#e8b765"
  slot-0: "#ffc72c"
  slot-1: "#3d95ff"
  slot-2: "#19e0b8"
  slot-3: "#ff6f55"
  slot-4: "#b693ff"
  slot-5: "#e8e2d6"
  pool: "rgb(255 238 208 / 14%)"
  pool-active: "rgb(255 238 208 / 24%)"
  grid-line: "rgb(255 244 228 / 6%)"
  tooltip-bg: "#2e2d33"
  wall-light: "#e8e4dc"
  surface-light: "#f1eee8"
  raised-light: "#fbfaf7"
  paper-light: "#1f1d1a"
  muted-light: "#55514b"
  subtle-light: "#6b665f"
  accent-light: "#1d68d8"
  danger-light: "#c23048"
  warning-light: "#9a6200"
  slot-0-light: "#a87600"
  slot-1-light: "#1f78e6"
  slot-2-light: "#008a6c"
  slot-3-light: "#e0452b"
  slot-4-light: "#7a52e0"
  slot-5-light: "#5a554e"
  pool-light: "rgb(255 255 255 / 75%)"
  pool-active-light: "rgb(255 255 255 / 100%)"
  grid-line-light: "rgb(60 40 20 / 8%)"
typography:
  brand:
    fontFamily: "'Hanken Grotesk Variable', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  title:
    fontFamily: "'Hanken Grotesk Variable', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 550
    lineHeight: 1.4
    letterSpacing: "-0.005em"
  body:
    fontFamily: "'Hanken Grotesk Variable', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "'Hanken Grotesk Variable', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
    fontFeature: "'tnum'"
  caption:
    fontFamily: "'Hanken Grotesk Variable', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "normal"
  data:
    fontFamily: "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
    fontFeature: "'tnum'"
rounded:
  sm: "3px"
  md: "4px"
  pop: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  toolbar-height: "46px"
  sidebar-width: "224px"
  wall-cell: "80px"
components:
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    size: "28px"
  icon-button-hover:
    backgroundColor: "{colors.hover-wash}"
    textColor: "{colors.paper}"
  icon-button-on:
    backgroundColor: "{colors.accent-wash}"
    textColor: "{colors.accent}"
  device-row:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    height: "34px"
    padding: "0 8px"
  device-row-selected:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.paper}"
  address-field:
    backgroundColor: "{colors.wall}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    height: "30px"
    padding: "0 10px"
  segmented-control:
    backgroundColor: "{colors.wall}"
    rounded: "{rounded.md}"
    padding: "2px"
  segmented-option-on:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    width: "28px"
    height: "24px"
  popover:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pop}"
    padding: "6px"
  menu-item:
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    height: "30px"
    padding: "0 8px"
  menu-item-hover:
    backgroundColor: "{colors.pressed-wash}"
  size-placard:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.subtle}"
    rounded: "{rounded.sm}"
    height: "29px"
    typography: "{typography.data}"
  tooltip:
    backgroundColor: "{colors.tooltip-bg}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
---

# Design System: FramePilot

## Overview

**Creative North Star: "The Gallery Wall"**

Every device is an exhibit: lit, labelled, and given room to be judged. The app window is a warm charcoal wall with a faint measuring grid; each device hangs without a box inside a soft pool of light, with its name above and a small size placard below. The chrome (sidebar, toolbar) is a pair of quiet rails on the same wall tone, so the exhibits carry the colour and the weight.

Identity and action are kept apart. The logo's four flat colours, extended to six slot colours, say which device is which and are never controls. A single blue says what can be pressed, toggled, or focused. The selected device is not filled; it is lit brighter and framed by four corner brackets in its own slot colour, the logo's viewfinder. The product is dark-first; the light theme is the same wall in warm plaster, with the same structure and deepened slot colours.

Density is that of an instrument: 13px text, 28-34px controls, 1px hairlines, tight 3-6px corners, tabular numerals wherever a number is read.

**Key Characteristics:**
- Warm charcoal wall (never neutral grey, never pure black) with a zoom-scaled measuring grid.
- Six flat slot colours for identity; one blue for action.
- Light, not boxes: pools of light behind devices, brackets for selection, a placard for size.
- Tight-cornered rectangles (3-6px); circles only for status dots and the light pools.
- Hanken Grotesk Variable throughout; mono only for sizes and key caps.
- Flat tonal layering with one soft shadow reserved for popovers.

## Colors

A warm-tinted charcoal ladder, one blue for action, six flat colours for identity, and two warm light pools. Dark values below are normative; the `-light` tokens in the frontmatter are the same roles in the light theme.

### Primary
- **Cockpit Blue** (`accent`, light `accent-light`): the only action colour. Focus rings (2px, offset 2px), toggles that are on (washed with `accent-wash`), slider and checkbox accents, the caret, the add-device plus, the address-bar focus border (`accent-line`), the loading line. It never marks identity.

### Secondary
Slot colours, identity only, assigned by device order (`slot-0` to `slot-5`, repeating modulo 6):
- **Gold** (`slot-0`), **Signal Blue** (`slot-1`), **Mint Teal** (`slot-2`), **Coral** (`slot-3`), **Lilac** (`slot-4`), **Bone** (`slot-5`). The light theme deepens each so it holds contrast on plaster (`slot-N-light`).
- A slot colour appears as: the 8px square chip beside the device name, the device-row glyph colour and its selected inset ring (at 60% mix), the four selection brackets, and the empty-slot viewfinder corners (gold, blue, blue, teal).

### Neutral
- **Charcoal Wall** (`wall`): window and canvas background; also the inset of fields and segmented controls.
- **Rail Charcoal** (`surface`): sidebar, toolbar, and the size placard plate.
- **Raised Charcoal** (`raised`): selected rows, popovers, notices, the on segment.
- **Lamp Paper** (`paper`): primary text. **Muted** and **Subtle**: secondary and tertiary text, headings, units.
- **Warm washes** (`hover-wash`, `pressed-wash`, `hairline`, `hairline-strong`): warm-white alpha overlays for hover, press, 1px dividers, and stronger outlines. In the light theme they flip to warm-brown alphas.
- **Pool** and **Pool Active** (`pool`, `pool-active`): the warm light behind each device; brighter for the selected one.
- **Grid Line** (`grid-line`): the wall's measuring hairlines.
- **Status:** `danger` (with wash and line variants) for errors and destructive hover; `warning` amber; success is deliberately the muted neutral (a hollow ring), not green.

### Named Rules
**The Identity-Is-Not-Action Rule.** Slot colours identify; they are never buttons, links, toggles, or states. Blue is the only colour that means "press me", and it never colours a device.

**The Warm Wall Rule.** Every neutral is warm-tinted (washes use 255 244 228 on dark, 60 40 20 on light). Do not introduce cool or pure greys.

## Typography

**Display Font:** none; the brand name is set in the body face.
**Body Font:** Hanken Grotesk Variable (bundled via @fontsource-variable/hanken-grotesk; fallbacks -apple-system, SF Pro Text, Segoe UI, system-ui, sans-serif)
**Label/Mono Font:** ui-monospace (SF Mono, Menlo), for device sizes and keyboard caps only

**Character:** A confident, slightly humanist grotesk at small sizes, with numerals kept tabular so sizes and counts line up like a placard.

### Hierarchy
- **Brand** (650, 14px, 1.15, -0.015em): the FramePilot wordmark beside the logo.
- **Title** (550, 13px): device names in headers; selected option rows go to 600.
- **Body** (400, 13px, 1.4): rows, menu items, address field, notices. Base size of the app.
- **Label** (400, 12px, tabular figures): group headings ("Devices", "5 of 6"), page status, history URLs, notes, tooltips, zoom percentage.
- **Caption** (400, 11px): brand tagline, select-group headings (600, +0.02em tracking, sentence case).
- **Data** (mono 11-12px, tabular): viewport size in the sidebar, menus, and the editable placard fields; `kbd` caps at 11px.

### Named Rules
**The Mono-Means-Measurement Rule.** The monospace face is only for pixel sizes and key caps. Names, labels, and prose are always Hanken Grotesk.

**The Sentence-Case Rule.** Headings and group labels are sentence case at 11-12px in `subtle`; no uppercase tracking.

## Layout

An application shell: a 224px sidebar (200px under 1180px wide, collapsible to zero) and a main column with a 46px toolbar over the wall. The window has a minimum of 920 by 640. Chrome padding follows a 4/8/12/16 rhythm; the wall canvas pads 24px top, 32px sides and bottom, and devices sit 24px apart (10px in the horizontal strip layout).

The wall grid is the signature measure: the canvas background is two 1px hairline gradients with a cell of 80 CSS pixels multiplied by the device scale, so at any zoom one cell equals 80 px of device viewport and the grid doubles as a ruler. Layouts (columns, rows, grid, vertical) change flow only; the wall and card anatomy are the same.

Each device card is a vertical stack: header strip (32px plus padding) with slot chip, name menu, and actions that appear on hover or when active; the device stage; the size placard (29px plus padding).

## Elevation & Depth

Depth is tonal and optical, not shadowed. The wall, rails, and raised layers step from `wall` to `surface` to `raised` with 1px hairlines between them. Devices are lit from behind by radial pools of warm light rather than lifted by boxes. The one conventional shadow is the popover shadow, soft and low-contrast, used for menus, notices, and the error count; device frames carry a drop-shadow filter appropriate to the theme.

### Shadow Vocabulary
- **Popover** (`0 14px 34px rgb(0 0 0 / 50%), 0 2px 6px rgb(0 0 0 / 34%)` dark; `0 12px 28px rgb(40 25 10 / 16%), 0 2px 6px rgb(40 25 10 / 10%)` light): menus, notices, error count.
- **Tooltip** (`0 4px 14px rgb(0 0 0 / 28%)`).
- **Device frame** (dark `drop-shadow(0 26px 26px rgb(0 0 0 / 60%)) drop-shadow(0 3px 6px rgb(0 0 0 / 50%))`; light `drop-shadow(0 0 8px rgb(0 0 0 / 42%)) drop-shadow(0 10px 16px rgb(0 0 0 / 38%))`).

### Named Rules
**The Light-Not-Box Rule.** A device is presented by light (pool), name (header), and placard. It does not sit in a bordered card, except in the horizontal strip layout where a 1px hairline separates neighbours.

**The Flat-Rails Rule.** Sidebar, toolbar, and rows have no shadow. Shadow belongs to things that float (popovers, notices, device frames).

## Shapes

Tight, rectangular, and engineered. Controls and rows use a 4px radius; inner segments, placard plates, and key caps use 3px; popovers and device cards use 6px. Borders are always 1px hairlines. Circles are reserved for the elliptical light pools and 6px state dots; slot chips are 8px squares with a 2px radius. Selection and the empty slot use open corner brackets, never closed outlines.

## Components

### Buttons (icon buttons)
- **Shape:** 4px radius, 28px square (24px in device headers).
- **Default:** transparent, `muted` glyph. **Hover:** `hover-wash` and `paper` glyph. **Pressed:** `pressed-wash`. **Disabled:** 45% opacity.
- **On / toggled:** `accent-wash` background with `accent` glyph. Destructive hover (close device) swaps to `danger-wash` and `danger`.
- Transitions 120ms on the wall easing.

### Device rows (sidebar)
- 34px high, 4px radius, slot-coloured glyph, name in 13px, size in mono 11px tabular.
- **Selected:** `raised` fill plus a 1px inset ring at 60% of the device's slot colour. Loading state is a pulsing `paper` dot; error is a `danger` dot; ready is a hollow ring.

### Inputs / Fields
- Address bar: 30px, `wall` inset, 1px hairline, 4px radius; hover strengthens the line; focus-within takes `accent-line`. Loading is a 1px `accent` line under the field.
- Placard size inputs: 42px by 22px, mono tabular, transparent with hairline; focus takes `accent-line`.
- Slider and checkbox use `accent`.

### Segmented controls
- `wall` inset, 1px hairline, 2px padding, 3px inner radius. The pressed option is `raised` with a 1px `hairline-strong` ring; no accent fill.

### Menus and popovers
- `raised` surface, 1px `hairline-strong`, 6px radius, 6px padding, popover shadow. Items 30-36px high, 4px radius, hover and keyboard highlight `pressed-wash`. Keyboard focus is an inset 1.5px `accent` ring.

### Tooltips
- Fixed dark plate (`tooltip-bg`) in both themes, 12px text, 4px radius, hairline.

### Device card (signature)
- Pool of light behind (elliptical radial gradient of `pool`, `pool-active` when selected) that fades in on mount.
- **Selection:** four 20px by 2px corner brackets (the logo's viewfinder) in the device's own slot colour, drawn on the card's `::after`, faded in over 200ms. Selection is a ring, never a fill.
- **Size placard:** a `surface` plate with a 1px hairline and 3px corners under the frame; viewport size in tabular mono on the left, page status on the right.
- Actions in the header and the resize handle appear only on hover, focus-within, or when active.

### Empty slot (signature)
- A borderless 188 by 124 slot labelled "Add a device" with a blue plus. Four 26px SVG viewfinder corners (stroke 3, round caps) in logo colours gold, blue, blue, teal. On hover the corners close in by 5px each over 250ms and the label moves from `subtle` to `paper`.

### Icon set
- Custom set on a 24px grid, default stroke 1.7, round caps and joins, stroked in `currentColor`. Panels and layouts are rounded windows (4-unit corners) with a second tone: a pane filled with `currentColor` at 22% opacity. Capture and framing borrow viewfinder corners (camera). Icons take colour from their context; they never carry a colour of their own except slot glyphs and the accent plus.

### Motion
- State changes 120ms, selection and light 200-350ms, on `cubic-bezier(.2, .8, .2, 1)`. Lights come up on mount (900ms, from 90% scale and zero opacity). Spinner 1s linear; status dot pulses 1.2s. All animation and transition durations collapse to near-zero under `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** colour a device only with its slot colour: chip, row glyph, selection brackets, ring.
- **Do** reserve `accent` for pressable, focusable, or on states.
- **Do** show size and counts in tabular figures, sizes in the mono face.
- **Do** draw selection as the four-corner bracket in the slot colour; keep the pool brighter on the selected device.
- **Do** keep the wall grid at 80 CSS px times the device scale.
- **Do** draw new icons on the 24px grid, 1.7 stroke, round caps, with an optional 22% second-tone pane.
- **Do** keep every neutral warm-tinted and every new surface to the three-step wall, rail, raised ladder.

### Don't:
- **Don't** use a slot colour as a button, link, or status colour, and don't use blue to identify a device.
- **Don't** fill the selected device; ring it.
- **Don't** wrap devices in bordered or shadowed cards (the horizontal strip's hairline is the only exception).
- **Don't** use gradients as identity colours; slot chips and brackets are flat.
- **Don't** add shadows to rails, rows, or fields.
- **Don't** use the mono face for names or prose.
- **Don't** extend this system to the on-screen device chrome (the `dc-` styles inside device frames); it imitates real device UI and is outside the system.
