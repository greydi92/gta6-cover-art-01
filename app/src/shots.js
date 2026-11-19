// Deterministic screenshot scenes: ?shot=editor shows the editor with a photo
// loaded; ?shot=cover-square / cover-story / cover-wide show the finished cover
// alone, at that size's aspect. window.__shotReady is set once painted.
import { defaultState } from './state.js';

const SCENES = {
  'editor': {
    size: 'square',
    patch: { layout: 'grid4', grade: 'sunset', title: 'Neon Shore', subtitle: 'a neon coast story', titleColor: 'sunset', titlePos: 'bottom', stars: 4 },
  },
  'cover-square': {
    size: 'square', coverOnly: true,
    patch: { layout: 'grid4', grade: 'sunset', title: 'Neon Shore', subtitle: 'a neon coast story', titleColor: 'sunset', titlePos: 'bottom', stars: 4 },
  },
  'cover-story': {
    size: 'story', coverOnly: true,
    patch: { layout: 'hero3', grade: 'neon', title: 'Night Shift', subtitle: 'lights on, brakes off', titleColor: 'pink', titlePos: 'bottom', stars: 5 },
    panelsPatch: { 0: { zoom: 1, oy: 0.12 } },
  },
  'cover-wide': {
    size: 'wide', coverOnly: true,
    patch: { layout: 'tilt', grade: 'gold', title: 'Pier Pressure', subtitle: 'catch the sunset', titleColor: 'gold', titlePos: 'bottom', stars: 4 },
  },
};

export async function runShot(shot, query, ctx) {
  const scene = SCENES[shot] || SCENES['editor'];
  if (scene.coverOnly) document.body.classList.add('shot-cover');
  const next = { ...defaultState(), ...scene.patch };
  // Keep the two sample photos in their slots; allow ?photo= / ?caption= overrides.
  const photo = query.get('photo');
  if (photo === 'boulevard') next.panels = next.panels.map((p) => ({ ...p, photo: 1 }));
  if (photo === 'pier') next.panels = next.panels.map((p) => ({ ...p, photo: 0 }));
  const caption = query.get('caption');
  if (caption) next.title = caption;
  if (scene.panelsPatch) {
    for (const [i, patch] of Object.entries(scene.panelsPatch)) {
      next.panels[Number(i)] = { ...next.panels[Number(i)], ...patch };
    }
  }
  ctx.setPreviewSize(scene.size);
  ctx.setState(next);
  // Cover-only scenes must not show the editor's selection outline.
  ctx.setSelected(scene.coverOnly ? -1 : 0);
  ctx.syncControls();
  ctx.redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
