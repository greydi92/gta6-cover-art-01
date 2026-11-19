// Neon Coast Cover Studio — editor wiring: controls, panel editing, undo/redo,
// PNG export. The cover itself is drawn by ./cover.js.
import { LAYOUTS, GRADES, TITLE_COLORS, layoutPanels, renderCover, slugify } from './cover.js';
import { defaultState, defaultPanel, PRESETS, EXPORT_SIZES, SAMPLE_PHOTOS } from './state.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const statusEl = $('status');

let state = defaultState();
let photos = []; // { img, name, src? } — loaded images, indexed by panels[].photo
let selectedPanel = 0;
let previewSize = 'square';
let fontsReady = false;

// ---------- undo / redo ----------
let history = [];
let historyIndex = -1;
function snapshot() { return JSON.stringify(state); }
function pushHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(snapshot());
  if (history.length > 60) history.shift();
  historyIndex = history.length - 1;
  updateUndoButtons();
}
function applyHistoryEntry(json) {
  state = JSON.parse(json);
  syncControls();
  redraw();
}
function undo() {
  if (historyIndex <= 0) return;
  historyIndex--;
  applyHistoryEntry(history[historyIndex]);
  updateUndoButtons();
}
function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex++;
  applyHistoryEntry(history[historyIndex]);
  updateUndoButtons();
}
function updateUndoButtons() {
  $('undo').disabled = historyIndex <= 0;
  $('redo').disabled = historyIndex >= history.length - 1;
}

// ---------- image loading ----------
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image: ' + url));
    img.src = url;
  });
}

async function addPhoto(img, name) {
  if (photos.length >= 6) { setStatus('Six photos max — remove one first.'); return -1; }
  photos.push({ img, name });
  renderTray();
  return photos.length - 1;
}

async function loadSamples() {
  for (const s of SAMPLE_PHOTOS) {
    try {
      const img = await loadImage(s.src);
      photos.push({ img, name: s.name });
    } catch (e) { console.warn('sample failed', s.src, e); }
  }
  renderTray();
}

// ---------- rendering ----------
function previewDims() {
  if (previewSize === 'story') return { w: 720, h: 900 };
  if (previewSize === 'wide') return { w: 960, h: 540 };
  return { w: 900, h: 900 };
}

function redraw() {
  const { w, h } = previewDims();
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  renderCover(canvas, state, photos.map((p) => p.img), { selection: selectedPanel });
  $('panelLabel').textContent = `Panel ${selectedPanel + 1} of ${LAYOUTS[state.layout].panels}`;
}

function setStatus(msg) { statusEl.textContent = msg; }

// ---------- controls <-> state ----------
function syncControls() {
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  $('titleSize').value = String(Math.round(state.titleSize * 1000));
  $('titleSizeVal').textContent = `${Math.round(state.titleSize * 1000)}`;
  $('titleY').value = String(Math.round(state.titleY * 100));
  $('outline').checked = state.outline;
  $('subtitleColor').value = state.subtitleColor;
  $('badge').value = state.badge;
  $('stars').value = String(state.stars);
  $('halftone').checked = state.halftone;
  $('grain').checked = state.grain;
  $('grainAmount').value = String(Math.round(state.grainAmount * 100));
  $('vignette').checked = state.vignette;
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('[data-titlecolor]').forEach((b) => b.classList.toggle('active', b.dataset.titlecolor === state.titleColor));
  document.querySelectorAll('[data-titlepos]').forEach((b) => b.classList.toggle('active', b.dataset.titlepos === state.titlePos));
  document.querySelectorAll('[data-frame]').forEach((b) => b.classList.toggle('active', b.dataset.frame === state.frame));
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === previewSize));
  document.querySelectorAll('[data-preset]').forEach((b) => b.classList.toggle('active', false));
  syncPanelControls();
}

function syncPanelControls() {
  const panel = state.panels[selectedPanel] || defaultPanel(0);
  $('zoom').value = String(Math.round(panel.zoom * 100));
  $('zoomVal').textContent = `${Math.round(panel.zoom * 100)}%`;
  $('panX').value = String(Math.round(panel.ox * 100));
  $('panY').value = String(Math.round(panel.oy * 100));
  document.querySelectorAll('#tray .thumb').forEach((t, i) => {
    t.classList.toggle('assigned', photos[i] && panel.photo === i);
  });
  $('panelLabel').textContent = `Panel ${selectedPanel + 1} of ${LAYOUTS[state.layout].panels}`;
}

