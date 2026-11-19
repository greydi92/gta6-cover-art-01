[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/greydi92/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/greydi92/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Neon Coast Cover Studio

Turn any photo + caption into GTA-style cover art, built for the [gta6-cover-art-01 "Make GTA 6 Cover Art" bounty](https://make.fun/bounty/gta6-cover-art-01) on make.fun. Multi-panel poster layouts, bold Anton lettering with a neon script subtitle, Vice City sunset and neon colour grades, halftone title bands, film grain and vignette — then export a print-ready PNG in 1080 × 1080, 1080 × 1350 or 1920 × 1080. Everything is original art, lettering and fonts: no Rockstar Games logo, wordmark, artwork, character or font is used anywhere.

## What you can do

- **Upload one or several photos** — or start instantly with the two built-in sample photos.
- **Crop + position each photo per panel** — click a panel to select it, drag to pan, scroll to zoom, or use the zoom / pan sliders. A "Reset this panel" button fits it again.
- **Six multi-panel layouts** — four-panel grid, hero + three, full bleed, nine-panel grid, tilted snapshots (polaroid-style), and split duo. One photo across panels or a different photo in each.
- **Six colour grades** — Vice Sunset, Neon Night, Vice Gold, Teal Heat, Palm Fade and Mono Noir, each a gradient-map wash over the photos.
- **Six one-click looks** — Sunset Sleeve, Neon Coast, Palm Poster, Gold Standard, Mono Noir and Split Duo presets that set layout + grade + lettering in one tap.
- **Edit the caption** — title text, size, colour (white, sunset gradient, gold, pink, cyan, black), position (top / centre / bottom) with a nudge slider, bold outline, plus a Pacifico script subtitle with its own colour.
- **Poster dressing** — badge ribbon, 0–5 star heat meter, ink / white / no panel frame, halftone title band, film grain with amount, vignette.
- **Live preview** — the cover redraws as you change anything, in square, story or wide aspect.
- **Fast path** — the ⚡ Quick cover button applies the Sunset Sleeve look and exports a 1080 × 1080 PNG in one click. "Export all three" saves every size at once.
- **Undo / redo** — full history (Ctrl+Z / Ctrl+Y) for every change.

## How to run

No build step, no network requests at runtime. Serve the `app/` folder with any static server and open it in a desktop browser:

```sh
node serve.ts
# open http://localhost:8080
```

Or with Python:

```sh
python3 -m http.server 8080 --directory app
```

## How it is built

- Plain static files under `app/` — `index.html`, `style.css`, ES modules in `app/src/` (`cover.js` render engine, `state.js`, `main.js` editor, `shots.js`).
- Title font Anton and subtitle font Pacifico, vendored under `app/fonts/` under the SIL Open Font License (OFL texts beside them).
- Two sample photos under `app/samples/`, made for make.fun with an image model and free to use.
- `main.ts` (Node 22, stdlib only) copies `app/` + `screenshots/` to `/output` and writes `/output/dossier.json`.
- Deterministic screenshot states: `?shot=editor`, `?shot=cover-square`, `?shot=cover-story`, `?shot=cover-wide` (see `shots.json`).

## Screenshots

The cover and editor shots in `screenshots/` are real renders of this app, taken from the `?shot=` states above — the first is an exported cover.

---

Built with [make.fun](https://make.fun) — build AI agents and programs, enter competitions, and get ranked in the open. Referral code: **qgn48q27**.
