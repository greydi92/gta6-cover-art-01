// Neon Coast Cover Studio — cover render engine (plain 2D canvas, no dependencies).
// Renders the same cover for the live preview, the PNG exports and the ?shot= scenes,
// at any pixel size. All art is drawn from the user's photos + gradients + text:
// no Rockstar logo, wordmark, artwork, character or font is used anywhere.

export const LAYOUTS = {
  grid4:    { label: 'Four-panel grid', panels: 4 },
  hero3:    { label: 'Hero + three',    panels: 4 },
  fullbleed:{ label: 'Full bleed',      panels: 1 },
  grid9:    { label: 'Nine-panel grid', panels: 9 },
  tilt:     { label: 'Tilted snapshots',panels: 3 },
  split2:   { label: 'Split duo',       panels: 2 },
};

// Gradient-map grades. `filter` is a canvas filter applied while drawing each photo;
// `wash` is a full-canvas gradient laid over the photos afterwards.
export const GRADES = {
  sunset: {
    label: 'Vice Sunset', filter: 'saturate(1.28) contrast(1.06) sepia(0.14)',
    backdrop: ['#2b1055', '#7597de'],
    wash: [['#ff9a3d', 0.20], ['#ff2e88', 0.22]],
    glow: 'rgba(255, 150, 60, 0.20)',
  },
  neon: {
    label: 'Neon Night', filter: 'saturate(1.45) contrast(1.12) hue-rotate(-10deg)',
    backdrop: ['#0b0620', '#1b0f3a'],
    wash: [['#00e5ff', 0.16], ['#ff2e88', 0.24]],
    glow: 'rgba(255, 46, 136, 0.20)',
  },
  gold: {
    label: 'Vice Gold', filter: 'saturate(1.15) contrast(1.05) sepia(0.28)',
    backdrop: ['#3a1c00', '#7a4a00'],
    wash: [['#ffd60a', 0.20], ['#ff7a00', 0.18]],
    glow: 'rgba(255, 214, 10, 0.18)',
  },
  teal: {
    label: 'Teal Heat', filter: 'saturate(1.3) contrast(1.08)',
    backdrop: ['#022a2e', '#0a4a52'],
    wash: [['#00e5b0', 0.16], ['#0077ff', 0.20]],
    glow: 'rgba(0, 229, 255, 0.18)',
  },
  palm: {
    label: 'Palm Fade', filter: 'saturate(1.1) contrast(1.02) sepia(0.08)',
    backdrop: ['#123524', '#3e7a5e'],
    wash: [['#a8ffce', 0.14], ['#ff9a3d', 0.14]],
    glow: 'rgba(168, 255, 206, 0.14)',
  },
  noir: {
    label: 'Mono Noir', filter: 'grayscale(1) contrast(1.18) brightness(1.04)',
    backdrop: ['#101010', '#333333'],
    wash: [['#ffffff', 0.08], ['#000000', 0.16]],
    glow: 'rgba(255, 255, 255, 0.10)',
  },
};

export const TITLE_COLORS = {
  white:  { label: 'White',  fill: '#ffffff' },
  sunset: { label: 'Sunset', fill: 'gradient-sunset' },
  gold:   { label: 'Gold',   fill: '#ffd60a' },
  pink:   { label: 'Pink',   fill: '#ff2e88' },
  cyan:   { label: 'Cyan',   fill: '#00e5ff' },
  black:  { label: 'Black',  fill: '#141414' },
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Panel rects in unit space (0..1), given the cover aspect w/h. `rot` is degrees.
export function layoutPanels(layout, w, h) {
  const g = 0.018; // ink gap between panels, in units of the short side
  const s = Math.min(w, h);
  const gap = g * s;
  const px = (x, y, pw, ph, rot = 0) => ({ x: x * w, y: y * h, w: pw * w, h: ph * h, rot });
  switch (layout) {
    case 'grid4': {
      const cw = (w - gap * 3) / 2, ch = (h - gap * 3) / 2;
      return [
        px(gap / w, gap / h, cw / w, ch / h), px((gap * 2 + cw) / w, gap / h, cw / w, ch / h),
        px(gap / w, (gap * 2 + ch) / h, cw / w, ch / h), px((gap * 2 + cw) / w, (gap * 2 + ch) / h, cw / w, ch / h),
      ];
    }
    case 'hero3': {
      const heroW = w * 0.62, colX = heroW + gap, colW = w - colX - gap;
      const rh = (h - gap * 4) / 3;
      return [
        px(gap / w, gap / h, heroW / w, (h - gap * 2) / h),
        px(colX / w, gap / h, colW / w, rh / h),
        px(colX / w, (gap * 2 + rh) / h, colW / w, rh / h),
        px(colX / w, (gap * 3 + rh * 2) / h, colW / w, rh / h),
      ];
    }
    case 'fullbleed':
      return [px(0, 0, 1, 1)];
    case 'grid9': {
      const cw = (w - gap * 4) / 3, ch = (h - gap * 4) / 3, out = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
        out.push(px((gap + c * (cw + gap)) / w, (gap + r * (ch + gap)) / h, cw / w, ch / h));
      return out;
    }
    case 'tilt': {
      // Three overlapping snapshots, polaroid-style, on the grade backdrop.
      const bw = w * 0.52, bh = h * 0.60;
      return [
        px(0.05, 0.10, bw / w, bh / h, -4),
        px(0.42, 0.06, bw / w, bh / h, 3.5),
        px(0.24, 0.34, bw / w, bh / h, -1.5),
      ];
    }
    case 'split2': {
      const cw = (w - gap * 3) / 2;
      return [px(gap / w, gap / h, cw / w, (h - gap * 2) / h), px((gap * 2 + cw) / w, gap / h, cw / w, (h - gap * 2) / h)];
    }
    default:
      return layoutPanels('grid4', w, h);
  }
}

function drawPhotoCover(ctx, img, rect, panel) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const zoom = panel.zoom || 1;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale, dh = ih * scale;
  // Clamp the pan so the photo always covers the panel (no backdrop gaps).
  const maxOx = Math.max(0, (dw - rect.w) / 2 / rect.w);
  const maxOy = Math.max(0, (dh - rect.h) / 2 / rect.h);
  const ox = Math.max(-maxOx, Math.min(maxOx, panel.ox || 0));
  const oy = Math.max(-maxOy, Math.min(maxOy, panel.oy || 0));
  const dx = rect.x + (rect.w - dw) / 2 + ox * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + oy * rect.h;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function halftonePattern(ctx, size, color) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = color;
  g.beginPath(); g.arc(size / 2, size / 2, size * 0.22, 0, Math.PI * 2); g.fill();
  return ctx.createPattern(c, 'repeat');
}

