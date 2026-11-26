---
name: phone-sim
description: Check a web page on real phone and tablet screen sizes and fix what breaks (content sticking out sideways, buttons too small to tap, tiny text, iPhone zoom on inputs, clipped text, banners covering the screen, notch overlap). Use after ANY change to a web page's UI, CSS or layout, before saying UI work is done, and whenever the user mentions mobile, responsive, phone, tablet, iPhone, Android, "looks broken on mobile", overflow or horizontal scroll.
---

# phone-sim: make pages work on phones

`phone-sim` opens the page in a headless browser on real device sizes (iPhone SE, iPhone 16 Pro,
Galaxy A16, Pixel 9, iPad mini by default), finds responsive problems, and saves screenshots with
numbered boxes on each problem. No setup: the first run downloads what it needs.

```bash
npx -y github:Abmichael01/phone-sim check --json            # finds the local dev server itself
npx -y github:Abmichael01/phone-sim check localhost:5173 --json
```

If a `phone-sim` command is already installed (`command -v phone-sim`), use `phone-sim check …`
instead; it is the same tool.

## The loop

1. **Have the page running.** Start the project's dev server if it is not running (use the
   project's own command and port). With no URL, phone-sim tries ports 3000, 5173, 4321, 8080,
   8000, 4200 and 3001. For a specific page pass its full URL (`localhost:3000/pricing`).
2. **Run the check** with `--json` and read the report from stdout:
   - `summary`: counts of errors, warnings and infos.
   - `devices[]`: `name`, `viewport`, `screenshot` (annotated PNG), `issues[]`.
   - each issue: `number` (matches the box on the screenshot), `rule`, `severity`, `selector`,
     `examples`, `message`, `hint` (how to fix), `detail` (element text to search the code for),
     `count`, `onAllDevices`.
3. **Look at the screenshot** of any device with errors (open the PNG path from the report). It
   shows what the user would see and where each numbered problem is.
4. **Find the code.** Search the source for the class names in `selector` and the text in
   `detail`. Fix the cause in the component or stylesheet.
5. **Run the check again.** Repeat until there are **0 errors and 0 warnings**. Infos are
   suggestions; fix them when cheap.
6. **Tell the user** which devices were checked, what you fixed, and anything left (with why).

Exit codes: 0 = clean, 1 = problems at or above `--fail-on` (default: errors), 2 = could not run
(the message says the exact next command).

## Rules and the right fix

| rule | what is wrong | fix the cause |
|---|---|---|
| `horizontal-overflow` | an element is wider than the screen, so the page scrolls sideways | remove fixed widths (`max-width: 100%`), let flex rows wrap (`flex-wrap: wrap`, `min-width: 0`), give wide tables/code their own `overflow-x: auto` box |
| `viewport-meta` | no `<meta name="viewport" content="width=device-width, initial-scale=1">` | add it to the document head |
| `small-tap-target` | a button or link is smaller than 24×24px with another target close by | padding or `min-width`/`min-height` of 44px; more space between targets |
| `small-text` | text under 12px | at least 12px for small print, 16px for body text |
| `ios-input-zoom` | input/select/textarea under 16px: iPhone zooms the page when tapped | `font-size: 16px` or more on form fields |
| `text-clipped` | text cut off by `overflow: hidden` | let it wrap, or use `text-overflow: ellipsis` when cutting is intended |
| `fixed-covers-screen` | a fixed/sticky element covers over 30% of the screen | make banners smaller, dismissible, or not fixed on small screens |
| `safe-area` | with `viewport-fit=cover`, fixed bars sit under the notch or home bar | `padding-top: env(safe-area-inset-top)` / `padding-bottom: env(safe-area-inset-bottom)` |
| `image-oversize` (info) | image file far bigger than shown | `srcset`/`sizes`, or a smaller file |

## Do not

- Hide problems instead of fixing them: no `overflow-x: hidden` on `html`/`body` to mask
  sideways scroll, no `display: none` on content to silence a warning.
- Commit the `phone-sim-report/` folder (add it to `.gitignore`).
- Stop after one run: always re-run to confirm the fix.

## Useful options

`--devices iphone-se-3,pixel-9` exact devices (`… devices --search galaxy` lists ids) ·
`--preset phones` or `all-sizes` · `--landscape` also sideways · `--full-page` whole page ·
`--wait 2000` for slow pages · `--all` include every note · `--out <dir>` report folder ·
`--open` open `report.html` for the user to see.

Limits: it checks the page as a logged-out visitor sees it on load (no clicks or logins), and the
screen height is the full display (real browsers subtract their toolbars; widths are exact).

To make every AI agent in a repo use this automatically, run
`npx -y github:Abmichael01/phone-sim init` once (adds a short section to AGENTS.md).

## Install the browser extension for the user

When the user wants the Phone Sim browser extension (not the checker), run
`npx -y github:Abmichael01/phone-sim extension --json`. It downloads the latest release into
`~/phone-sim-extension` (or `--dir <path>`) and prints `{version, dir, steps}`. Then tell the user
the steps in plain words with the exact `dir` path. Browsers do not let an agent click
"Load unpacked", so the user must do those clicks (open `chrome://extensions`, turn on Developer
mode, Load unpacked, pick the folder). To update, run the same command again and ask the user to
click the reload button on Phone Sim in the extensions page.
