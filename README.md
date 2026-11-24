# Phone Sim

See any website on real phone and tablet screens, and let your AI agent fix what breaks.

Phone Sim has two parts:

- **An AI skill + checker** that loads your page on real device sizes, finds what breaks
  (sideways scrolling, tiny buttons, tiny text, iPhone input zoom, notch overlap…) and gives your
  AI agent the exact element and fix. Works with Claude Code, Codex, Cursor, Gemini and others.
- **A browser extension** (Opera GX, Chrome, Edge, Brave) that shows any site inside realistic
  phone, tablet and foldable frames, with screenshots and screen recording.

## Quick start: give your AI agent the skill

```sh
npx skills add Abmichael01/phone-sim
```

That's it. After UI changes your agent checks the page on phones, looks at the screenshots, fixes
the problems and checks again until it's clean. You can also just ask it: *"check this page on
phones"*.

Or run the checker yourself (with your dev server running; it finds it):

```sh
npx -y github:Abmichael01/phone-sim check
```

You get a short list of problems in the terminal, and in `phone-sim-report/` a screenshot per
device with numbered boxes on each problem, plus `report.html` with every device side by side.

To make every agent in a repo run it after UI changes, run this once in the repo:

```sh
npx -y github:Abmichael01/phone-sim init
```

## Browser extension features

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

## Check responsive layouts from the terminal (for AI agents)

The `phone-sim` command opens a page in a headless browser on real device sizes from the same
catalog, finds layout problems, and saves annotated, framed screenshots plus a report an AI coding
agent can act on. Nothing to set up: the first run downloads a headless browser by itself.

```sh
npx -y github:Abmichael01/phone-sim check                  # finds your dev server (3000, 5173, 4321, 8080, 8000, 4200, 3001)
npx -y github:Abmichael01/phone-sim check localhost:5173   # a URL, a port (3000) or an .html file
npx -y github:Abmichael01/phone-sim init                   # tells AI agents in this repo to run the check
```

It runs straight from GitHub; nothing to install. Inside this repo you can also run
`node dist-cli/phone-sim.js check …`.

The output is kept short. Each issue is listed once: issues found on every device come first, then
issues a few devices share, then what is specific to one device. It shows at most 10 issues per
section and one fix line per rule, and hides info-level notes. It ends with the path of
`report.html`, which has everything (all devices side by side, issues next to each screenshot):

```text
On all 5 devices  ⚠ 4 warnings
  1. ⚠ small-tap-target  span.icons > button.icon-btn  2 elements: worst is 18×18px with another target within 24px …
     Fix: Make it at least 24×24px (44×44px is better): add padding or min-width/min-height.
  …
iPhone 16 Pro  402×874 @3x  ✖ 1 error  ⚠ 6 warnings
  7. ✖ horizontal-overflow  body > main > div.promo  sticks out 166px past the right edge …
     Fix: Remove the fixed width (use max-width: 100%), let rows wrap …
```

An issue has the same number on every screenshot and in every report. Per device:
`<id>.png` (framed, with numbered boxes), `<id>-raw.png` (plain screen), plus `report.json`,
`report.md` (paste into an AI chat) and `report.html`. `report.json` and `--json` hold errors
and warnings only, at most 25 per device, with an `omitted` count for what was left out.
`--all` lists every issue and note everywhere.

| Option | What it does |
| --- | --- |
| `--preset common` | iPhone SE, iPhone 16 Pro, Galaxy A16, Pixel 9, iPad mini (default) |
| `--preset phones` | iPhone SE, iPhone 16 Pro, iPhone 17 Pro Max, Galaxy A16, Galaxy S25 Ultra, Pixel 9 |
| `--preset all-sizes` | one device per screen-width class, from small phones to large tablets |
| `--devices <id,id>` | exact devices; list ids with `npx -y github:Abmichael01/phone-sim devices --search <text>` |
| `--landscape` | also check every device turned sideways |
| `--full-page` | screenshot the whole page instead of the first screen |
| `--json` | JSON report on stdout and nothing else (progress goes to stderr) |
| `--out <dir>` | output folder (default `./phone-sim-report`) |
| `--fail-on error\|warn\|never` | when to exit 1 (default `error`) |
| `--open` | open `report.html` when done |
| `--wait <ms>` / `--timeout <ms>` | extra wait after load (500) / load timeout (30000) |
| `--no-frame` / `--no-annotate` | plain screenshots / no numbered boxes |
| `--all` | every issue and note in the terminal, the JSON and the screenshots (no limits) |
| `--debug` | full error details |

**Exit codes:** `0` no problems at the `--fail-on` level, `1` problems found, `2` the check could not
run (bad option, unknown device, page did not load, browser missing). Every error message ends with
the exact command to run next. Set `PHONE_SIM_NO_INSTALL=1` to stop the automatic browser download
(it then prints `npx playwright install chromium` instead).

**Rules**

| Rule | Level | Finds |
| --- | --- | --- |
| `viewport-meta` | error | no `<meta name="viewport" content="width=device-width">` (`info` on iPads, which show desktop sites zoomed to fit) |
| `horizontal-overflow` | error | the page scrolls sideways; lists the elements that cause it (not their children), with how many px stick out |
| `small-tap-target` | warn | links, buttons and inputs under 24×24 px with another target within 24 px (WCAG 2.2 AA 2.5.8, including its spacing exception). Links in running text and footnote marks are exempt. `info` under 44×44 px (Apple) |
| `small-text` | warn | text under 12 px (not counting `<sup>` / `<sub>`) |
| `ios-input-zoom` | warn | iPhone/iPad only: inputs under 16 px, which makes Safari zoom in on tap |
| `text-clipped` | warn | text cut off by `overflow: hidden` without an ellipsis |
| `fixed-covers-screen` | warn | fixed or sticky elements (cookie banners, headers, popups) covering over 30% of the screen on load |
| `safe-area` | warn | with `viewport-fit=cover` on notch / Dynamic Island / punch-hole phones: fixed bars at the top or bottom edge without safe-area padding |
| `image-oversize` | info | images over 2.5× larger than the screen needs |

Look-alike elements are grouped into one issue with a count and up to 3 example selectors. "Look-alike"
means the same tag and stable classes for the element and its parent, so every footnote link or nav
item is one issue. Screen-reader-only elements (visually hidden text clipped to 1 px) are
ignored by every rule.

**Viewport note:** each device is checked with the viewport set to its full screen size, at its real
pixel ratio, with its User-Agent and touch. Every device honours the page's viewport tag, iPads too:
they send a Mac User-Agent as iPad Safari does. Real browsers subtract their address bar
and toolbar, so the real visible area is a little shorter; widths are exact. The CLI only contacts the
URL being checked (and localhost ports when looking for a dev server); no telemetry.

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
pnpm check:fixtures   # the built CLI on fixtures/responsive/: bad.html must fail; good.html and article.html must pass
```

## License

[MIT](LICENSE). Device names belong to their makers and are used only to say which screen size a
frame matches. All frames, icons and wallpapers are drawn in code for this project; no device
artwork or images from other simulators are included.