let grainCache = null;
function grainPattern(ctx, size, seed) {
  if (grainCache) return grainCache;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  const rnd = mulberry32(seed);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainCache = ctx.createPattern(c, 'repeat');
  return grainCache;
}

function fitTitleFont(ctx, text, maxW, startSize) {
  let size = startSize;
  ctx.font = `400 ${size}px Anton, "Arial Black", sans-serif`;
  try { ctx.letterSpacing = `${Math.round(size * 0.04)}px`; } catch { /* older canvas */ }
  while (size > 14 && ctx.measureText(text).width > maxW) {
    size -= 2;
    ctx.font = `400 ${size}px Anton, "Arial Black", sans-serif`;
    try { ctx.letterSpacing = `${Math.round(size * 0.04)}px`; } catch { /* older canvas */ }
  }
  return size;
}

function titleFill(ctx, colorKey, x, y, w, h) {
  const spec = TITLE_COLORS[colorKey] || TITLE_COLORS.white;
  if (spec.fill === 'gradient-sunset') {
    const g = ctx.createLinearGradient(x, y - h, x, y);
    g.addColorStop(0, '#ffd60a'); g.addColorStop(0.55, '#ff5e3a'); g.addColorStop(1, '#ff2e88');
    return g;
  }
  return spec.fill;
}

