# Phone Sim

A free Chromium extension (Opera GX, Chrome, Edge, Brave) that opens any website inside realistic
phone, tablet and foldable frames. No accounts, no tracking, no network calls of its own.

## Features

- **Multi-device side-by-side canvas** — Opens with a Phone + Tablet (`iPhone 16 Pro` + `iPad Pro 11" (M4)`)
  at the same time, remembers your workspace, and lets you place up to **4 devices** side by side with
  1-click layout presets (`Phone + Tab`, `2 Phones`, `Single`), silky 60 fps **synced scrolling**, and
  **soft SPA synced navigation** (switches React / Next.js / Vue / Svelte routes across sibling devices
  with zero full-page reload).
- **Original flat pill left-rail workspace** — Slim 57 px matte left icon rail with rounded-full controls,
  crisp cobalt blue active states, zero drop shadows, and full vertical stage height.
- 189 built-in devices (Apple iPhone SE–17 Pro Max & iPads, Samsung Galaxy S / A / Z Fold / Z Flip /
  Tab, Google Pixel & Nexus, Xiaomi / Redmi / POCO, OnePlus, Motorola, Huawei, Nothing, OPPO, vivo,
  realme, Infinix, Tecno, itel, Surface Duo, Amazon Fire) plus **Custom devices** saved locally.
  Estimated specs are marked **≈**.
- Realistic CSS-drawn hardware frames: per-model proportions and corner radii, multi-layer brushed
  anodized metallic rims with corner specular chamfer highlights, micro-grain satin finish and
  finish picker (including Deep Burgundy & titanium finishes), antenna bands, machined side buttons,
  earpiece/camera lenses, fold hinges and creases, hidden desktop scrollbars, and live iOS / Android
  status bars.
- In-phone Safari (iOS / iPadOS) and Chrome (Android) browser bars with per-device working back,
  forward, reload, and domain editing, shrinking each site viewport realistically.
- Touch finger cursor with drag-to-scroll momentum inside every frame (toggleable in Settings).
- Keyboard shortcuts (`D`, `A`, `B`, `R`, `Y`, `[` / `]`, `S`, `Shift+S`, `V`, `F`, `1`/`2`/`3`,
  `Ctrl/Cmd+L`, `Alt+←`/`→`, `Ctrl/Cmd+wheel`).
- **Curated dot grids & dark wallpapers** — Opens on clean `Dark Dots` by default, with 10 bundled
  offline backdrops (`Dark Dots`, `Cobalt Dots`, `Obsidian`, `Studio Light`, `Dark Topo`,
  `Cobalt Aurora`, `Editor Bokeh`, `Cyber Horizon`, `Terminal Wave`, and `Blueprint Grid`),
  switchable via the left rail (`B`).
- **Auto-scroll video recording** — Record strictly the active phone frame or screen only (never
  the rail or sibling devices) manually or in **Auto-scroll mode** with adjustable scroll speed
  (`30–450 px/s`), hero pause, start-from-top, and automatic stop at the bottom of the page.
- **Screenshots & demo polish** — 1-click screenshot drawer (`All devices`, `Active w/ frame`,
  `Screen only`, `+ Bars`) with optional transparent rounded PNG corners, independent phone-bar
  light/dark tone, and a clean `"9:41"` demo clock toggle.
- **Solo focus & reorder** — Double-click any device caption (or click its expand icon) to solo
  focus it at full Fit size; reorder devices left/right in the stage drawer; clicking or scrolling
  inside any iframe automatically focuses that device.

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
- When multiple devices are open at once, each frame gets its own viewport width and JS `navigator` /
  touch environment, while the tab's HTTP `User-Agent` header follows the currently focused device
  (Manifest V3 `declarativeNetRequest` scopes headers per tab, not per iframe).
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

## License

[MIT](LICENSE). Device names belong to their makers and are used only to say which screen size a
frame matches. All frames, icons and wallpapers are drawn in code for this project; no device
artwork or images from other simulators are included.