function renderTray() {
  const tray = $('tray');
  tray.innerHTML = '';
  photos.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb';
    b.title = `${p.name} — click to put in panel ${selectedPanel + 1}`;
    const img = document.createElement('img');
    img.src = p.img.src;
    img.alt = p.name;
    b.appendChild(img);
    const cap = document.createElement('span');
    cap.textContent = p.name;
    b.appendChild(cap);
    b.addEventListener('click', () => {
      pushHistory();
      state.panels[selectedPanel].photo = i;
      syncPanelControls();
      redraw();
      setStatus(`${p.name} is now in panel ${selectedPanel + 1}.`);
    });
    tray.appendChild(b);
  });
  $('photoCount').textContent = `${photos.length} photo${photos.length === 1 ? '' : 's'} loaded`;
  syncPanelControls();
}

// ---------- panel editing on the canvas ----------
function panelAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const x = ((clientX - r.left) / r.width) * canvas.width;
  const y = ((clientY - r.top) / r.height) * canvas.height;
  const rects = layoutPanels(state.layout, canvas.width, canvas.height);
  for (let i = rects.length - 1; i >= 0; i--) {
    const rc = rects[i];
    if (x >= rc.x && x <= rc.x + rc.w && y >= rc.y && y <= rc.y + rc.h) return i;
  }
  return -1;
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  canvas.setPointerCapture(e.pointerId);
  if (i !== selectedPanel) { selectedPanel = i; syncPanelControls(); redraw(); }
  drag = { x: e.clientX, y: e.clientY, moved: false };
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rects = layoutPanels(state.layout, canvas.width, canvas.height);
  const rc = rects[selectedPanel];
  const r = canvas.getBoundingClientRect();
  const dx = ((e.clientX - drag.x) / r.width) * canvas.width;
  const dy = ((e.clientY - drag.y) / r.height) * canvas.height;
  if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
  if (!drag.moved) return;
  const panel = state.panels[selectedPanel];
  panel.ox = Math.max(-0.6, Math.min(0.6, panel.ox + dx / rc.w));
  panel.oy = Math.max(-0.6, Math.min(0.6, panel.oy + dy / rc.h));
  drag.x = e.clientX; drag.y = e.clientY;
  syncPanelControls();
  redraw();
});
canvas.addEventListener('pointerup', () => {
  if (drag && drag.moved) pushHistory();
  drag = null;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[selectedPanel];
  panel.zoom = Math.max(0.8, Math.min(2.5, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  syncPanelControls();
  redraw();
}, { passive: false });

// ---------- export ----------
function renderExport(size) {
  const c = document.createElement('canvas');
  c.width = size.w; c.height = size.h;
  renderCover(c, state, photos.map((p) => p.img));
  return c;
}

function downloadCanvas(c, filename) {
  return new Promise((resolve) => {
    c.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(blob);
    }, 'image/png');
  });
}

async function exportSize(size) {
  const c = renderExport(size);
  const name = `${slugify(state.title)}-cover-${size.w}x${size.h}.png`;
  await downloadCanvas(c, name);
  setStatus(`Saved ${name}`);
  return name;
}

async function exportAll() {
  for (const size of EXPORT_SIZES) {
    await exportSize(size);
    await new Promise((r) => setTimeout(r, 350));
  }
}

// ---------- presets ----------
function applyPreset(key) {
  const p = PRESETS[key];
  if (!p) return;
  pushHistory();
  Object.assign(state, {
    layout: p.layout, grade: p.grade, title: p.title, subtitle: p.subtitle,
    titleColor: p.titleColor, titlePos: p.titlePos, halftone: p.halftone,
    grain: p.grain, vignette: p.vignette, frame: p.frame, stars: p.stars,
  });
  selectedPanel = 0;
  syncControls();
  redraw();
  setStatus(`Look applied: ${p.label}.`);
}