// The cover. `state` is the serialisable cover state; `photos` is an array of
// loaded images indexed by state.panels[].photo. `opts.selection` (editor only)
// draws the dashed selection outline around one panel.
export function renderCover(canvas, state, photos, opts = {}) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const short = Math.min(W, H);
  const grade = GRADES[state.grade] || GRADES.sunset;
  const frame = state.frame || 'ink';

  // Backdrop.
  const bg = ctx.createLinearGradient(0, 0, W * 0.4, H);
  bg.addColorStop(0, grade.backdrop[0]);
  bg.addColorStop(1, grade.backdrop[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Panels.
  const rects = layoutPanels(state.layout, W, H);
  const panels = state.panels || [];
  const isTilt = state.layout === 'tilt';
  rects.forEach((rect, i) => {
    const panel = panels[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const img = photos[panel.photo];
    ctx.save();
    if (rect.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate((rect.rot * Math.PI) / 180);
      ctx.translate(-rect.w / 2, -rect.h / 2);
    } else {
      ctx.translate(rect.x, rect.y);
    }
    const r = { x: 0, y: 0, w: rect.w, h: rect.h };
    if (isTilt) {
      // Polaroid-style white border + drop shadow.
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = short * 0.03;
      ctx.shadowOffsetY = short * 0.012;
      ctx.fillStyle = '#f8f4ec';
      ctx.fillRect(-short * 0.012, -short * 0.012, rect.w + short * 0.024, rect.h + short * 0.024);
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    }
    ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    if (img) {
      ctx.filter = grade.filter;
      drawPhotoCover(ctx, img, r, panel);
      ctx.filter = 'none';
    } else {
      ctx.fillStyle = '#241a33';
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    // Inner shade so panels read as poster art.
    const shade = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(20,0,40,0.28)');
    ctx.fillStyle = shade;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.restore();
    // Ink band between panels.
    if (!isTilt && frame !== 'none') {
      ctx.strokeStyle = frame === 'white' ? '#f8f4ec' : '#0d0a14';
      ctx.lineWidth = Math.max(2, short * 0.012);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
    // Editor selection outline.
    if (opts.selection === i) {
      ctx.save();
      ctx.setLineDash([short * 0.02, short * 0.012]);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = Math.max(3, short * 0.008);
      ctx.strokeRect(rect.x - short * 0.006, rect.y - short * 0.006, rect.w + short * 0.012, rect.h + short * 0.012);
      ctx.restore();
    }
  });

  // Grade wash + warm glow over the whole cover.
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  const wash = ctx.createLinearGradient(0, 0, W * 0.5, H);
  grade.wash.forEach(([color, alpha], i) => wash.addColorStop(i === 0 ? 0 : 1, color));
  ctx.globalAlpha = 1;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const glow = ctx.createRadialGradient(W * 0.72, H * 0.16, 0, W * 0.72, H * 0.16, short * 0.75);
  glow.addColorStop(0, grade.glow);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ---- Title block ----
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  const titleSize = Math.round(short * (state.titleSize ?? 0.115));
  const pos = state.titlePos || 'bottom';
  const yOff = (state.titleY ?? 0) * short; // -0.2..0.2
  const bandH = titleSize * 1.9 + (subtitle ? titleSize * 0.62 : 0);
  let bandY;
  if (pos === 'top') bandY = H * 0.05 + yOff;
  else if (pos === 'center') bandY = H / 2 - bandH / 2 + yOff;
  else bandY = H - bandH - H * 0.045 + yOff;
  bandY = Math.max(H * 0.02, Math.min(H - bandH - H * 0.02, bandY));

  if (title) {
    // Halftone band behind the title.
    if (state.halftone) {
      ctx.save();
      ctx.fillStyle = 'rgba(10, 6, 18, 0.55)';
      ctx.fillRect(0, bandY, W, bandH);
      ctx.fillStyle = halftonePattern(ctx, Math.max(8, Math.round(short * 0.012)), 'rgba(255,255,255,0.16)');
      ctx.fillRect(0, bandY, W, bandH);
      ctx.restore();
    }
    // Thin rules above / below the block.
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(W * 0.08, bandY - short * 0.008, W * 0.84, Math.max(2, short * 0.003));
    ctx.fillRect(W * 0.08, bandY + bandH + short * 0.008, W * 0.84, Math.max(2, short * 0.003));

    const size = fitTitleFont(ctx, title, W * 0.88, titleSize);
    const cx = W / 2;
    const baseline = bandY + size * (subtitle ? 0.95 : 1.15);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    if (state.outline !== false) {
      ctx.lineWidth = Math.max(2, size * 0.09);
      ctx.strokeStyle = 'rgba(10,6,18,0.9)';
      ctx.lineJoin = 'round';
      ctx.strokeText(title, cx, baseline);
    }
    ctx.fillStyle = titleFill(ctx, state.titleColor, cx - W * 0.44, baseline, W * 0.88, size);
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.04;
    ctx.fillText(title, cx, baseline);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    if (subtitle) {
      const subSize = Math.round(size * 0.42);
      ctx.font = `${subSize}px Pacifico, cursive`;
      try { ctx.letterSpacing = '0px'; } catch { /* noop */ }
      ctx.fillStyle = state.subtitleColor || '#ffd60a';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = subSize * 0.2;
      ctx.fillText(subtitle, cx, bandY + bandH - size * 0.12);
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    }
  }

  // Badge ribbon (top-right) + heat-meter stars.
  if (state.badge) {
    const bw = Math.max(W * 0.16, short * 0.2), bh = short * 0.045;
    ctx.save();
    ctx.translate(W - bw / 2 - W * 0.02, bh);
    ctx.rotate(-0.06);
    ctx.fillStyle = '#ff2e88';
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.fillStyle = '#ffffff';
    ctx.font = `400 ${Math.round(bh * 0.52)}px Anton, "Arial Black", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText((state.badge || '').toUpperCase().slice(0, 18), 0, 1);
    ctx.restore();
  }
  const stars = state.stars ?? 0;
  if (stars > 0) {
    const r = short * 0.022, gap = r * 2.6;
    const total = 5 * gap;
    let sx = W / 2 - total / 2 + gap / 2;
    const sy = pos === 'bottom' ? bandY - short * 0.05 : bandY + bandH + short * 0.05;
    ctx.fillStyle = '#ffd60a';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(r * 2)}px sans-serif`;
    for (let i = 0; i < 5; i++) {
      ctx.globalAlpha = i < stars ? 1 : 0.28;
      ctx.fillText('★', sx, sy);
      sx += gap;
    }
    ctx.globalAlpha = 1;
  }

  // Grain + vignette.
  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = (state.grainAmount ?? 0.10);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grainPattern(ctx, 160, 1337);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (state.vignette !== false) {
    const v = ctx.createRadialGradient(W / 2, H / 2, short * 0.42, W / 2, H / 2, short * 0.95);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
  try { ctx.letterSpacing = '0px'; } catch { /* noop */ }
}

// Slug for export filenames.
export function slugify(text) {
  return (text || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'cover';
}
