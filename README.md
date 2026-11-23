# Phone Sim

A free Chromium extension (Opera GX, Chrome, Edge, Brave) that opens any website inside realistic
phone, tablet and foldable frames. No accounts, no tracking, no network calls of its own.

## Features

- 180+ devices: iPhones (SE to 17 Pro Max), iPads, Galaxy S / A / Z Fold / Z Flip / Tab, Pixels and
  Nexus, Xiaomi / Redmi / POCO, OnePlus, Motorola, Huawei, Nothing, OPPO, vivo, realme, Infinix,
  Tecno, itel, Surface Duo and Amazon Fire. Estimated specs are marked **≈**.
- Searchable device picker with filters (phones, tablets, foldables, brand), keyboard ↑ / ↓ / Enter,
  and the last device is remembered.
- Frames drawn with CSS from each device's numbers: Dynamic Island, notch, punch hole, waterdrop,
  home button, side buttons, fold crease and a live status bar.
- The site sees the device: mobile User-Agent and client hints, `navigator.platform`, touch points,
  `userAgentData`, and `(pointer: coarse)` / `(hover: none)` in `matchMedia`.
- Rotate, zoom (Fit / 100% / 75% / 50%), URL bar that follows in-site navigation, reload, open in tab.
- Screenshot to PNG (with frame, or screen only) and screen recording to MP4 / WebM.

## Install (load unpacked)

```sh
pnpm install
pnpm build
```

Then open `opera://extensions` (or `chrome://extensions`), turn on **Developer mode**, click
**Load unpacked** and pick the `dist/` folder. While developing, `pnpm dev` rebuilds `dist/` on every
save; reload the extension afterwards.

Open a site in Phone Sim with the toolbar button, **Alt+Shift+M**, or the right-click menu
("Open page in Phone Sim" / "Open link in Phone Sim").

## Add a device

Add one object to the brand's file in `src/devices/catalog/` (or `others.ts`). Nothing else changes.
Sizes are CSS pixels in portrait, as a browser on that device reports them. The `id` is permanent
because saved settings use it.

```ts
{
  id: "pixel-11",
  name: "Pixel 11",
  brand: "Google",
  kind: "phone", // "phone" | "tablet" | "foldable"
  year: 2026,
  platform: "android", // "ios" | "ipados" | "android"
  osVersion: "17",
  screen: { width: 412, height: 923 },
  dpr: 2.625,
  frame: { cutout: "punch-hole-center", screenRadius: 34, bezel: 11, color: "#4b5563" },
  approx: true, // numbers are estimates: shown with "≈"
},
```

`pnpm test` checks every entry against the schema, unique ids and sane sizes.

## Known limits

- `devicePixelRatio` cannot be faked inside a frame: the site sees your monitor's pixel ratio.
- CSS `@media (hover: …)` / `(pointer: …)` rules in stylesheets still match your mouse; only the
  JavaScript `matchMedia` checks are switched to touch.
- Framing headers (`X-Frame-Options`, CSP) are removed in simulator tabs, but some sites still
  refuse to work inside a frame (script frame-busting, `window.top` checks).
- Sites that need you to be logged in may need third-party cookies allowed for that site, because the
  page runs inside a frame.
- Recording asks you to share a tab each time; pick this tab ("Phone Sim").
- Header changes and the mobile-environment script apply only to tabs showing the simulator; they are
  removed when the tab closes or navigates elsewhere.

## Checks

```sh
pnpm typecheck && pnpm test && pnpm build
```