// ---------- wire up controls ----------
function bindControls() {
  $('photoInput').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue;
      try {
        const img = await loadImage(URL.createObjectURL(f));
        const idx = await addPhoto(img, f.name.replace(/\.[^.]+$/, '').slice(0, 18) || 'Photo');
        if (idx >= 0) {
          state.panels[selectedPanel].photo = idx;
          setStatus(`${f.name} added — assigned to panel ${selectedPanel + 1}.`);
        }
      } catch { setStatus(`Could not read ${f.name}.`); }
    }
    e.target.value = '';
    syncPanelControls();
    redraw();
  });

  document.querySelectorAll('[data-layout]').forEach((b) => b.addEventListener('click', () => {
    pushHistory();
    state.layout = b.dataset.layout;
    selectedPanel = 0;
    syncControls(); redraw();
    setStatus(`Layout: ${LAYOUTS[state.layout].label}.`);
  }));
  document.querySelectorAll('[data-grade]').forEach((b) => b.addEventListener('click', () => {
    pushHistory();
    state.grade = b.dataset.grade;
    syncControls(); redraw();
    setStatus(`Grade: ${GRADES[state.grade].label}.`);
  }));
  document.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => applyPreset(b.dataset.preset)));
  document.querySelectorAll('[data-titlecolor]').forEach((b) => b.addEventListener('click', () => {
    pushHistory();
    state.titleColor = b.dataset.titlecolor;
    syncControls(); redraw();
  }));
  document.querySelectorAll('[data-titlepos]').forEach((b) => b.addEventListener('click', () => {
    pushHistory();
    state.titlePos = b.dataset.titlepos;
    syncControls(); redraw();
  }));
  document.querySelectorAll('[data-frame]').forEach((b) => b.addEventListener('click', () => {
    pushHistory();
    state.frame = b.dataset.frame;
    syncControls(); redraw();
  }));
  document.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
    previewSize = b.dataset.size;
    syncControls(); redraw();
  }));

  const text = (id, key) => {
    $(id).addEventListener('input', () => { state[key] = $(id).value; redraw(); });
    $(id).addEventListener('change', () => { pushHistory(); });
  };
  text('title', 'title');
  text('subtitle', 'subtitle');
  text('badge', 'badge');

  $('titleSize').addEventListener('input', () => {
    state.titleSize = Number($('titleSize').value) / 1000;
    $('titleSizeVal').textContent = $('titleSize').value;
    redraw();
  });
  $('titleSize').addEventListener('change', pushHistory);
  $('titleY').addEventListener('input', () => {
    state.titleY = Number($('titleY').value) / 100;
    redraw();
  });
  $('titleY').addEventListener('change', pushHistory);
  $('outline').addEventListener('change', () => { pushHistory(); state.outline = $('outline').checked; redraw(); });
  $('subtitleColor').addEventListener('input', () => { state.subtitleColor = $('subtitleColor').value; redraw(); });
  $('subtitleColor').addEventListener('change', pushHistory);
  $('stars').addEventListener('input', () => { state.stars = Number($('stars').value); redraw(); });
  $('stars').addEventListener('change', pushHistory);
  $('halftone').addEventListener('change', () => { pushHistory(); state.halftone = $('halftone').checked; redraw(); });
  $('grain').addEventListener('change', () => { pushHistory(); state.grain = $('grain').checked; redraw(); });
  $('grainAmount').addEventListener('input', () => { state.grainAmount = Number($('grainAmount').value) / 100; redraw(); });
  $('grainAmount').addEventListener('change', pushHistory);
  $('vignette').addEventListener('change', () => { pushHistory(); state.vignette = $('vignette').checked; redraw(); });

  const panelNum = (id, key, scale) => {
    $(id).addEventListener('input', () => {
      state.panels[selectedPanel][key] = Number($(id).value) / scale;
      syncPanelControls(); redraw();
    });
    $(id).addEventListener('change', pushHistory);
  };
  panelNum('zoom', 'zoom', 100);
  panelNum('panX', 'ox', 100);
  panelNum('panY', 'oy', 100);
  $('fitPanel').addEventListener('click', () => {
    pushHistory();
    Object.assign(state.panels[selectedPanel], { zoom: 1, ox: 0, oy: 0 });
    syncPanelControls(); redraw();
  });

  $('undo').addEventListener('click', undo);
  $('redo').addEventListener('click', redo);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
  });

  $('exportSquare').addEventListener('click', () => exportSize(EXPORT_SIZES[0]));
  $('exportStory').addEventListener('click', () => exportSize(EXPORT_SIZES[1]));
  $('exportWide').addEventListener('click', () => exportSize(EXPORT_SIZES[2]));
  $('exportAll').addEventListener('click', exportAll);
  $('quickCover').addEventListener('click', async () => {
    applyPreset('sunsetSleeve');
    await new Promise((r) => setTimeout(r, 60));
    await exportSize(EXPORT_SIZES[0]);
  });
}

// ---------- boot ----------
async function boot() {
  bindControls();
  try {
    await Promise.all([
      document.fonts.load('400 80px Anton'),
      document.fonts.load('400 40px Pacifico'),
      document.fonts.ready,
    ]);
    fontsReady = true;
  } catch { /* fall back to system fonts */ }
  await loadSamples();
  pushHistory();
  syncControls();
  redraw();

  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    await runShot(shot, params, {
      photos, state,
      setState(next) { state = next; },
      redraw, syncControls,
      setSelected(i) { selectedPanel = i; },
      setPreviewSize(s) { previewSize = s; },
    });
  }
  window.__appReady = true;
}

boot();
